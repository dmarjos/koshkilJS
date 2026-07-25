(function($){
    $.fn.waitImages = function(method) {
        var element=$(this);
        if (method) {
            switch(method) {
                case 'isLoaded':
                    var imagesInContainer=$(element).data('imagesTotal');
                    var imagesLoaded=$(element).data('imagesLoaded');
                    return (imagesLoaded==imagesInContainer);
                    break;
                default:
                    console.log('Unrecognized Method: '+method);
            }
        }
        $(element).replaceHandler('DOMSubtreeModified',function() {
            var imagesInContainer=$(element).find('img').length;
            $(element).data('imagesTotal',imagesInContainer);
            if (imagesInContainer==0) {
                $(element).trigger('koshkilJS.waitImages.no-images');
                return;
            }
            var imagesLoaded=0;
            $(element).find('img').on('load',function() {
                imagesLoaded++;
                $(element).data('imagesLoaded',imagesLoaded);
                if(imagesLoaded==imagesInContainer) {
                    $(element).trigger('koshkilJS.waitImages.loaded');
                }
            })
        });
        return $(this);
    }
})(jQuery);
