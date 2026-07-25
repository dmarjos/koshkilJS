//dependencies: main.js pagination.js breakpoints.js objects.js methods.js methods/data.js methods/filters.js methods/events.js sorting.js datastore.js virtualscroll.js tinysort/tinysort.js
/**
 * KooTable v1.0
 * JS Code Author: Daniel Marjos <dmarjos at gmail.com>
 * CSS Author: Steven Usher & Brad Vincent 
 * 
 * Inspired by FooTable (https://github.com/fooplugins/FooTable) and Tabulator (https://tabulator.info/)
 * 
 * KooTable is a grid library, that takes the simplicity and beauty of FooTable's UI and some of the customization capabilities of Tabulator
 * 
 * No JavaScript code was taken from any of the above mentioned plugins, but FooTable CSS is used enterely, renaming classes 
 * from .footable-* to .kootable-* just for consistency sake.
 */
(function($) {
    jQuery.expr[':'].icontains = function(a, i, m) {
        return jQuery(a).text().toUpperCase()
            .indexOf(m[3].toUpperCase()) >= 0;
    };
    $.koshkilJS = $.extend($.koshkilJS || {}, {
        kooTable: {
            settings: {
                handler: null,
                emptyString:"No hay informaci&oacute;n disponible",
                searchString:"Buscar...",
                loadingString:"Cargando Informaci&oacute;n...",
                pageSize: 25,
                paginatorAlign: 'right',
                reDrawColumns: false,
                kootableEvents: {
                    afterSetData:null,
                },
                plugins: {},
                filteringEnabled: true,
                pagingEnabled:true,
                autoloadListings: true,
                // Phase 3: Virtual Scrolling Options (DISABLED BY DEFAULT - User must opt-in)
                virtualScrolling: false,              // Enable virtual scrolling manually for large datasets
                virtualScrollRowHeight: 35,           // Fixed row height
                virtualScrollOverscan: 5,             // Extra rows above/below viewport
                virtualScrollMaxHeight: null,         // Auto-calculated: max(600px, 80vh)
                virtualScrollThresholdMultiplier: 2,  // (Not used for auto-enabling, kept for compatibility)
            }
        }
    });
    
    $.fn.kooTable = function (options) {
        var kooTableInstance;
        if (typeof options === 'object' || !options) {
            var settings = $.koshkilJS.cloneObject($.koshkilJS.kooTable.settings);
            $.extend(settings, options || {});
            
            var emptyString = $(this).attr('data-empty-table');
            if (emptyString) settings.emptyString=emptyString;
            
            var searchString = $(this).attr('data-search-string');
            if (searchString) settings.searchString=searchString;
            
            var loadingString = $(this).attr('data-loading-string');
            if (loadingString) settings.loadingString=loadingString;
            
            var pageSize = $(this).attr('data-page-size');
            if (pageSize) settings.pageSize=pageSize;
        
            var filteringEnabled=$(this).attr('data-filterable');
            if (filteringEnabled) settings.filteringEnabled=filteringEnabled!=='no';
            
            var pagingEnabled=$(this).attr('data-paging');
            if (pagingEnabled) settings.pagingEnabled=pagingEnabled !== 'no';

            var paginatorAlign = $(this).attr('data-paginator-align');
            if (paginatorAlign) settings.paginatorAlign=paginatorAlign;
            
            settings.handler = '#' + $(this).attr('id');
            
            /**
             * Clone the main object
             */
            kooTableInstance = $.koshkilJS.cloneObject($.koshkilJS.kooTable);
            kooTableInstance.settings = settings;

            if (settings.filteringEnabled) {
                $(settings.handler).addClass('kootable-filtering');
            }

            if (settings.pagingEnabled) {
                $(settings.handler).addClass('kootable-paging kootable-paging-'+settings.paginatorAlign);
            }

            $(settings.handler).html('');
            kooTableInstance.methods.setEvents(kooTableInstance.kootableEvents, kooTableInstance);
            $(this).data('kooTable', kooTableInstance);
        } else if (options !== undefined && typeof $.koshkilJS.kooTable.methods[options] === 'function') {
            kooTableInstance = $(this).data('kooTable');
            var args = Array.from(arguments);
            args.shift();
            args.push(kooTableInstance);
            kooTableInstance.methods[options](...args);
        } 
        return $(this);
    }
})(jQuery);
(function ($) {
    $.koshkilJS.kooTable = $.extend($.koshkilJS.kooTable || {}, {
        pagination: {
            pageNumber: 1,
            pages: 1,
            range: 5,
            listeners: {
                pageSelection: function (evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    if ($(this).parent().hasClass('disabled')) return;
                    var kooTableInstance = $(this).parents('table.kootable').data('kooTable');
                    var handler = kooTableInstance.settings.handler;
                    var page = $(this).parent().attr('data-page');
                    var rangePage =parseInt($($(handler).find('ul.pagination li.kootable-page.visible')[0]).attr('data-page'),10);
                    switch (page) {
                        case 'first':
                            $.koshkilJS.kooTable.pagination.gotoPage(1, kooTableInstance);
                            $.koshkilJS.kooTable.pagination.selectRange(1, kooTableInstance);
                            break;
                        case 'prev':
                            var pageNumber = kooTableInstance.pagination.pageNumber - 1;
                            $.koshkilJS.kooTable.pagination.gotoPage(pageNumber, kooTableInstance);
                            $.koshkilJS.kooTable.pagination.selectRange(pageNumber, kooTableInstance);
                            break;
                        case 'next':
                            var pageNumber = kooTableInstance.pagination.pageNumber + 1;
                            var firstRange = pageNumber - (kooTableInstance.pagination.range-1);
                            $.koshkilJS.kooTable.pagination.gotoPage(pageNumber, kooTableInstance);
                            $.koshkilJS.kooTable.pagination.selectRange(firstRange, kooTableInstance);
                            break;
                        case 'last':
                            var pageNumber = kooTableInstance.pagination.pages;
                            var firstRange = pageNumber - (kooTableInstance.pagination.range-1);
                            $.koshkilJS.kooTable.pagination.gotoPage(kooTableInstance.pagination.pages, kooTableInstance);
                            $.koshkilJS.kooTable.pagination.selectRange(firstRange, kooTableInstance);
                            break;
                        case 'prev-limit': $.koshkilJS.kooTable.pagination.selectRange(rangePage - kooTableInstance.pagination.range, kooTableInstance); break;
                        case 'next-limit': $.koshkilJS.kooTable.pagination.selectRange(rangePage + kooTableInstance.pagination.range, kooTableInstance); break;
                        default: $.koshkilJS.kooTable.pagination.gotoPage(page,kooTableInstance); break;
                    }
                }
            },
            selectRange: function (firstRange, kooTableInstance) { 
                var handler = kooTableInstance.settings.handler;
                var $handler = $(handler); // Cache selector
                var $paginator = $handler.find('tfoot'); // Cache paginator
                var $pagination = $handler.find('.kootable-paging ul.pagination'); // Cache pagination list
                
                if (firstRange < 1) {
                    firstRange = 1;
                }
                var lastRange = (firstRange + kooTableInstance.pagination.range)-1;
                if (lastRange > kooTableInstance.pagination.pages) {
                    lastRange = kooTableInstance.pagination.pages
                }

                if (firstRange<=1) {
                    $pagination.find('li[data-page=prev-limit]').addClass('disabled');
                } else {
                    $pagination.find('li[data-page=prev-limit]').removeClass('disabled');
                }

                if (lastRange >= kooTableInstance.pagination.pages) {
                    $pagination.find('li[data-page=next-limit]').addClass('disabled');
                } else {
                    $pagination.find('li[data-page=next-limit]').removeClass('disabled');
                }

                var $pages = $paginator.find('ul li.kootable-page');
                $pages.removeClass('visible');
                $pages.slice(firstRange - 1, lastRange).addClass('visible');
            },
            /**
             * Navigate to specific page using DataStore (Phase 2 Optimization)
             * OPTIMIZATION: Render only visible rows instead of hiding all rows
             */
            gotoPage: function (pageNumber,kooTableInstance) { 
                var handler = kooTableInstance.settings.handler;
                var $handler = $(handler); // Cache selector
                
                if (!kooTableInstance.dataStore) {
                    console.warn('KooTable: DataStore not initialized. Pagination disabled.');
                    return;
                }
                
                pageNumber = parseInt(pageNumber, 10);
                kooTableInstance.pagination.pageNumber = pageNumber;

                var $visiblePages = $handler.find('ul.pagination li.kootable-page.visible');
                var rangePage = parseInt($visiblePages.first().attr('data-page'), 10);
                var lastRange = rangePage + kooTableInstance.pagination.range;
                
                // Close any open detail rows when changing pages
                var $detailRows = $handler.find('tbody .kootable-detail-row');
                if ($detailRows.length > 0) {
                    $detailRows.remove();
                    var $signs = $handler.find('tr td.kootable-first-visible .kootable-toggle.kooicon-minus');
                    $signs.removeClass('kooicon-minus').addClass('kooicon-plus');
                    $signs.parents('tr').data('detailsRowShown', false);
                }
                
                var $pagination = $handler.find('.kootable-paging ul.pagination');
                
                // Update pagination control states
                if (kooTableInstance.pagination.pageNumber == 1) {
                    $pagination.find('li[data-page=first]').addClass('disabled');
                    $pagination.find('li[data-page=prev]').addClass('disabled');
                } else {
                    $pagination.find('li[data-page=first]').removeClass('disabled');
                    $pagination.find('li[data-page=prev]').removeClass('disabled');
                }
                if (rangePage < kooTableInstance.pagination.range) {
                    $pagination.find('li[data-page=prev-limit]').addClass('disabled');
                }

                if (lastRange > kooTableInstance.pagination.pages) {
                    $pagination.find('li[data-page=next-limit]').addClass('disabled');
                } else {
                    $pagination.find('li[data-page=next-limit]').removeClass('disabled');
                }

                if (kooTableInstance.pagination.pageNumber==kooTableInstance.pagination.pages) {
                    $pagination.find('li[data-page=last]').addClass('disabled');
                    $pagination.find('li[data-page=next]').addClass('disabled');
                } else {
                    $pagination.find('li[data-page=last]').removeClass('disabled');
                    $pagination.find('li[data-page=next]').removeClass('disabled');
                }

                // OPTIMIZATION: Get page data from DataStore and re-render (no hiding/showing)
                // NOTE: DataStore.getPage() updates currentPage internally, so buildRowElement will use correct page number
                var pageData = kooTableInstance.dataStore.getPage(pageNumber);
                kooTableInstance.methods.setRows(pageData, kooTableInstance, true); // Skip pagination init to avoid recursion
                
                // Update active page indicator in pagination UI
                var $pageItems = $handler.find('tfoot tr td ul li.kootable-page');
                $pageItems.filter('.active').removeClass('active');
                $pageItems.filter('[data-page=' + pageNumber + ']').addClass('active');
                
                // Update pagination page number label
                $handler.find('tfoot .label').html(kooTableInstance.pagination.pageNumber + ' de ' + kooTableInstance.pagination.pages);

                $handler.data('kooTable', kooTableInstance);                
            },
            paginatorLink: function (text) {
                return $('<a/>', {
                    href:'#'
                }).addClass('footable-page-link').html(text);
            },
            buildPaginator: function (kooTableInstance) { 
                var handler = kooTableInstance.settings.handler;
                $(handler).find('tfoot').remove();

                var paginator = $('<tfoot/>').appendTo(handler);
                var trPaginator = $('<tr/>').addClass('kootable-paging').appendTo(paginator);
                var tdPaginator = $('<td/>', {
                    colspan: kooTableInstance.columnCount,
                    'align':'right'
                });
                $(tdPaginator).css({'text-align':'right !important'});
                $(tdPaginator).appendTo(trPaginator);

                var ulPagination = $('<ul/>').addClass('pagination').appendTo(tdPaginator);
                var firstRange = kooTableInstance.pagination.pageNumber - kooTableInstance.pagination.range;
                if (firstRange < 1) {
                    firstRange = 1;
                }
                var lastRange = (firstRange + kooTableInstance.pagination.range)-1;
                if (lastRange > kooTableInstance.pagination.pages) {
                    lastRange = kooTableInstance.pagination.pages
                }
                $('<li/>', {
                    'data-page': 'first'
                }).addClass('kootable-page-nav').appendTo(ulPagination);
                $.koshkilJS.kooTable.pagination.paginatorLink('&laquo;').appendTo(handler+' .kootable-paging ul.pagination li[data-page=first]');
                if (kooTableInstance.pagination.pageNumber == 1) {
                    $(handler+' .kootable-paging ul.pagination li[data-page=first]').addClass('disabled');
                }
                $('<li/>', {
                    'data-page': 'prev'
                }).addClass('kootable-page-nav').appendTo(ulPagination);
                if (kooTableInstance.pagination.pageNumber == 1) {
                    $(handler+' .kootable-paging ul.pagination li[data-page=prev]').addClass('disabled');
                }
                $.koshkilJS.kooTable.pagination.paginatorLink('<').appendTo(handler+' .kootable-paging ul.pagination li[data-page=prev]');
                $('<li/>', {
                    'data-page': 'prev-limit'
                }).addClass('kootable-page-nav').appendTo(ulPagination);
                if (kooTableInstance.pagination.pageNumber <= firstRange) {
                    $(handler+' .kootable-paging ul.pagination li[data-page=prev-limit]').addClass('disabled');
                }
                $.koshkilJS.kooTable.pagination.paginatorLink('...').appendTo(handler+' .kootable-paging ul.pagination li[data-page=prev-limit]');


                for (var p = 1; p <= kooTableInstance.pagination.pages; p++) {
                    var visible = '';
                    if (p >= firstRange && p <= lastRange) {
                        visible += ' visible';
                    }
                    if (p == kooTableInstance.pagination.pageNumber) {
                        visible += ' active';
                    }
                    $('<li/>', {
                        'data-page': p
                    }).addClass('kootable-page' + visible).appendTo(ulPagination);
                    $.koshkilJS.kooTable.pagination.paginatorLink(p).appendTo(handler+' .kootable-paging ul.pagination li[data-page='+p+']');
                }

                $('<li/>', {
                    'data-page': 'next-limit'
                }).addClass('kootable-page-nav').appendTo(ulPagination);
                if (kooTableInstance.pagination.pageNumber > (kooTableInstance.pagination.pages-kooTableInstance.pagination.range)) {
                    $(handler+' .kootable-paging ul.pagination li[data-page=next-limit]').addClass('disabled');
                }
                $.koshkilJS.kooTable.pagination.paginatorLink('...').appendTo(handler+' .kootable-paging ul.pagination li[data-page=next-limit]');

                $('<li/>', {
                    'data-page': 'next'
                }).addClass('kootable-page-nav').appendTo(ulPagination);
                if (kooTableInstance.pagination.pageNumber == kooTableInstance.pagination.pages) {
                    $(handler+' .kootable-paging ul.pagination li[data-page=next]').addClass('disabled');
                }
                $.koshkilJS.kooTable.pagination.paginatorLink('>').appendTo(handler+' .kootable-paging ul.pagination li[data-page=next]');

                $('<li/>', {
                    'data-page': 'last'
                }).addClass('kootable-page-nav').appendTo(ulPagination);
                $.koshkilJS.kooTable.pagination.paginatorLink('&raquo;').appendTo(handler+' .kootable-paging ul.pagination li[data-page=last]');
                if (kooTableInstance.pagination.pageNumber == kooTableInstance.pagination.pages) {
                    $(handler+' .kootable-paging ul.pagination li[data-page=last]').addClass('disabled');
                }
                $('<div/>').addClass('divider').appendTo(tdPaginator);
                $('<span/>').addClass('label label-defautl').html(kooTableInstance.pagination.pageNumber + ' de ' + kooTableInstance.pagination.pages).appendTo(tdPaginator);
                tdPaginator.find('li[data-page] a').unbind('click').on('click', $.koshkilJS.kooTable.pagination.listeners.pageSelection);
            },
            /**
             * Show specific page (DEPRECATED in Phase 2)
             * Kept for backward compatibility but replaced by gotoPage re-rendering
             */
            showPage: function (kooTableInstance) { 
                // This method is now handled by gotoPage re-rendering with DataStore
                // Kept for backward compatibility only
                console.warn('KooTable: showPage is deprecated. Page rendering handled by DataStore.');
            },
            /**
             * Initialize pagination with DataStore (Phase 2 Optimization)
             * OPTIMIZATION: Only builds UI, doesn't trigger re-render
             */
            init: function (kooTableInstance) {
                var handler = kooTableInstance.settings.handler;
                var $handler = $(handler); // Cache selector
                
                if (kooTableInstance.dataStore) {
                    // Get total pages from DataStore
                    kooTableInstance.pagination.pages = kooTableInstance.dataStore.getTotalPages();
                } else {
                    // Fallback: Count DOM rows
                    var totalRows = $handler.find('tbody tr[data-page]').length;
                    kooTableInstance.pagination.pages = Math.ceil(totalRows / kooTableInstance.settings.pageSize);
                }
                
                // Set to page 1
                kooTableInstance.pagination.pageNumber = 1;
                
                $handler.data('kooTable', kooTableInstance);                
                if (kooTableInstance.pagination.pages > 1) {
                    $.koshkilJS.kooTable.pagination.buildPaginator(kooTableInstance);
                    // DON'T call gotoPage here - data is already rendered for page 1
                    // Just update the UI state
                    var $pageItems = $handler.find('tfoot tr td ul li.kootable-page');
                    $pageItems.filter('[data-page=1]').addClass('active');
                } else if (kooTableInstance.pagination.pages === 1) {
                    // Single page, no pagination needed
                    kooTableInstance.pagination.pageNumber = 1;
                }
            },
            /**
             * Refresh pagination after filter/sort changes (Phase 2 NEW)
             * Rebuild paginator and stay on valid page
             */
            refreshPagination: function(kooTableInstance) {
                var handler = kooTableInstance.settings.handler;
                var $handler = $(handler);
                
                if (!kooTableInstance.dataStore) return;
                
                // Get new total pages from DataStore
                var newTotalPages = kooTableInstance.dataStore.getTotalPages();
                kooTableInstance.pagination.pages = newTotalPages;
                
                // Validate current page
                var currentPage = kooTableInstance.pagination.pageNumber;
                if (currentPage > newTotalPages && newTotalPages > 0) {
                    currentPage = newTotalPages;
                }
                if (currentPage < 1) currentPage = 1;
                
                // Rebuild paginator UI
                if (newTotalPages > 1) {
                    $.koshkilJS.kooTable.pagination.buildPaginator(kooTableInstance);
                    $.koshkilJS.kooTable.pagination.gotoPage(currentPage, kooTableInstance);
                } else if (newTotalPages === 1) {
                    // Single page - remove paginator or show disabled
                    $handler.find('tfoot').remove();
                    kooTableInstance.pagination.pageNumber = 1;
                    var pageData = kooTableInstance.dataStore.getPage(1);
                    kooTableInstance.methods.setRows(pageData, kooTableInstance, true);
                } else {
                    // No data
                    $handler.find('tfoot').remove();
                    kooTableInstance.methods.setRows([], kooTableInstance, true);
                }
            }
        },
    });

})(jQuery);
(function ($) {
    $.extend($.koshkilJS.kooTable || {}, {
        breakpoints: {
            preInit: function (kooTableInstance) {
                console.log('preinit breakpoints');
            },
            init: function (kooTableInstance) { 
                if (!kooTableInstance) {
                    return;
                }
                kooTableInstance.raiseEvent('koshkilJS.kootable.breakpoints.preinit', [kooTableInstance]).then(function () {
                    $.koshkilJS.kooTable.breakpoints.preInit(kooTableInstance);
                });
            }
        }
    });
})(jQuery);
(function ($) {
    $.koshkilJS = $.extend($.koshkilJS || {}, {
        /**
         * Debounce utility function
         * Delays function execution until after a specified wait time
         * @param {Function} func - Function to debounce
         * @param {Number} wait - Milliseconds to wait
         * @returns {Function} Debounced function
         */
        debounce: function(func, wait) {
            var timeout;
            return function() {
                var context = this;
                var args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    func.apply(context, args);
                }, wait);
            };
        }
    });
    
    $.koshkilJS.kooTable = $.extend($.koshkilJS.kooTable || {}, {
        /**
         * Calculate virtual scrolling threshold based on viewport capacity
         * @param {Object} settings - KooTable settings object
         * @returns {Number} Number of rows that fit in viewport × multiplier
         */
        calculateVirtualScrollThreshold: function(settings) {
            // Ensure settings exists
            if (!settings) {
                console.warn('KooTable: calculateVirtualScrollThreshold called without settings, using defaults');
                settings = {};
            }
            
            var calculatedMaxHeight = settings.virtualScrollMaxHeight;
            
            if (calculatedMaxHeight === null || calculatedMaxHeight === undefined) {
                // Auto-calculate: 80% of viewport height, minimum 600px
                calculatedMaxHeight = Math.max(600, Math.floor(window.innerHeight * 0.8));
            } else if (typeof calculatedMaxHeight === 'string') {
                // Parse px value (e.g., "600px" -> 600)
                calculatedMaxHeight = parseInt(calculatedMaxHeight.replace('px', ''), 10);
            }
            
            // Validate calculatedMaxHeight
            if (isNaN(calculatedMaxHeight) || calculatedMaxHeight <= 0) {
                console.warn('KooTable: Invalid maxHeight (' + calculatedMaxHeight + '), defaulting to 600px');
                calculatedMaxHeight = 600;
            }
            
            // Ensure we have a valid row height
            var rowHeight = settings.virtualScrollRowHeight || 35;
            if (isNaN(rowHeight) || rowHeight <= 0) {
                console.warn('KooTable: Invalid rowHeight (' + rowHeight + '), defaulting to 35px');
                rowHeight = 35;
            }
            
            // Calculate base capacity (rows that fit in viewport)
            var viewportCapacity = Math.ceil(calculatedMaxHeight / rowHeight);
            
            // Apply multiplier for threshold (default 2x)
            // Virtual scrolling only activates when rows significantly exceed viewport capacity
            var multiplier = settings.virtualScrollThresholdMultiplier || 2;
            if (isNaN(multiplier) || multiplier <= 0) {
                console.warn('KooTable: Invalid multiplier (' + multiplier + '), defaulting to 2');
                multiplier = 2;
            }
            
            var threshold = Math.ceil(viewportCapacity * multiplier);
            
            console.log('KooTable: Virtual scroll threshold = ' + threshold + 
                       ' rows (' + viewportCapacity + ' fit in viewport × ' + multiplier + ' multiplier)');
            
            return threshold;
        },
        
        objects: {
            row: {
                _data: null,
                getData: function () {
                    return this._data;
                }
            },
            cell: {
                _row: null,
                _value: null,
                _colName: null,
                getColumnName: function () { 
                    return this._colName;
                },
                getRow: function () {
                    return this._row;
                },
                getValue: function () { 
                    return this._value;
                },
            }
        },
    });

})(jQuery);
(function ($) {
    $.extend($.koshkilJS.kooTable || {}, {
        methods: {
            destroy: function (kooTableInstance) {
                if (!kooTableInstance) {
                    return;
                }
                var handler = kooTableInstance.settings.handler;
                $(handler).html('');
                $(handler).removeData();
            },
            setEvents: function (events, kooTableInstance) {
                var handler = kooTableInstance.settings.handler;
//                $.extend(kooTableInstance.kootableEvents,events);
//                $(handler).data('kooTable', kooTableInstance);
                for (var evt in events) {
                    eventName = 'koshkilJS.kootable.' + evt;
                    if (typeof events[evt] == 'function') {
                        $(handler).unbind(eventName).on(eventName, events[evt]);
                    }
                }
            },
        }
    });
})(jQuery);
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
(function ($) {
    $.extend($.koshkilJS.kooTable.methods || {}, {
        /**
         * Apply filters using DataStore (Phase 2 Optimization)
         * OPTIMIZATION: Operates on data array instead of DOM (10-20x faster)
         */
        doFilter: function () { 
            var handler = $(this).data('handler');
            var $handler = $(handler); // Cache selector
            var kooTableInstance = $handler.data('kooTable');
            
            if (!kooTableInstance || !kooTableInstance.dataStore) {
                // Fallback: No DataStore available, skip filtering
                console.warn('KooTable: DataStore not initialized. Filtering disabled.');
                return;
            }
            
            // Start performance timer
            if ($.koshkilJS.profiler) {
                $.koshkilJS.profiler.start('filter');
            }
            
            // Collect filter values from input fields
            var filters = [];
            $handler.find('input[data-role="head-filter"]').each(function () {
                var column = $(this).attr('id').replace('search-', '');
                var searchValue = $(this).val();
                if (searchValue && searchValue.trim() !== '') {
                    filters.push({
                        column: column,
                        value: searchValue,
                        operator: 'contains' // Default operator
                    });
                }
            });
            
            // Apply filters at data level
            kooTableInstance.dataStore.applyFilters(filters);
            
            // Reapply current sort if active
            if (kooTableInstance.dataStore.sortColumn) {
                kooTableInstance.dataStore.applySort(
                    kooTableInstance.dataStore.sortColumn,
                    kooTableInstance.dataStore.sortDirection
                );
            }
            
            // Determine rendering mode based on filtered result count
            var filteredCount = kooTableInstance.dataStore.getTotalRows();
            
            // Use cached threshold or recalculate if not available
            var threshold = kooTableInstance.virtualScrollThreshold;
            if (!threshold) {
                threshold = $.koshkilJS.kooTable.calculateVirtualScrollThreshold(
                    kooTableInstance.settings
                );
                kooTableInstance.virtualScrollThreshold = threshold;
            }
            
            var shouldUseVirtualScrolling = kooTableInstance.settings.virtualScrolling && 
                                           filteredCount >= threshold;
            
            // Re-render with filtered data
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
                    $(kooTableInstance.settings.handler).find('tfoot').hide();
                    
                    console.log('KooTable Filter: Initialized virtual scrolling (' + filteredCount + ' rows)');
                } else {
                    kooTableInstance.virtualScroll.refresh();
                }
            } else if (kooTableInstance.settings.pagingEnabled) {
                // PHASE 2: Pagination refresh
                // Disable virtual scrolling if user disabled the setting
                if (kooTableInstance.usingVirtualScroll && kooTableInstance.virtualScroll) {
                    kooTableInstance.virtualScroll.destroy();
                    kooTableInstance.usingVirtualScroll = false;
                    console.log('KooTable Filter: Disabled virtual scrolling, using pagination (' + filteredCount + ' rows)');
                }
                
                // Update pagination with filtered data
                var pageData = kooTableInstance.dataStore.getPage(1);
                kooTableInstance.methods.setRows(pageData, kooTableInstance, true); // Skip pagination init
                
                // Update pagination controls
                if ($.koshkilJS.kooTable.pagination) {
                    $.koshkilJS.kooTable.pagination.refreshPagination(kooTableInstance);
                    
                    // Ensure pagination controls are visible
                    $(kooTableInstance.settings.handler).find('tfoot').show();
                }
            } else {
                // Render all filtered data
                // Disable virtual scrolling if user disabled the setting
                if (kooTableInstance.usingVirtualScroll && kooTableInstance.virtualScroll) {
                    kooTableInstance.virtualScroll.destroy();
                    kooTableInstance.usingVirtualScroll = false;
                    console.log('KooTable Filter: Disabled virtual scrolling, rendering all rows (' + filteredCount + ' rows)');
                }
                
                // Hide pagination controls when rendering all rows
                $(kooTableInstance.settings.handler).find('tfoot').hide();
                
                var allFiltered = kooTableInstance.dataStore.getAllData();
                kooTableInstance.methods.setRows(allFiltered, kooTableInstance, true);
            }
            
            // End performance timer
            if ($.koshkilJS.profiler) {
                $.koshkilJS.profiler.stop('filter');
                var filterTime = $.koshkilJS.profiler.getResult('filter');
                console.log('KooTable Filter: ' + filterTime.toFixed(2) + 'ms for ' + 
                           kooTableInstance.dataStore.getTotalRows() + ' rows');
            }
            
            // Trigger event for custom actions
            $handler.trigger('koshkilJS.kootable.afterFilter', [filters]);
        },
    });
})(jQuery);
(function ($) {
    $.extend($.koshkilJS.kooTable.kootableEvents || {}, {
        beforeDataSet:null,
        afterDataSet: null,
        beforePageChange: null,
        afterPageChange: null,
    });
    $.extend($.koshkilJS.kooTable, {
        raiseEvent: function (eventName, args) {
            kooTableInstance = this;
            args = args || [];
            args.unshift(this);
            return $.Deferred(function (d) { 
                var evt = $.Event(eventName);
                var handler = kooTableInstance.settings.handler;
                $(handler).trigger(evt, args);
                if (evt.isDefaultPrevented()){
					d.reject(evt);
                } else {
                    d.resolve(evt);
                }
            })
        }
    })
})(jQuery);
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
/**
 * KooTable DataStore v1.0
 * Data layer for performance optimization
 * 
 * Separates data operations from DOM manipulation for 5-10x performance gains
 */
