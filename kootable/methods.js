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
