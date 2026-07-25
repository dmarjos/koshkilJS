$.koshkilJS = $.koshkilJS || {};
$.koshkilJS.components = $.koshkilJS.components || {};
$.koshkilJS.components.summernote = {
    buttonsHandlers: {
        addImage:function(context) {
            var ui = $.summernote.ui;

            $('img[data-type]').each(function() {
                if (!$(this).data('summernote-context'))
                    $(this).data('summernote-context',context);
            });

            // create button
            var button = ui.button({
                contents: '<i class="fa fa-image"/>',
                tooltip: '',
                click: function () {
                    context.invoke('editor.saveRange');
                    $.koshkilJS.components.summernote.helpers.populateModal('images');
                    $('#selectContent').data('context',context).attr('data-dialog-type','image');
                    $('#selectContent').modal('show');
                }
            });

            return button.render();   // return button as jquery object
        },
        addDocument : function (context) {
            var ui = $.summernote.ui;
          
            // create button
            var button = ui.button({
                contents: '<i class="fa fa-file-pdf-o"/>',
                tooltip: '',
                click: function () {
                    context.invoke('editor.saveRange');
                    $.koshkilJS.components.summernote.helpers.populateModal('documents');
                    $('#selectContent').data('context',context).attr('data-dialog-type','document');
                    $('#selectContent').modal('show');
                }
            });
          
            return button.render();   // return button as jquery object
        },
        addVideo: function (context) {
            var ui = $.summernote.ui;
            // create button
            var button = ui.button({
                contents: '<i class="fa fa-film"/>',
                tooltip: '',
                click: function () {
                    context.invoke('editor.saveRange');
                    $.koshkilJS.components.summernote.helpers.populateModal('videos');
                    $('#selectContent').data('context',context).attr('data-dialog-type','video');
                    $('#selectContent').modal('show');
                }
            });
            
            return button.render();   // return button as jquery object
        }
    },
    helpers: {
        setupHover:function(obj) {
            var nodeType=$(obj).attr('data-type');
            var text='';
            switch(nodeType) {
                case "image":
                    text='Imagen: ';
                    break;
                case "document":
                    text='Documento: ';
                    break;
                case "video":
                    text='Video: ';
                    break;
            }
            text+=$(obj).attr('data-index');
            $(obj).drawText({
                text: text,
                fontFamily: 'Arial',
                fontSize: 14,
                x: 3,
                y: 3,
                fromCenter: false,
                fillStyle: 'black',
                fontStyle:'normal',
                strokeStyle: 'black',
                strokeWidth: 0.3
            });
        
        
            $(obj).hover(function(e){
                var nodeType=$(obj).attr('data-type');
                var src='';
                switch(nodeType) {
                    case "image":
                    case "video":
                        src='<img src="'+$.koshkilJS.helpers.getLink($(this).attr('data-src'))+'" class="img-responsive"/>';
                        break;
                    default:
                        src=$(this).attr('data-src');
                        break;
                }
                $("body").append("<p id='img-preview'>"+src+"</p>");
                $("#img-preview")
                    .css("top",(e.pageY + yOffset) + "px")
                    .css("left",(e.pageX +xOffset) + "px")
                    .fadeIn("fast");
            },
            function(){
                $("#img-preview").remove();
            }).mousemove(function(e){
                $("#img-preview")
                    .css("top",(e.pageY + yOffset) + "px")
                    .css("left",(e.pageX + xOffset) + "px");
            }).click(editNode);
        },
        editNode: function() {
            var me=$(this);
            var context=$(me).data('summernote-context');
            var dialogType=$(me).attr('data-type');
        
            context.invoke('editor.saveRange');
            $('#editContent [data-action=delete]').unbind('click').on('click',function() {
                $.koshkilJS.helpers.askConfirmation('&iquest;Desea eliminar este elemento?<br/>('+$(me).attr('data-src')+')',function() {
                    $("#img-preview").remove();
                    $(me).remove();
                    context.invoke('editor.restoreRange');
                    $('#editContent').modal('hide');
                });
            });
            if (dialogType=='image') {
                var preview=$(me).clone();
                $('#editContent #content').html('');
                $(preview).removeAttr('width').addClass('img-responsive').appendTo('#editContent #content');
                var selectedAlign=$(me).attr('data-selected-align');
                var selectedSize=$(me).attr('data-selected-size');
                var selectedMarginTop=$(me).attr('data-selected-mt');
                var selectedMarginRight=$(me).attr('data-selected-mr');
                var selectedMarginBottom=$(me).attr('data-selected-mb');
                var selectedMarginLeft=$(me).attr('data-selected-ml');
        
                if (selectedAlign) {
                    $('#editContent #properties #align').val(selectedAlign);
                }
                if (selectedSize) {
                    $('#editContent #properties #size').val(selectedSize);
                }
                if (selectedMarginTop) {
                    $('#editContent #properties #margin-top').val(selectedMarginTop);
                }
                if (selectedMarginRight) {
                    $('#editContent #properties #margin-right').val(selectedMarginRight);
                }
                if (selectedMarginBottom) {
                    $('#editContent #properties #margin-bottom').val(selectedMarginBottom);
                }
                if (selectedMarginLeft) {
                    $('#editContent #properties #margin-left').val(selectedMarginLeft);
                }
                $('#editContent #properties select, #editContent #properties input').removeAttr('disabled');
        
                $('#editContent [data-action=accept]').removeAttr('disabled').unbind('click').on('click',function() {
                    $.koshkilJS.helpers.askConfirmation('&iquest;Desea aplicar los cambios a este elemento?<br/>('+$(me).attr('data-src')+')',function() {
                        $("#img-preview").remove();
                        var align=$('#editContent #properties #align').val();
                        var size=$('#editContent #properties #size').val();
                        var marginTop=$('#editContent #properties #margin-top').val();
                        var marginRight=$('#editContent #properties #margin-right').val();
                        var marginBottom=$('#editContent #properties #margin-bottom').val();
                        var marginLeft=$('#editContent #properties #margin-left').val();
                        nodeAttr={};
                        $(me).removeAttr('align');
                        $(me).removeAttr('width');
                        if (align!='none') {
                            nodeAttr.align=align;
                        }
                        nodeAttr['data-selected-align']=align;
                        nodeAttr['data-selected-size']=size;
                        nodeAttr['data-selected-mt']=marginTop;
                        nodeAttr['data-selected-mr']=marginRight;
                        nodeAttr['data-selected-mb']=marginBottom;
                        nodeAttr['data-selected-ml']=marginLeft;
                        if (size!='100') {
                            nodeAttr.width=size+'%'
                        } else {
                            $(me).removeAttr('size');
                        }
        
                        styles={};
                        styles.marginTop=marginTop+'px';
                        styles.marginRight=marginRight+'px';
                        styles.marginBottom=marginBottom+'px';
                        styles.marginLeft=marginLeft+'px';
        
                        $(me).attr(nodeAttr).css(styles);
                        context.invoke('editor.restoreRange');
                        $('#editContent').modal('hide');
                    });
                });
            }
            $('#editContent').modal('show');
            return false;
        },
        updateSummernote: function() {
            var imageObject=$('#selectContent #content img.selected');
            var dialog=$(imageObject).parents('[role=dialog]')
            var context=$(dialog).data('context');
            var dialogType=$(dialog).attr('data-dialog-type');
            var insertText='';
            var index=$(imageObject).attr('data-index');
            var src=$(imageObject).attr('src');
            var file=$(imageObject).attr('data-file');
            var url=$(imageObject).attr('data-url');
            var thumb=$(imageObject).attr('data-thumb');
            var title=$(imageObject).attr('data-title');
            switch(dialogType) {
                case 'image':
                    var align=$('#selectContent #properties #align').val();
                    var preview=$('#selectContent #properties #preview').val();
                    var size=$('#selectContent #properties #size').val();
                    var marginTop=$('#selectContent #properties #margin-top').val();
                    var marginRight=$('#selectContent #properties #margin-right').val();
                    var marginBottom=$('#selectContent #properties #margin-bottom').val();
                    var marginLeft=$('#selectContent #properties #margin-left').val();
                    var node=document.createElement('img');
                    var imgSrc='/webroot/img/icons/picture.png';
                    var nodeAttr={
                        'src': '/webroot/img/icons/picture.png',
                        'data-type':'image',
                        'data-src':src,
                        'data-index': index
                    };
        
                    if (align!='none') {
                        nodeAttr.align=align;
                    }
                    if (size!='100') {
                        nodeAttr.width=size+'%'
                    }
        
                    nodeAttr['data-selected-align']=align;
                    nodeAttr['data-selected-size']=size;
                    nodeAttr['data-selected-mt']=marginTop;
                    nodeAttr['data-selected-mr']=marginRight;
                    nodeAttr['data-selected-mb']=marginBottom;
                    nodeAttr['data-selected-ml']=marginLeft;
        
                    styles={};
                    styles.marginTop=marginTop+'px';
                    styles.marginRight=marginRight+'px';
                    styles.marginBottom=marginBottom+'px';
                    styles.marginLeft=marginLeft+'px';
        
                    if(preview=='si') {
                        nodeAttr.src=src;
                        if (align!='none') {
                            nodeAttr.align=align;
                        }
                        $(node).attr(nodeAttr).css(styles);
                    } else {
                        $(node).attr(nodeAttr).addClass('sn-components').html('&nbsp;');
                    }
                    $(node).data('summernote-context',context).click(editNode);
                    break;
                case 'document':
                    var node=document.createElement('img');
                    $(node).attr({
                        'src': '/webroot/img/icons/document.png',
                        'data-type':'document',
                        'data-src':file,
                        'data-index': index
                    }).addClass('sn-components').html('&nbsp;');
                    break;
                    setupHover(node);
                case 'video':
                    var node=document.createElement('img');
                    $(node).attr({
                        'src': '/webroot/img/icons/video.png',
                        'data-type':'video',
                        'data-src':thumb,
                        'data-url':url,
                        'data-index': index
                    }).addClass('sn-components').html('&nbsp;');
                    setupHover(node);
                    break;
            }
        
            context.invoke('editor.restoreRange');
            context.invoke('editor.insertNode', node);
            $(dialog).modal('hide');
        },
        enableProperties:function() {
            var dialog=$(this).parents('[role=dialog]')
            var dialogType=$(dialog).attr('data-dialog-type');
        
            $('#selectContent #content img').removeClass('selected');
            $('#selectContent [data-action=accept]').removeAttr('disabled');
            if (dialogType=='image') {
                $('#selectContent #properties select, #selectContent #properties input').removeAttr('disabled');
            }
            $(this).addClass('selected');
        },
        populateModal: function (src){
            $('#selectContent #content').html('');
            $('#selectContent #properties select').each(function() {
                var defaultValue=$(this).find('option[data-default=1]').attr('value');
                $(this).val(defaultValue);
            });
            $('#selectContent #properties select, #selectContent #properties input').attr('disabled','disabled');
            $('#selectContent [data-action=accept]').attr('disabled','disabled').unbind('click').on('click',$.koshkilJS.components.summernote.helpers.updateSummernote);
            switch(src) {
                case 'images':
                    var idx=0;
                    var tr;
                    var index=1;
                    $('#documentos .fake-dropzone div[data-item-type=image]').each(function() {
                        if (idx==0) {
                            tr=$('<tr/>').addClass('row').appendTo('#selectContent #content');
                        }
                        var imgDiv=$('<div/>').addClass('col-lg-4').appendTo(tr);
                        var img=$(this).find('img').clone();
                        $(img).addClass('img-responsive').css('cursor','pointer').click($.koshkilJS.components.summernote.helpers.enableProperties);
                        $(img).attr('data-index',index).appendTo(imgDiv);
                        index++;
                        idx++;
                        if (idx>2) {
                            $('<div/>').addClass('clear15').appendTo(tr);
                            idx=0;
                        }
                    });
                    break;
                case 'documents':
                    var idx=0;
                    var tr;
                    var index=1;
                    $('#documentos .fake-dropzone div[data-item-type=document]').each(function() {
                        if (idx==0) {
                            tr=$('<tr/>').addClass('row').appendTo('#selectContent #content');
                        }
                        var imgDiv=$('<div/>').addClass('col-lg-4').appendTo(tr);
                        var originalImg=$(this).find('img');
                        var imgSrc=$(originalImg).attr('src');
                        var img=$('<img/>',{src:imgSrc});
                        var title=$(originalImg).parent().attr('title');
                        $(img).css('cursor','pointer').click($.koshkilJS.components.summernote.helpers.enableProperties);
                        $(img).attr('data-index',index).attr('data-file',title).appendTo(imgDiv);
                        $('<div/>').addClass('title').html(title).appendTo(imgDiv);
                        index++;
                        idx++;
                        if (idx>2) {
                            $('<div/>').addClass('clear15').appendTo(tr);
                            idx=0;
                        }
                    });
                    break;
                case 'videos':
                    var idx=0;
                    var tr;
                    var index=1;
                    $('#multimedia tr[data-item-type]').each(function() {
                        if (idx==0) {
                            tr=$('<tr/>').addClass('row').appendTo('#selectContent #content');
                        }
                        var imgDiv=$('<div/>').addClass('col-lg-4').appendTo(tr);
                        var videoThumb=$(this).attr('data-thumb');
                        if (!videoThumb) {
                            videoThumb='/webroot/img/icons/'+$(this).attr('data-item-type')+'.png';
                        }
                        var img=$('<img/>',{src:videoThumb}).addClass('img-responsive');
                        var title=$(this).find('[data-role=titulo]').html();
                        var url=$(this).find('[data-role=url]').html();
                        $(img).addClass('img-responsive').css('cursor','pointer').click($.koshkilJS.components.summernote.helpers.enableProperties);
                        $(img).attr('data-index',index).attr('data-thumb',videoThumb).attr('data-url',url).appendTo(imgDiv);
                        $('<div/>').addClass('title').html(title).appendTo(imgDiv);
                        index++;
                        idx++;
                        if (idx>2) {
                            $('<div/>').addClass('clear15').appendTo(tr);
                            idx=0;
                        }
                    });
                    break;
            }
        },
        createModals: function() {
            //<div class="modal inmodal fade" id="editMultimedia" tabindex="-1" role="dialog"  aria-hidden="true">
            var requestURL=$.koshkilJS.helpers.getLink('/admin/ajax/biblioteca');
            $.ajax({
                url: requestURL,
                type: 'POST',
                dataType: 'text',
                data: {
                    action: 'getSelectImagePopup'
                },
                success: function(response) {
                    var modal=$('<div/>',{
                        id:'selectContent',
                        tabindex:'-1',
                        role:'dialog',
                        'aria-hidden':'true'
                    }).addClass('modal inmodal fade').html(response).appendTo(document.body);
                }
            })
            var requestURL=$.koshkilJS.helpers.getLink('/admin/ajax/biblioteca');
            $.ajax({
                url: requestURL,
                type: 'POST',
                dataType: 'text',
                data: {
                    action: 'getEditImagePopup'
                },
                success: function(response) {
                    var modal=$('<div/>',{
                        id:'editContent',
                        tabindex:'-1',
                        role:'dialog',
                        'aria-hidden':'true'
                    }).addClass('modal inmodal fade').html(response).appendTo(document.body);
                }
            })
        }
    },
    enableSummernote: function(field,height) {
        height=height || 150;
        var custToolbar= [
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['insert',['link','hr','table']],
            ['misc', ['codeview']],
        ];
    
        var summerNoteOptions={
            disableDragAndDrop: true,
            height: height,
            toolbar:custToolbar,
            callbacks: {
                onPaste:function (e) {
                    e.preventDefault();
                    var bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
                    document.execCommand('insertText', false, bufferText);
                }
            }
        };
        $(field).each(function() {
            $(this).data('hasEditor','1');
            if ($(this).attr('data-multimedia')!='false') {
                var spanDescripcion=$('<span/>');
                var ayuda=[];
                ayuda.push('<font color="red">[imagen:X]</font> para incluir la imagen cuya posici&oacute;n sea X');
                ayuda.push('<font color="red">[documento:X]</font> para incluir un enlace al documento cuya posici&oacute;n sea X');
                ayuda.push('<font color="red">[video:X]</font> para incluir el video o clip de audio cuya posici&oacute;n sea X');
                ayuda.push('Tambien puede utilizar los botones:');
                ayuda.push('<i class="fa fa-image"></i> para seleccionar una imagen, <i class="fa fa-file-pdf-o"></i> para seleccionar un documento, <i class="fa fa-film"></i> para seleccionar un video o clip de audio');
                var small=$('<small/>').html('Puede utilizar alguno de los siguientes codigos:<br/>'+ayuda.join('<br/>')).appendTo(spanDescripcion);
    
                $(spanDescripcion).appendTo($(this).parent());
                custToolbar.push(['koshkil', ['imagen','documento','multimedia']]);
                summerNoteOptions.buttons={
                    imagen:$.koshkilJS.components.summernote.buttonsHandlers.addImage,
                    documento:$.koshkilJS.components.summernote.buttonsHandlers.addDocument,
                    multimedia:$.koshkilJS.components.summernote.buttonsHandlers.addVideo
                };
                summerNoteOptions.toolbar=custToolbar;
            }
            $(this).summernote(summerNoteOptions);
        });
    
        $.koshkilJS.components.summernote.helpers.createModals();
        $('img[data-type]').each(function() {
            $.koshkilJS.components.summernote.helpers.setupHover($(this));
        })
    }
};
xOffset = 10;
yOffset = 10;