(function ($) {
    $.koshkilJS.kooTable = $.extend($.koshkilJS.kooTable || {}, {
        DataStore: function() {
            // Private data storage
            this.rawData = [];           // Original unmodified dataset
            this.processedData = [];     // After filters/sorting/transforms
            this.columns = {};           // Column definitions
            this.filters = [];           // Active filters
            this.sortColumn = null;      // Current sort column
            this.sortDirection = null;   // 'asc' or 'desc'
            this.currentPage = 1;        // Current page number
            this.pageSize = 25;          // Rows per page
            this.indices = {};           // Column indices for fast lookup
            
            /**
             * Initialize datastore with data and columns
             * @param {Array} data - Array of row objects
             * @param {Object} columns - Column definitions
             * @param {Number} pageSize - Rows per page
             */
            this.init = function(data, columns, pageSize) {
                this.rawData = data || [];
                this.columns = columns || {};
                this.pageSize = parseInt(pageSize, 10) || 25; // FIX: Ensure pageSize is always a number
                this.processedData = this.rawData.slice(); // Shallow copy
                this.currentPage = 1;
                this.buildIndices();
                return this;
            };
            
            /**
             * Build column indices for fast data access
             * Useful for large datasets with frequent lookups
             */
            this.buildIndices = function() {
                // Build indices for columns marked as indexed
                for (var columnName in this.columns) {
                    var column = this.columns[columnName];
                    if (column.indexed) {
                        this.indices[columnName] = {};
                        for (var i = 0; i < this.rawData.length; i++) {
                            var value = this.rawData[i][columnName];
                            if (!this.indices[columnName][value]) {
                                this.indices[columnName][value] = [];
                            }
                            this.indices[columnName][value].push(i);
                        }
                    }
                }
            };
            
            /**
             * Get total number of rows in processed data
             * @returns {Number}
             */
            this.getTotalRows = function() {
                return this.processedData.length;
            };
            
            /**
             * Get total number of pages based on current page size
             * @returns {Number}
             */
            this.getTotalPages = function() {
                return Math.ceil(this.processedData.length / this.pageSize);
            };
            
            /**
             * Apply filters to raw data
             * OPTIMIZATION: Operates on data array, not DOM
             * 
             * @param {Array} filters - Array of {column, value, operator} objects
             * @returns {Array} Filtered data
             */
            this.applyFilters = function(filters) {
                this.filters = filters || [];
                
                if (this.filters.length === 0) {
                    this.processedData = this.rawData.slice();
                    return this.processedData;
                }
                
                // OPTIMIZATION: Single-pass filtering with early exit
                this.processedData = this.rawData.filter(function(row) {
                    // All filters must match (AND logic)
                    for (var i = 0; i < filters.length; i++) {
                        var filter = filters[i];
                        var columnValue = String(row[filter.column] || '');
                        var searchValue = String(filter.value || '').toLowerCase();
                        
                        // Support different operators
                        var matches = false;
                        switch(filter.operator || 'contains') {
                            case 'contains':
                                matches = columnValue.toLowerCase().indexOf(searchValue) >= 0;
                                break;
                            case 'equals':
                                matches = columnValue.toLowerCase() === searchValue;
                                break;
                            case 'startsWith':
                                matches = columnValue.toLowerCase().indexOf(searchValue) === 0;
                                break;
                            case 'endsWith':
                                matches = columnValue.toLowerCase().lastIndexOf(searchValue) === 
                                         (columnValue.length - searchValue.length);
                                break;
                            case 'gt':
                                matches = parseFloat(columnValue) > parseFloat(searchValue);
                                break;
                            case 'lt':
                                matches = parseFloat(columnValue) < parseFloat(searchValue);
                                break;
                            case 'regex':
                                try {
                                    var regex = new RegExp(searchValue, 'i');
                                    matches = regex.test(columnValue);
                                } catch(e) {
                                    matches = false;
                                }
                                break;
                            default:
                                matches = columnValue.toLowerCase().indexOf(searchValue) >= 0;
                        }
                        
                        if (!matches) {
                            return false; // Early exit - filter doesn't match
                        }
                    }
                    return true; // All filters matched
                });
                
                // Reset to first page after filtering
                this.currentPage = 1;
                
                return this.processedData;
            };
            
            /**
             * Apply sorting to processed data
             * OPTIMIZATION: Native array sort, faster than tinysort on DOM
             * 
             * @param {String} column - Column name to sort by
             * @param {String} direction - 'asc' or 'desc'
             * @returns {Array} Sorted data
             */
            this.applySort = function(column, direction) {
                if (!column) {
                    return this.processedData;
                }
                
                this.sortColumn = column;
                this.sortDirection = direction || 'asc';
                
                var columnDef = this.columns[column];
                var customSorter = columnDef ? columnDef.sorter : null;
                
                // OPTIMIZATION: Sort in place (faster than slice+sort)
                this.processedData.sort(function(a, b) {
                    var aVal = a[column];
                    var bVal = b[column];
                    
                    // Use custom sorter if provided
                    if (customSorter && typeof customSorter === 'function') {
                        var result = customSorter(aVal, bVal);
                        return direction === 'desc' ? -result : result;
                    }
                    
                    // Handle null/undefined
                    if (aVal === null || aVal === undefined) return 1;
                    if (bVal === null || bVal === undefined) return -1;
                    
                    // Numeric comparison
                    if (typeof aVal === 'number' && typeof bVal === 'number') {
                        return direction === 'asc' ? aVal - bVal : bVal - aVal;
                    }
                    
                    // String comparison (case-insensitive)
                    var aStr = String(aVal).toLowerCase();
                    var bStr = String(bVal).toLowerCase();
                    
                    if (aStr === bStr) return 0;
                    
                    if (direction === 'asc') {
                        return aStr > bStr ? 1 : -1;
                    } else {
                        return aStr < bStr ? 1 : -1;
                    }
                });
                
                return this.processedData;
            };
            
            /**
             * Get rows for a specific page
             * OPTIMIZATION: Returns only visible data slice
             * 
             * @param {Number} pageNumber - Page to retrieve (1-based)
             * @returns {Array} Rows for the requested page
             */
            this.getPage = function(pageNumber) {
                pageNumber = pageNumber || this.currentPage;
                
                // Validate page number
                var totalPages = this.getTotalPages();
                if (pageNumber < 1) pageNumber = 1;
                if (pageNumber > totalPages && totalPages > 0) pageNumber = totalPages;
                
                this.currentPage = pageNumber;
                
                var startIndex = (pageNumber - 1) * this.pageSize;
                var endIndex = startIndex + this.pageSize;
                
                return this.processedData.slice(startIndex, endIndex);
            };
            
            /**
             * Get all processed data (after filters/sorting)
             * @returns {Array}
             */
            this.getAllData = function() {
                return this.processedData;
            };
            
            /**
             * Get raw unprocessed data
             * @returns {Array}
             */
            this.getRawData = function() {
                return this.rawData;
            };
            
            /**
             * Reset filters and sorting, return to raw data
             */
            this.reset = function() {
                this.filters = [];
                this.sortColumn = null;
                this.sortDirection = null;
                this.currentPage = 1;
                this.processedData = this.rawData.slice();
                return this.processedData;
            };
            
            /**
             * Update raw data and reprocess with current filters/sort
             * @param {Array} data - New dataset
             * @param {Boolean} keepState - Whether to maintain filters/sort
             */
            this.setData = function(data, keepState) {
                this.rawData = data || [];
                
                if (keepState) {
                    // Reapply current filters and sorting
                    this.processedData = this.rawData.slice();
                    if (this.filters.length > 0) {
                        this.applyFilters(this.filters);
                    }
                    if (this.sortColumn) {
                        this.applySort(this.sortColumn, this.sortDirection);
                    }
                } else {
                    this.reset();
                }
                
                this.buildIndices();
                return this.processedData;
            };
            
            /**
             * Get current datastore state for debugging
             * @returns {Object} Current state information
             */
            this.getState = function() {
                return {
                    totalRawRows: this.rawData.length,
                    totalProcessedRows: this.processedData.length,
                    currentPage: this.currentPage,
                    totalPages: this.getTotalPages(),
                    pageSize: this.pageSize,
                    hasFilters: this.filters.length > 0,
                    activeFilters: this.filters,
                    sortColumn: this.sortColumn,
                    sortDirection: this.sortDirection
                };
            };
            
            /**
             * Search across all columns for a value
             * Useful for global search functionality
             * 
             * @param {String} searchTerm - Term to search for
             * @param {Array} columns - Optional: specific columns to search (default: all)
             * @returns {Array} Matching rows
             */
            this.globalSearch = function(searchTerm, columns) {
                if (!searchTerm || searchTerm.trim() === '') {
                    return this.processedData;
                }
                
                var searchLower = searchTerm.toLowerCase();
                var searchColumns = columns || Object.keys(this.columns);
                
                return this.processedData.filter(function(row) {
                    for (var i = 0; i < searchColumns.length; i++) {
                        var columnName = searchColumns[i];
                        var value = String(row[columnName] || '').toLowerCase();
                        if (value.indexOf(searchLower) >= 0) {
                            return true;
                        }
                    }
                    return false;
                });
            };
        }
    });
})(jQuery);
/**
 * KooTable VirtualScroll v1.0
 * Virtual scrolling implementation for 10,000+ row datasets
 * 
 * Renders only visible rows in viewport for constant performance
 * regardless of dataset size
 */
