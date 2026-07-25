$.extend($.koshkilJS.plugins, {
    formatters: {
        number_unformat: function(number,decimals,thou_sep,dec_sep) {
            var ending=new RegExp((dec_sep=='.'?'\\':'')+dec_sep+"([0-9]{"+decimals+"})$");
            if (number.match(ending)) {
                var numberParts=number.split(dec_sep);
                var integerPart=numberParts[0].split(thou_sep).join('');
                return parseFloat(integerPart+'.'+numberParts[1],10);
            }
            return parseFloat(number,10);
        },
    
        
        number_format: function(number,decimals,thou_sep,dec_sep) {
            decimals=decimals || 2;
            thou_sep=thou_sep || '.';
            dec_sep=dec_sep || ',';
    
            var stringNumber=parseFloat(number,10).toFixed(decimals);
    
            var numberParts=stringNumber.split('.');
            var integerPart=numberParts[0];
            var formatedPart=[];
            var digits=0;
            while(integerPart!='') {
                var theDigit=integerPart.substr(-1);
                integerPart=integerPart.substr(0,integerPart.length-1);
                digits++;
                if (digits==3 && integerPart!='') {
                    theDigit=thou_sep+theDigit;
                    digits=0;
                }
                formatedPart.unshift(theDigit);
            }
            return formatedPart.join('')+dec_sep+numberParts[1];
        }, 
    
        dateFormatter: function (cell, formatterParams) {
            var fromFormat = formatterParams.sourceFormat || 'YYYY-MM-DD';
            var toFormat = formatterParams.destFormat || 'DD/MM/YYYY';
            return moment(cell.getValue()).format(toFormat); 
        },
        onOffSwitch: function (params) {
            var checked = (params.checked) ? ' checked="checked"' : '';
            var name = params.name;
            var id = params.id;

            var onOffSwitch = "<div class=\"switch\">"
            +"<div class=\"onoffswitch\">"
            +"<input data-"+params.attrName+"=\""+id+"\" data-flag=\""+name+"\" name=\""+name+"\" type=\"checkbox\""+checked+" class=\"onoffswitch-checkbox\" id=\""+name+"_"+id+"\">"
            +"<label class=\"onoffswitch-label\" for=\""+name+"_"+id+"\">"
            +"<span class=\"onoffswitch-inner\"></span>"
            +"<span class=\"onoffswitch-switch\"></span>"
            +"</label>"
            +"</div>"
            + "</div>";
        
        return $(onOffSwitch);
            
        }
    }
})

