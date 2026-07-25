// Paginator plugin

(function($) {
    $.koshkilJS = $.koshkilJS || {};
    $.koshkilJS.paginator = {
        helpers: {
            update : function(obj) {
                var settings=$(obj).data('settings');
                var items=$(settings.itemSelector+':visible');
                var pageSize=parseInt(settings.pageSize,10);
                if (pageSize<=0) return;
                var pages=settings.pages==0?Math.ceil(items.length/pageSize):settings.pages;
                if (pages==1) return;
                $(obj).attr({
                    'data-pages':pages,
                    'data-current-page':1
                }).html('');
                var paginator=$('<ul/>').addClass('pagination').appendTo(obj);
                $('<li/>',{page:'first'}).addClass('page').on('click',$.koshkilJS.paginator.helpers.firstPage).html('<a><i class="fa fa-angle-double-left"></i></a>').appendTo(paginator);
                $('<li/>',{page:'previous'}).addClass('page').on('click',$.koshkilJS.paginator.helpers.previousPage).html('<a><i class="fa fa-angle-left"></i></a>').appendTo(paginator);
                $('<li/>',{page:'prev-limit'}).addClass('page').html('<a><i class="fa fa-ellipsis-h"></i></a>').appendTo(paginator);
                for (var p=1; p<=pages; p++) {
                    $('<li/>',{'data-page':p}).addClass('page visible').on('click',$.koshkilJS.paginator.helpers.gotoPage).html('<a>'+p+'</a>').appendTo(paginator);
                }
                var idx=1;
                $(items).each(function() {
                    if (!$(this).attr('data-page-number'))
                        $(this).attr('data-page-number',Math.ceil(idx/pageSize));
                    idx++;
                });
                $('<li/>',{page:'next-limit'}).addClass('page').html('<a><i class="fa fa-ellipsis-h"></i></a>').appendTo(paginator);
                $('<li/>',{page:'next'}).addClass('page visible').on('click',$.koshkilJS.paginator.helpers.nextPage).html('<a><i class="fa fa-angle-right"></i></a>').appendTo(paginator);
                $('<li/>',{page:'last'}).addClass('page visible').on('click',$.koshkilJS.paginator.helpers.lastPage).html('<a><i class="fa fa-angle-double-right"></i></a>').appendTo(paginator);
                settings.pages=pages;
                $(obj).data('settings',settings);
                this.updateLimits(obj);
                this.showPage(obj);
            },
            updateLimits:function(paginator) {
                var settings=$(paginator).data('settings');
                var pages=parseInt(settings.pages,10);
                var currentPage=parseInt(settings.currentPage,10);
                var range=settings.pagesRange;
                if (currentPage>1) {
                    $(paginator).find('li[page=first]').addClass('visible');
                    $(paginator).find('li[page=previous]').addClass('visible');
                } else {
                    $(paginator).find('li[page=first]').removeClass('visible');
                    $(paginator).find('li[page=previous]').removeClass('visible');
                }
                if (currentPage<pages) {
                    $(paginator).find('li[page=next]').addClass('visible');
                    $(paginator).find('li[page=last]').addClass('visible');
                } else {
                    $(paginator).find('li[page=next]').removeClass('visible');
                    $(paginator).find('li[page=last]').removeClass('visible');
                }
                if (range<pages) {
                    var minLimit=currentPage-((range-1)/2);
                    if (minLimit<1) minLimit=1;
                    var maxLimit=minLimit+range;
                    if (maxLimit>pages) maxLimit=pages;
                } else {
                    minLimit=1;
                    maxLimit=pages;
                }
                if (minLimit==1)
                    $(paginator).find('li[page=prev-limit]').removeClass('visible');
                else
                    $(paginator).find('li[page=prev-limit]').addClass('visible');
                $(paginator).find('li[data-page]').removeClass('active');
                $(paginator).find('li[data-page]').each(function(){
                    var pageNumber=parseInt($(this).attr('data-page'),10);
                    if (pageNumber>=minLimit && pageNumber<=maxLimit)
                        $(this).addClass('visible');
                    else
                        $(this).removeClass('visible');
                    if (pageNumber==currentPage)
                        $(this).addClass('active');
                });
                if (maxLimit==pages)
                    $(paginator).find('li[page=next-limit]').removeClass('visible');
                else
                    $(paginator).find('li[page=next-limit]').addClass('visible');
            },
            gotoPage: function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                var paginator=$(this).parents('.paginator');
                var settings=$(paginator).data('settings');
                var currentPage=parseInt($(this).attr('data-page'),10);
                settings.currentPage=currentPage;;
                $(paginator).data('settings',settings);
                $(paginator).attr('data-current-page',currentPage);
                $(paginator).triggerHandler('koshkilJS.paginator.goto',[currentPage]);
                if (settings.autoManaged) {
                    $.koshkilJS.paginator.helpers.showPage(paginator);
                    $.koshkilJS.paginator.helpers.updateLimits(paginator);
                }
            },
            showPage:function(paginator) {
                var settings=$(paginator).data('settings');
                var currentPage=parseInt(settings.currentPage,10);

                $(settings.itemSelector).addClass('hidden');
                $(settings.itemSelector+'[data-page-number='+currentPage+']').removeClass('hidden');
                this.updateLimits(paginator);
            },
            firstPage:function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
                var paginator=$(this).parents('.paginator');
                var settings=$(paginator).data('settings');
                settings.currentPage=1;
                $(paginator).data('settings',settings);
                $(paginator).triggerHandler('koshkilJS.paginator.goto',[1]);
                if (settings.autoManaged) {
                    $.koshkilJS.paginator.helpers.showPage(paginator);
                    $.koshkilJS.paginator.helpers.updateLimits(paginator);
                }
            },
            previousPage:function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                var paginator=$(this).parents('.paginator');
                var settings=$(paginator).data('settings');
                var currentPage=parseInt(settings.currentPage,10);

                currentPage--;
                if (currentPage<1)
                    currentPage=1;

                settings.currentPage=currentPage;
                $(paginator).data('settings',settings);

                $(paginator).triggerHandler('koshkilJS.paginator.goto',[currentPage]);
                if (settings.autoManaged) {
                    $.koshkilJS.paginator.helpers.showPage(paginator);
                    $.koshkilJS.paginator.helpers.updateLimits(paginator);
                }
            },
            nextPage:function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                var paginator=$(this).parents('.paginator');
                var settings=$(paginator).data('settings');
                var currentPage=parseInt(settings.currentPage,10);
                currentPage++;
                if(currentPage>settings.pages)
                    currentPage=settings.pages;

                settings.currentPage=currentPage;
                $(paginator).data('settings',settings);

                $(paginator).triggerHandler('koshkilJS.paginator.goto',[currentPage]);
                if (settings.autoManaged) {
                    $.koshkilJS.paginator.helpers.showPage(paginator);
                    $.koshkilJS.paginator.helpers.updateLimits(paginator);
                }
            },
            lastPage:function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
                var paginator=$(this).parents('.paginator');
                var settings=$(paginator).data('settings');
                var currentPage=settings.pages;

                settings.currentPage=currentPage;
                $(paginator).data('settings',settings);

                $(paginator).triggerHandler('koshkilJS.paginator.goto',[currentPage]);
                if (settings.autoManaged) {
                    $.koshkilJS.paginator.helpers.showPage(paginator);
                    $.koshkilJS.paginator.helpers.updateLimits(paginator);
                }
            }
        }
    }
    $.fn.paginator = function(options) {
        var settings;
        if (typeof options === 'object' || !options) {
            settings=$.extend({
                itemSelector:'[data-role=item]',
                pageSize: 15,
                pages:0,
                autoManaged:true,
                currentPage:1,
                pagesRange: 7
            },options);
            if ($(this).attr('data-page-size'))
                settings.pageSize=parseInt($(this).attr('data-page-size'),10);
            $(this).data('settings',settings);
            $.koshkilJS.paginator.helpers.update($(this));
        } else if (options !== undefined && typeof $.koshkilJS.paginator.helpers[options] === 'function') {
            settings=$(this).data('settings');
            $.koshkilJS.paginator.helpers[options]($(this));
        } else {
            settings=$(this).data('settings');
            switch(options) {
                case 'setOption':
                    var option=arguments[1];
                    var value=arguments[2];
                    settings[option]=value;
                    $(this).data('settings',settings);
                    break;
                default:
                    console.log('Method not recognized: '+options);
            }
        }
        if ($(this).attr('data-page-size'))
            settings.pageSize=$(this).attr('data-page-size');
        $(this).addClass('paginator').data('settings',settings);
        return $(this);
    }
})(jQuery);
