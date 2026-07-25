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
