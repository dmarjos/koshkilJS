(function( $ ) {
	$.koshkilJS = $.koshkilJS || {};
	$.koshkilJS.uploadWithPreview = {
		destroy: function(obj) {
			var options=$(obj).data('options');
			$(options.previewParent).find('#file_'+options.name+(options.suffix?'-'+options.suffix:'')).remove();
			var original=$(obj).data('originalElement');
			$(obj).replaceWith(original);
		}
	};
	$.fn.uploadWithPreview=function(opt) {
        if (typeof opt === 'object' || !opt) {
	        var options=$.extend({
	            name:'image',
	            suffix:'',
	            text:'Select Image',
				zIndexPreview:2100,
				autoMultipartForm:true,
	            previewParent:document.body,
				externalPreview: false,
				externalPreviewContainer: null
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
			if (!options.externalPreview) {
				var spanPreview=$('<span/>',{
					id:'preview-'+options.name+(options.suffix?'-'+options.suffix:'')
				}).addClass('input-group-addon')
				.html('<i class="fa fa-eye"></i>')
				.data('settings',options)
				.appendTo(inputGroup);
			}

			var spanDelete=$('<span/>',{
				id:'delete-'+options.name+(options.suffix?'-'+options.suffix:'')
			}).addClass('input-group-addon hidden')
			.css('cursor','pointer')
			.html('<i class="fa fa-trash"></i>')
			.on('click',function() {
				$.koshkilJS.helpers.askConfirmation('&iquest;Desea realmente eliminar esta imagen?',function() {
					if (options.externalPreview && $(options.externalPreviewContainer).length>0) {
						$(options.externalPreviewContainer).html('');
					} else {
						$(spanPreview).removeData('img')
					}

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
					if (options.externalPreview && $(options.externalPreviewContainer).length>0) {
						$(options.externalPreviewContainer).html('');
						$('<img/>').attr({
							width: '500',
							height: '500',
							'src':e.target.result,
						}).css({
							'background-image':e.target.result,
							'background-size': 'cover',
							'background-repeat': 'no-repeat',
							'background-position': '0px 0px',
							'width': '500px',
							'height': '500px',
						}).appendTo($(options.externalPreviewContainer));
					} else {
						$(spanPreview).data("img",$("<img/>",{
							src : e.target.result,
							title : file.name
						}));
					}
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
				if (options.externalPreview && $(options.externalPreviewContainer).length>0) {
					$(options.externalPreviewContainer).html('');
					$('<img/>').attr({
						width: '500',
						height: '500',
						'src':options.value,
					}).css({
						'background-image':options.value,
						'background-size': 'cover',
						'background-repeat': 'no-repeat',
						'background-position': '0px 0px',
						'width': '500px',
						'height': '500px',
					}).appendTo($(options.externalPreviewContainer));
				}  else {
					$(spanPreview).data('img',$('<img/>',{src:options.value}));
				}
				$(spanDelete).removeClass('hidden');
				
			}

			$.imagePreviewer.init(spanPreview);
			$(this).html('');
			$(inputGroup).appendTo(this);
		} else if (opt !== undefined && typeof $.koshkilJS.uploadWithPreview[opt] === 'function') {
            settings=$(this).data('settings');
            $.koshkilJS.uploadWithPreview[opt]($(this));
		}
        return this;
	};
}( jQuery ));
