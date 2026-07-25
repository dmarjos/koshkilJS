$.extend($.koshkilJS.plugins, {
    validators: {
        validateEmail:function(obj) {
            var email=$(obj).val();
    
            var RegExp=/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if(RegExp.test(email)){
                return true;
            }else{
                return false;
            }
        },
    
        validateUrl: function(obj) {
            var url=$(obj).val();
            var RegExp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    
            if(RegExp.test(url)){
                return true;
            }else{
                return false;
            }
        }, 
    
        validateDate: function(obj) {
            var dateToCheck=$(obj).val();
            var objDate,  // date object initialized from the dateToCheck string
                mSeconds, // dateToCheck in milliseconds
                day,      // day
                month,    // month
                year;     // year
            // date length should be 10 characters (no more no less)
            if (dateToCheck.length !== 10) {
                return false;
            }
            // third and sixth character should be '/'
            if (dateToCheck.substring(2, 3) !== '/' || dateToCheck.substring(5, 6) !== '/') {
                return false;
            }
            // extract month, day and year from the dateToCheck (expected format is mm/dd/yyyy)
            // subtraction will cast variables to integer implicitly (needed
            // for !== comparing)
            var dmY=dateToCheck.split("/");
            day = parseInt(dmY[0],10); // because months in JS start from 0
            month = parseInt(dmY[1],10) - 1;
            year = parseInt(dmY[2],10);
            // test year range
            if (year < 1000 || year > 3000) {
                return false;
            }
            // convert dateToCheck to milliseconds
            mSeconds = (new Date(year, month, day)).getTime();
            // initialize Date() object from calculated milliseconds
            objDate = new Date();
            objDate.setTime(mSeconds);
            // compare input date and parts from Date() object
            // if difference exists then date isn't valid
            if (objDate.getFullYear() !== year ||
                objDate.getMonth() !== month ||
                objDate.getDate() !== day) {
                return false;
            }
            // otherwise return true
            return true;
        }, 
    
        dateInRange: function (val, min, max) {
            var compareDate=val.split('/').reverse().join('-');
            var startDate=min.split('/').reverse().join('-');
            var endDate=max.split('/').reverse().join('-');

            return compareDate >= startDate && compareDate <= endDate;
        },
    }
})

