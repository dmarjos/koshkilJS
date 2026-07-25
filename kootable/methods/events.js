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
