
$.fn.replaceHandler=function(event,handler) {
    $(this).unbind(event).on(event,handler);
};
$.fn.attributes = function() {
    var a, aLength, attributes,	map;
    if (this[0]) {
        map = {};
        attributes = this[0].attributes;
        aLength = attributes.length;
        for (a = 0; a < aLength; a++) {
            map[attributes[a].name.toLowerCase()] = attributes[a].value;
        }
        return map;
    }
};

$.fn.outerHTML = function(s) {
    return $("<p>").append($(s).clone()).html();
};

$.fn.markError=function(message) {
    var spanError=$('<span/>').addClass('error').html(message);
    var container;
    if ($(this).parent().hasClass('input-group')) {
        container=$(this).parent();
    } else {
        container=$(this);
    }
    $(container).after(spanError);
    $(this).parents('.form-group').addClass('has-error');
}

$.fn.functionNameFromId = function() {
    var separators=/[\-_\.]/;
    var id=$(this).attr('id');
    var idParts=id.split(separators)
    var functionName=[];
    functionName.push(idParts[0].toLowerCase());
    for(var i=1; i<idParts.length;i++) {
        functionName.push($.ucwords(idParts[i]));
    }
    return functionName.join('');
};

/**
 * Translation helper function
 * Uses KoshkilJS translations module if available
 */
var t = function(key, params, domain) {
    if (typeof $.koshkilJS !== 'undefined' && 
        typeof $.koshkilJS.modules !== 'undefined' && 
        typeof $.koshkilJS.modules.translations !== 'undefined') {
        return $.koshkilJS.modules.translations.helpers.t(key, params, domain);
    }
    return key;
};

