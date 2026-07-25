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
