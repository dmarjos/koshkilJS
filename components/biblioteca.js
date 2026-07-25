// Manejo de biblioteca de documentos
var maxFiles;
var queuePending=false;
//Dropzone.autoDiscover = false;
$.koshkilJS = $.koshkilJS || {};
var errors=[];

function saveRecordIfNeeded(mensaje,callBack) {
    gal_relacionado=$('#gal_relacionado').val();
    if (gal_relacionado=='') {
        $.koshkilJS.helpers.askConfirmation(mensaje,function() {
            var validRecord;
            if (typeof $.koshkilJS.validarRegistro === 'function') {
                validRecord=$.koshkilJS.validarRegistro(false);
            } else if (typeof window['validarRegistro'] === 'function') {
                validRecord=validarRegistro(false);
            } else {
                validRecord=true;
            }
            if (validRecord) {
                var postData={};
                var theForm;
                if ($('#detalles form').length==0) {
                    theForm=$('#detalles').parents('form');
                } else {
                    theForm=$('#detalles form');
                }
                var postData=new FormData($(theForm)[0]);
                postData.append("ajax",'1');
                $.ajax({
                    url:location.href,
                    type:'post',
                    dataType:'json',
                    data: postData,
                    cache: false,
                    processData: false,
                    contentType: false,
                    success:function(data) {
                        if (data.status=='error') {
                            toastr.error(data.message);
                            for (var fld in data.fields) {
                                if (data.fields[fld]===true) {
                                    $('#'+fld).parents('.form-group').addClass('has-error');
                                }
                            }
                        } else {
                            toastr.success(data.message);
                            $('#detalles #action').val('actualizar');
                            $('#detalles #id').val(data.data.record_id);

                            $('input[type=hidden]#gal_relacionado').each(function() {
                                $(this).val(data.data.record_id)
                            });
                            var dzForm=$('#dropzone-biblioteca');
                            $.koshkilJS.dropZone.options.params.gal_relacionado=$(dzForm).find('[name=gal_relacionado]').val();
                            Dropzone.options.dropzoneBiblioteca.params = $.koshkilJS.dropZone.options.params;
//                            $('#biblioteca #gal_relacionado').val(data.data.record_id);
                            callBack();
                        }
                    },
                    error: function(data) {
                        console.log(data);
                    }
                })
            }
        },null,false)
    } else
    	callBack();
}

