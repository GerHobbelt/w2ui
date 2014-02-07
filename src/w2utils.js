var w2ui  = w2ui  || {};
var w2obj = w2obj || {}; // expose object to be able to overwrite default functions

/************************************************
*   Library: Web 2.0 UI for jQuery
*   - Following objects are defines
*   	- w2ui 				- object that will contain all widgets
*		- w2obj				- object with widget prototypes
*		- w2utils 			- basic utilities
*		- $().w2render		- common render
*		- $().w2destroy		- common destroy
*		- $().w2marker		- marker plugin
*		- $().w2tag			- tag plugin
*		- $().w2overlay		- overlay plugin
*		- $().w2menu		- menu plugin
*		- w2utils.event		- generic event object
*		- w2utils.keyboard	- object for keyboard navigation
*   - Dependencies: jQuery
*
* == NICE TO HAVE ==
*	- date has problems in FF new Date('yyyy-mm-dd') breaks
*	- bug: w2utils.formatDate('2011-31-01', 'yyyy-dd-mm'); - wrong foratter
*	- overlay should be displayed where more space (on top or on bottom)
* 	- write and article how to replace certain framework functions
*	- format date and time is buggy
*	- onComplete should pass widget as context (this)
*	- add maxHeight for the w2menu
*	- user localization from another lib (make it generic), https://github.com/jquery/globalize#readme
*	- hidden and disabled in menus
*
* == 1.4 changes
*	- lock(box, options) || lock(box, msg, spinner)
* 	- updated age() date(), formatDate(), formatTime() - input format either '2013/12/21 19:03:59 PST' or unix timestamp
*	- formatNumer(num, groupSymbol) - added new param
*	- improved localization support (currency prefix, suffix, numbger group symbol)
*	- improoved overlays (better positioning, refresh, etc.)
*	- multiple overlay at the same time (if it has name)
*	- overlay options.css removed, I have added options.style 
*
************************************************/

