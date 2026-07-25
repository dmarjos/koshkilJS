(function ($) {
    $.extend($.koshkilJS.kooTable.methods || {}, {
        /**
         * Set table data and initialize DataStore (Phase 2 Optimization)
         * OPTIMIZATION: Initialize data layer for fast operations
         */
        setData: function (data,kooTableInstance) { 
            var handler = kooTableInstance.settings.handler;
            var $handler = $(handler); // Cache selector
            
            // Start performance timer
            if ($.koshkilJS.profiler) {
                $.koshkilJS.profiler.start('setData');
            }
            
            // Initialize or update DataStore
            if (!kooTableInstance.dataStore) {
                kooTableInstance.dataStore = new $.koshkilJS.kooTable.DataStore();
            }
            
            // Set columns first if needed
            if (kooTableInstance.settings.reDrawColumns && Array.isArray(data.columns) && data.columns.length>0) {
                kooTableInstance.methods.setColumns(data.columns, kooTableInstance);    
            }
            
            // Get columns from storage
            var columns = $handler.data('kooTable-columns') || {};
            
            // Initialize DataStore with data and columns
            var rows = data.rows || [];
            kooTableInstance.dataStore.init(rows, columns, kooTableInstance.settings.pageSize);
            
            // Store raw data reference for backward compatibility
            $handler.data('kooTable-data', rows);
            
            // Simple check: Use virtual scrolling if explicitly enabled by user
            var shouldUseVirtualScrolling = kooTableInstance.settings.virtualScrolling && rows.length > 0;
            
            if (shouldUseVirtualScrolling) {
                // Initialize Virtual Scrolling (for 10,000+ rows)
                if (!kooTableInstance.virtualScroll) {
                    kooTableInstance.virtualScroll = new $.koshkilJS.kooTable.VirtualScroll();
                }
                
                // Configure virtual scroll options
                var vsOptions = {
                    rowHeight: kooTableInstance.settings.virtualScrollRowHeight,
                    overscan: kooTableInstance.settings.virtualScrollOverscan,
                    maxHeight: kooTableInstance.settings.virtualScrollMaxHeight
                };
                
                // Initialize and render
                kooTableInstance.virtualScroll.init(kooTableInstance, vsOptions);
                
                // Store that we're in virtual scroll mode
                kooTableInstance.usingVirtualScroll = true;
                
                // Hide pagination controls when virtual scrolling is active
                $handler.find('tfoot').hide();
                
                console.log('KooTable: Virtual scrolling enabled for ' + rows.length + ' rows (user enabled)');
                
            } else if (kooTableInstance.settings.pagingEnabled && rows.length > 0) {
                // Traditional pagination (Phase 2)
                // Disable virtual scrolling if it was previously enabled
                if (kooTableInstance.usingVirtualScroll && kooTableInstance.virtualScroll) {
                    kooTableInstance.virtualScroll.destroy();
                    kooTableInstance.usingVirtualScroll = false;
                }
                
                // Render only first page
                var pageData = kooTableInstance.dataStore.getPage(1);
                kooTableInstance.methods.setRows(pageData, kooTableInstance, true); // Pass skipPaginationInit flag
                
                // Initialize pagination UI after first render
                if ($.koshkilJS.kooTable.pagination) {
                    $.koshkilJS.kooTable.pagination.init(kooTableInstance);
                    
                    // Ensure pagination controls are visible
                    $handler.find('tfoot').show();
                }
                
                console.log('KooTable: Pagination mode for ' + rows.length + ' rows');
            } else {
                // Render all data (no pagination)
                // Disable virtual scrolling if it was previously enabled
                if (kooTableInstance.usingVirtualScroll && kooTableInstance.virtualScroll) {
                    kooTableInstance.virtualScroll.destroy();
                    kooTableInstance.usingVirtualScroll = false;
                }
                
                // Hide pagination controls when rendering all rows
                $handler.find('tfoot').hide();
                
                kooTableInstance.methods.setRows(rows, kooTableInstance, false);
                console.log('KooTable: Rendering all ' + rows.length + ' rows (no pagination)');
            }

            // Use event delegation instead of binding to each button
            $handler.off('click.kootable-buttons').on('click.kootable-buttons', 'button[href]', function (evt) {
                evt.stopPropagation(); // Prevent row click
                evt.stopImmediatePropagation(); // Prevent other handlers
                evt.preventDefault();
                document.location=$(this).attr('href');                
            });
            
            // Initialize tooltips after render
            $handler.find('[data-toggle=tooltip]').tooltip();
            
            // End performance timer
            if ($.koshkilJS.profiler) {
                $.koshkilJS.profiler.stop('setData');
                var setDataTime = $.koshkilJS.profiler.getResult('setData');
                console.log('KooTable setData: ' + setDataTime.toFixed(2) + 'ms for ' + rows.length + ' rows');
            }
            
            $handler.trigger('koshkilJS.kootable.afterSetData');
        },
        
        /**
         * Recalculate virtual scroll threshold (useful when container becomes visible)
         * PUBLIC METHOD: Can be called via $('#table').kooTable('recalculateThreshold')
         * SIMPLIFIED: Just refreshes virtual scroll if active, no auto-enabling based on threshold
         */
        recalculateThreshold: function(kooTableInstance) {
            var handler = kooTableInstance.settings.handler;
            var $handler = $(handler);
            
            console.log('KooTable: Recalculating display (container may have become visible)');
            
            // If virtual scrolling is active, just refresh it (recalculate viewport, etc.)
            if (kooTableInstance.usingVirtualScroll && kooTableInstance.virtualScroll) {
                console.log('KooTable: Refreshing virtual scrolling');
                kooTableInstance.virtualScroll.onResize();
            } else {
                console.log('KooTable: Virtual scrolling not active, no action needed');
            }
        },
        
        setColumns: function (columns, kooTableInstance) {
            var handler = kooTableInstance.settings.handler;
            var rowSkeleton = {};
            var _columns = {};
            var hasBreakpoints = false;
            for (var c in columns) {
                var column = columns[c];
                if (column.breakpoints) {
                    var colBreakpoint = column.breakpoints;
                    if(colBreakpoint=='all') {
                        colBreakpoint = 'lg md sm xs';
                    }
                    var breakpoints = colBreakpoint.split(' ');
                    for (var b in breakpoints) {
                        var breakpoint = breakpoints[b];
                        if ($.trim(breakpoint) == '') {
                            continue;
                        }
                        var className = (column.classes?column.classes+' ':'')+'hidden-' + breakpoint;
                        column.classes = className;
                    }
                    hasBreakpoints = true;
                }
                var columnName=column.name
                _columns[columnName] = column;
                rowSkeleton[columnName] = '';
            }
            $(handler).data({
                'kooTable-columns': _columns,
                'kooTable-rowSkeleton': rowSkeleton
            });
            $(handler).html('');
            kooTableInstance.hasBreakpoints = hasBreakpoints;
            var _columns = $(handler).data('kooTable-columns');
            if (_columns) {
                kooTableInstance.methods.drawColumns(_columns,kooTableInstance);
            } else if (data.columns) {
                kooTableInstance.methods.setColumns(data.columns,kooTableInstance);
                var _columns = $(handler).data('kooTable-columns');
                kooTableInstance.methods.drawColumns(_columns,kooTableInstance);
            }
        },
        drawColumns: function (columns, kooTableInstance) {
            var handler = kooTableInstance.settings.handler;
            var $handler = $(handler); // Cache selector
            var thead = $('<thead/>').appendTo(handler);
            var titlesRow = $('<tr/>').appendTo(thead);
            var hasFilters = false;
            
            for (var c in columns) {
                var column = columns[c];
                var th=$('<th/>', {
                    'data-field': column.name
                }).addClass(column.classes ? column.classes : '')
                    .appendTo(titlesRow);
                $('<span/>').html(column.title ? column.title : '&nbsp;').appendTo(th);
                if (column.sortable !== false) {
                    th.addClass('kootable-sortable');
                    $('<span/>').addClass('kooicon kooicon-sort').appendTo(th);
                }
                if (column.filterable !== false) {
                    hasFilters = true;
                }
            }
            
            // Use event delegation for sorting
            thead.off('click.sort').on('click.sort', 'th.kootable-sortable', $.koshkilJS.kooTable.sorting.doSort);
            if (hasFilters) {
                titlesRow.find('th').each(function () {
                    $(this).addClass('no-border');
                });
                filtersRow = $('<tr/>').appendTo(thead);
                for (var c in columns) {
                    var column = columns[c];
                    var th=$('<th/>').addClass(column.classes ? column.classes : '').addClass('filter')
                        .appendTo(filtersRow);
                    if (column.filterable !== false) {
                        $('<input/>', {
                            id: 'search-' + column.name,
                            'data-role':'head-filter',
                            'data-handler':handler
                        }).css({
                            'width': '100%'
                        }).on('keyup',kooTableInstance.methods.doFilter).appendTo(th);
                    }
                }
            }
        },
        buildRowElement: function (row, kooTableInstance, rowSkeleton, columns) {
            // With DataStore, we render only current page rows, so all visible rows are on the "current" page
            // Without DataStore (legacy), calculate page based on row index
            var pageNumber;
            if (kooTableInstance.dataStore) {
                // DataStore mode: all rendered rows belong to current page
                pageNumber = kooTableInstance.dataStore.currentPage;
            } else {
                // Legacy mode: calculate page from row index
                pageNumber = Math.ceil(row._rowIndex / kooTableInstance.settings.pageSize);
            }
            
            var tr = $('<tr/>', {
                'data-page': pageNumber
            });
            if (row.rowClass) { 
                tr.addClass(row.rowClass);
            }
            
            // OPTIMIZATION: Use shallow copy instead of deep clone
            var rowPlaceholders = {};
            for (var key in rowSkeleton) {
                if (rowSkeleton.hasOwnProperty(key)) {
                    rowPlaceholders[key] = rowSkeleton[key];
                }
            }
            for (var column in row) {
                colName = column;
                if (!isNaN(colName)) {
                    colName = "c" + colName;
                }
                if (rowPlaceholders[colName] !== undefined) {
                    rowPlaceholders[colName] = row[column]
                };
            }
            
            var cellIdx = 0;
            var hiddenColumnsData = {}; // Store for lazy loading
            
            for (column in rowPlaceholders) {
                if (rowPlaceholders[column]===undefined) {
                    continue;
                }
                var classes = columns[column].classes ? columns[column].classes : (row[column] && row[column].classes?row[column].classes:'');
                if (cellIdx == 0) {
                    classes += ' kootable-first-visible';
                }
                var cellContent;
                var td;
                
                if (columns[column].formatter) {
                    // OPTIMIZATION: Use Object.create instead of deep clone
                    var cell = Object.create($.koshkilJS.kooTable.objects.cell);
                    cell._colName = columns[column].name;
                    cell._value = rowPlaceholders[column];
                    // Create row object with proper prototype to include getData() method
                    var __row = Object.create($.koshkilJS.kooTable.objects.row);
                    __row._data = row;
                    cell._row = __row;
                    cellContent = columns[column].formatter(cell, columns[column].formatterParams || {});
                    td = $('<td/>', {
                        'data-column': column
                    }).addClass(classes).css('display', 'table-cell');
                    $(cellContent).appendTo(td);
                    td.appendTo(tr);
                } else {
                    cellContent = rowPlaceholders[column];
                    td = $('<td/>',{
                        'data-column':column
                    }).addClass(classes).css('display', 'table-cell').html(cellContent);
                    
                    // Mark editable cells for event delegation
                    if (columns[column].editable && columns[column].editor) {
                        td.attr('data-editable', 'true');
                        td.attr('data-editor-column', column);
                    }
                    td.appendTo(tr);
                }
                
                // Store hidden column data for lazy loading
                var isHidden = classes && (classes.indexOf('hidden-') >= 0);
                if (isHidden) {
                    hiddenColumnsData[column] = {
                        title: columns[column].title,
                        content: cellContent,
                        classes: columns[column].classes
                    };
                }
                
                cellIdx++;   
            }
            // OPTIMIZATION: Lazy load breakpoint details
            if (kooTableInstance.hasBreakpoints) {
                var plusSign = $('<span/>').addClass('kootable-toggle kooicon kooicon-plus');
                plusSign.appendTo(tr.find('td.kootable-first-visible'));
                
                // Store data for lazy rendering instead of building upfront
                tr.data('hiddenColumns', hiddenColumnsData);
                tr.data('colspan', tr.find('td').length);
            }
            
            tr.data('rowData', row);
            return tr;
        },
        addRow: function (row, kooTableInstance) {
            // Kept for backward compatibility - use buildRowElement for new code
            var handler = kooTableInstance.settings.handler;
            var $tbody = $(handler).find('tbody');
            var rowSkeleton = $(handler).data('kooTable-rowSkeleton');
            var columns = $(handler).data('kooTable-columns');
            
            if (!columns) columns = {};
            if (!rowSkeleton) rowSkeleton = {};
            
            var tr = kooTableInstance.methods.buildRowElement(row, kooTableInstance, rowSkeleton, columns);
            $tbody.append(tr);
        },
        setRows: function (rows, kooTableInstance, skipPaginationInit) {
            var handler = kooTableInstance.settings.handler;
            var $handler = $(handler); // Cache selector
            
            // Clear existing tbody
            $handler.find('tbody').remove();
            var $tbody = $('<tbody/>');
            var $thead = $handler.find('thead tr:first-child th');
            var colspan = $thead.length;
            
            kooTableInstance.columnCount = colspan;
            $handler.data('kooTable', kooTableInstance);
            
            if (rows.length == 0) {
                var emptyRow = $('<tr/>');
                $('<td/>', {
                    colspan: colspan,
                    align: 'center'
                }).addClass('kootable-empty').html(kooTableInstance.settings.emptyString).appendTo(emptyRow);
                $tbody.append(emptyRow);
            } else {
                var rowSkeleton = $handler.data('kooTable-rowSkeleton');
                var columns = $handler.data('kooTable-columns');
                
                if (!columns) columns = {};
                if (!rowSkeleton) rowSkeleton = {};
                
                // OPTIMIZATION: Build all rows in memory first
                var rowElements = [];
                
                // Calculate starting row index based on current page from DataStore
                var startRowIndex = 1;
                if (kooTableInstance.dataStore) {
                    // With DataStore: calculate actual row position in full dataset
                    startRowIndex = ((kooTableInstance.dataStore.currentPage - 1) * kooTableInstance.settings.pageSize) + 1;
                }
                
                var _rowIndex = startRowIndex;
                for (var r in rows) {
                    var row = rows[r];
                    row._rowIndex = _rowIndex;
                    var $tr = kooTableInstance.methods.buildRowElement(row, kooTableInstance, rowSkeleton, columns);
                    rowElements.push($tr);
                    _rowIndex++;
                }
                
                // Single batch append
                $tbody.append(rowElements);
                
                // Event delegation for editable cells
                $tbody.off('click.editable').on('click.editable', 'td[data-editable="true"]', function() {
                    var $td = $(this);
                    var columnName = $td.attr('data-editor-column');
                    var $tr = $td.closest('tr');
                    var rowData = $tr.data('rowData');
                    var column = columns[columnName];
                    
                    if (column && column.editor) {
                        var cell = Object.create($.koshkilJS.kooTable.objects.cell);
                        cell._colName = columnName;
                        cell._value = rowData[columnName];
                        cell._row = { _data: rowData };
                        column.editor(cell, column.editorParams || {});
                    }
                });
                
                // Event delegation for breakpoint details
                if (kooTableInstance.hasBreakpoints) {
                    $tbody.off('click.breakpoint').on('click.breakpoint', 'tr[data-page]', function(evt) {
                        // Ignore clicks on interactive elements to prevent event bubbling issues
                        var $target = $(evt.target);
                        if ($target.is('button, a, input, select, textarea') || 
                            $target.closest('button, a, input, select, textarea').length > 0) {
                            return; // Let the element handle its own click
                        }
                        
                        var $tr = $(this);
                        var $tbody = $tr.parent();
                        var $detailRow = $tr.next('.kootable-detail-row');
                        var $sign = $tr.find('td.kootable-first-visible .kootable-toggle.kooicon');
                        
                        // Close all other detail rows
                        $tbody.find('.kootable-detail-row').remove();
                        $tbody.find('tr').data('detailsRowShown', false);
                        $tbody.find('tr td.kootable-first-visible .kootable-toggle.kooicon-minus')
                            .removeClass('kooicon-minus').addClass('kooicon-plus');
                        
                        if ($sign.hasClass('kooicon-plus') && !$tr.data('detailsRowShown')) {
                            // Build detail row on demand
                            var hiddenColumns = $tr.data('hiddenColumns');
                            var colspan = $tr.data('colspan');
                            
                            if (hiddenColumns && Object.keys(hiddenColumns).length > 0) {
                                var $newDetailRow = $('<tr/>').addClass('kootable-detail-row');
                                var $tdDetails = $('<td/>', { colspan: colspan }).appendTo($newDetailRow);
                                var $tableDetails = $('<table/>').addClass('kootable-details table table-stripped').appendTo($tdDetails);
                                var $tbodyDetails = $('<tbody/>').appendTo($tableDetails);
                                
                                for (var col in hiddenColumns) {
                                    var colData = hiddenColumns[col];
                                    $('<tr><th>' + colData.title + '</th><td class="' + colData.classes + '">' + colData.content + '</td></tr>')
                                        .appendTo($tbodyDetails);
                                }
                                
                                $newDetailRow.find('td').removeClass('hidden-xs hidden-md hidden-sm hidden-lg');
                                $tr.after($newDetailRow);
                                $sign.removeClass('kooicon-plus').addClass('kooicon-minus');
                                $tr.data('detailsRowShown', true);
                            }
                        } else {
                            $sign.removeClass('kooicon-minus').addClass('kooicon-plus');
                            $tr.data('detailsRowShown', false);
                        }
                    });
                }
            }
            
            // Append tbody in single operation
            $handler.append($tbody);
            
            // ONLY initialize pagination if explicitly requested (to avoid recursive loop)
            // Main initialization happens from setData() after first render
            if (!skipPaginationInit && rows.length > 0 && kooTableInstance.settings.pagingEnabled && !kooTableInstance.dataStore) { 
                // Fallback for old code without DataStore
                kooTableInstance.pagination.pageNumber = 1;
                kooTableInstance.pagination.init(kooTableInstance);
            }
        },
        loadData: function (parameters, kooTableInstance) { 
            var handler = kooTableInstance.settings.handler;
            $(handler).find('tbody').remove();
            var tbody=$('<tbody/>').appendTo(handler);
            var colspan = $(handler).find('thead tr:first-child th').length;
            $.Deferred(function (d) {

                var trDetails = $('<tr/>').addClass('kootable-detail-row').appendTo(tbody);
                var tdDetails = $('<td/>', {
                    colspan: colspan
                }).appendTo(trDetails);
                var tableDetails = $('<table/>').addClass('kootable-details table table-stripped').appendTo(tdDetails);
                var tbodyDetails = $('<tbody/>').appendTo(tableDetails);
                $('<td/>', {
                    colspan: colspan,
                    align: 'center'
                }).html('<i class="fa fa-fw fa-spinner fa-spin fa-2x"></i><br>' + kooTableInstance.settings.loadingString).appendTo(tbodyDetails);
                d.resolve();
            }).then(function () {
                $.koshkilJS.helpers.callAjax(parameters.url, parameters.data, parameters.callBack);    
            })
            
        },
    });
})(jQuery);
