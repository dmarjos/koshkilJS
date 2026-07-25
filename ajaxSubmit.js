(function($) {
    $.fn.ajaxSubmit = function(options) {
        if (!$(this).is('form')) {
            console.log('Element is not a form');
            return;
        }

        if ($(this).find('input[type=file]').length>0)
            $(this).attr('enctype',"multipart/form-data");
        var me=$(this);
        var actualSubmit=function(evt, formData, me) {
            evt.preventDefault();
            evt.stopPropagation();
            var postData=formData || new FormData($(this)[0]);
            var submitObj;
            me = me || $(this);
            if (evt.originalEvent && evt.originalEvent.submitter) {
                submitObj=$(evt.originalEvent.submitter);
            } else {
                submitObj=$(me).find('button[type=submit]');
                if (submitObj.length==0) {
                    submitObj=$(me).find('button[type!=submit]');
                    if (submitObj.length>1) {
                        submitObj=$(submitObj)[0];
                    }
                }
                if (submitObj.length==0) {
                    submitObj=$(me).find('input[type=button]');
                }
            }
            var currentHTML=$(submitObj).html();
            $(submitObj).html('<i class="fa fa-spinner fa-spin"></i>&nbsp;'+currentHTML).attr('disabled','disabled');
            $.ajax({
                url: $(me).attr('action'),
                type: 'POST',
                dataType:'json',
                data: postData,
                success:function(data) {
                    $(me).trigger('koshkilJS.ajaxSubmit.success',[data]);
                    $(submitObj).html(currentHTML).removeAttr('disabled');
                },
    			error:function(data) {
                    $(me).trigger('koshkilJS.ajaxSubmit.error',[data]);
                    $(submitObj).html(currentHTML).removeAttr('disabled');
                },
                cache: false,
                contentType: false,
                processData: false
            });
            return false;
        };
        if (options && typeof options.validate === 'object' ) {
            $(this).validate(options.validate).on('koshkilJS.validate.isValid',function(evt,formData) {

            });
        } else {
            $(this).on('submit',actualSubmit)
        }
        
        return $(this);
    }
})(jQuery);
