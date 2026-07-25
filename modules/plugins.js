$.koshkilJS = $.koshkilJS || {};
$.koshkilJS.modules = $.koshkilJS.modules || {};
$.extend($.koshkilJS.modules, {
    plugins: {
        helpers: {
            // Helper functions for the plugins module can be added here
            checkUrlForPlugin: function(pluginName) {
                return window.location.href.indexOf('/' + pluginName + '/') !== -1;
            }
        },
        init: function() {
            // Initialization code for the plugins module can be added here
        }
    }
});