!function(){function t(t,e,n,o){Object.defineProperty(t,e,{get:n,set:o,enumerable:!0,configurable:!0})}var e=("undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{}).parcelRequire55a5;e.register("gyRZo",(function(n,o){t(n.exports,"Connector",(function(){return l}));var i=e("kxanC"),r=e("hWDD9"),a=e("cksMj"),s=e("giCK6"),u=e("irPpa"),c=e("aOvOw");var l=function(t){"use strict";(0,a.default)(n,t);var e=(0,s.default)(n);function n(){var t;return(0,i.default)(this,n),t=e.call(this),console.warn("Hello, this is LiaScript from within a SCORM 1.2 package. You should definitely try out the SCORM 2004 exporter, since this one cannot be used to store states or any kind of progress. The only thing that is stores, is currently the user location...\n\nIF YOU ARE AN ELABORATE AND EXPERIENCED SCORM DEVELOPER?\n========================================================\n\nAnd you want to help us, to extend this service, please contact us via LiaScript@web.de\n\nHava fun ;-)"),window.top&&window.top.API&&(t.scorm=window.top.API,console.log("LMSInitialize",t.scorm.LMSInitialize("")),t.location=function(t){try{return JSON.parse(t)}catch(t){}return null}(t.scorm.LMSGetValue("cmi.core.lesson_location")),null===t.location&&t.slide(0)),t}return(0,r.default)(n,[{key:"open",value:function(t,e,n){null!==this.location&&window.LIA.goto(this.location)}},{key:"slide",value:function(t){this.location=t,this.scorm&&(this.scorm.LMSSetValue("cmi.core.lesson_location",JSON.stringify(t)),this.scorm.LMSCommit(""))}},{key:"countInteractions",value:function(){if(!this.scorm)return null;var t=parseInt(this.scorm.LMSGetValue("cmi.interactions._count"));return t||null}},{key:"setInteraction",value:function(t,e){if(this.scorm)return e.length<=256?(this.scorm.LMSSetValue("cmi.interactions.".concat(t,".id"),e),!0):(this.scorm.LMSSetValue("cmi.interactions.".concat(t,".id"),"Objective could not be stored, content exceeds 256Bytes!"),!1)}},{key:"initSettings",value:function(t){return c.Settings.init(t,!1,this.setSettings)}},{key:"setSettings",value:function(t){this.write("cmi.suspend_data",JSON.stringify(t))}},{key:"getSettings",value:function(){var t="";try{var e;t=(null===(e=this.scorm)||void 0===e?void 0:e.LMSGetValue("cmi.suspend_data"))||null}catch(t){console.warn("cannot write to localStorage")}var n=null;if("string"==typeof t){try{n=JSON.parse(t)}catch(t){console.warn("getSettings =>",t)}n||(n=c.Settings.data),window.innerWidth<=768&&(n.table_of_contents=!1)}return n}},{key:"write",value:function(t,e){this.scorm?(this.scorm.LMSSetValue(t,e),this.scorm.LMSCommit("")):console.warn("SCORM: could not write")}}]),n}(u.Connector)})),e.register("irPpa",(function(n,o){t(n.exports,"Connector",(function(){return l}));var i=e("2swew"),r=e("kxanC"),a=e("hWDD9"),s=e("eQNFO"),u=e("2QbWq"),c=e("aOvOw"),l=function(){"use strict";function t(){(0,r.default)(this,t)}return(0,a.default)(t,[{key:"hasIndex",value:function(){return!1}},{key:"storage",value:function(){return new u.LiaStorage}},{key:"initSettings",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1];return c.Settings.init(t,e,this.setSettings)}},{key:"setSettings",value:function(t){try{localStorage.setItem(c.Settings.PORT,JSON.stringify(t))}catch(t){console.warn("cannot write to localStorage")}}},{key:"getSettings",value:function(){var t="";try{t=localStorage.getItem(c.Settings.PORT)}catch(t){console.warn("cannot write to localStorage")}var e=null;if("string"==typeof t){try{e=JSON.parse(t)}catch(t){console.warn("getSettings =>",t)}e||(e=c.Settings.data),window.innerWidth<=768&&(e.table_of_contents=!1)}return e}},{key:"open",value:function(t,e,n){}},{key:"load",value:function(t){}},{key:"store",value:function(t){}},{key:"update",value:function(t,e){}},{key:"slide",value:function(t){}},{key:"getIndex",value:function(){}},{key:"deleteFromIndex",value:function(t){}},{key:"storeToIndex",value:function(t){}},{key:"restoreFromIndex",value:function(t,e){}},{key:"reset",value:function(t,e){this.initSettings(null,!0)}},{key:"getFromIndex",value:function(t){return(0,i.default)((function(){return(0,s.__generator)(this,(function(t){return[2,null]}))}))()}}]),t}()})),e.register("2QbWq",(function(n,o){t(n.exports,"LiaStorage",(function(){return s}));var i=e("kxanC"),r=e("hWDD9"),a=e("mBz5n"),s=function(){"use strict";function t(){(0,i.default)(this,t)}return(0,r.default)(t,[{key:"getItems",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[];"string"==typeof t&&(t=[t]);for(var e={},n=0;n<t.length;n++){var o=localStorage.getItem(t[n]);e[t[n]]=o?JSON.parse(o):o}return e}},{key:"setItems",value:function(t){this._setLocal(t)}},{key:"_setLocal",value:function(t){var e=!0,n=!1,o=void 0;if("object"==typeof t)try{for(var i,r=Object.entries(t)[Symbol.iterator]();!(e=(i=r.next()).done);e=!0){var s=(0,a.default)(i.value,2),u=s[0],c=s[1];localStorage.setItem(u,JSON.stringify(c))}}catch(t){n=!0,o=t}finally{try{e||null==r.return||r.return()}finally{if(n)throw o}}}}]),t}()}))}();