(function ($) {
    $.koshkilJS.kooTable = $.extend($.koshkilJS.kooTable || {}, {
        VirtualScroll: function() {
            // Configuration
            this.enabled = false;
            this.rowHeight = 35;              // Default row height in pixels
            this.overscan = 5;                // Extra rows to render above/below viewport
            this.debounceDelay = 16;          // ~60fps
            this.maxHeight = null;            // Max container height (null = auto-calculate)
            
            // State
            this.viewportHeight = 0;
            this.visibleRowCount = 0;
            this.scrollTop = 0;
            this.startIndex = 0;
            this.endIndex = 0;
            this.totalRows = 0;
            
            // References
            this.$container = null;
            this.$table = null;
            this.$tbody = null;
            this.kooTableInstance = null;
            this.scrollHandler = null;
            
            /**
             * Initialize virtual scrolling
             * @param {Object} kooTableInstance - KooTable instance
             * @param {Object} options - Virtual scroll options
             */
            this.init = function(kooTableInstance, options) {
                this.kooTableInstance = kooTableInstance;
                this.enabled = true;
                
                // Apply options with validation
                if (options) {
                    this.rowHeight = options.rowHeight || this.rowHeight;
                    this.overscan = options.overscan || this.overscan;
                    
                    // Validate maxHeight - must be null, string, or number (not object or undefined that becomes an object)
                    if (options.maxHeight !== undefined) {
                        if (options.maxHeight === null || 
                            typeof options.maxHeight === 'string' || 
                            typeof options.maxHeight === 'number') {
                            this.maxHeight = options.maxHeight;
                        } else {
                            // Invalid maxHeight (probably an object), use null for auto-calculation
                            console.warn('KooTable VirtualScroll: Invalid maxHeight value, using auto-calculation');
                            this.maxHeight = null;
                        }
                    }
                }
                
                // Get references
                var handler = kooTableInstance.settings.handler;
                this.$table = $(handler);
                this.$tbody = this.$table.find('tbody');
                
                // Create scroll container if it doesn't exist
                this.setupScrollContainer();
                
                // Calculate viewport dimensions
                this.calculateViewport();
                
                // Bind scroll event with debouncing
                this.bindScrollEvent();
                
                // Initial render
                this.renderVisibleRows();
                
                return this;
            };
            
            /**
             * Setup scroll container wrapper
             */
            this.setupScrollContainer = function() {
                // Check if table is already in a scroll container
                this.$container = this.$table.closest('.kootable-virtual-scroll-container');
                
                if (this.$container.length === 0) {
                    // Wrap table in scroll container
                    this.$table.wrap('<div class="kootable-virtual-scroll-container"></div>');
                    this.$container = this.$table.parent();
                    
                    // Calculate responsive max height with hidden container detection
                    var calculatedMaxHeight;
                    if (this.maxHeight === null) {
                        // Detect if container is hidden and determine appropriate height
                        var $modal = this.$table.closest('.modal');
                        var $inactiveTab = this.$table.closest('.tab-pane:not(.active)');
                        
                        if ($modal.length > 0) {
                            // CASE 1: Table is inside a Bootstrap modal
                            // Use fixed default of 400px for modals (user can override with virtualScrollMaxHeight setting)
                            calculatedMaxHeight = '400px';
                            console.log('KooTable VirtualScroll: Detected modal container, using 400px default height');
                            
                        } else if ($inactiveTab.length > 0) {
                            // CASE 2: Table is inside an inactive Bootstrap tab
                            // Find the active tab in the same tab-content container and use its height
                            var $tabContent = $inactiveTab.parent('.tab-content');
                            var $activeTab = $tabContent.find('.tab-pane.active');
                            
                            if ($activeTab.length > 0) {
                                var activeTabHeight = $activeTab.height();
                                
                                if (activeTabHeight > 0) {
                                    // Use active tab's height minus some padding for content
                                    calculatedMaxHeight = Math.max(300, activeTabHeight - 100) + 'px';
                                    console.log('KooTable VirtualScroll: Detected inactive tab, calculated height from active tab: ' + calculatedMaxHeight);
                                } else {
                                    // Fallback if active tab has no height
                                    calculatedMaxHeight = '400px';
                                    console.log('KooTable VirtualScroll: Active tab has no height, using 400px fallback');
                                }
                            } else {
                                // No active tab found, use default
                                calculatedMaxHeight = '400px';
                                console.log('KooTable VirtualScroll: No active tab found, using 400px fallback');
                            }
                            
                        } else {
                            // CASE 3: Normal visible container
                            // Auto-calculate: 80% of viewport height, minimum 600px
                            calculatedMaxHeight = Math.max(600, Math.floor(window.innerHeight * 0.8)) + 'px';
                            console.log('KooTable VirtualScroll: Visible container, calculated responsive height: ' + calculatedMaxHeight);
                        }
                    } else {
                        // Use provided max height (user override)
                        calculatedMaxHeight = this.maxHeight;
                        console.log('KooTable VirtualScroll: Using user-provided max height: ' + calculatedMaxHeight);
                    }
                    
                    // Set container styles for scrolling
                    this.$container.css({
                        'overflow-y': 'auto',
                        'overflow-x': 'hidden',
                        'position': 'relative',
                        'max-height': calculatedMaxHeight
                    });
                }
            };
            
            /**
             * Calculate viewport dimensions
             */
            this.calculateViewport = function() {
                this.viewportHeight = this.$container.height();
                this.visibleRowCount = Math.ceil(this.viewportHeight / this.rowHeight) + (this.overscan * 2);
                
                if (this.kooTableInstance.dataStore) {
                    this.totalRows = this.kooTableInstance.dataStore.getTotalRows();
                }
            };
            
            /**
             * Bind scroll event with debouncing
             */
            this.bindScrollEvent = function() {
                var self = this;
                
                // Debounced scroll handler
                var debouncedRender = $.koshkilJS.debounce(function() {
                    self.onScroll();
                }, this.debounceDelay);
                
                // Store reference to handler for cleanup
                this.scrollHandler = debouncedRender;
                
                // Bind to container scroll
                this.$container.off('scroll.virtualscroll').on('scroll.virtualscroll', debouncedRender);
            };
            
            /**
             * Handle scroll event
             */
            this.onScroll = function() {
                this.scrollTop = this.$container.scrollTop();
                this.renderVisibleRows();
            };
            
            /**
             * Calculate visible row range based on scroll position
             * @returns {Object} {startIndex, endIndex}
             */
            this.calculateVisibleRange = function() {
                // Calculate which row is at the top of viewport
                var startIndex = Math.floor(this.scrollTop / this.rowHeight);
                
                // Apply overscan above
                startIndex = Math.max(0, startIndex - this.overscan);
                
                // Calculate end index
                var endIndex = startIndex + this.visibleRowCount;
                endIndex = Math.min(this.totalRows, endIndex);
                
                return {
                    startIndex: startIndex,
                    endIndex: endIndex
                };
            };
            
            /**
             * Render only visible rows
             */
            this.renderVisibleRows = function() {
                if (!this.kooTableInstance.dataStore) {
                    console.warn('VirtualScroll: DataStore not initialized');
                    return;
                }
                
                // Calculate visible range
                var range = this.calculateVisibleRange();
                this.startIndex = range.startIndex;
                this.endIndex = range.endIndex;
                
                // Get data slice for visible rows
                var visibleData = this.kooTableInstance.dataStore.processedData.slice(
                    this.startIndex,
                    this.endIndex
                );
                
                // Clear existing rows
                this.$tbody.empty();
                
                // Get columns and rowSkeleton from table data (same as setRows method)
                var handler = this.kooTableInstance.settings.handler;
                var $handler = $(handler);
                var columns = $handler.data('kooTable-columns');
                var rowSkeleton = $handler.data('kooTable-rowSkeleton');
                
                if (!columns) columns = {};
                if (!rowSkeleton) rowSkeleton = {};
                
                // Build row elements
                var rowElements = [];
                for (var i = 0; i < visibleData.length; i++) {
                    var row = visibleData[i];
                    var globalIndex = this.startIndex + i;
                    row._rowIndex = globalIndex + 1; // 1-based index
                    
                    var $tr = this.kooTableInstance.methods.buildRowElement(
                        row,
                        this.kooTableInstance,
                        rowSkeleton,
                        columns
                    );
                    
                    // Store global index for later reference
                    $tr.attr('data-virtual-index', globalIndex);
                    
                    rowElements.push($tr);
                }
                
                // Append all rows at once
                this.$tbody.append(rowElements);
                
                // Update spacer heights to maintain scroll position
                this.updateSpacers();
            };
            
            /**
             * Update padding spacers to maintain scroll position
             */
            this.updateSpacers = function() {
                var topPadding = this.startIndex * this.rowHeight;
                var bottomPadding = (this.totalRows - this.endIndex) * this.rowHeight;
                
                this.$tbody.css({
                    'padding-top': topPadding + 'px',
                    'padding-bottom': bottomPadding + 'px'
                });
            };
            
            /**
             * Refresh virtual scroll (call after data changes)
             */
            this.refresh = function() {
                this.calculateViewport();
                this.renderVisibleRows();
            };
            
            /**
             * Scroll to specific row index
             * @param {Number} rowIndex - Row index to scroll to (0-based)
             */
            this.scrollToRow = function(rowIndex) {
                var scrollPosition = rowIndex * this.rowHeight;
                this.$container.scrollTop(scrollPosition);
            };
            
            /**
             * Get currently visible row indices
             * @returns {Array} Array of visible row indices
             */
            this.getVisibleIndices = function() {
                var indices = [];
                for (var i = this.startIndex; i < this.endIndex; i++) {
                    indices.push(i);
                }
                return indices;
            };
            
            /**
             * Destroy virtual scrolling and cleanup
             */
            this.destroy = function() {
                if (this.$container) {
                    this.$container.off('scroll.virtualscroll');
                }
                
                // Remove spacers
                if (this.$tbody) {
                    this.$tbody.css({
                        'padding-top': '',
                        'padding-bottom': ''
                    });
                }
                
                this.enabled = false;
                this.kooTableInstance = null;
            };
            
            /**
             * Detect row height automatically
             * @returns {Number} Detected row height in pixels
             */
            this.detectRowHeight = function() {
                // Render a single row to measure its height
                var $firstRow = this.$tbody.find('tr:first-child');
                if ($firstRow.length) {
                    this.rowHeight = $firstRow.outerHeight();
                }
                return this.rowHeight;
            };
            
            /**
             * Handle window resize or container visibility change
             */
            this.onResize = function() {
                // Recalculate container max height when becoming visible
                if (this.$container && this.$container.length > 0) {
                    var currentMaxHeight = this.$container.css('max-height');
                    
                    // Only recalculate if using auto height (not user-provided)
                    if (this.maxHeight === null) {
                        var $modal = this.$table.closest('.modal');
                        var $inactiveTab = this.$table.closest('.tab-pane:not(.active)');
                        var $activeTab = this.$table.closest('.tab-pane.active');
                        var newMaxHeight;
                        
                        if ($modal.length > 0 && $modal.is(':visible')) {
                            // Modal is now visible, use modal default
                            newMaxHeight = '400px';
                            console.log('KooTable VirtualScroll onResize: Modal now visible, using 400px');
                            
                        } else if ($activeTab.length > 0) {
                            // Tab is now active, recalculate based on viewport
                            newMaxHeight = Math.max(600, Math.floor(window.innerHeight * 0.8)) + 'px';
                            console.log('KooTable VirtualScroll onResize: Tab now active, calculated responsive height: ' + newMaxHeight);
                            
                        } else if ($inactiveTab.length > 0) {
                            // Still inactive, keep previous calculation
                            newMaxHeight = currentMaxHeight;
                            
                        } else {
                            // Normal visible container, recalculate responsive height
                            newMaxHeight = Math.max(600, Math.floor(window.innerHeight * 0.8)) + 'px';
                            console.log('KooTable VirtualScroll onResize: Recalculated responsive height: ' + newMaxHeight);
                        }
                        
                        // Update container max-height if changed
                        if (newMaxHeight !== currentMaxHeight) {
                            this.$container.css('max-height', newMaxHeight);
                        }
                    }
                }
                
                // Recalculate viewport and re-render
                this.calculateViewport();
                this.renderVisibleRows();
            };
        }
    });
    
    /**
     * jQuery plugin method for enabling virtual scrolling
     */
    $.fn.kooTableVirtualScroll = function(options) {
        return this.each(function() {
            var $table = $(this);
            var kooTableInstance = $table.data('kooTable');
            
            if (!kooTableInstance) {
                console.error('KooTable must be initialized before enabling virtual scrolling');
                return;
            }
            
            if (!kooTableInstance.dataStore) {
                console.error('DataStore must be initialized before enabling virtual scrolling');
                return;
            }
            
            // Create and initialize virtual scroll
            kooTableInstance.virtualScroll = new $.koshkilJS.kooTable.VirtualScroll();
            kooTableInstance.virtualScroll.init(kooTableInstance, options);
            
            // Bind window resize event
            $(window).on('resize.kootable-virtualscroll', function() {
                if (kooTableInstance.virtualScroll && kooTableInstance.virtualScroll.enabled) {
                    kooTableInstance.virtualScroll.onResize();
                }
            });
        });
    };
    
    /**
     * Destroy method - cleanup when switching to regular rendering
     */
    $.koshkilJS.kooTable.VirtualScroll.prototype.destroy = function() {
        if (!this.enabled) return;
        
        console.log('KooTable: Destroying virtual scroll container');
        
        // Unbind scroll event
        if (this.$container) {
            this.$container.off('scroll.kootable-virtualscroll');
        }
        
        // Remove scroll container wrapper and restore table
        if (this.$container && this.$container.hasClass('kootable-virtual-scroll-container')) {
            this.$table.unwrap();
        }
        
        // Clear tbody padding
        if (this.$tbody) {
            this.$tbody.css({
                'padding-top': '',
                'padding-bottom': ''
            });
        }
        
        // Show pagination controls when switching back to pagination mode
        if (this.kooTableInstance) {
            var handler = this.kooTableInstance.settings.handler;
            $(handler).find('tfoot').show();
        }
        
        // Reset state
        this.enabled = false;
        this.$container = null;
        this.scrollHandler = null;
        
        console.log('KooTable: Virtual scroll destroyed, restored to normal rendering');
    };
    
})(jQuery);
/*global define, module*/
/**
 * TinySort is a small script that sorts HTML elements. It sorts by text- or attribute value, or by that of one of it's children.
 * @summary A nodeElement sorting script.
 * @version 3.1.4
 * @license MIT
 * @author Ron Valstar (http://www.ronvalstar.nl/)
 * @copyright Ron Valstar <ron@ronvalstar.nl>
 * @namespace tinysort
 */
