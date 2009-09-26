/**
 * PeriodicalUpdater - jQuery plugin for timed, decaying ajax calls
 *
 * Smokejumper Version by Robert Fischer, Smokejumper IT
 * Based on version from http://www.360innovate.co.uk
 *
 * Copyright (c) 2009 by the following:
 *   * Robert Fischer (http://smokejumperit.com)
 *   * 360innovate (http://www.360innovate.co.uk)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * Version: 2.0
 */

(function($) {
		// From http://www.hiteshagrawal.com/javascript/convert-xml-document-to-string-in-javascript
		var xml_content_string = function(xmlData) {
			if (window.ActiveXObject) {
				//for IE
				xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
				xmlDoc.async="false";
				xmlDoc.loadXML(xmlData);
				return xmlDoc.xml;
			} else if (document.implementation && document.implementation.createDocument) {
				//for Mozila
				parser=new DOMParser();
				xmlDoc=parser.parseFromString(xmlData,"text/xml");
				return xmlDoc.xml;
			} else {
				// Punt!
				return xmlData;
			}
		};

		// Now back to our regularly scheduled work
    $.PeriodicalUpdater = function(url, options, callback){

        var settings = jQuery.extend(true, {
            url: url,               // URL of ajax request
						cache: false,						// By default, don't allow caching
            method: 'GET',          // method; get or post
            data: '',           		// array of values to be passed to the page - e.g. {name: "John", greeting: "hello"}
            minTimeout: 1000,       // starting value for the timeout in milliseconds
            maxTimeout: 8000,       // maximum length of time between requests
            multiplier: 2           // if set to 2, timerInterval will double each time the response hasn't changed (up to maxTimeout)
        }, options);
        
        // set some initial values, then begin
				var knowIsSame = false;
        var timerInterval = settings.minTimeout;

				// Function to boost the timer (nop unless multiplier > 1)
				var boostPeriod = function() { return; };
				if(settings.multiplier > 1) {
					boostPeriod = function() { 
						timerInterval = timerInterval * settings.multiplier;
						
						if(timerInterval > settings.maxTimeout) {
								timerInterval = settings.maxTimeout;
						}
					};
				} 

				// Construct the settings for $.ajax based on settings
				var ajaxSettings = jQuery.extend(true, {}, settings);
				if(settings.type && !ajaxSettings.dataType) ajaxSettings.dataType = settings.type;
				if(settings.sendData) ajaxSettings.data = settings.sendData;
				ajaxSettings.type = settings.method; // 'type' is used internally for jQuery.  Who knew?
				ajaxSettings.ifModified = false;
				ajaxSettings.success = function(data) {
					if(knowIsSame) {
						boostPeriod();
					} else {
						timerInterval = settings.minTimeout;
						if(callback) { 
							callback(data); 
						}
					}
					if(settings.success) { settings.success(data); }
				};
				ajaxSettings.error = function (xhr, textStatus) { 
					if(knowIsSame || textStatus == "notmodified") {
						boostPeriod();
					} else {
						timerInterval = settings.minTimeout;
					}
					if(settings.error) { settings.error(xhr, textStatus); }
				};

				ajaxSettings.dataFilter = function() { 
					var prevData = null;
					return function(data, type) {
						var respText = this.xhr().responseText;
						knowIsSame = (respText != null && prevData != null && respText == prevData);
						prevData = respText;

						if(settings.dataFilter) data = settings.dataFilter(data, type);
						return data;
					};
				}();
				

				function getdata() { $.ajax(ajaxSettings); }

				// Make the first call
        $(function() { getdata(); });
    };  
})(jQuery);