$.koshkilJS = {
    plugins: {},
    startup: {},
    forceRunModule: null,
    formatters: {
        estado: function (cell, formatterParams) { 
            var rowData = cell.getRow().getData();
            var name = formatterParams.flagName;
            var id = rowData.id;

            return $.koshkilJS.plugins.formatters.onOffSwitch({
                attrName: formatterParams.attrName,
                checked: (rowData.estado == 1),
                name: name,
                id: id,
            });
        },
    },
    helpers: {
        convertirFechaAFormatoYMD: function(fecha) {
            var partesFecha=fecha.split('/');
            return partesFecha[2]+'-'+partesFecha[1]+'-'+partesFecha[0];
        },
        validarRegistro: function () {
            var errors=false;
            $('span.error').remove();
            $('.form-group.has-error').removeClass('has-error');
            $('[data-language=es][data-required=required]').each(function() {
                if ($(this).val()=='') {
                    var spanError=$('<span/>').addClass('error').html('Campo obligatorio');
                    $(this).after(spanError);
                    $(this).parents('.form-group').addClass('has-error');
                    errors=true;
                }
            });
            if (errors) {
                swal({
                    title: 'Error',
                    text: 'Por favor corrija los errores indicados',
                    type:'error',
                    html: true,
                })
                return false;
            }
            return true;
        },
        actionButton: function (action,id,tooltip,icon,disabled,callback,asEvent) { 
            var btn = this.button(null, tooltip, icon, disabled);
            btn.attr('data-id', id);
            if (action == 'eliminar') {
                btn.removeClass('btn-white').addClass('btn-danger');
            }
            if (callback && asEvent) {
                btn.on('click', callback);
            } else {
                btn.on('click', function (evt) { 
                    evt.stopPropagation();
                    evt.preventDefault();
                    if (!callback) { 
                        if ($('form#formDoAction').length == 0) {
                            $('<form/>', {
                                id: 'formDoAction',
                                action: location.href,
                                method:'post'
                            }).appendTo(document.body);
                        }
                        if ($('form#formDoAction input#action').length == 0) {
                            $('<input/>', {
                                type:'hidden',
                                id: 'action',
                                name: 'action',
                            }).appendTo('form#formDoAction');
                        }
                        if ($('form#formDoAction input#id').length == 0) {
                            $('<input/>', {
                                type:'hidden',
                                id: 'id',
                                name: 'id'
                            }).appendTo('form#formDoAction');
                        }
                        $('#formDoAction #action').val(action);
                        $('#formDoAction #id').val(id);
                    }
                    if(action == "eliminar"){
                        $.koshkilJS.helpers.askConfirmation('&iquest;Desea realmente eliminar este registro?',function() {
                            $('#formDoAction').submit();
                        });
                    } else if (callback) {
                        callback(this)
                    } else  {
                        $('#formDoAction').submit();
                    }
                });
            }
            return btn;
        },
        button: function (href, tooltip, icon, disabled) { 
            var btnAttributes = {};
            if (href !== null) {
                $.extend(btnAttributes, {
                    'href':href,
                    'data-role': 'link',
                });
            }
            $.extend(btnAttributes, {
                'data-toggle': 'tooltip',
                'data-placement': 'bottom',
                'data-original-title': tooltip,
                'type':'button',
                'title':'',
            });

            var btn = $('<button/>',btnAttributes).addClass('pull-left btn btn-xs btn-white').html('<i class="fa ' + icon + ' fa-fw"></i>');
            if (disabled) {
                btn.attr('disabled', 'disabled');
            }
            return btn;
        },
        ucwords: function (str) {
            str=str.toLowerCase();
            var words=str.split(' ');
            for(var i = 0; i<words.length; i++) {
                var theWord=words[i];
                var first=theWord.substr(0,1).toUpperCase();
                var rest=theWord.substr(1);
                words[i]=first+rest;
            }
            return words.join(' ');
        },
        htmlDecode: function(str) {
            var decodedStr = $('<textarea />').html(str).text();
            console.log(decodedStr);
            return decodedStr;
        },
        uniqId: function (separator) {
            var delim = separator || "-";
            function S4() {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            }
            return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());
        },
        callAdminAjax: function (module, postData, dataType, successCallback, errorCallback) {
            var ajaxObj={
                url:this.getLink('admin/ajax/'+module),
                type:'post',
                data: postData,
                dataType:dataType || 'text',
                success:function(data,event) {
                    if (successCallback)
                        successCallback(data,event);
                },
                error:function(data,event) {
                    if (errorCallback)
                        errorCallback(data,event);
                }
            };
            return $.ajax(ajaxObj);
        },
        callAjax: function(url,postData,successCallback,errorCallback) {
            return $.ajax({
                url: $.koshkilJS.helpers.getLink(url),
                type: 'POST',
                dataType:'json',
                data: postData,
                success:successCallback,
                error: errorCallback,
            });
        },
        callWaitingAjax: function (module, postData, successCallback, errorCallback) {
            $.koshkilJS.helpers.blockScreen();
            return $.koshkilJS.helpers.callAjax(module,postData, function(data,event) {
                Application.unblockScreen();
                if (successCallback)
                    successCallback(data,event);
                $.koshkilJS.helpers.unblockScreen();
            },function(data,event) {
                if (errorCallback)
                    errorCallback(data,event);
                $.koshkilJS.helpers.unblockScreen();
            });
        },
        callAjaxAndWait: function (module, postData, dataType, successCallback, errorCallback) {
            var ajaxObj={
                url:this.getLink('ajax/'+module),
                type:'post',
                async: false,
                data: postData,
                dataType:dataType || 'text',
                success:function(data,event) {
                    if (successCallback)
                        successCallback(data,event);
                },
                error:function(data,event) {
                    if (errorCallback)
                        errorCallback(data,event);
                }
            };
            return $.ajax(ajaxObj);
        },
        ajaxUpload: function(url, postData, success, failure, progress ) {
            var ajaxOptions={
                url: this.getLink(url),
                data: postData,
                type:'post',
                dataType: 'json',
                async: true,
                cache: false,
                contentType: false,
                processData: false,
                success: (typeof success=='function'?success:function(data) {console.log(data)}),
                error: (typeof failure=='function'?failure:function(data) {console.log(data)})
            };
            if (progress) {
                ajaxOptions.xhr=progress;
            }
            return $.ajax(ajaxOptions);
        },
        askConfirmation: function(question,callBackYes,callBackNo,closeOnConfirm) {
            if (typeof swal == "function") {
                swal({
                    title:'Confirme por favor',
                    text: question,
                    type: "warning",
                    showCancelButton: true,
                    html: true,
                    cancelButtonText: "No",
                    confirmButtonText: "Si",
                    closeOnConfirm: (typeof closeOnConfirm !== "boolean"?true:closeOnConfirm)
                },function(isConfirm) {
                    if (isConfirm) {
                        closeOnClick=(typeof closeOnConfirm !== "boolean"?false:!closeOnConfirm)
                        if (closeOnClick) {
                            $('.sweet-alert.showSweetAlert.visible').remove();
                            $('.sweet-overlay').remove();
                            $(document.body).removeClass('stop-scrolling');
                        }
                        callBackYes();
                    } else if (typeof callBackNo === 'function') {
                        callBackNo();
                    }
                });
            } else {
                if (confirm('Please confirm: '+question)) {
                    callBackYes();
                } else {
                    callBackNo();
                }
            }
        },
        getLink: function(path) {
            var baseDir=$('html').attr('data-base-dir');
            if (!baseDir && MAIN_URL) baseDir=MAIN_URL;

            if (path.split('://').length==1) {
                var retVal = "";
                if (path.substr(0, 1) != "/")
                    path = "/"+path;

                retVal=baseDir+path;
                retVal = retVal.replace("//", "/");
                var doubleBaseDir = baseDir + baseDir;
                retVal = retVal.replace(doubleBaseDir, baseDir, retVal);
            } else {
                retVal=path;
            }

            return retVal;
        },
        loadScripts: function(arr, path) {
            var _arr = $.map(arr, function(scr) {
                return $.getScript( (path||"") + scr );
            });

            _arr.push($.Deferred(function( deferred ){
                $( deferred.resolve );
            }));

            return $.when.apply($, _arr);
        },
        debugFormData: function(formData) {
            for (var pair in formData.entries()) {
                console.log(pair[0]+ ', ' + pair[1]);
            }
        },
        blockScreen: function() {
            $('<div/>',{id:'waitUntilFinish'}).css({
                'background-color': 'rgba(0,0,0,0.5)',
                'position':'fixed',
                'left':'0px',
                'top':'0px',
                'width':'100%',
                'height':'100%',
                'z-index':'10000'
            }).appendTo(document.body);
        },

        unblockScreen: function() {
            $('#waitUntilFinish').remove();
        },
    },

    timer: {
        initTimer:function () {
            this.start = new Date();
            this.end = new Date();
        },
        startTimer: function () {
            this.start = new Date();
        },
        endTimer: function (message) {
            message = message || 'last action';
            this.end = new Date();
            var timeDiff = this.end - this.start;
            timeDiff /= 1000;
            console.log(message + ' took ' + timeDiff + ' seconds');
        },
    },

    /**
     * Performance profiling helper.
     * Tracks execution time for labeled code sections.
     * Similar to PHP Profiler class (core/tools/profiler.php)
     */
    Profiler: {
        /**
         * Start times for profiling labels.
         * @private
         */
        _startTimes: {},

        /**
         * Start profiling a labeled section.
         * @param {string} label - Section label
         */
        start: function(label) {
            this._startTimes[label] = performance.now();
        },

        /**
         * Stop profiling a labeled section and log elapsed time to console.
         * @param {string} label - Section label
         * @returns {number|null} Elapsed time in seconds or null if not started
         */
        stop: function(label) {
            if (this._startTimes[label] !== undefined) {
                var elapsed = (performance.now() - this._startTimes[label]) / 1000;
                delete this._startTimes[label];
                
                var elapsedFormatted = elapsed.toFixed(4);
                console.log('[Profiler] ' + label + ' executed in ' + elapsedFormatted + ' seconds');
                
                return elapsed;
            }
            console.warn('[Profiler] Label "' + label + '" was not started');
            return null;
        },

        /**
         * Profile a function and log execution time.
         * @param {Function} callable - Function to profile
         * @param {string} label - Label for logging
         * @returns {*} Return value of the function
         */
        profileCallable: function(callable, label) {
            var start = performance.now();
            var result = callable();
            var elapsed = (performance.now() - start) / 1000;
            
            var elapsedFormatted = elapsed.toFixed(4);
            console.log('[Profiler] ' + label + ' executed in ' + elapsedFormatted + ' seconds');
            
            return result;
        },

        /**
         * Clear all active profiling timers.
         */
        clear: function() {
            this._startTimes = {};
        }
    },

    Redirect: function(url) {
        location.href=this.getLink(url);
    },

    cloneObject: function(obj) {
        if (typeof(obj)=="object") {
            var clone = {};
            for (var prop in obj)
                if (obj.hasOwnProperty(prop))
                    clone[prop] = $.koshkilJS.cloneObject(obj[prop]);
    
            return clone;
        } else
            return obj;
    }
            
};


