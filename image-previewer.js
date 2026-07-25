(function( $ ) {
    $.imagePreviewer = {
        xOffset:10,
        yOffset:10,
        init:function(element) {
            $(element).css('cursor','pointer').hover(function(e){
                var img=$(this).data('img');
                var w=200,h=200;
                var src;
                if (img) {
                    src='';
                } else {
                    src='<i>No se ha seleccionado ninguna imagen</i>';
                    w=220;
                    h=50;
                }
                $("body").append("<div id='img-preview' class='hover-preview'>"+src+"</div>");
                $("#img-preview")
                    .css("top",(e.pageY + $.imagePreviewer.yOffset) + "px")
                    .css("left",(e.pageX - ($('#img-preview').width()+$.imagePreviewer.xOffset)) + "px")
                    .css('width',w+'px')
                    .css('height',h+'px')
                    .fadeIn("fast");
                if (img)
                    $("#img-preview").css({
                        'background-image':"url('"+$(img).attr('src')+"')",
                        'background-size':"cover",
                        'z-index':'10000'
                    })
                else
                    $("#img-preview").css('background-color',"#ffffff")
            },
            function(){
                $("#img-preview").remove();
            }).mousemove(function(e){
                $("#img-preview")
                    .css("top",(e.pageY + $.imagePreviewer.yOffset) + "px")
                    .css("left",(e.pageX - ($('#img-preview').width()+$.imagePreviewer.xOffset)) + "px");
            });
        }
    }
}( jQuery ));
