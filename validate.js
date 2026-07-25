(function($) {

    $.koshkilJS = $.koshkilJS || {};
    $.koshkilJS.validate={
        helpers: {
            markField: function (obj,message) {
                $(obj).addClass('error');
                var spanError=$('<span/>').addClass('error').html(message);
                $(obj).after(spanError);
            },
            checkRequired: function(obj) {
                hasErrors=false;
                if ($.trim($(obj).val())=='') {
                    hasErrors=true;
                    this.markField(obj,'Este campo es obligatorio');
                }
                return hasErrors;
            },
            checkFormat:function(obj,validator) {
                if ($.trim($(obj).val())!='') {
                    if (typeof $.koshkilJS.validate.validators[validator] !== 'function') {
                        console.log('Validator not defined: '+validator);
                        return;
                    }
                    if (!$.koshkilJS.validate.validators[validator](obj)) {
                        hasErrors=true;
                        this.markField(obj,'El valor del campo es inv&aacute;lido');
                    }
                }
            }
        },
        validators : {
            email: function(obj) {
                var email=$(obj).val();

                var RegExp=/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if(RegExp.test(email)){
                    return true;
                }else{
                    return false;
                }
            },
            url: function(obj) {
                var url=$(obj).val();
                var RegExp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

                if(RegExp.test(url)){
                    return true;
                }else{
                    return false;
                }
            },
            date: function(obj) {
                var dateToCheck=$(obj).val();
                var objDate,  // date object initialized from the dateToCheck string
                    mSeconds, // dateToCheck in milliseconds
                    day,      // day
                    month,    // month
                    year;     // year
                // date length should be 10 characters (no more no less)
                if (dateToCheck.length !== 10) {
                    return false;
                }
                // third and sixth character should be '/'
                if (dateToCheck.substring(2, 3) !== '/' || dateToCheck.substring(5, 6) !== '/') {
                    return false;
                }
                // extract month, day and year from the dateToCheck (expected format is mm/dd/yyyy)
                // subtraction will cast variables to integer implicitly (needed
                // for !== comparing)
                var dmY=dateToCheck.split("/");
                day = parseInt(dmY[0],10); // because months in JS start from 0
                month = parseInt(dmY[1],10) - 1;
                year = parseInt(dmY[2],10);
                // test year range
                if (year < 1000 || year > 3000) {
                    return false;
                }
                // convert dateToCheck to milliseconds
                mSeconds = (new Date(year, month, day)).getTime();
                // initialize Date() object from calculated milliseconds
                objDate = new Date();
                objDate.setTime(mSeconds);
                // compare input date and parts from Date() object
                // if difference exists then date isn't valid
                if (objDate.getFullYear() !== year ||
                    objDate.getMonth() !== month ||
                    objDate.getDate() !== day) {
                    return false;
                }
                // otherwise return true
                return true;
            }
        }
    };
    $.fn.validate = function(options) {
        var settings=$.extend({
            rules: null,
            recaptchaId:null,
            resetOnValid:false,
            submitOnValid: true,
        },options);
        if (!$(this).is('form')) {
            console.log('Element is not a form');
            return;
        }
        $(this).attr('novalidate','1');
        //$(this).find('button[type=submit]').attr('formnovalidate','formnovalidate');
        $(this).on('submit',function(evt) {
            //evt.preventDefault();
            evt.stopPropagation();
            $(this).find('span.error').remove();
            $(this).find('.error').removeClass('error');
            var customMessages=['Corrija los errores marcados.'];
            var hasErrors=false;
            var hasErrorsFormat=false;
            $(this).find('[data-required]').each(function() {
                var elementName=$(this).attr('name');
                if (typeof settings.rules == 'object') {
                    var rule=settings.rules[elementName];
                    if (rule===undefined) {
                        if ($.koshkilJS.validate.helpers.checkRequired($(this)))hasErrors=true;
                    }
                } else
                    if ($.koshkilJS.validate.helpers.checkRequired($(this)))hasErrors=true;
            });
            $(this).find('[data-format]').each(function() {
                if ($.koshkilJS.validate.helpers.checkFormat($(this),$(this).attr('data-format')))
                    hasErrorsFormat=true;
            });
            if (typeof settings.rules == 'object') {
                for(var field in settings.rules) {
                    rulesHasErrors=false;
                    var rule=settings.rules[field];
                    var obj=$(this).find('[name='+field+']');
                    var wrongFormat = false,isEmpty = false;
                    if (rule.required) {
                        isEmpty=$.koshkilJS.validate.helpers.checkRequired(obj);
                        if (!isEmpty && rule.format) {
                            wrongFormat=$.koshkilJS.validate.helpers.checkFormat(obj,rule.format);
                        }
                        if (isEmpty || wrongFormat) {
                            rulesHasErrors=true;
                        }
                    } else if (rule.format) {
                        wrongFormat=$.koshkilJS.validate.helpers.checkFormat(obj,rule.format);
                        if (wrongFormat) {
                            rulesHasErrors=true;
                        }
                    } else if (rule.customValidator) {
                        var retVal=rule.customValidator(obj);
                        var message='El campo tiene informaci&oacute;n inv&aacute;lida';
                        if (typeof retVal === 'object') {
                            if (typeof retVal.status === "boolean") {
                                rulesHasErrors = !retVal.status
                            }
                            if (typeof retVal.message === "string") {
                                message=retVal.message
                            }
                        } else if (typeof retVal === 'boolean') {
                            rulesHasErrors = !retVal
                        } else {
                            rulesHasErrors=false;
                        }

                        if (rulesHasErrors) {
                            $.koshkilJS.validate.helpers.markField(obj,message);
                            hasErrors = true;
                        }
                    }
                }
            }
            if (hasErrors || hasErrorsFormat) {
                $(this).find('button[type=submit]').removeAttr('disabled')
                toastr.error(customMessages.join('<br/>'));
                if (settings.recaptchaId!==null) {
                    grecaptcha.reset(settings.recaptchaId);
                }
                $(this).trigger('koshkilJS.validate.hasErrors');
                return false;
            }
            if (settings.recaptchaId!==null) {
                if(grecaptcha.getResponse(settings.recaptchaId) == "") {
                    $(this).find('button[type=submit]').removeAttr('disabled')
                    toastr.error('Por favor indique que Ud no es un robot.');
                    evt.preventDefault();
                    return false;
                }
            }
            $(this).find('button[type=submit]').attr('disabled','disabled');
            var formData=new FormData($(this)[0]);
            var form=$(this)[0]
            $(this).trigger('koshkilJS.validate.isValid',[formData,form]);
            if (settings.resetOnValid){
                form.reset();
                if (settings.recaptchaId!==null) {
                    grecaptcha.reset(settings.recaptchaId);
                }
            }
            return settings.submitOnValid;
        })
        return $(this);
    }
})(jQuery);