String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

String.prototype.base64_decode=function() {
    var s=this;
    var e={},i,b=0,c,x,l=0,a,r='',w=String.fromCharCode,L=s.length;
    var A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for(i=0;i<64;i++){e[A.charAt(i)]=i;}
    for(x=0;x<L;x++){
        c=e[s.charAt(x)];b=(b<<6)+c;l+=6;
        while(l>=8){((a=(b>>>(l-=8))&0xff)||(x<(L-2)))&&(r+=w(a));}
    }
    return r;
};
$(document.body).ready(function() {
    var scriptPath=document.location.pathname.substr(1);
    var moduleName;

    $.koshkilJS.ajaxFunction = $.ajax;
    if (typeof $.koshkilJS.components == 'object') { 
        for (moduleName in $.koshkilJS.components) {
            if ($.koshkilJS.components[moduleName] && typeof $.koshkilJS.components[moduleName].init == 'function') {
                $.koshkilJS.components[moduleName].init();
            }
        }
    }

    if ($.koshkilJS.forceRunModule === null || $.koshkilJS.forceRunModule === undefined) {
        if (scriptPath == '') {
            moduleName='home';
        } else {
            moduleName=null;
            var pathParts=scriptPath.split('/');
            while(pathParts.length>0) {
                var last=pathParts.pop();
    
                if (!new RegExp(/^[0-9]*$/).test(last) && !new RegExp(/\.[a-zA-Z]*$/).test(last) && last != 'listado' && last != 'editar' && $.koshkilJS[last]) {
                    if ($.koshkilJS[last] && typeof $.koshkilJS[last].init == 'function') {
                        moduleName=last;
                        break;
                    }
                }
            }
        }
    } else {
        moduleName = $.koshkilJS.forceRunModule;
    }
        
    if (moduleName && $.koshkilJS[moduleName] && typeof $.koshkilJS[moduleName].init == 'function' && !$.koshkilJS[moduleName].initialized) {
        $.koshkilJS[moduleName].initialized=true;
        $.koshkilJS[moduleName].init();
    }
    for (var module in $.koshkilJS.startup) {
        if (typeof $.koshkilJS.startup[module] === 'object' && typeof $.koshkilJS.startup[module].init == 'function') {
            $.koshkilJS.startup[module].init();
        }
    }
});