(function( $ ) {
    $.koshkilJS.bibliotecaUpload={
        ajaxURL:'/admin/ajax/biblioteca',
        maxFiles:25000,
        maxFileSize: 10, // Maximo 10 MB por archivo

        clickDocumento:function() {
        	var resourceId=$(this).parent().attr('data-dz-resource-id');
        	$.ajax({
        		url:$.koshkilJS.bibliotecaUpload.ajaxURL,
        		type:'post',
                dataType: 'json',
        		data: {
        			action: 'obtenerDocumento',
        			gal_codigo: resourceId
        		},
        		success: function(data) {
                    $('#editDocumento #gal_codigo').val(data.resource.gal_codigo);
                    $('#editDocumento #gal_titulo').val($.koshkilJS.helpers.htmlDecode(data.resource.gal_titulo));
                    $('#editDocumento #gal_url').val($.koshkilJS.helpers.htmlDecode(data.resource.gal_url));
                    $('#editDocumento #gal_descripcion').val($.koshkilJS.helpers.htmlDecode(data.resource.gal_descripcion));
                    $('#editDocumento #img').removeClass('hidden').attr('src',data.resource.gal_archivo+'?_'+Math.random());
                    $('#editDocumento').modal('show');
        			},
                error: function (data) {
                    console.log(data);
        		}
        	});
        },

        guardarDocumento:function() {
        	var id=$('#editDocumento #gal_codigo').val();
            var titulo=$('#editDocumento #gal_titulo').val();
            var url=$('#editDocumento #gal_url').val();
            var descripcion=$('#editDocumento #gal_descripcion').val();
        	$('.fake-dropzone .dz-preview[data-dz-resource-id='+id+']').find('a[data-gallery]').attr('title',titulo);
            var postData={
                action: 'guardarDocumento',
                gal_codigo: id,
                gal_titulo: titulo,
                gal_url: url,
                gal_descripcion: descripcion,
            };
        	$.ajax({
        		url:$.koshkilJS.bibliotecaUpload.ajaxURL,
        		type:'post',
        		data: postData,
        		success: function(data) {
        			$('#editDocumento .close').click();
        		}
        	});
        },

        clickRemove:function() {
        	var resourceId=$(this).parent().attr('data-dz-resource-id');
        	$.koshkilJS.helpers.askConfirmation('&iquest;Desea eliminar esta imagen?',function()  {
        		$.ajax({
        			url:$.koshkilJS.bibliotecaUpload.ajaxURL,
        			type:'post',
        			data: {
        				action: 'borrarDocumento',
        				gal_codigo: resourceId
        			},
        			success: function() {
        				$('.fake-dropzone .dz-preview.dz-image-preview[data-dz-resource-id="'+resourceId+'"]').remove();
        			},
                    error: function (data) {
                        console.log(data);
                    }
        		});
        	})
        },

        init: function() {
            var ajaxURL=$.koshkilJS.bibliotecaUpload.ajaxURL;
            var theForm=$('#dropzone-biblioteca').parents('form');
            var dzForm=$('#dropzone-biblioteca');
            $.koshkilJS.dropZone.options.url=$(dzForm).attr('action');
            $.koshkilJS.dropZone.options.params={
                'action':$(dzForm).find('[name=dz_action]').val(),
                'gal_grupo':$(dzForm).find('[name=gal_grupo]').val(),
                'gal_relacionado':$(dzForm).find('[name=gal_relacionado]').val(),
            };

            if ($(dzForm).find('[name=sizeRestrictions]').length>0) {
                $.koshkilJS.dropZone.options.params.sizeRestrictions=$(dzForm).find('[name=sizeRestrictions]').val();
            }
            //$('#dropzone-biblioteca input[type=hidden]').remove();
            $('#remove-documents').click(function() {
        		$.koshkilJS.helpers.askConfirmation('Desea realmente eliminar todas las im&aacute;genes asociadas a este registro?',function() {
        		    gal_relacionado=$('#gal_relacionado').val();
        			$.ajax({
        				url:ajaxURL,
        				type:'post',
        				data: {
        					action: 'borrarDocumentos',
                            gal_grupo: $('#dropzone-biblioteca [name=gal_grupo]').val(),
        					gal_relacionado: gal_relacionado,
        				},
        				success: function() {
        					$('.fake-dropzone').html('');
            			},
                        error: function (data) {
                            console.log(data);
        				}
        			});
        		});
        	});

        	if ($('.dz-preview.dz-image-preview').length>0) {
                $('#remove-documents').removeClass('hidden');
            }

            $( ".fake-dropzone" ).sortable({
        		stop: function() {
                    $('<div/>',{
                        id: 'backgroundModal'
                    }).css({
                        'position':'fixed',
                        'top':0,
                        'left':0,
                        'width': $(window).width(),
                        'height': $(window).height(),
                        'background-color':'rgba(0,0,0,0.3)'
                    }).appendTo(document.body);
        			var c=1;
                    var imageIndexes=[];
        			$('.fake-dropzone .dz-preview.dz-image-preview').each(function() {
                        imageIndexes.push({
                            gal_codigo:$(this).attr('data-dz-resource-id'),
                            gal_indice: c
                        });
        				c++;
        			});
                    var postData={
                        action:'fixImageIndex',
                        gal_index: JSON.stringify(imageIndexes)
                    };
                    $.ajax({
                        url: ajaxURL,
                        data:postData,
                        type: 'post',
                        success: function () {
                            $('#backgroundModal').remove();
                        },
                        error: function () {
                            $('#backgroundModal').remove();
                        }
                    });
        		}
        	});

            maxFiles=$.koshkilJS.bibliotecaUpload.maxFiles-$('.fake-dropzone .dz-preview.dz-image-preview').length;
        	$('.fake-dropzone').data('remaining-images',maxFiles);
        	$('.fake-dropzone .dz-preview.dz-image-preview').each(function() {
        		$(this).find('button[data-dz-properties]').attr('type','button').click($.koshkilJS.bibliotecaUpload.clickDocumento);
        		$(this).find('button[data-dz-remove]').attr('type','button').click($.koshkilJS.bibliotecaUpload.clickRemove);
        	});
        }
    };

}(jQuery));

