function t(t,e,n,o){Object.defineProperty(t,e,{get:n,set:o,enumerable:!0,configurable:!0})}var e=("undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{}).parcelRequire55a5;e.register("6lxlE",(function(n,o){t(n.exports,"Connector",(function(){return r}));var i=e("8kkhg");class r extends i.Connector{open(t,e,n){null!==this.location&&window.LIA.goto(this.location)}slide(t){this.location=t,this.scorm&&(this.scorm.LMSSetValue("cmi.core.lesson_location",JSON.stringify(t)),this.scorm.LMSCommit(""))}countInteractions(){if(!this.scorm)return;let t=parseInt(this.scorm.LMSGetValue("cmi.interactions._count"));return t||null}setInteraction(t,e){if(this.scorm)return e.length<=256?(this.scorm.LMSSetValue(`cmi.interactions.${t}.id`,e),!0):(this.scorm.LMSSetValue(`cmi.interactions.${t}.id`,"Objective could not be stored, content exceeds 256Bytes!"),!1)}constructor(){super(),console.warn("Hello, this is LiaScript from within a SCORM 1.2 package. You should definitely try out the SCORM 2004 exporter, since this one cannot be used to store states or any kind of progress. The only thing that is stores, is currently the user location...\n\nIF YOU ARE AN ELABORATE AND EXPERIENCED SCORM DEVELOPER?\n========================================================\n\nAnd you want to help us, to extend this service, please contact us via LiaScript@web.de\n\nHava fun ;-)"),window.top&&window.top.API&&(this.scorm=window.top.API,console.log("LMSInitialize",this.scorm.LMSInitialize("")),this.location=function(t){try{return JSON.parse(t)}catch(t){}return null}(this.scorm.LMSGetValue("cmi.core.lesson_location")),null===this.location&&this.slide(0))}}})),e.register("8kkhg",(function(n,o){t(n.exports,"Connector",(function(){return s}));var i=e("5MFHK"),r=e("dI6r2");class s{hasIndex(){return!1}storage(){return new i.LiaStorage}initSettings(t,e=!1){return r.Settings.init(t,e)}setSettings(t){try{localStorage.setItem(r.Settings.PORT,JSON.stringify(t))}catch(t){console.warn("cannot write to localStorage")}}getSettings(){let t="";try{t=localStorage.getItem(r.Settings.PORT)}catch(t){console.warn("cannot write to localStorage")}let e=null;if("string"==typeof t){try{e=JSON.parse(t)}catch(t){console.warn("getSettings =>",t)}e||(e=r.Settings.default),window.innerWidth<=768&&(e.table_of_contents=!1)}return e}open(t,e,n){}load(t){}store(t){}update(t,e){}slide(t){}getIndex(){}deleteFromIndex(t){}storeToIndex(t){}restoreFromIndex(t,e){}reset(t,e){this.initSettings(null,!0)}async getFromIndex(t){return null}constructor(){}}})),e.register("5MFHK",(function(e,n){t(e.exports,"LiaStorage",(function(){return o}));class o{getItems(t=[]){"string"==typeof t&&(t=[t]);let e={};for(let n=0;n<t.length;n++){let o=localStorage.getItem(t[n]);e[t[n]]=o?JSON.parse(o):o}return e}setItems(t){this._setLocal(t)}_setLocal(t){if("object"==typeof t)for(const[e,n]of Object.entries(t))localStorage.setItem(e,JSON.stringify(n))}constructor(){}}}));