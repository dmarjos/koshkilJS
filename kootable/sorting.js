(function ($) {
    $.extend($.koshkilJS.kooTable || {}, {
        sorting: {
            currentDirection:null,
            preInit: function (kooTableInstance) {
            },
            init: function (kooTableInstance) { 
                if (!kooTableInstance) {
                    return;
                }
                kooTableInstance.raiseEvent('koshkilJS.kootable.sorting.preinit', [kooTableInstance]).then(function () {
                    $.koshkilJS.kooTable.sorting.preInit(kooTableInstance);
                });
            },
            /**
             * Sort table using DataStore (Phase 2 Optimization)
             * OPTIMIZATION: Native array sort on data (5-10x faster than tinysort on DOM)
             */
            doSort: function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
                
                var kooTableInstance = $(this).parents('table').data('kooTable');
                var handler = kooTableInstance.settings.handler;
                var $handler = $(handler);
                var $header = $(this);
                
                if (!kooTableInstance.dataStore) {
                    console.warn('KooTable: DataStore not initialized. Sorting disabled.');
                    return;
                }
                
                // Start performance timer
                if ($.koshkilJS.profiler) {
                    $.koshkilJS.profiler.start('sort');
                }
                
                // Determine sort direction (toggle between asc/desc)
                var currentDirection = $header.data('currentDirection');
                var newDirection = currentDirection === 'A' ? 'D' : 'A';
                var columnName = $header.attr('data-field');
                
                // Update UI - remove sort indicators from other headers
                $header.siblings().each(function () {
                    $(this).removeClass('kootable-asc kootable-desc');
                    $(this).find('span.kooicon').removeClass('kooicon-sort kooicon-sort-asc kooicon-sort-desc').addClass('kooicon-sort');
                    $(this).data('currentDirection', null);
                });
                
                // Update UI - add sort indicator to current header
                var icon, className;
                if (newDirection === 'A') {
                    className = 'kootable-asc';
                    icon = 'kooicon-sort-asc';
                } else {
                    className = 'kootable-desc';
                    icon = 'kooicon-sort-desc';
                }
                
                $header.data('currentDirection', newDirection);
                $header.removeClass('kootable-asc kootable-desc').addClass(className);
                $header.find('span.kooicon').removeClass('kooicon-sort kooicon-sort-asc kooicon-sort-desc').addClass(icon);
                
                // Trigger before sorting event
                kooTableInstance.raiseEvent('koshkilJS.kootable.beforeSorting', [columnName, newDirection]).then(function () {
                    // Apply sort at data level
                    var sortDirection = newDirection === 'A' ? 'asc' : 'desc';
                    kooTableInstance.dataStore.applySort(columnName, sortDirection);
                    
                    // Determine rendering mode based on current result count
                    var currentCount = kooTableInstance.dataStore.getTotalRows();
                    
                    // Simple check: Use virtual scrolling if explicitly enabled by user
                    var shouldUseVirtualScrolling = kooTableInstance.settings.virtualScrolling && currentCount > 0;
                    
                    // Re-render with sorted data
                    if (shouldUseVirtualScrolling) {
                        // PHASE 3: Virtual scrolling refresh
                        // Initialize virtual scroll if not already active
                        if (!kooTableInstance.usingVirtualScroll) {
                            if (!kooTableInstance.virtualScroll) {
                                kooTableInstance.virtualScroll = new $.koshkilJS.kooTable.VirtualScroll();
                            }
                            var vsOptions = {
                                rowHeight: kooTableInstance.settings.virtualScrollRowHeight,
                                overscan: kooTableInstance.settings.virtualScrollOverscan,
                                maxHeight: kooTableInstance.settings.virtualScrollMaxHeight
                            };
                            kooTableInstance.virtualScroll.init(kooTableInstance, vsOptions);
                            kooTableInstance.usingVirtualScroll = true;
                            
                            // Hide pagination controls when switching to virtual scrolling
                            $handler.find('tfoot').hide();
                            
                            console.log('KooTable Sort: Initialized virtual scrolling (' + currentCount + ' rows)');
                        } else {
                            kooTableInstance.virtualScroll.refresh();
                        }
                    } else if (kooTableInstance.settings.pagingEnabled) {
                        // PHASE 2: Pagination refresh
                        // Disable virtual scrolling if user disabled the setting
                        if (kooTableInstance.usingVirtualScroll && kooTableInstance.virtualScroll) {
                            kooTableInstance.virtualScroll.destroy();
                            kooTableInstance.usingVirtualScroll = false;
                            console.log('KooTable Sort: Disabled virtual scrolling, using pagination (' + currentCount + ' rows)');
                        }
                        
                        // Show first page of sorted data
                        var pageData = kooTableInstance.dataStore.getPage(1);
                        kooTableInstance.methods.setRows(pageData, kooTableInstance, true); // Skip pagination init
                        
                        // Update pagination controls
                        if ($.koshkilJS.kooTable.pagination) {
                            $.koshkilJS.kooTable.pagination.refreshPagination(kooTableInstance);
                            
                            // Ensure pagination controls are visible
                            $handler.find('tfoot').show();
                        }
                    } else {
                        // Render all sorted data
                        // Disable virtual scrolling if user disabled the setting
                        if (kooTableInstance.usingVirtualScroll && kooTableInstance.virtualScroll) {
                            kooTableInstance.virtualScroll.destroy();
                            kooTableInstance.usingVirtualScroll = false;
                            console.log('KooTable Sort: Disabled virtual scrolling, rendering all rows (' + currentCount + ' rows)');
                        }
                        
                        // Hide pagination controls when rendering all rows
                        $handler.find('tfoot').hide();
                        
                        var allSorted = kooTableInstance.dataStore.getAllData();
                        kooTableInstance.methods.setRows(allSorted, kooTableInstance, true);
                    }
                    
                    // End performance timer
                    if ($.koshkilJS.profiler) {
                        $.koshkilJS.profiler.stop('sort');
                        var sortTime = $.koshkilJS.profiler.getResult('sort');
                        console.log('KooTable Sort: ' + sortTime.toFixed(2) + 'ms for ' + 
                                   kooTableInstance.dataStore.getTotalRows() + ' rows');
                    }
                    
                    // Trigger after sorting event
                    $handler.trigger('koshkilJS.kootable.afterSorting', [columnName, sortDirection]);
                });
            }
        }
    });
})(jQuery);