(function(root,tinysort){
  typeof define==='function'&&define.amd?define('tinysort',()=>tinysort):(root.tinysort = tinysort)
}(window||module||{},(_undef=>{
  const fls = !1
    ,undef = _undef
    ,nll = null
    ,win = window
    ,doc = win.document
    ,parsefloat = parseFloat
    ,regexLastNr = /(-?\d+\.?\d*)\s*$/g    // regex for testing strings ending on numbers
    ,regexLastNrNoDash = /(\d+\.?\d*)\s*$/g  // regex for testing strings ending on numbers ignoring dashes
    ,plugins = []
    ,largeChar = String.fromCharCode(0xFFF)
    ,/**{options}*/defaults = {        // default settings
      selector: nll      // CSS selector to select the element to sort to
      ,order: 'asc'      // order: asc, desc or rand
      ,attr: nll         // order by attribute value
      ,data: nll         // use the data attribute for sorting
      ,useVal: fls       // use element value instead of text
      ,place: 'org'      // place ordered elements at position: start, end, org (original position), first, last
      ,returns: fls      // return all elements or only the sorted ones (true/false)
      ,cases: fls        // a case sensitive sort orders [aB,aa,ab,bb]
      ,natural: fls      // use natural sort order
      ,forceStrings:fls  // if false the string '2' will sort with the value 2, not the string '2'
      ,ignoreDashes:fls  // ignores dashes when looking for numerals
      ,sortFunction: nll // override the default sort function
      ,useFlex:fls
      ,emptyEnd:fls
      ,console
    }
  let numCriteria = 0
    ,criteriumIndex = 0

  /**
   * Options object
   * @typedef {object} options
   * @property {string} [selector] A CSS selector to select the element to sort to.
   * @property {string} [order='asc'] The order of the sorting method. Possible values are 'asc', 'desc' and 'rand'.
   * @property {string} [attr=null] Order by attribute value (ie title, href, class)
   * @property {string} [data=null] Use the data attribute for sorting.
   * @property {string} [place='org'] Determines the placement of the ordered elements in respect to the unordered elements. Possible values 'start', 'end', 'first', 'last' or 'org'.
   * @property {boolean} [useVal=false] Use element value instead of text.
   * @property {boolean} [cases=false] A case sensitive sort (orders [aB,aa,ab,bb])
   * @property {boolean} [natural=false] Use natural sort order.
   * @property {boolean} [forceStrings=false] If false the string '2' will sort with the value 2, not the string '2'.
   * @property {boolean} [ignoreDashes=false] Ignores dashes when looking for numerals.
   * @property {function} [sortFunction=null] Override the default sort function. The parameters are of a type {elementObject}.
   * @property {boolean} [useFlex=true] If one parent and display flex, ordering is done by CSS (instead of DOM)
   * @property {boolean} [emptyEnd=true] Sort empty values to the end instead of the start
   * @property {object|boolean} [console] - an optional console implementation to prevent output to console
   */

  /**
   * TinySort is a small and simple script that will sort any nodeElement by it's text- or attribute value, or by that of one of it's children.
   * @memberof tinysort
   * @public
   * @param {NodeList|HTMLElement[]|String} nodeList The nodelist or array of elements to be sorted. If a string is passed it should be a valid CSS selector.
   * @param {options} [options] A list of options.
   * @returns {HTMLElement[]}
   */
  function tinysort(nodeList,options){
    isString(nodeList) && (nodeList = doc.querySelectorAll(nodeList))

    const {console} = Object.assign({},defaults,options||{})
    nodeList.length===0 && console && console.warn && console.warn('No elements to sort')

    const fragment = doc.createDocumentFragment()
      /** both sorted and unsorted elements
       * @type {elementObject[]} */
      ,elmObjsAll = []
      /** sorted elements
       * @type {elementObject[]} */
      ,elmObjsSorted = []
      /** unsorted elements
       * @type {elementObject[]} */
      ,elmObjsUnsorted = []
      /** sorted elements before sort
       * @type {elementObject[]} */
      ,elmObjsSortedInitial = []
      /** @type {criteriumIndex[]} */
      ,criteria = []
    let /** @type {HTMLElement} */parentNode
      ,isSameParent = true
      ,firstParent = nodeList.length&&nodeList[0].parentNode
      ,isFragment = firstParent.rootNode!==document
      ,isFlex = nodeList.length&&(options===undef||options.useFlex!==false)&&!isFragment&&getComputedStyle(firstParent,null).display.indexOf('flex')!==-1

    initCriteria.apply(nll,Array.prototype.slice.call(arguments,1))
    initSortList()
    elmObjsSorted.sort(options&&options.sortFunction||sortFunction)
    applyToDOM()

    /**
     * Create criteria list
     */
    function initCriteria(){
      if (arguments.length===0) {
        addCriterium({}) // have at least one criterium
      } else {
        loop(arguments,param=>addCriterium(isString(param)?{selector:param}:param))
      }
      numCriteria = criteria.length
    }

    /**
     * A criterium is a combination of the selector, the options and the default options
     * @typedef {Object} criterium
     * @property {String} selector - a valid CSS selector
     * @property {String} order - order: asc, desc or rand
     * @property {String} attr - order by attribute value
     * @property {String} data - use the data attribute for sorting
     * @property {boolean} useVal - use element value instead of text
     * @property {String} place - place ordered elements at position: start, end, org (original position), first
     * @property {boolean} returns - return all elements or only the sorted ones (true/false)
     * @property {boolean} cases - a case sensitive sort orders [aB,aa,ab,bb]
     * @property {boolean} natural - use natural sort order
     * @property {boolean} forceStrings - if false the string '2' will sort with the value 2, not the string '2'
     * @property {boolean} ignoreDashes - ignores dashes when looking for numerals
     * @property {Function} sortFunction - override the default sort function
     * @property {boolean} hasSelector - options has a selector
     * @property {boolean} hasFilter - options has a filter
     * @property {boolean} hasAttr - options has an attribute selector
     * @property {boolean} hasData - options has a data selector
     * @property {number} sortReturnNumber - the sort function return number determined by options.order
     */

    /**
     * Adds a criterium
     * @memberof tinysort
     * @private
     * @param {Object} [options]
     */
    function addCriterium(options){
      const hasSelector = !!options.selector
        ,hasFilter = hasSelector&&options.selector[0]===':'
        ,allOptions = extend(options||{},defaults)
      criteria.push(extend({
        // has find, attr or data
        hasSelector
        ,hasAttr: !(allOptions.attr===nll||allOptions.attr==='')
        ,hasData: allOptions.data!==nll
        // filter
        ,hasFilter
        ,sortReturnNumber: allOptions.order==='asc'?1:-1
      },allOptions))
    }

    /**
     * The element object.
     * @typedef {Object} elementObject
     * @property {HTMLElement} elm - The element
     * @property {number} pos - original position
     * @property {number} posn - original position on the partial list
     */

    /**
     * Creates an elementObject and adds to lists.
     * Also checks if has one or more parents.
     * @memberof tinysort
     * @private
     */
    function initSortList(){
      loop(nodeList,(elm,i)=>{
        if (!parentNode) parentNode = elm.parentNode
        else if (parentNode!==elm.parentNode) isSameParent = false
        const {hasFilter,selector} = criteria[0]
          ,isPartial = !selector||(hasFilter&&elm.matches(selector))||(selector&&elm.querySelector(selector))
          ,listPartial = isPartial?elmObjsSorted:elmObjsUnsorted
          ,elementObject = {
            elm: elm
            ,pos: i
            ,posn: listPartial.length
          }
        elmObjsAll.push(elementObject)
        listPartial.push(elementObject)
      })
      elmObjsSortedInitial.splice(0,Number.MAX_SAFE_INTEGER,...elmObjsSorted)
    }

    /**
     * Compare strings using natural sort order
     * http://web.archive.org/web/20130826203933/http://my.opera.com/GreyWyvern/blog/show.dml/1671288
     */
    function naturalCompare(a, b, chunkify) {
      const aa = chunkify(a.toString())
        ,bb = chunkify(b.toString())
      for (let x = 0; aa[x] && bb[x]; x++) {
        if (aa[x]!==bb[x]) {
          const c = Number(aa[x])
            ,d = Number(bb[x])
          if (c == aa[x] && d == bb[x]) {
            return c - d
          } else return aa[x]>bb[x]?1:-1
        }
      }
      return aa.length - bb.length
    }

    /**
     * Split a string into an array by type: numeral or string
     * @memberof tinysort
     * @private
     * @param {string} t
     * @returns {Array}
     */
    function chunkify(t) {
      const tz = []
      let x = 0, y = -1, n = 0, i, j
      while (i = (j = t.charAt(x++)).charCodeAt(0)) { // eslint-disable-line no-cond-assign
        const m = (i === 46 || (i >=48 && i <= 57))
        if (m !== n) {
          tz[++y] = ''
          n = m
        }
        tz[y] += j
      }
      return tz
    }

    /**
     * Sort all the things
     * @memberof tinysort
     * @private
     * @param {elementObject} a
     * @param {elementObject} b
     * @returns {number}
     */
    function sortFunction(a,b){
      let sortReturnNumber = 0
      if (criteriumIndex!==0) criteriumIndex = 0
      while (sortReturnNumber===0&&criteriumIndex<numCriteria) {
        /** @type {criterium} */
        const criterium = criteria[criteriumIndex]
          ,regexLast = criterium.ignoreDashes?regexLastNrNoDash:regexLastNr
        //
        loop(plugins,plugin=>plugin.prepare && plugin.prepare(criterium))
        //
        let isNumeric = fls
          // prepare sort elements
          ,valueA = getSortBy(a,criterium)
          ,valueB = getSortBy(b,criterium)
        if (criterium.sortFunction) { // custom sort
          sortReturnNumber = criterium.sortFunction(a,b)
        } else if (criterium.order==='rand') { // random sort
          sortReturnNumber = Math.random()<0.5?1:-1
        } else { // regular sort
          const noA = valueA===''||valueA===undef
            ,noB = valueB===''||valueB===undef
          if (valueA===valueB) {
            sortReturnNumber = 0
          } else if (criterium.emptyEnd&&(noA||noB)) {
            sortReturnNumber = noA&&noB?0:noA?1:-1
          } else {
            if (!criterium.forceStrings) {
              // cast to float if both strings are numeral (or end numeral)
              let valuesA = isString(valueA)?valueA&&valueA.match(regexLast):fls// todo: isString superfluous because getSortBy returns string|undefined
                ,valuesB = isString(valueB)?valueB&&valueB.match(regexLast):fls

              if (valuesA&&valuesB) {
                const previousA = valueA.substr(0,valueA.length-valuesA[0].length)
                  ,previousB = valueB.substr(0,valueB.length-valuesB[0].length)
                if (previousA==previousB) {
                  isNumeric = !fls
                  valueA = parsefloat(valuesA[0])
                  valueB = parsefloat(valuesB[0])
                }
              }
            }
            if (valueA===undef||valueB===undef) {
              sortReturnNumber = 0
            } else {
              // todo: check here
              if (!criterium.natural||(!isNaN(valueA)&&!isNaN(valueB))) {
                sortReturnNumber = valueA<valueB?-1:(valueA>valueB?1:0)
              } else {
                sortReturnNumber = naturalCompare(valueA, valueB, chunkify)
              }
            }
          }
        }
        loop(plugins,({sort})=>sort && (sortReturnNumber = sort(criterium,isNumeric,valueA,valueB,sortReturnNumber)))
        sortReturnNumber *= criterium.sortReturnNumber // lastly assign asc/desc
        sortReturnNumber===0 && criteriumIndex++
      }
      sortReturnNumber===0 && (sortReturnNumber = a.pos>b.pos?1:-1)
      return sortReturnNumber
    }

    /**
     * Applies the sorted list to the DOM
     * @memberof tinysort
     * @private
     */
    function applyToDOM(){
      const hasSortedAll = elmObjsSorted.length===elmObjsAll.length
      const {place,console} = criteria[0]
      if (isSameParent&&hasSortedAll) {
        if (isFlex) {
          elmObjsSorted.forEach((elmObj,i)=>elmObj.elm.style.order = i)
        } else {
          if (parentNode) parentNode.appendChild(sortedIntoFragment())
          else console && console.warn && console.warn('parentNode has been removed')
        }
      } else {
        const isPlaceOrg = place==='org'
          ,isPlaceStart = place==='start'
          ,isPlaceEnd = place==='end'
          ,isPlaceFirst = place==='first'
          ,isPlaceLast = place==='last'

        if (isPlaceOrg) {
          elmObjsSorted.forEach(addGhost)
          elmObjsSorted.forEach((elmObj,i)=>replaceGhost(elmObjsSortedInitial[i],elmObj.elm))
        } else if (isPlaceStart||isPlaceEnd) {
          let startElmObj = elmObjsSortedInitial[isPlaceStart?0:elmObjsSortedInitial.length-1]
            ,startParent = startElmObj&&startElmObj.elm.parentNode
            ,startElm = startParent&&(isPlaceStart&&startParent.firstChild||startParent.lastChild)
          if (startElm) {
            startElm!==startElmObj.elm && (startElmObj = {elm:startElm})
            addGhost(startElmObj)
            isPlaceEnd&&startParent.appendChild(startElmObj.ghost)
            replaceGhost(startElmObj,sortedIntoFragment())
          }
        } else if (isPlaceFirst||isPlaceLast) {
          const firstElmObj = elmObjsSortedInitial[isPlaceFirst?0:elmObjsSortedInitial.length-1]
          replaceGhost(addGhost(firstElmObj),sortedIntoFragment())
        }
      }
    }

    /**
     * Adds all sorted elements to the document fragment and returns it.
     * @memberof tinysort
     * @private
     * @returns {DocumentFragment}
     */
    function sortedIntoFragment(){
      elmObjsSorted.forEach(elmObj=>fragment.appendChild(elmObj.elm))
      return fragment
    }

    /**
     * Adds a temporary element before an element before reordering.
     * @memberof tinysort
     * @private
     * @param {elementObject} elmObj
     * @returns {elementObject}
     */
    function addGhost(elmObj){
      const element = elmObj.elm
        ,ghost = doc.createElement('div')
      elmObj.ghost = ghost
      element.parentNode.insertBefore(ghost,element)
      return elmObj
    }

    /**
     * Inserts an element before a ghost element and removes the ghost.
     * @memberof tinysort
     * @private
     * @param {elementObject} elmObjGhost
     * @param {HTMLElement} elm
     */
    function replaceGhost(elmObjGhost,elm){
      const ghost = elmObjGhost.ghost
        ,ghostParent = ghost.parentNode
      ghostParent.insertBefore(elm,ghost)
      ghostParent.removeChild(ghost)
      delete elmObjGhost.ghost
    }

    /**
     * Get the string/number to be sorted by checking the elementObject with the criterium.
     * @memberof tinysort
     * @private
     * @param {elementObject} elementObject
     * @param {criterium} criterium
     * @returns {String}
     * @todo memoize
     */
    function getSortBy(elementObject,criterium){
      let sortBy
          ,element = elementObject.elm
          ,{selector} = criterium
      // element
      if (selector) {
        if (criterium.hasFilter) {
          if (!element.matches(selector)) element = nll
        } else {
          element = element.querySelector(selector)
        }
      }
      // value
      if (criterium.hasAttr) sortBy = element.getAttribute(criterium.attr)
      else if (criterium.useVal) sortBy = element.value||element.getAttribute('value')
      else if (criterium.hasData) sortBy = element.getAttribute('data-'+criterium.data)
      else if (element) sortBy = element.textContent
      // strings should be ordered in lowercase (unless specified)
      if (isString(sortBy)) {
        if (!criterium.cases) sortBy = sortBy.toLowerCase()
        sortBy = sortBy.replace(/\s+/g,' ') // spaces/newlines
      }
      if (sortBy===null) sortBy = largeChar
      return sortBy
    }

    /*function memoize(fnc) {
      var oCache = {}
        , sKeySuffix = 0;
      return function () {
        var sKey = sKeySuffix + JSON.stringify(arguments); // todo: circular dependency on Nodes
        return (sKey in oCache)?oCache[sKey]:oCache[sKey] = fnc.apply(fnc,arguments);
      };
    }*/

    /**
     * Test if an object is a string
     * @memberOf tinysort
     * @method
     * @private
     * @param o
     * @returns {boolean}
     */
    function isString(o){
      return typeof o==='string'
    }

    return elmObjsSorted.map(o=>o.elm)
  }

  /**
   * Traverse an array, or array-like object
   * @memberOf tinysort
   * @method
   * @private
   * @param {Array} array The object or array
   * @param {Function} func Callback function with the parameters value and key.
   */
  function loop(array,func){
    const l = array.length
    let i = l
      ,j
    while (i--) {
      j = l-i-1
      func(array[j],j)
    }
  }

  /**
   * Extend an object
   * @memberOf tinysort
   * @method
   * @private
   * @param {Object} obj Subject.
   * @param {Object} fns Property object.
   * @param {boolean} [overwrite=false]  Overwrite properties.
   * @returns {Object} Subject.
   */
  function extend(obj,fns,overwrite){
    for (let s in fns) {
      if (overwrite||obj[s]===undef) {
        obj[s] = fns[s]
      }
    }
    return obj
  }

  function plugin(prepare,sort,sortBy){
    plugins.push({prepare,sort,sortBy})
  }

  // Element.prototype.matches IE
  win.Element&&(elementPrototype=>elementPrototype.matches = elementPrototype.matches||elementPrototype.msMatchesSelector)(Element.prototype)

  // extend the plugin to expose stuff
  extend(plugin,{loop})

  return extend(tinysort,{plugin,defaults})
})()))