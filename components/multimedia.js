$.koshkilJS = $.koshkilJS || {};
$.koshkilJS.components = $.koshkilJS.components || {};
$.koshkilJS.components.multimediaUpload={
    ajaxURL:'/admin/ajax/biblioteca.php',
    initButtons: function() {
        $('button[data-multimedia-role]').each(function() {
            $(this).unbind('click');
            $(this).click(function() {
                if($(this).attr('data-multimedia-role')=='add') {
                    $.koshkilJS.components.multimediaUpload.addNewMultimedia();
                } else if($(this).attr('data-multimedia-role')=='edit') {
                    var dataRecordId=$(this).attr('data-record-id');
                    $.koshkilJS.components.multimediaUpload.editMultimedia(dataRecordId);
                } else if($(this).attr('data-multimedia-role')=='delete') {
                    var dataRecordId=$(this).attr('data-record-id');
                    $.koshkilJS.helpers.askConfirmation('&iquest;Desea realmente eliminar el registro seleccionado?',function() {
                        $.koshkilJS.components.multimediaUpload.deleteMultimedia(dataRecordId);
                    });
                }
            });
        });
    },
    editMultimedia: function(recordId) {
        $.ajax({
            url:$.koshkilJS.components.multimediaUpload.ajaxURL,
            type:'post',
            dataType: 'json',
            data: {
                action: 'obtenerDocumento',
                gal_codigo: recordId
            },
            success: function(data) {
                $('#editMultimedia #gal_codigo').val(data.resource.gal_codigo);
                $('#editMultimedia #gal_archivo').val(data.resource.gal_archivo);
                $('#editMultimedia #gal_titulo').val(data.resource.gal_titulo);
                $('#editMultimedia #gal_descripcion').val(data.resource.gal_descripcion);
                $('#editMultimedia #uploadPreview').attr('data-src',data.resource.gal_stillframe);
                $('#editMultimedia').modal('show');
            }

        });
    },
    deleteMultimedia: function(recordId) {
        $.ajax({
            url:$.koshkilJS.components.multimediaUpload.ajaxURL,
            type:'post',
            dataType: 'json',
            data: {
                action: 'deleteMultimedia',
                gal_codigo: recordId
            },
            success: function(data) {
                $('.footable tbody tr[data-multimedia-id='+recordId+']').remove();
            }

        });
    },
    addNewMultimedia: function() {
        $('#editMultimedia input,#editMultimedia textarea').each(function() {
            $(this).parents('.form-control').removeClass('has-error');
        });
        $('#editMultimedia #gal_codigo').val('0');
        $('#editMultimedia #gal_archivo').val('');
        $('#editMultimedia #gal_titulo').val('');
        $('#editMultimedia #gal_descripcion').val('');
        $('#editMultimedia').modal('show');
    },
    init: function() {
        $.koshkilJS.components.multimediaUpload.initButtons();
        $('#editMultimedia').on('shown.bs.modal',function() {
            $('#editMultimedia #uploadPreview').uploadWithPreview({
                name:'imagen',
                text:'Seleccionar imagen',
                previewParent: $('#editMultimedia [data-role=form]')
            });
        }).on('hidden.bs.modal',function() {
            $('#editMultimedia #uploadPreview').uploadWithPreview('destroy');
        });
        $('#guardarMutimedia').click(function() {
            var fakeForm=$('<form/>').css({
                'display':'none',
                'enctype':'multipart/form-data'
            }).appendTo(document.body);
            $('#editMultimedia [data-role=form] input').each(function() {
                $(this).clone().appendTo(fakeForm);
            });
            $('#editMultimedia [data-role=form] textarea').each(function() {
                $(this).clone().appendTo(fakeForm);
            });

            var formData=new FormData(fakeForm[0]);
            $.koshkilJS.helpers.ajaxUpload($.koshkilJS.components.multimediaUpload.ajaxURL,formData,function (data) {
                if (data.status=='error') {
                    for(fld in data.fields) {
                        if (data.fields[fld]===true)
                            $('#editMultimedia #'+fld).parents('.form-group').addClass('has-error');
                    }
                    toastr.error(data.message);
                } else {
                    if (data.multimedia.gal_codigo!=$('#editMultimedia #gal_codigo').val()) {
                        var tr=$('<tr/>',{
                            "data-multimedia-id":data.multimedia.gal_codigo,
                            'data-item-type':data.multimedia.gal_tipo,
                            'data-item-order':data.multimedia.gal_indice,
                        }).appendTo('.footable tbody');
                        $('<td/>',{'data-role':'titulo'}).addClass('col-lg-5 col-md-5').html(data.multimedia.gal_titulo).appendTo(tr);
                        $('<td/>',{'data-role':'url'}).addClass('col-lg-4 col-md-4').html(data.multimedia.gal_archivo).appendTo(tr);
                        $('<td/>',{'data-role':'tipo'}).addClass('col-lg-2 col-md-2').html(data.multimedia.gal_tipo).appendTo(tr);
                        var botones=[
                            '<button type="button" data-multimedia-role="delete" data-record-id="'+data.multimedia.gal_codigo+'" class="btn btn-xs pull-right btn-white" data-toggle="tooltip" data-placement="bottom" title="" data-original-title="Borrar"><i class="fa fa-trash"></i></button>',
                            '<button type="button" data-multimedia-role="edit" data-record-id="'+data.multimedia.gal_codigo+'" class="pull-right btn btn-xs btn-white" data-toggle="tooltip" data-placement="bottom" title="" data-original-title="Editar"><i class="fa fa-pencil"></i></button>'
                        ];
                        $('<td/>').addClass('col-lg-1 col-md-1 text-right').html(botones.join('')).appendTo(tr);
                    } else {
                        var tr=$('.footable tbody tr[data-multimedia-id='+data.multimedia.gal_codigo+']');
                        $(tr).find('[data-role=titulo]').html(data.multimedia.gal_titulo);
                        $(tr).find('[data-role=url]').html(data.multimedia.gal_archivo);
                        $(tr).find('[data-role=tipo]').html(data.multimedia.gal_tipo);
                    }
                    $.koshkilJS.components.multimediaUpload.initButtons();
                    $('#editMultimedia .close').click();
                    $(fakeForm).remove();
                }
                console.log(data);
            },function(data) {
                console.log(data);
            });

        })
    },
};

