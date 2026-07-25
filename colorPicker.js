(function ($) {
    $.fn.colorPicker = function (options) { 
        $(this).html('');
        var settings = $.extend({
            selectedColor:'',
            palette: {
                '1': '#000000',
                '2': '#7f7f7f',
                '3': '#880015',
                '4': '#f68326',
                '5': '#fdf200',
                '6': '#28ad52',
                '7': '#02a4e2',
                '8': '#3c4ac7',
                '9': '#ea13e6',
            },
        }, options);

        var colorCount = 0;
        for (var id in settings.palette) {
            if (settings.palette[id]) {
                colorCount++;
            }
        }
        if (colorCount == 0) {
            console.log('There are no colors inthe palette.');
            return;
        }
        if ($(this).attr('data-selected-color')) {
            settings.selectedColor = $(this).attr('data-selected-color');
        }
        $(this).data('settings', settings);
        $(this).attr({
            'data-role': 'color-picker',
            'data-selected-color': settings.selectedColor
        });
        $(this).css('width', '100%');
		var me=$(this);
		var objId=$(this).attr("id");
		if (!objId) {
			objId=$.uniqId();
			$(this).attr("id",objId);
        }
        var fullWidth = $(me).width();
        var colorWidth = settings.width?settings.width:((fullWidth / colorCount)-5);

        for (var id in settings.palette) {
            var color = $('<div/>', {
                id: 'color_' + id,
                'data-color-id': id,
            }).css({
                position: 'relative',
                float:'left',
                width: colorWidth + 'px',
                height: (settings.height ? settings.height : colorWidth) + 'px',
                'background-color': settings.palette[id],
                border: '2px solid #' + (settings.palette[id] == settings.selectedColor ? '000000' : 'ffffff'),
                'border-radius':'3px',
                cursor: 'pointer',
                'margin-right': '1px'
            }).on('click', function () {
                $(this).parent().find('[data-color-id]').css('border-color', '#ffffff');
                $(this).css('border-color', '#000000');
                $(me).attr('data-selected-color',settings.palette[$(this).attr('data-color-id')]).trigger('koshkilJS.colorPicker.colorSelected',[$(this)]);
            }).appendTo(me);
        }

    }
    $.fn.colorPicker.prototype.setColor = function (options) {
        console.log($(this).data('settings'));
    }
})(jQuery);