var w2utils = (function () {
	var tmp = {}; // for some temp variables
	var obj = {
		settings : {
			"locale"		: "en-us",
			"date_format"	: "m/d/yyyy",
			"date_display"	: "Mon d, yyyy",
			"time_format"	: "h12",
			"currencyPrefix": "$",
			"currencySuffix": "",
			"groupSymbol"	: ",",
			"shortmonths"	: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			"fullmonths"	: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			"shortdays"		: ["M", "T", "W", "T", "F", "S", "S"],
			"fulldays" 		: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			"RESTfull"		: false,
			"phrases"		: {} // empty object for english phrases
		},
		isInt			: isInt,
		isFloat			: isFloat,
		isMoney			: isMoney,
		isHex			: isHex,
		isAlphaNumeric	: isAlphaNumeric,
		isEmail			: isEmail,
		isDate			: isDate,
		isTime			: isTime,
		age 			: age,
		date 			: date,
		size 			: size,
		formatNumber	: formatNumber,
		formatDate		: formatDate,
		formatTime  	: formatTime,
		formatDateTime  : formatDateTime,
		stripTags		: stripTags,
		encodeTags		: encodeTags,
		escapeId		: escapeId,
		base64encode	: base64encode,
		base64decode	: base64decode,
		transition		: transition,
		lock			: lock,
		unlock			: unlock,
		lang 			: lang,
		locale	 		: locale,
		getSize			: getSize,
		scrollBarSize	: scrollBarSize
	}
	return obj;
	
	function isInt (val) {
		var re = /^[-+]?[0-9]+$/;
		return re.test(val);		
	}
		
	function isFloat (val) {
		return typeof val == 'number' || (typeof val == 'string' && val != '' && Number(val) + '' != 'NaN') ? true : false;
	}

	function isMoney (val) {
		var se = w2utils.settings;
		var re = new RegExp('^'+ (se.currencyPrefix ? '\\' + se.currencyPrefix + '?' : '') +'[-+]?[0-9]*[\.]?[0-9]+'+ (se.currencySuffix ? '\\' + se.currencySuffix + '?' : '') +'$', 'i');
		if (typeof val == 'string') {
			val = val.replace(new RegExp(se.groupSymbol, 'g'), '');
		}
		if (typeof val == 'object' || val == '') return false;
		return re.test(val);		
	}
		
	function isHex (val) {
		var re = /^[a-fA-F0-9]+$/;
		return re.test(val);		
	}
	
	function isAlphaNumeric (val) {
		var re = /^[a-zA-Z0-9_-]+$/;
		return re.test(val);		
	}
	
	function isEmail (val) {
		var email = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
		return email.test(val); 
	}

	function isDate (val, format, retDate) {
		if (!val) return false;
		if (!format) format = w2utils.settings.date_format;
		// convert month formats
		if (RegExp('mon', 'ig').test(format)) {
			format = format.replace(/month/ig, 'm').replace(/mon/ig, 'm').replace(/dd/ig, 'd').replace(/[, ]/ig, '/').replace(/\/\//g, '/').toLowerCase();
			val	= val.replace(/[, ]/ig, '/').replace(/\/\//g, '/').toLowerCase();
			for (var m in w2utils.settings.fullmonths) {
				var t = w2utils.settings.fullmonths[m];
				val = val.replace(RegExp(t, 'ig'), (parseInt(m) + 1)).replace(RegExp(t.substr(0, 3), 'ig'), (parseInt(m) + 1));
			}
		}
		// format date
		var tmp  = val.replace(/-/g, '/').replace(/\./g, '/').toLowerCase().split('/');
		var tmp2 = format.replace(/-/g, '/').replace(/\./g, '/').toLowerCase();
		var dt   = 'Invalid Date';
		var month, day, year;
		if (tmp2 == 'mm/dd/yyyy') { month = tmp[0]; day = tmp[1]; year = tmp[2]; }
		if (tmp2 == 'm/d/yyyy')   { month = tmp[0]; day = tmp[1]; year = tmp[2]; }
		if (tmp2 == 'dd/mm/yyyy') { month = tmp[1]; day = tmp[0]; year = tmp[2]; }
		if (tmp2 == 'd/m/yyyy')   { month = tmp[1]; day = tmp[0]; year = tmp[2]; }
		if (tmp2 == 'yyyy/dd/mm') { month = tmp[2]; day = tmp[1]; year = tmp[0]; } 
		if (tmp2 == 'yyyy/d/m')   { month = tmp[2]; day = tmp[1]; year = tmp[0]; } 
		if (tmp2 == 'yyyy/mm/dd') { month = tmp[1]; day = tmp[2]; year = tmp[0]; } 
		if (tmp2 == 'yyyy/m/d')   { month = tmp[1]; day = tmp[2]; year = tmp[0]; } 
		if (tmp2 == 'mm/dd/yy')   { month = tmp[0]; day = tmp[1]; year = tmp[2]; }
		if (tmp2 == 'm/d/yy')     { month = tmp[0]; day = tmp[1]; year = parseInt(tmp[2]) + 1900; }
		if (tmp2 == 'dd/mm/yy')   { month = tmp[1]; day = tmp[0]; year = parseInt(tmp[2]) + 1900; }
		if (tmp2 == 'd/m/yy')     { month = tmp[1]; day = tmp[0]; year = parseInt(tmp[2]) + 1900; }
		if (tmp2 == 'yy/dd/mm')   { month = tmp[2]; day = tmp[1]; year = parseInt(tmp[0]) + 1900; } 
		if (tmp2 == 'yy/d/m')     { month = tmp[2]; day = tmp[1]; year = parseInt(tmp[0]) + 1900; } 
		if (tmp2 == 'yy/mm/dd')   { month = tmp[1]; day = tmp[2]; year = parseInt(tmp[0]) + 1900; } 
		if (tmp2 == 'yy/m/d')     { month = tmp[1]; day = tmp[2]; year = parseInt(tmp[0]) + 1900; } 
		dt = new Date(month + '/' + day + '/' + year);
		// do checks
		if (typeof month == 'undefined') return false;
		if (dt == 'Invalid Date') return false;
		if ((dt.getMonth()+1 != month) || (dt.getDate() != day) || (dt.getFullYear() != year)) return false;
		if (retDate === true) return dt; else return true;
	}

	function isTime (val) {
		// Both formats 10:20pm and 22:20
		if (String(val) == 'undefined') return false;
		var max;
		// -- process american foramt
		val = val.toUpperCase();
		if (val.indexOf('PM') >= 0 || val.indexOf('AM') >= 0) max = 12; else max = 23;
		val = $.trim(val.replace('AM', ''));
		val = $.trim(val.replace('PM', ''));
		// ---
		var tmp = val.split(':');
		if (tmp.length != 2) { return false; }
		if (tmp[0] == '' || parseInt(tmp[0]) < 0 || parseInt(tmp[0]) > max || !this.isInt(tmp[0])) { return false; }
		if (tmp[1] == '' || parseInt(tmp[1]) < 0 || parseInt(tmp[1]) > 59 || !this.isInt(tmp[1])) { return false; }
		return true;
	}

	function age (dateStr) {
		if (dateStr == '' || typeof dateStr == 'undefined' || dateStr == null) return '';
		var d1 = new Date(dateStr);
		if (w2utils.isInt(dateStr)) d1 = new Date(Number(dateStr)); // for unix timestamps
		if (d1 == 'Invalid Date') return '';

		var d2  = new Date();
		var sec = (d2.getTime() - d1.getTime()) / 1000;
		var amount = '';
		var type   = '';
		
		if (sec < 60) {
			amount = Math.floor(sec);
			type   = 'sec';
			if (sec < 0) { amount = 0; type = 'sec' }
		} else if (sec < 60*60) {
			amount = Math.floor(sec/60);
			type   = 'min';
		} else if (sec < 24*60*60) {
			amount = Math.floor(sec/60/60);
			type   = 'hour';
		} else if (sec < 30*24*60*60) {
			amount = Math.floor(sec/24/60/60);
			type   = 'day';
		} else if (sec < 12*30*24*60*60) {
			amount = Math.floor(sec/30/24/60/60*10)/10;
			type   = 'month';
		} else if (sec >= 12*30*24*60*60) {
			amount = Math.floor(sec/12/30/24/60/60*10)/10;
			type   = 'year';
		}		
		return amount + ' ' + type + (amount > 1 ? 's' : '');
	}	
		
	function date (dateStr) {
		if (dateStr == '' || typeof dateStr == 'undefined' || dateStr == null) return '';
		var d1 = new Date(dateStr);
		if (w2utils.isInt(dateStr)) d1 = new Date(Number(dateStr)); // for unix timestamps
		if (d1 == 'Invalid Date') return '';

		var months = w2utils.settings.shortmonths;
		var d2   = new Date(); // today
		var d3   = new Date(); 
		d3.setTime(d3.getTime() - 86400000); // yesterday
		
		var dd1  = months[d1.getMonth()] + ' ' + d1.getDate() + ', ' + d1.getFullYear();
		var dd2  = months[d2.getMonth()] + ' ' + d2.getDate() + ', ' + d2.getFullYear();
		var dd3  = months[d3.getMonth()] + ' ' + d3.getDate() + ', ' + d3.getFullYear();
		
		var time = (d1.getHours() - (d1.getHours() > 12 ? 12 :0)) + ':' + (d1.getMinutes() < 10 ? '0' : '') + d1.getMinutes() + ' ' + (d1.getHours() >= 12 ? 'pm' : 'am');
		var time2= (d1.getHours() - (d1.getHours() > 12 ? 12 :0)) + ':' + (d1.getMinutes() < 10 ? '0' : '') + d1.getMinutes() + ':' + (d1.getSeconds() < 10 ? '0' : '') + d1.getSeconds() + ' ' + (d1.getHours() >= 12 ? 'pm' : 'am');
		var dsp = dd1;
		if (dd1 == dd2) dsp = time;
		if (dd1 == dd3) dsp = w2utils.lang('Yesterday');

		return '<span title="'+ dd1 +' ' + time2 +'">'+ dsp +'</span>';
	}

	function size (sizeStr) {
		if (!w2utils.isFloat(sizeStr) || sizeStr == '') return '';
		sizeStr = parseFloat(sizeStr);
		if (sizeStr == 0) return 0;
		var sizes = ['Bt', 'KB', 'MB', 'GB', 'TB'];
		var i = parseInt( Math.floor( Math.log(sizeStr) / Math.log(1024) ) );
		return (Math.floor(sizeStr / Math.pow(1024, i) * 10) / 10).toFixed(i == 0 ? 0 : 1) + ' ' + sizes[i];
	}

	function formatNumber (val, groupSymbol) {
		var ret = '';
		if (typeof groupSymbol == 'undefined') groupSymbol = w2utils.settings.groupSymbol || ',';
		// check if this is a number
		if (w2utils.isFloat(val) || w2utils.isInt(val) || w2utils.isMoney(val)) {
			tmp = String(val).split('.');
			ret = String(tmp[0]).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1"+ groupSymbol);
			if (typeof tmp[1] != 'undefined') ret += '.' + tmp[1];
		}
		return ret;
	}
	
	function formatDate (dateStr, format) { // IMPORTANT dateStr HAS TO BE valid JavaScript Date String
		var months = w2utils.settings.shortmonths;
		var fullMonths = w2utils.settings.fullmonths;
		if (typeof format == 'undefined') format = this.settings.date_format;
		if (typeof dateStr == 'undefined' || dateStr == '' || dateStr == null) return '';

		var dt = new Date(dateStr);
		if (w2utils.isInt(dateStr)) dt = new Date(Number(dateStr)); // for unix timestamps
		if (dt == 'Invalid Date') return '';

		var year 	= dt.getFullYear();
		var month 	= dt.getMonth();
		var date 	= dt.getDate();
		return format.toLowerCase()
			.replace('month', w2utils.settings.fullmonths[month])
			.replace('mon', w2utils.settings.shortmonths[month])
			.replace(/yyyy/g, year)
			.replace(/yyy/g, year)
			.replace(/yy/g, year > 2000 ? 100 + parseInt(String(year).substr(2)) : String(year).substr(2))
			.replace(/(^|[^a-z$])y/g, '$1'+year) 			// only y's that are not preceeded by a letter
			.replace(/mm/g, (month + 1 < 10 ? '0' : '') + (month + 1))
			.replace(/dd/g, (date < 10 ? '0' : '') + date)
			.replace(/(^|[^a-z$])m/g, '$1'+ (month + 1)) 	// only y's that are not preceeded by a letter
			.replace(/(^|[^a-z$])d/g, '$1' + date); 		// only y's that are not preceeded by a letter
	}

	function formatTime (dateStr, format) { // IMPORTANT dateStr HAS TO BE valid JavaScript Date String
		var months = w2utils.settings.shortmonths;
		var fullMonths = w2utils.settings.fullmonths;
		if (typeof format == 'undefined') format = (this.settings.time_format == 'h12' ? 'hh:mi pm' : 'h24:mi');
		if (typeof dateStr == 'undefined' || dateStr == '' || dateStr == null) return '';

		var dt = new Date(dateStr);
		if (w2utils.isInt(dateStr)) dt = new Date(Number(dateStr)); // for unix timestamps
		if (dt == 'Invalid Date') return '';

		var type = 'am';
		var hour = dt.getHours();
		var h24  = dt.getHours();
		var min  = dt.getMinutes();
		var sec  = dt.getSeconds();
		if (min < 10) min = '0' + min;
		if (sec < 10) sec = '0' + sec;
		if (format.indexOf('am') != -1 || format.indexOf('pm') != -1) {
			if (hour >= 12) type = 'pm'; 
			if (hour > 12)  hour = hour - 12;
		}
		return format.toLowerCase()
			.replace('am', type)
			.replace('pm', type)
			.replace('hh', hour)
			.replace('h24', h24)
			.replace('mm', min)
			.replace('mi', min)
			.replace('ss', sec)
			.replace(/(^|[^a-z$])h/g, '$1' + hour) 	// only y's that are not preceeded by a letter
			.replace(/(^|[^a-z$])m/g, '$1' + min) 	// only y's that are not preceeded by a letter
			.replace(/(^|[^a-z$])s/g, '$1' + sec); 	// only y's that are not preceeded by a letter
	}

	function formatDateTime(dateStr, format) {
		var fmt;
		if (typeof format != 'string') {
			fmt = [this.settings.date_format, this.settings.time_format];
		} else {
			fmt = format.split('|');
		}
		return this.formatDate(dateStr, fmt[0]) + ' ' + this.formatTime(dateStr, fmt[1]);
	}

	function stripTags (html) {
		if (html == null) return html;
		switch (typeof html) {
			case 'number':
				break;
			case 'string':
				html = $.trim(String(html).replace(/(<([^>]+)>)/ig, ""));
				break;
			case 'object':
				for (var a in html) html[a] = this.stripTags(html[a]);
				break;
		}
		return html;
	}

	function encodeTags (html) {
		if (html == null) return html;
		switch (typeof html) {
			case 'number':
				break;
			case 'string':
				html = String(html).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
				break;
			case 'object':
				for (var a in html) html[a] = this.encodeTags(html[a]);
				break;
		}
		return html;
	}

	function escapeId (id) {
		if (typeof id == 'undefined' || id == '' || id == null) return '';
		return String(id).replace(/([;&,\.\+\*\~'`:"\!\^#$%@\[\]\(\)=<>\|\/? {}\\])/g, '\\$1');
	}

	function base64encode (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
		var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		input = utf8_encode(input);

		while (i < input.length) {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
			output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
		}

		function utf8_encode (string) {
			var string = String(string).replace(/\r\n/g,"\n");
			var utftext = "";

			for (var n = 0; n < string.length; n++) {
				var c = string.charCodeAt(n);
				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}
			}
			return utftext;
		}

		return output;
	}

	function base64decode (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
		var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		while (i < input.length) {
			enc1 = keyStr.indexOf(input.charAt(i++));
			enc2 = keyStr.indexOf(input.charAt(i++));
			enc3 = keyStr.indexOf(input.charAt(i++));
			enc4 = keyStr.indexOf(input.charAt(i++));
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
			output = output + String.fromCharCode(chr1);
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
		}
		output = utf8_decode(output);

		function utf8_decode (utftext) {
			var string = "";
			var i = 0;
			var c = 0, c1 = 0, c2 = 0;

			while ( i < utftext.length ) {
				c = utftext.charCodeAt(i);
				if (c < 128) {
					string += String.fromCharCode(c);
					i++;
				}
				else if((c > 191) && (c < 224)) {
					c2 = utftext.charCodeAt(i+1);
					string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
					i += 2;
				}
				else {
					c2 = utftext.charCodeAt(i+1);
					c3 = utftext.charCodeAt(i+2);
					string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
					i += 3;
				}
			}

			return string;
		}

		return output;
	}
	
	function transition (div_old, div_new, type, callBack) {
		var width  = $(div_old).width();
		var height = $(div_old).height();
		var time   = 0.5;
				
		if (!div_old || !div_new) {
			console.log('ERROR: Cannot do transition when one of the divs is null');
			return;
		}
		 
		div_old.parentNode.style.cssText += cross('perspective', '700px') +'; overflow: hidden;';
		div_old.style.cssText += '; position: absolute; z-index: 1019; '+ cross('backface-visibility', 'hidden');
		div_new.style.cssText += '; position: absolute; z-index: 1020; '+ cross('backface-visibility', 'hidden');
		
		switch (type) {
			case 'slide-left':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d('+ width + 'px, 0, 0)', 'translate('+ width +'px, 0)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +';'+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
					div_old.style.cssText += cross('transition', time+'s') +';'+ cross('transform', 'translate3d(-'+ width +'px, 0, 0)', 'translate(-'+ width +'px, 0)');
				}, 1);
				break;

			case 'slide-right':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(-'+ width +'px, 0, 0)', 'translate(-'+ width +'px, 0)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'translate3d(0px, 0, 0)', 'translate(0px, 0)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'translate3d('+ width +'px, 0, 0)', 'translate('+ width +'px, 0)');
				}, 1);
				break;

			case 'slide-down':
				// init divs
				div_old.style.cssText += 'overflow: hidden; z-index: 1; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				div_new.style.cssText += 'overflow: hidden; z-index: 0; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'translate3d(0, '+ height +'px, 0)', 'translate(0, '+ height +'px)');
				}, 1);
				break;

			case 'slide-up':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, '+ height +'px, 0)', 'translate(0, '+ height +'px)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				}, 1);
				break;

			case 'flip-left':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('-transform', 'rotateY(0deg)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateY(-180deg)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateY(0deg)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateY(180deg)');
				}, 1);
				break;

			case 'flip-right':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateY(0deg)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateY(180deg)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateY(0deg)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateY(-180deg)');
				}, 1);
				break;

			case 'flip-down':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateX(0deg)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateX(180deg)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateX(0deg)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateX(-180deg)');
				}, 1);
				break;

			case 'flip-up':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateX(0deg)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'rotateX(-180deg)');
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateX(0deg)');
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'rotateX(180deg)');
				}, 1);
				break;

			case 'pop-in':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)') + '; '+ cross('transform', 'scale(.8)') + '; opacity: 0;';
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'scale(1)') +'; opacity: 1;';
					div_old.style.cssText += cross('transition', time+'s') +';';
				}, 1);
				break;

			case 'pop-out':
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)') +'; '+ cross('transform', 'scale(1)') +'; opacity: 1;';
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)') +'; opacity: 0;';
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time+'s') +'; opacity: 1;';
					div_old.style.cssText += cross('transition', time+'s') +'; '+ cross('transform', 'scale(1.7)') +'; opacity: 0;';
				}, 1);
				break;

			default:
				// init divs
				div_old.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)');
				div_new.style.cssText += 'overflow: hidden; '+ cross('transform', 'translate3d(0, 0, 0)', 'translate(0, 0)') +'; opacity: 0;';
				$(div_new).show();
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += cross('transition', time +'s') +'; opacity: 1;';
					div_old.style.cssText += cross('transition', time +'s');
				}, 1);
				break;
		}
		
		setTimeout(function () {
			if (type == 'slide-down') {
				$(div_old).css('z-index', '1019');
				$(div_new).css('z-index', '1020');
			}
			if (div_new) {
				$(div_new).css({ 
					'opacity': '1', 
					'-webkit-transition': '', 
					'-moz-transition': '', 
					'-ms-transition': '', 
					'-o-transition': '', 
					'-webkit-transform': '', 
					'-moz-transform': '', 
					'-ms-transform': '', 
					'-o-transform': '', 
					'-webkit-backface-visibility': '', 
					'-moz-backface-visibility': '', 
					'-ms-backface-visibility': '', 
					'-o-backface-visibility': '' 
				});
			}
			if (div_old) {
				$(div_old).css({ 
					'opacity': '1', 
					'-webkit-transition': '', 
					'-moz-transition': '', 
					'-ms-transition': '', 
					'-o-transition': '', 
					'-webkit-transform': '', 
					'-moz-transform': '', 
					'-ms-transform': '', 
					'-o-transform': '', 
					'-webkit-backface-visibility': '', 
					'-moz-backface-visibility': '', 
					'-ms-backface-visibility': '', 
					'-o-backface-visibility': '' 
				});
				if (div_old.parentNode) $(div_old.parentNode).css({
					'-webkit-perspective': '',
					'-moz-perspective': '',
					'-ms-perspective': '',
					'-o-perspective': ''
				});
			}
			if (typeof callBack == 'function') callBack();
		}, time * 1000);
		
		function cross(property, value, none_webkit_value) {
			var isWebkit=!!window.webkitURL; // jQuery no longer supports $.browser - RR
			if (!isWebkit && typeof none_webkit_value != 'undefined') value = none_webkit_value;
			return ';'+ property +': '+ value +'; -webkit-'+ property +': '+ value +'; -moz-'+ property +': '+ value +'; '+
				   '-ms-'+ property +': '+ value +'; -o-'+ property +': '+ value +';';
		}
	}
	
	function lock (box, msg, spinner) {
		var options = {};
		if (typeof msg == 'object') {
			options = msg; 
		} else {
			options.msg 	= msg;
			options.spinner = spinner;
		}
		if (!options.msg && options.msg != 0) options.msg = '';
		w2utils.unlock(box);
		$(box).find('>:first-child').before(
			'<div class="w2ui-lock"></div>'+
			'<div class="w2ui-lock-msg"></div>'
		);
		var lock = $(box).find('.w2ui-lock');
		var mess = $(box).find('.w2ui-lock-msg');
		if (!options.msg) mess.css({ 'background-color': 'transparent', 'border': '0px' }); 
		if (options.spinner === true) options.msg = '<div class="w2ui-spinner" '+ (!options.msg ? 'style="width: 35px; height: 35px"' : '') +'></div>' + options.msg;
		if (typeof options.opacity != 'undefined') lock.css('opacity', options.opacity);
		lock.fadeIn(200);
		mess.html(options.msg).fadeIn(200);
		// hide all tags (do not hide overlays as the form can be in overlay)
		$().w2tag();
	}

	function unlock (box) { 
		$(box).find('.w2ui-lock').remove();
		$(box).find('.w2ui-lock-msg').remove();
	}

	function getSize (el, type) {
		var bwidth = {
			left: 	parseInt($(el).css('border-left-width')) || 0,
			right:  parseInt($(el).css('border-right-width')) || 0,
			top:  	parseInt($(el).css('border-top-width')) || 0,
			bottom: parseInt($(el).css('border-bottom-width')) || 0
		};
		var mwidth = {
			left: 	parseInt($(el).css('margin-left')) || 0,
			right:  parseInt($(el).css('margin-right')) || 0,
			top:  	parseInt($(el).css('margin-top')) || 0,
			bottom: parseInt($(el).css('margin-bottom')) || 0
		};
		var pwidth = {
			left: 	parseInt($(el).css('padding-left')) || 0,
			right:  parseInt($(el).css('padding-right')) || 0,
			top:  	parseInt($(el).css('padding-top')) || 0,
			bottom: parseInt($(el).css('padding-bottom')) || 0
		};
		switch (type) {
			case 'top': 	return bwidth.top + mwidth.top + pwidth.top; 
			case 'bottom': 	return bwidth.bottom + mwidth.bottom + pwidth.bottom; 
			case 'left': 	return bwidth.left + mwidth.left + pwidth.left; 
			case 'right': 	return bwidth.right + mwidth.right + pwidth.right; 
			case 'width': 	return bwidth.left + bwidth.right + mwidth.left + mwidth.right + pwidth.left + pwidth.right + parseInt($(el).width()); 
			case 'height': 	return bwidth.top + bwidth.bottom + mwidth.top + mwidth.bottom + pwidth.top + pwidth.bottom + parseInt($(el).height());
			case '+width': 	return bwidth.left + bwidth.right + mwidth.left + mwidth.right + pwidth.left + pwidth.right; 
			case '+height': return bwidth.top + bwidth.bottom + mwidth.top + mwidth.bottom + pwidth.top + pwidth.bottom;
		}
		return 0;
	}

	function lang (phrase) {
		var translation = this.settings.phrases[phrase];
		if (typeof translation == 'undefined') return phrase; else return translation;
	}

	function locale (locale) {
		if (!locale) locale = 'en-us';
		if (locale.length == 5) locale = 'locale/'+ locale +'.json';
		// load from the file
		$.ajax({
			url		: locale,
			type	: "GET",
			dataType: "JSON",
			async	: false,
			cache 	: false,
			success : function (data, status, xhr) {
				w2utils.settings = $.extend(true, w2utils.settings, data);
				// apply translation to some prototype functions
				var p = w2obj.grid.prototype;
				for (var b in p.buttons) {
					p.buttons[b].caption = w2utils.lang(p.buttons[b].caption);
					p.buttons[b].hint 	 = w2utils.lang(p.buttons[b].hint);
				}
				p.msgDelete		= w2utils.lang(p.msgDelete);
				p.msgNotJSON	= w2utils.lang(p.msgNotJSON);
				p.msgRefresh	= w2utils.lang(p.msgRefresh);
			},
			error	: function (xhr, status, msg) {
				console.log('ERROR: Cannot load locale '+ locale);
			}
		});
	}

	function scrollBarSize () {
		if (tmp.scrollBarSize) return tmp.scrollBarSize; 
		var html = '<div id="_scrollbar_width" style="position: absolute; top: -300px; width: 100px; height: 100px; overflow-y: scroll;">'+
				   '	<div style="height: 120px">1</div>'+
				   '</div>';
		$('body').append(html);
		tmp.scrollBarSize = 100 - $('#_scrollbar_width > div').width();
		$('#_scrollbar_width').remove();
		if (String(navigator.userAgent).indexOf('MSIE') >= 0) tmp.scrollBarSize  = tmp.scrollBarSize / 2; // need this for IE9+
		return tmp.scrollBarSize;
	}

})();

