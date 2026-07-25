(function( $ ) {
	$.koshkilJS = $.koshkilJS || {};
	$.koshkilJS.attachments = {
		destroy: function(obj) {
			var options=$(obj).data('options');
			$(options.previewParent).find('#file_'+options.name+(options.suffix?'-'+options.suffix:'')).remove();
			var original=$(obj).data('originalElement');
			$(obj).replaceWith(original);
		}
	};
	$.fn.attachments=function(opt) {
        if (typeof opt === 'object' || !opt) {
	        var options=$.extend({
	            name:'attachment',
	            suffix:'',
	            text:'Select File',
				zIndexPreview:2100,
				autoMultipartForm:true,
	            previewParent:document.body
	        },opt);
	        options.value=$(this).attr('data-src');
	        $(this).data('options',options);
			$(this).data('originalElement',$(this).clone())
			var inputGroup=$('<div/>').addClass('input-group');
			var spanSelector=$('<span/>',{
				id:'select-'+options.name+(options.suffix?'-'+options.suffix:'')
			}).addClass('input-group-addon').html('<i class="fa fa-upload"></i>&nbsp;'+options.text)
			.appendTo(inputGroup);
			if (options.autoMultipartForm && $(this).parents('form').length>0) {
				$(this).parents('form').attr('enctype','multipart/form-data')
			}
			var fileName=$('<input/>',{
				type:'text',
				id:'name-'+options.name+(options.suffix?'-'+options.suffix:''),
				value:options.value
			}).addClass('form-control')
			.appendTo(inputGroup);

			var spanDelete=$('<span/>',{
				id:'delete-'+options.name+(options.suffix?'-'+options.suffix:'')
			}).addClass('input-group-addon hidden')
			.css('cursor','pointer')
			.html('<i class="fa fa-trash"></i>')
			.on('click',function() {
				$.koshkilJS.helpers.askConfirmation('&iquest;Desea realmente eliminar este archivo?',function() {
					$('<input/>',{
						type:'hidden',
						value:'1',
						name:'deleted-'+options.name+(options.suffix?'-'+options.suffix:''),
						id:'deleted-'+options.name+(options.suffix?'-'+options.suffix:'')
					}).appendTo(options.previewParent);;
					$('#delete-'+options.name+(options.suffix?'-'+options.suffix:'')).addClass('hidden');
					$('#name-'+options.name+(options.suffix?'-'+options.suffix:'')).val('');
				});
			})
			.appendTo(inputGroup);

			$('<input/>',{
				type:'file',
				name:'file_'+options.name+(options.suffix?'-'+options.suffix:''),
				id:'file_'+options.name+(options.suffix?'-'+options.suffix:''),
				value:'',
			}).addClass('hidden')
			.on('change',function(e) {
				var files = e.target.files;
				var f = files[0];
				$('#name-'+options.name+(options.suffix?'-'+options.suffix:'')).val(f.name);
				var fileReader = new FileReader();
				fileReader.onload = (function(e) {
					var file = e.target;
					$('#delete-'+options.name+(options.suffix?'-'+options.suffix:'')).removeClass('hidden');
					$('#deleted-'+options.name+(options.suffix?'-'+options.suffix:'')).remove();
				});
				fileReader.readAsDataURL(f);

			}).appendTo(options.previewParent);

			$(spanSelector).css('cursor','pointer')
			.on('click',function() {
				$('#file_'+options.name+(options.suffix?'-'+options.suffix:'')).trigger('click');
			})

			if (options.value) {
				$(spanDelete).removeClass('hidden');
			}

			$(this).html('');
			$(inputGroup).appendTo(this);
		} else if (opt !== undefined && typeof $.koshkilJS.attachments[opt] === 'function') {
            settings=$(this).data('settings');
            $.koshkilJS.attachments[opt]($(this));
		}
        return this;
	};
}( jQuery ));
