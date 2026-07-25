/*!
 * Autosuggest jQuery Plugin - v1.0 - 2018-02-09
 * http://jqueryui.com
 * Copyright 2018 Daniel Marjos - Mestizos Comunicacion
 */


var AS_LIST_BOTTOM=1;
var AS_LIST_TOP=2;
var AS_LIST_RIGHT=3;
var AS_LIST_LEFT=4;

(function($){
	$.autosuggestHelper = {
		searchQueue: null,
		showList: function (objId,data) {
			var position=$("#"+objId).offset();
			var objTop=position.top;
			var objLeft=position.left;
			var objHeight=parseInt($("#"+objId).css("height").replace("px",""));
			var objWidth=parseInt($("#"+objId).css("width").replace("px",""));;
			var options=$('#'+objId).data('settings');

			var itemsReturned=data.results.length;
			$('[data-role=autosuggest-results]').remove();

			if (itemsReturned || options.noresults) {
				$(" <div />",{
					"id":"suggestions_"+objId,
					'data-role':'autosuggest-results'
				})
				.addClass("autosuggest")
				.html('<div class="as_header"><div class="as_bar"></div></div><ul id="as_ul"></ul><div class="as_footer"><div class="as_bar"></div></div>')
				.appendTo($( "body" ));

				$("#suggestions_"+objId).css('display','block');
				switch (options.listPosition) {
					case AS_LIST_BOTTOM:
						$("#suggestions_"+objId).css('top',(objTop+objHeight+12)+'px');
						$("#suggestions_"+objId).css('left', objLeft+'px');
						$("#suggestions_"+objId).css('width', objWidth+'px');
						break;
					case AS_LIST_RIGHT:
						$("#suggestions_"+objId).css('top',(objTop-objHeight)+'px');
						$("#suggestions_"+objId).css('left', (objLeft+objWidth)+'px');
						$("#suggestions_"+objId).css('width', '250px');
						break;
				}
			}
			if (itemsReturned>0) {
				options.lastKeyboardSelected=-1;
				$("#"+objId).keydown(function(e) {
					if (e.keyCode==38 || e.keyCode==40) {
						var opt=$('#'+objId).data('settings');
						var lastSelected=opt.lastKeyboardSelected;
						if (lastSelected!=-1)  {
							var liADesmarcar=$("#suggestions_"+objId+' li').get(lastSelected);
							$(liADesmarcar).removeClass('hovered');
						}
						if (e.keyCode==40) {
							lastSelected++;
							if (lastSelected==$("#suggestions_"+objId+' li').length)
								lastSelected=0;
						} else {
							lastSelected--;
							if (lastSelected<0)
								lastSelected=$("#suggestions_"+objId+' li').length-1;
						}
						var liAMarcar=$("#suggestions_"+objId+' li').get(lastSelected);
						$(liAMarcar).addClass('hovered');
						opt.lastKeyboardSelected=lastSelected;
						$('#'+objId).data('settings',opt);
						e.keyCode=0;
						e.preventDefault();
					}
				});
				for (var x in data.results) {
					if (x>options.maxresults) break;
					var item=data.results[x];
					var html='';
					if (options.renderItem) {
						html=options.renderItem(objId,item,x);
					} else {
						var val=item.value;
						var st = val.toLowerCase().indexOf( $("#"+objId).val().toLowerCase() );
						var output = val.substring(0,st) + "<em>" + val.substring(st, st+$("#"+objId).val().length) + "</em>" + val.substring(st+$("#"+objId).val().length);
						html='<a data-role="link" id="suggestion_'+objId+'_'+x+'" href="javascript:void(0);"><span class="tl"> </span><span class="tr"> </span><span>'+output;
						if (item.info) {
							html+='<br/><small>'+item.info+'</small>';
						}
						html+='</span></a>';
					}
					var itemLI=$(" <li /> ").html(html).appendTo("#as_ul");

					var insideLink=$(itemLI).find('[data-role=link]');
					if (insideLink) {
						var href=$(insideLink).attr('href');

						if (href) {
							$(insideLink).removeAttr('href');
							$(itemLI).css('cursor','pointer').attr("data-href",href).on('click',function(evt) {
								evt.stopPropagation();
								location.href=$(this).attr("data-href");
							});
						}
					} else {
						var receivedData=data;
						var receivedObjId=objId;
						$('#suggestion_'+objId+'_'+x).click(function() {
							var item=$(this).attr("id").replace("suggestion_"+objId+"_","");
							var value=receivedData.results[item].value;
							var decodedHtml=$('<textarea />').html(value).text();
							$("#"+objId).val(decodedHtml);
							if (options.callback != null)
							options.callback(receivedData.results[item],objId);
							$("#suggestions_"+objId).remove();
						});
					}
				}
			} else {
				if (options.noresults) {
					var html='<span class="tl"> </span><span class="tr"> </span><span>'+options.noresults+'</span></a>';
					$(" <li /> ").addClass("as_warning").html(html).appendTo("#as_ul");
				}
			}
			//
			if (options.useFadeEffect) {
				options.timeoutHandler=setTimeout('$.autosuggestHelper.fadeOut(\''+objId+'\')',options.timeout);
			}

		},

		fadeOut: function (objId) {
			return;
			$("#suggestions_"+objId).fadeOut(2000,function() {
				$.autosuggestHelper.closeSuggestion(objId);
			}).mouseleave(function(){
				var id=$(this).attr("id").replace("suggestions_","");
				var fieldOptions=$('#'+id).data('settings');
				fieldOptions.timeoutHandler=setTimeout('$.autosuggestHelper.fadeOut(\''+id+'\')',fieldOptions.timeout);
			}).mouseover(function(){
				var id=$(this).attr("id").replace("suggestions_","");
				var fieldOptions=$('#'+id).data('settings');
				if($(this).is(':animated')) {
					$(this).stop().animate({opacity:'100'});
				}
				clearTimeout(fieldOptions.timeoutHandler);
			});
		},

		closeSuggestion: function(objId) {
			return;
			var fieldOptions=$('#'+objId).data('settings');
			clearTimeout(fieldOptions.timeoutHandler);
			$("#suggestions_"+objId).remove();
		},

		doAjaxRequest: function(objId) {
			if ($('#'+objId).data('searching')) {
				$.autosuggestHelper.searchQueue=$('#'+objId).val();
				return;
			}
			var options=$('#'+objId).data('settings');
			if (!options.useAjax && options.script) {
				options.script(objId);
				$('#'+objId).data('searching',false)
				return;
			}
			var ajaxUrl=options.script;
			var postData={
				maxresults:options.maxresults
			}
			if (options.extraVarName!='') {
  				postData[options.extraVarName]=options.extraVarValue;
			}
			postData[options.varname]=$("#"+objId).val();
			$('#'+objId).data('searching',true)
			var asObject=this;
			$.ajax({
				url: ajaxUrl,
				cache: false,
				type:'post',
				data: postData,
				dataType: "json",
				success: function(data) {
					$.autosuggestHelper.showList(objId,data);
					$('#'+objId).data('searching',false);
					if ($.autosuggestHelper.searchQueue)
						$.autosuggestHelper.doAjaxRequest(objId);
				},
				error: function(data, textStatus, errorThrown) {
					toastr.error("Error: "+textStatus+", "+errorThrown);
					$('#'+objId).data('searching',false)
				}
			});
		}
	}
	$.fn.autosuggest = function(options) {
		var settings=$.extend({
			triggerOnFocus: false,
			hideOnBlur: true,
			extraVarName:'',
			extraVarValue:null,
			listPosition: AS_LIST_BOTTOM,
			timeoutHandler:null,
			timeout:6000,
			script:null,
			varname:'search',
			json:true,
			maxresults:10,
			minLengthToTrigger:3,
			disableEnterKey: false,
			noresults:'No se encontraron resultados',
			callback:null,
			renderItem:null,
			useFadeEffect:true,
			useAjax:true,
			searching:false
		},options);
		$(this).data('settings',settings);

		var me=$(this);
		var objId=$(this).attr("id");
		if (!objId) {
			objId=$.uniqId();
			$(this).attr("id",objId);
		}

		$(this).attr('autocomplete','off').keypress(function(e) {
			if (settings.disableEnterKey) {
				var code = (e.keyCode ? e.keyCode : e.which);
				if (code==13 && !e.shiftKey) {
					if ($("#suggestions_"+$(me).attr('id')+' li.hovered').length>0) {
						$("#suggestions_"+$(me).attr('id')+' li.hovered').click();
					}
					e.preventDefault();
					return false;
				}
			}
	    }).keyup(function(e) {
			if (settings.minLengthToTrigger!=0 && $(me).val().length<settings.minLengthToTrigger) return;
			if (e.keyCode!=38 && e.keyCode!=40)
				$.autosuggestHelper.doAjaxRequest($(me).attr('id'));
	    } );

		if (settings.triggerOnFocus) {
			$(this).focus(function() {
				$.autosuggestHelper.doAjaxRequest($(me).attr('id'));
			});
	    }
		$(document.body).bind('click',function(eventData){
			var clickSource=$(eventData.target).attr('data-search');
			if (!clickSource) {
				$("#suggestions_"+$(me).attr('id')).remove();
			}
		});
	}
})(jQuery);

/**
 * Autosuggest
 */

var LKS=[];