/***********************************************************
*  Generic Event Object
*  --- This object is reused across all other 
*  --- widgets in w2ui.
*
*********************************************************/

w2utils.event = {

	on: function (eventData, handler) {
		if (!$.isPlainObject(eventData)) eventData = { type: eventData };
		eventData = $.extend({ type: null, execute: 'before', target: null, onComplete: null }, eventData);
		
		if (typeof eventData.type == 'undefined') { console.log('ERROR: You must specify event type when calling .on() method of '+ this.name); return; }
		if (typeof handler == 'undefined') { console.log('ERROR: You must specify event handler function when calling .on() method of '+ this.name); return; }
		this.handlers.push({ event: eventData, handler: handler });
	},
	
	off: function (eventData, handler) {
		if (!$.isPlainObject(eventData)) eventData = { type: eventData };
		eventData = $.extend({}, { type: null, execute: 'before', target: null, onComplete: null }, eventData);
	
		if (typeof eventData.type == 'undefined') { console.log('ERROR: You must specify event type when calling .off() method of '+ this.name); return; }
		if (typeof handler == 'undefined') { handler = null;  }
		// remove handlers
		var newHandlers = [];
		for (var h in this.handlers) {
			var t = this.handlers[h];
			if ( (t.event.type == eventData.type || eventData.type == '*')
				&& (t.event.target == eventData.target || eventData.target == null) 
				&& (t.handler == handler || handler == null)) {
				// match
			} else {
				newHandlers.push(t);
			}
		}		
		this.handlers = newHandlers;
	},
		
	trigger: function (eventData) {
		var eventData = $.extend({ type: null, phase: 'before', target: null, isStopped: false, isCancelled: false }, eventData, {
				preventDefault 	: function () { this.isCancelled = true; },
				stopPropagation : function () { this.isStopped   = true; }
			});
		if (typeof eventData.target == 'undefined') eventData.target = null;		
		// process events in REVERSE order 
		for (var h = this.handlers.length-1; h >= 0; h--) {
			var item = this.handlers[h];
			if ( (item.event.type == eventData.type || item.event.type == '*') 
					&& (item.event.target == eventData.target || item.event.target == null)
					&& (item.event.execute == eventData.phase || item.event.execute == '*' || item.event.phase == '*') ) {
				eventData = $.extend({}, item.event, eventData);
				// check handler arguments
				var args = [];
				var tmp  = RegExp(/\((.*?)\)/).exec(item.handler);
				if (tmp) args = tmp[1].split(/\s*,\s*/);
				if (args.length == 2) {
					item.handler.call(this, eventData.target, eventData); // old way for back compatibility
				} else {
					item.handler.call(this, eventData); // new way
				}
				if (eventData.isStopped === true || eventData.stop === true) return eventData; // back compatibility eventData.stop === true
			}
		}		
		// main object events
		var funName = 'on' + eventData.type.substr(0,1).toUpperCase() + eventData.type.substr(1);
		if (eventData.phase == 'before' && typeof this[funName] == 'function') {
			var fun = this[funName];
			// check handler arguments
			var args = [];
			var tmp  = RegExp(/\((.*?)\)/).exec(fun);
			if (tmp) args = tmp[1].split(/\s*,\s*/);
			if (args.length == 2) {
				fun.call(this, eventData.target, eventData); // old way for back compatibility
			} else {
				fun.call(this, eventData); // new way
			}
			if (eventData.isStopped === true || eventData.stop === true) return eventData; // back compatibility eventData.stop === true
		}
		// item object events
		if (typeof eventData.object != 'undefined' && eventData.object != null && eventData.phase == 'before'
				&& typeof eventData.object[funName] == 'function') {
			var fun = eventData.object[funName];
			// check handler arguments
			var args = [];
			var tmp  = RegExp(/\((.*?)\)/).exec(fun);
			if (tmp) args = tmp[1].split(/\s*,\s*/);
			if (args.length == 2) {
				fun.call(this, eventData.target, eventData); // old way for back compatibility
			} else {
				fun.call(this, eventData); // new way
			}
			if (eventData.isStopped === true || eventData.stop === true) return eventData; 
		}
		// execute onComplete
		if (eventData.phase == 'after' && eventData.onComplete != null)	eventData.onComplete.call(this, eventData);
	
		return eventData;
	}
};

