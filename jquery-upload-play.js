(function( $ ) {
	$.koshkilJS = $.koshkilJS || {};
	$.koshkilJS.uploadWithPlay = {
		destroy: function(obj) {
			var options=$(obj).data('options');
			$(options.previewParent).find('#file_'+options.name+(options.suffix?'-'+options.suffix:'')).remove();
			var original=$(obj).data('originalElement');
			$(obj).replaceWith(original);
		}
	};
	$.fn.uploadWithPlay=function(opt) {
        if (typeof opt === 'object' || !opt) {
	        var options=$.extend({
	            name:'audio',
	            suffix:'',
	            text:'Select Audio',
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
			var spanPreview=$('<span/>',{
				id:'play-'+options.name+(options.suffix?'-'+options.suffix:'')
			}).addClass('input-group-addon hidden')
			.css('cursor', 'pointer')
			.html('<i class="fa fa-play"></i>')
			.data('settings',options)
			.on('click',function() {
				var audio=$(this).data('audio');
				audio.play();
			})
			.appendTo(inputGroup);

			var spanDelete=$('<span/>',{
				id:'delete-'+options.name+(options.suffix?'-'+options.suffix:'')
			}).addClass('input-group-addon hidden')
			.css('cursor','pointer')
			.html('<i class="fa fa-trash"></i>')
			.on('click',function() {
				$.koshkilJS.helpers.askConfirmation('&iquest;Desea realmente eliminar este sonido?',function() {
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
					var audio=new Audio(e.target.result);
					$('#play-'+options.name+(options.suffix?'-'+options.suffix:'')).data("audio",audio).removeClass('hidden');
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
				$(spanPreview).data('audio',new Audio(options.value)).removeClass('hidden');
				$(spanDelete).removeClass('hidden');
			}

			$(this).html('');
			$(inputGroup).appendTo(this);
		} else if (opt !== undefined && typeof $.koshkilJS.uploadWithPlay[opt] === 'function') {
            settings=$(this).data('settings');
            $.koshkilJS.uploadWithPlay[opt]($(this));
		}
        return this;
	};
}( jQuery ));
