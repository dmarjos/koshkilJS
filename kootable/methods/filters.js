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