$(document.body).ready(function() {
    $.koshkilJS.dropZone={
        options: {
            previewTemplate: $('#preview-template').html(),
            autoProcessQueue: false,
            uploadMultiple: true,
            parallelUploads: 4,
            maxFiles: maxFiles,
            maxFilesize: $.koshkilJS.bibliotecaUpload.maxFileSize,
            paramName:'documento',
            addRemoveLinks:true,
            dictRemoveFile:'Eliminar',
            dictMaxFilesExceeded:'Solo puede asignarse un m\xE1ximo de '+$.koshkilJS.bibliotecaUpload.maxFiles+' im\xE1genes',
            dictDefaultMessage:'Suelte los archivos aqui, o haga click para seleccionarlos. Se admite unicamente archivos de im\xE1genes.',
            // Dropzone settings
            renameFilename: function(name) {
                if (name)
                    return name.replace(/[^\x20-\x7F]/g, "");
            },
            init: function() {
                var myDropzone = this;

                $("button#procesar-dropzone").on("click", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    saveRecordIfNeeded('Antes de guardar las imagenes seleccionadas, debe grabarse el registro en curso de creaci&oacute;n<br/>&iquest;Desea continuar?',function(){
                        myDropzone.processQueue();
                    })
                });
                //this.on("sendingmultiple", function() {});
                this.on("successmultiple", function(files, response) {
                    if (response)
                        response=JSON.parse(response);

                    for(var i=0; i<files.length; i++) {
                        $(files[i].previewElement).attr('data-dz-resource-id',response.archivos[i].gal_codigo);
                        $(files[i].previewElement).attr('data-item-type',response.archivos[i].gal_tipo);
                        $(files[i].previewElement).attr('data-item-order',response.archivos[i].gal_indice);
                        $(files[i].previewElement).attr('data-usage',response.archivos[i].gal_uso);
                        $(files[i].previewElement).find('img[data-dz-thumbnail]').attr('src',response.archivos[i].gal_archivo);
                    }
                    var imagenesCargadas=$('.dropzone .dz-preview.dz-image-preview').length;
                    var imagenesProcesadasOK=$('.dropzone .dz-preview.dz-image-preview.dz-success').length;
                    maxFiles-=imagenesProcesadasOK;
                    Dropzone.forElement(document.getElementById('dropzone-biblioteca')).options.maxFiles=maxFiles;

                    if (imagenesProcesadasOK==imagenesCargadas) {
                        $('#multimedia .alert.alert-warning').addClass('hidden');
                        $('#multimedia button[type=submit]').addClass('hidden');
                        queuePending=false;
                    }
                    $('.dropzone .dz-preview.dz-image-preview.dz-success, .dropzone .dz-preview.dz-file-preview.dz-success').each(function() {
                        var newPreview=$(this).clone();
                        $('.fake-dropzone').removeClass('hidden');
                        $(newPreview).appendTo('.fake-dropzone');
                        var dzThumb=$(newPreview).find('img[data-dz-thumbnail]').clone();
                        var imgTitle=$(dzThumb).attr('src').split('/').pop();
                        var a=$('<a/>',{href:$(dzThumb).attr('src'),'data-gallery':'',title:imgTitle}).css('cursor','zoom-in')
                        $(dzThumb).appendTo(a);
                        $(newPreview).find('img[data-dz-thumbnail]').replaceWith(a);
                        $(newPreview).find('center[data-dz-usage]').html($(this).attr('data-usage'));

                        $(newPreview).find('.dz-size').remove();
                        $(newPreview).find('.dz-success-mark').remove();
                        $(newPreview).find('.dz-error-mark').remove();
                        $(newPreview).find('.dz-progress').remove();
                        $(newPreview).find('.dz-error-mark').remove();
                        $(newPreview).find('.dz-error-message').remove();
                        $(newPreview).find('a[data-dz-remove]').remove();
                        /* <a class="dz-remove" href="javascript:void();" data-dz-remove="">Eliminar</a> */
                        if ($(newPreview).hasClass('dz-file-preview')) {
                            $(newPreview).removeClass('dz-file-preview dz-processing').addClass('dz-image-preview');
                        }
                        $(newPreview).find('button[data-dz-properties]').attr('type','button').removeClass('hidden').click($.koshkilJS.bibliotecaUpload.clickDocumento);
                        $(newPreview).find('button[data-dz-remove]').attr('type','button').removeClass('hidden').click($.koshkilJS.bibliotecaUpload.clickRemove);

                        $(this).animate({opacity:0},{
                            duration: 100,
                            complete: function() {
                                $(this).addClass('hidden');
                            }
                        })
                        var imagenesCargadas=$('.dropzone .dz-preview.dz-image-preview').length+$('.dropzone .dz-preview.dz-file-preview').length;
                    	var imagenesProcesadasOK=$('.dropzone .dz-preview.dz-image-preview.dz-success').length+$('.dropzone .dz-preview.dz-file-preview.dz-success').length;
                    	if (imagenesProcesadasOK==imagenesCargadas)
                            $('#documentos button#procesar-dropzone').addClass('hidden');

                        if ($('.dz-preview.dz-image-preview').length>0) {
                            $('#remove-documents').removeClass('hidden');
                        }
                    });
                });
                this.on("errormultiple", function(files, response) {
                });
                this.on("addedfile", function(event) {
                    queuePending=true;
                    $('#documentos .alert.alert-warning').removeClass('hidden');
                    $('#documentos button#procesar-dropzone').removeClass('hidden');
                });
                this.on("removedfile", function(event) {
                    queuePending=true;
                });
            }
        }
    };
    $.koshkilJS.bibliotecaUpload.init();
    $('#editDocumento #guardarDocumento').click($.koshkilJS.bibliotecaUpload.guardarDocumento);
    Dropzone.options.dropzoneBiblioteca = $.koshkilJS.dropZone.options;
});
