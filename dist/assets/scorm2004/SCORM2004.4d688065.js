!function(){function t(t,e,i,n){Object.defineProperty(t,e,{get:i,set:n,enumerable:!0,configurable:!0})}var e=("undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{}).parcelRequire55a5;e.register("lb3ul",(function(i,n){t(i.exports,"Connector",(function(){return o}));var r=e("iDmjL"),s=e("bV6KY"),a=e("5rPeW"),o=function(t){"use strict";r.inherits(i,t);var e=r.createSuper(i);function i(){var t;if(r.classCallCheck(this,i),(t=e.call(this)).active=!1,t.scaled_passing_score=null,t.db={quiz:[],survey:[],task:[]},t.id={quiz:[],survey:[],task:[]},window.API_1484_11||window.top.API_1484_11){c("successfully opened API"),t.scorm=window.API_1484_11||window.top.API_1484_11,c("loading quizzes ...");try{t.db.quiz=window.config_.quiz||[[]],c(" ... done")}catch(t){u("... failed",t)}c("loading surveys ...");try{t.db.survey=window.config_.survey||[[]],c(" ... done")}catch(t){u("... failed",t)}c("loading tasks ...");try{t.db.task=window.config_.task||[[]],c(" ... done")}catch(t){u("... failed",t)}t.init()}return t}return r.createClass(i,[{key:"init",value:function(){if(this.scorm){c("Initialize ",this.scorm.Initialize(""));var t=this.scorm.GetValue("cmi.mode");if(this.active="normal"===t,this.active=!0,this.scaled_passing_score=JSON.parse(this.scorm.GetValue("cmi.scaled_passing_score")),c("open location ..."),this.location=function(t){try{return JSON.parse(t)}catch(t){}return null}(this.scorm.GetValue("cmi.location")),c("... ",this.location),null===this.location){this.slide(0);var e=0;e=this.initFirst("quiz",e),e=this.initFirst("survey",e),e=this.initFirst("task",e)}else{var i=0;i=this.initSecond("quiz",i),i=this.initSecond("survey",i),i=this.initSecond("task",i)}}}},{key:"initFirst",value:function(t,e){for(var i=0;i<this.db[t].length;i++){this.id[t].push([]);for(var n=0;n<this.db[t][i].length;n++)this.setInteraction(e,"".concat(t,":").concat(i,"-").concat(n)),this.id[t][i].push(e),e++}return e}},{key:"initSecond",value:function(t,e){for(var i=0;i<this.db[t].length;i++){this.id[t].push([]);for(var n=0;n<this.db[t][i].length;n++){var r=this.getInteraction(e);r&&(this.db[t][i][n]=r[2]),this.id[t][i].push(e),e++}}return e}},{key:"open",value:function(t,e,i){null!==this.location&&window.LIA.goto(this.location)}},{key:"load",value:function(t){if(this.active)switch(t.table){case"quiz":case"survey":case"task":return c("loading ",t.table,t.id,this.db.task[t.id]),this.db[t.table][t.id]}}},{key:"store",value:function(t){if(this.active)switch(t.table){case"quiz":this.storeHelper(t),this.score();break;case"survey":case"task":this.storeHelper(t)}}},{key:"storeHelper",value:function(t){for(var e=0;e<this.db[t.table][t.id].length;e++)i=t.data[e],n=this.db[t.table][t.id][e],JSON.stringify(i)!=JSON.stringify(n)&&(this.updateInteraction(this.id[t.table][t.id][e],t.data[e]),"quiz"==t.table&&this.updateQuiz(this.id[t.table][t.id][e],t.data[e]));var i,n}},{key:"score",value:function(){if(this.active&&this.scaled_passing_score){var t=this.db.quiz.reduce((function(t,e){return t+e.length}),0),e=this.db.quiz.map((function(t){return t.filter((function(t){return!0===t}))})).reduce((function(t,e){return t+e.length}),0),i=this.db.quiz.map((function(t){return t.filter((function(t){return null!=t}))})).reduce((function(t,e){return t+e.length}),0),n=0===e?0:e/t;this.write("cmi.score.min","0"),this.write("cmi.score.max",JSON.stringify(t)),this.write("cmi.score.raw",JSON.stringify(e)),n>=this.scaled_passing_score?this.write("cmi.success_status","passed"):i===e&&this.write("cmi.success_status","failed")}}},{key:"write",value:function(t,e){if(this.scorm){if(c("write: ",t,e),"false"===this.scorm.SetValue(t,e)){console.warn("error occurred for ",t,e);var i=this.scorm.GetLastError();console.warn("GetLastError:",i),i?(console.warn("GetErrorString:",this.scorm.GetErrorString(i)),console.warn("GetDiagnostic:",this.scorm.GetDiagnostic(i))):console.warn("GetDiagnostic:",this.scorm.GetDiagnostic(""))}this.scorm.Commit("")}}},{key:"slide",value:function(t){this.location=t,this.write("cmi.location",JSON.stringify(t))}},{key:"setInteraction",value:function(t,e){this.write("cmi.interactions.".concat(t,".id"),e),this.write("cmi.interactions.".concat(t,".type"),"long-fill-in")}},{key:"updateQuiz",value:function(t,e){if(this.active)switch(e.solved){case 0:e.trial>0&&this.write("cmi.interactions.".concat(t,".result"),"incorrect");break;case 1:this.write("cmi.interactions.".concat(t,".result"),"correct");break;case-1:this.write("cmi.interactions.".concat(t,".result"),"neutral")}}},{key:"updateInteraction",value:function(t,e){this.write("cmi.interactions.".concat(t,".learner_response"),JSON.stringify(e))}},{key:"getInteraction",value:function(t){if(!this.active)return null;try{return JSON.parse(this.scorm.GetValue("cmi.interactions.".concat(t,".learner_response")))}catch(t){console.warn("SCORM: getInteraction => ",t)}return null}}]),i}(s.Connector);function c(){for(var t=arguments.length,e=new Array(t),i=0;i<t;i++)e[i]=arguments[i];a.default.info("SCORM2004: "+e)}function u(){for(var t=arguments.length,e=new Array(t),i=0;i<t;i++)e[i]=arguments[i];a.default.warn("SCORM2004: "+e)}})),e.register("bV6KY",(function(i,n){t(i.exports,"Connector",(function(){return o}));var r=e("iDmjL"),s=e("kKjPA"),a=e("buw1Y"),o=function(){"use strict";function t(){r.classCallCheck(this,t)}return r.createClass(t,[{key:"hasIndex",value:function(){return!1}},{key:"storage",value:function(){return new s.LiaStorage}},{key:"initSettings",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1];return a.Settings.init(t,e)}},{key:"setSettings",value:function(t){localStorage.setItem(a.Settings.PORT,JSON.stringify(t))}},{key:"getSettings",value:function(){var t=localStorage.getItem(a.Settings.PORT),e=null;if("string"==typeof t){try{e=JSON.parse(t)}catch(t){console.warn("getSettings =>",t)}e||(e=a.Settings.default),window.innerWidth<=768&&(e.table_of_contents=!1)}return e}},{key:"open",value:function(t,e,i){}},{key:"load",value:function(t){}},{key:"store",value:function(t){}},{key:"update",value:function(t,e){}},{key:"slide",value:function(t){}},{key:"getIndex",value:function(){}},{key:"deleteFromIndex",value:function(t){}},{key:"storeToIndex",value:function(t){}},{key:"restoreFromIndex",value:function(t,e){}},{key:"reset",value:function(t,e){this.initSettings(null,!0)}},{key:"getFromIndex",value:function(t){return null}}]),t}()})),e.register("kKjPA",(function(i,n){t(i.exports,"LiaStorage",(function(){return s}));var r=e("iDmjL"),s=function(){"use strict";function t(){r.classCallCheck(this,t)}return r.createClass(t,[{key:"getItems",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[];"string"==typeof t&&(t=[t]);for(var e={},i=0;i<t.length;i++){var n=localStorage.getItem(t[i]);e[t[i]]=n?JSON.parse(n):n}return e}},{key:"setItems",value:function(t){this._setLocal(t)}},{key:"_setLocal",value:function(t){var e=!0,i=!1,n=void 0;if("object"==typeof t)try{for(var s,a=Object.entries(t)[Symbol.iterator]();!(e=(s=a.next()).done);e=!0){var o=r.slicedToArray(s.value,2),c=o[0],u=o[1];localStorage.setItem(c,JSON.stringify(u))}}catch(t){i=!0,n=t}finally{try{e||null==a.return||a.return()}finally{if(i)throw n}}}}]),t}()}))}();