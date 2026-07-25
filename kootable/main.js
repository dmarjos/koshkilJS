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
