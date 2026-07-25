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