/***********************************************************
*  Common Keyboard Handler. Supported in
*  - grid
*  - sidebar
*  - popup
*
*********************************************************/

w2utils.keyboard = (function (obj) {
	// private scope
	var w2ui_name = null;

	obj.active	 	= active;
	obj.clear 		= clear;
	obj.register	= register;

	init();
	return obj;

	function init() {
		$(document).on('keydown', keydown);
		$(document).on('mousedown', mousedown);
	}

	function keydown (event) {
		var tag = event.target.tagName;
		if ($.inArray(tag, ['INPUT', 'SELECT', 'TEXTAREA']) != -1) return;
		if ($(event.target).prop('contenteditable') == 'true') return;
		if (!w2ui_name) return;
		// pass to appropriate widget
		if (w2ui[w2ui_name] && typeof w2ui[w2ui_name].keydown == 'function') {
			w2ui[w2ui_name].keydown.call(w2ui[w2ui_name], event);
		}
	}

	function mousedown (event) {
		var tag = event.target.tagName;
		var obj = $(event.target).parents('.w2ui-reset');
		if (obj.length > 0) {
			w2ui_name = obj.attr('name');
		}
	}

	function active (new_w2ui_name) {
		if (typeof new_w2ui_name == 'undefined') return w2ui_name;
		w2ui_name = new_w2ui_name;
	}

	function clear () {
		w2ui_name = null;
	}

	function register () {
	}

})({});

