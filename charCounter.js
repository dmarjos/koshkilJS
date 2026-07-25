(function($) {
    $.fn.charCounter = function(opt) {
        var options=$.extend({
            threshold:10,
            maxlength:null
        },opt);
        var fieldParent=$(this).parent();
        var fieldId=$(this).attr('id');
        var currentLength=$(this).val().length;
        var labelContainer=$(this).parents('.form-group').find('label');
        var spanCounter=$('<span/>',{
            id:fieldId+'-counter'
        }).html('&nbsp;'+currentLength+'').addClass('counter').appendTo(labelContainer)

        $(this).data('threshold',options.threshold)
        $(this).data('maxlength',options.maxlength)

        var handleKeyUp=function() {
            var fieldId=$(this).attr('id');
            var chars=$(this).val().length;
            var threshold=$(this).data('threshold');
            var maxlength=$(this).data('maxlength');
            charsHtml=chars;
            if (!isNaN(threshold)) {
                if (chars>(maxlength-threshold)) {
                    charsHtml='<font color="red">'+chars+'</font>';
                }
            }
            if (chars>maxlength)
                charsHtml='<font color="red"><b>'+chars+'</b></font>';

            $('#'+fieldId+'-counter').html('&nbsp;'+charsHtml+'');
        };
        $(this).on('keyup',handleKeyUp);
        if($(this).data('hasEditor')=='1')
            $(this).on('summernote.keyup',handleKeyUp);
        return $(this);
    }
})(jQuery);

$(document.body).ready(function() {
    $('[data-countable]').each(function() {
        $(this).charCounter({
            threshold:$(this).attr('data-threshold')?$(this).attr('data-threshold'):null,
            maxlength:$(this).attr('data-maxlength')?$(this).attr('data-maxlength'):null
        });
    })
})
