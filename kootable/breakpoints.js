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