/***********************************************************
*  Commonly used plugins
*  --- used primarily in grid and form
*
*********************************************************/

(function () {

	$.fn.w2render = function (name) {
		if ($(this).length > 0) {
			if (typeof name == 'string' && w2ui[name]) w2ui[name].render($(this)[0]);
			if (typeof name == 'object') name.render($(this)[0]);
		}
	};

	$.fn.w2destroy = function (name) {
		if (!name && this.length > 0) name = this.attr('name');
		if (typeof name == 'string' && w2ui[name]) w2ui[name].destroy();
		if (typeof name == 'object') name.destroy();
	};

    $.fn.w2checkNameParam = function (params, component) {
		if (!params || typeof params.name == 'undefined') {
			console.log('ERROR: The parameter "name" is required but not supplied in $().'+ component +'().');
			return false;
		}
		if (typeof w2ui[params.name] != 'undefined') {
			console.log('ERROR: The parameter "name" is not unique. There are other objects already created with the same name (obj: '+ params.name +').');
			return false;
		}
		if (!w2utils.isAlphaNumeric(params.name)) {
			console.log('ERROR: The parameter "name" has to be alpha-numeric (a-z, 0-9, dash and underscore). ');
			return false;
		}
		return true;
	};

	$.fn.w2marker = function (str) {
		if (str == '' || typeof str == 'undefined') { // remove marker
			return $(this).each(function (index, el) {			
				el.innerHTML = el.innerHTML.replace(/\<span class=\"w2ui\-marker\"\>(.*)\<\/span\>/ig, '$1'); // unmark		
			});
		} else { // add marker
			return $(this).each(function (index, el) {
				if (typeof str == 'string') str = [str];
				el.innerHTML = el.innerHTML.replace(/\<span class=\"w2ui\-marker\"\>(.*)\<\/span\>/ig, '$1'); // unmark		
				for (var s in str) {
					var tmp = str[s];
					if (typeof tmp != 'string') tmp = String(tmp);
					// escape regex special chars
					tmp = tmp.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&").replace(/&/g, '&amp;').replace(/</g, '&gt;').replace(/>/g, '&lt;');
					var regex = new RegExp(tmp + '(?!([^<]+)?>)', "gi"); // only outside tags
					el.innerHTML = el.innerHTML.replace(regex, function (matched) { // mark new
						return '<span class="w2ui-marker">' + matched + '</span>';
					});
				}
			});
		}
	};

	// -- w2tag - appears on the right side from element, there can be multiple on screen at a time

	$.fn.w2tag = function (text, options) {
		if (!$.isPlainObject(options)) options = {};
		if (!$.isPlainObject(options.css)) options.css = {};
		if (typeof options['class'] == 'undefined') options['class'] = '';
		// remove all tags
		if ($(this).length == 0) {
			$('.w2ui-tag').each(function (index, elem) {
				var opt = $(elem).data('options');
				if (typeof opt == 'undefined') opt = {};
				$($(elem).data('taged-el')).removeClass( opt['class'] );
				clearInterval($(elem).data('timer'));
				$(elem).remove();
			});
			return;
		}
		return $(this).each(function (index, el) {
			// show or hide tag
			var tagOrigID = el.id;
			var tagID = w2utils.escapeId(el.id);
			if (text == '' || text == null || typeof text == 'undefined') {
				$('#w2ui-tag-'+tagID).css('opacity', 0);
				setTimeout(function () {
					// remmove element
					clearInterval($('#w2ui-tag-'+tagID).data('timer'));
					$('#w2ui-tag-'+tagID).remove();
				}, 300);
			} else {
				// remove elements
				clearInterval($('#w2ui-tag-'+tagID).data('timer'));
				$('#w2ui-tag-'+tagID).remove();
				// insert
				$('body').append('<div id="w2ui-tag-'+ tagOrigID +'" class="w2ui-tag '+ ($(el).parents('.w2ui-popup').length > 0 ? 'w2ui-tag-popup' : '') +'" '+
								 '	style=""></div>');	

				var timer = setInterval(function () { 
					// monitor if destroyed
					if ($(el).length == 0 || ($(el).offset().left == 0 && $(el).offset().top == 0)) {
						clearInterval($('#w2ui-tag-'+tagID).data('timer'));
						tmp_hide(); 
						return;
					}
					// monitor if moved
					if ($('#w2ui-tag-'+tagID).data('position') != ($(el).offset().left + el.offsetWidth) + 'x' + $(el).offset().top) {
						$('#w2ui-tag-'+tagID).css({
							'-webkit-transition': '.2s',
							'-moz-transition': '.2s',
							'-ms-transition': '.2s',
							'-o-transition': '.2s',
							left: ($(el).offset().left + el.offsetWidth) + 'px',
							top: $(el).offset().top + 'px'
						}).data('position', ($(el).offset().left + el.offsetWidth) + 'x' + $(el).offset().top);
					}
				}, 100);
				setTimeout(function () {
					if (!$(el).offset()) return;
					$('#w2ui-tag-'+tagID).css({
						opacity: '1',
						left: ($(el).offset().left + el.offsetWidth) + 'px',
						top: $(el).offset().top + 'px'
					}).html('<div style="margin-top: -2px 0px 0px -2px; white-space: nowrap;"> <div class="w2ui-tag-body">'+ text +'</div> </div>')
					.data('text', text)
					.data('taged-el', el)
					.data('options', options)
					.data('position', ($(el).offset().left + el.offsetWidth) + 'x' + $(el).offset().top)
					.data('timer', timer);
					$(el).off('keypress', tmp_hide).on('keypress', tmp_hide).off('change', tmp_hide).on('change', tmp_hide)
						.css(options.css).addClass(options['class']);
					if (typeof options.onShow == 'function') options.onShow();
				}, 1);
				var originalCSS = '';
				if ($(el).length > 0) originalCSS = $(el)[0].style.cssText;
				// bind event to hide it
				function tmp_hide() { 
					if ($('#w2ui-tag-'+tagID).length <= 0) return;
					clearInterval($('#w2ui-tag-'+tagID).data('timer'));
					$('#w2ui-tag-'+tagID).remove(); 
					$(el).off('keypress', tmp_hide).removeClass(options['class']); 
					if ($(el).length > 0) $(el)[0].style.cssText = originalCSS;
					if (typeof options.onHide == 'function') options.onHide();
				}
			}
		});
	};
	
	// w2overlay - appears under the element, there can be only one at a time

	$.fn.w2overlay = function (html, options) {
		var obj  = this;
		var name = '';
		var defaults = {
			name		: null,		// it not null, then allows multiple concurent overlays
			align		: 'none',	// can be none, left, right, both
			left 		: 0,		// offset left
			top 		: 0,		// offset top
			tipLeft		: 30,		// tip offset left
			width		: 0,		// fixed width
			height		: 0,		// fixed height
			maxWidth	: null,		// max width if any
			maxHeight	: null,		// max height if any
			style		: '',		// additional style for main div
			'class'		: '',		// additional class name for main dvi
			onShow		: null, 	// event on show
			onHide		: null		// event on hide
		}
		if (!$.isPlainObject(options)) options = {};
		options = $.extend(true, {}, defaults, options);
		if (options.name) name = '-' + options.name;
		// if empty then hide
		if (this.length == 0 || html == '' || typeof html == 'undefined') { 
			$(document).off('click', $('#w2ui-overlay'+ name).data('hide'));
			$('#w2ui-overlay'+ name).remove();
			return $(this); 
		}
		if ($('#w2ui-overlay'+ name).length > 0) {
			$(document).off('click', $('#w2ui-overlay'+ name).data('hide'));
			$('#w2ui-overlay'+ name).remove();
		}
		$('body').append(
			'<div id="w2ui-overlay'+ name +'" style="display: none"'+
			'		class="w2ui-reset w2ui-overlay '+ ($(this).parents('.w2ui-popup').length > 0 ? 'w2ui-overlay-popup' : '') +'">'+
			'	<style></style>'+
			'	<div style="'+ options.style +'" class="'+ options['class'] +'"></div>'+
			'</div>'
		);
		// init
		var div1 = $('#w2ui-overlay'+ name);
		var div2 = div1.find(' > div');
		div2.html(html);
		// pick bg color of first div
		var bc  = div2.css('background-color'); 
		if (typeof bc != 'undefined' &&	bc != 'rgba(0, 0, 0, 0)' && bc != 'transparent') div1.css('background-color', bc);

		div1.data('obj', obj)
			.data('hide', hide)
			.data('fixSize', fixSize)
			.fadeIn('fast').on('mousedown', function (event) { 
				$('#w2ui-overlay'+ name).data('keepOpen', true); 
				if (['INPUT', 'TEXTAREA', 'SELECT'].indexOf(event.target.tagName) === -1) event.preventDefault(); 
			});

		// need time to display
		fixSize();
		setTimeout(function () {
			fixSize();
			$(document).off('click', hide).on('click', hide);
			if (typeof options.onShow == 'function') options.onShow();
		}, 10);
		return $(this);

		// click anywhere else hides the drop down
		function hide () {
			var div1 = $('#w2ui-overlay'+ name);
			if (div1.data('keepOpen') === true) {
				div1.removeData('keepOpen');
				return;
			}
			var result;
			if (typeof options.onHide == 'function') result = options.onHide();
			if (result === false) return;
			div1.remove();
			$(document).off('click', hide);
			clearInterval(div1.data('timer'));
		}

		function fixSize () {
			var div1 = $('#w2ui-overlay'+ name);
			var div2 = div1.find(' > div');
			// if goes over the screen, limit height and width
			if (div1.length > 0) {
				div2.height('auto').width('auto');
				// width/height
				var overflowX = false;
				var overflowY = false;
				var h = div2.height();
				var w = div2.width();
				if (options.width && options.width < w) w = options.width;
				if (w < 30) w = 30;
				// alignment
				switch(options.align) {
					case 'both':
						options.left = 17;
						options.width = w2utils.getSize($(obj), 'width');
						break;
					case 'left':
						options.left = 17;
						break;
					case 'right':
						options.tipLeft = w - 45;
						options.left = w2utils.getSize($(obj), 'width') - w + 10;
						break;
				}
				// adjust position
				var tmp = (w - 17) / 2;
				var boxLeft  = options.left;
				var boxWidth = options.width;
				var tipLeft  = options.tipLeft;
				if (w == 30) boxWidth = 30; else boxWidth = (options.width ? options.width : 'auto');
				if (tmp < 25) {
					boxLeft = 25 - tmp;
					tipLeft = Math.floor(tmp);
				}
				// Y coord
				div1.css({
					top			: (obj.offset().top + w2utils.getSize(obj, 'height') + options.top + 7) + 'px',
					left		: ((obj.offset().left > 25 ? obj.offset().left : 25) + boxLeft) + 'px',
					'min-width' : boxWidth,
					'min-height': (options.height ? options.height : 'auto')
				});
				// $(window).height() - has a problem in FF20
				var maxHeight = window.innerHeight + $(document).scrollTop() - div2.offset().top - 7;
				var maxWidth  = window.innerWidth + $(document).scrollLeft() - div2.offset().left - 7;
				if (maxHeight > -30 && maxHeight < 210) {
					// show on top
					maxHeight = div2.offset().top - $(document).scrollTop() - 7;
					if (options.maxHeight && maxHeight > options.maxHeight) maxHeight = options.maxHeight;
					if (h > maxHeight) { 
						overflowY = true;
						div2.height(maxHeight).width(w).css({ 'overflow-y': 'auto' });
						h = maxHeight;
					}
					div1.css('top', ($(obj).offset().top - h - 24 + options.top) + 'px');
					div1.find('>style').html(
						'#w2ui-overlay'+ name +':before { display: none; margin-left: '+ parseInt(tipLeft) +'px; }'+
						'#w2ui-overlay'+ name +':after { display: block; margin-left: '+ parseInt(tipLeft) +'px; }'
					);
				} else {
					// show under
					if (options.maxHeight && maxHeight > options.maxHeight) maxHeight = options.maxHeight;
					if (h > maxHeight) { 
						overflowY = true;
						div2.height(maxHeight).width(w).css({ 'overflow-y': 'auto' });
					}
					div1.find('>style').html(
						'#w2ui-overlay'+ name +':before { display: block; margin-left: '+ parseInt(tipLeft) +'px; }'+
						'#w2ui-overlay'+ name +':after { display: none; margin-left: '+ parseInt(tipLeft) +'px; }'
					);
				}
				// check width
				w = div2.width();
				maxWidth = window.innerWidth + $(document).scrollLeft() - div2.offset().left - 7;
				if (options.maxWidth && maxWidth > options.maxWidth) maxWidth = options.maxWidth;
				if (w > maxWidth && options.align != 'both') {
					options.align = 'right';
					setTimeout(function () { fixSize(); }, 1);
				}
				// check scroll bar
				if (overflowY && overflowX) div2.width(w + w2utils.scrollBarSize() + 2);
			}
		}
	};

	$.fn.w2menu = function (menu, options) {
		/* 
		ITEM STRUCTURE
			item : {
				id		: null,
				text 	: '',
				style	: '',
				hidden	: true
				...
			}
		*/		
		var defaults = {
			index		: null, 	// current selected
			items 		: [],
			render		: null,
			onSelect 	: null
		}
		var name = '';
		if (menu == 'refresh') {
			// if not show - call blur
			if ($('#w2ui-overlay'+ name).length > 0) {
				$('#w2ui-overlay'+ name +' > div').html(getMenuHTML(), options);
				var fun = $('#w2ui-overlay'+ name).data('fixSize');
				if (typeof fun == 'function') fun();
			} else {
				$(this).w2menu(options);
			}
		} else {
			if (arguments.length == 1) options = menu; else options.items = menu;
			if (typeof options != 'object') options = {};
			options = $.extend({}, defaults, options);
			if (options.name) name = '-' + options.name;
			if (typeof options.select == 'function' && typeof options.onSelect != 'function') options.onSelect = options.select;
			if (typeof options.onRender == 'function' && typeof options.render != 'function') options.render = options.onRender;
			// since only one overlay can exist at a time
			$.fn.w2menuHandler = function (event, index) {
				if (typeof options.onSelect == 'function') {
					options.onSelect({
						index	: index,
						item	: options.items[index],
						originalEvent: event
					}); 
				}
			};
			return $(this).w2overlay(getMenuHTML(), options);
		}

		function getMenuHTML () { 
			var count		= 0;
			var menu_html	= '<table cellspacing="0" cellpadding="0" class="w2ui-drop-menu">';
			for (var f = 0; f < options.items.length; f++) { 
				var mitem = options.items[f];
				if (typeof mitem == 'string') {
					mitem = { id: mitem, text: mitem };
				} else {
					if (typeof mitem.text != 'undefined' && typeof mitem.id == 'undefined') mitem.id = mitem.text;
					if (typeof mitem.text == 'undefined' && typeof mitem.id != 'undefined') mitem.text = mitem.id;
					if (typeof mitem.caption != 'undefined') mitem.text = mitem.caption;
					var img  = mitem.img;
					var icon = mitem.icon;
					if (typeof img  == 'undefined') img  = null;
					if (typeof icon == 'undefined') icon = null;
				}
				if (mitem.hidden !== true) {
					var imgd = '';
					var txt = mitem.text;
					if (typeof options.render == 'function') txt = options.render(mitem, options);
					if (img)  imgd = '<td><div class="w2ui-tb-image w2ui-icon '+ img +'"></div></td>';
					if (icon) imgd = '<td align="center"><span class="w2ui-icon '+ icon +'"></span></td>';
					// render only if non-empty
					if (typeof txt != 'undefined' && txt != '' && !(/^-+$/.test(txt))) {
						var bg = (count % 2 == 0 ? 'w2ui-item-even' : 'w2ui-item-odd');
						if (options.altRows !== true) bg = '';
						menu_html += 
							'<tr index="'+ f + '" style="'+ (mitem.style ? mitem.style : '') +'" '+
							'		class="'+ bg +' '+ (options.index == count ? 'w2ui-selected' : '') +'"'+
							'		onclick="$(\'#w2ui-overlay\').remove(); $.fn.w2menuHandler(event, \''+ f +'\'); event.stopPropagation();" '+
							'		onmouseover="$(this).addClass(\'w2ui-selected\');" '+
							'		onmouseout="$(this).removeClass(\'w2ui-selected\');">'+
								imgd +
							'	<td>'+ txt +'</td>'+
							'</tr>';
						count++;
					} else {
						// horizontal line
						menu_html += '<tr><td colspan="2" style="padding: 6px"><div style="border-top: 1px solid silver;"></div></td></tr>';						
					}
				}
				options.items[f] = mitem;
			}
			if (count == 0) {
				menu_html += '<tr><td style="text-align: center; color: #999">No items</td></tr>';
			}
			menu_html += "</table>";
			return menu_html;
		}	
	}
})();
