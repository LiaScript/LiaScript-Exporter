function t(t,e,i,s){Object.defineProperty(t,e,{get:i,set:s,enumerable:!0,configurable:!0})}var e=("undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{}).parcelRequire55a5;e.register("1FNwj",(function(i,s){t(i.exports,"Connector",(function(){return c}));var n=e("jXXgq"),o=e("ayIBF"),r=e("5aa3i");class c extends n.Connector{init(){if(this.scorm){a("Initialize ",this.scorm.LMSInitialize(""));let t=this.scorm.LMSGetValue("cmi.core.lesson_mode");if(this.active="normal"===t,a("Running in",t,"mode, results will ",this.active?"":"NOT","be stored!"),a("open location ..."),this.location=r.jsonParse(this.scorm.LMSGetValue("cmi.core.lesson_location")),a("... ",this.location),null===this.location){this.slide(0);let t=0;t=this.initFirst("quiz",t),t=this.initFirst("survey",t),t=this.initFirst("task",t)}else{let t=0;t=this.initSecond("quiz",t),t=this.initSecond("survey",t),t=this.initSecond("task",t)}window.SCORE=0,this.score()}}initFirst(t,e){for(let i=0;i<this.db[t].length;i++){this.id[t].push([]);for(let s=0;s<this.db[t][i].length;s++)this.id[t][i].push(e),e++}return e}initSecond(t,e){for(let i=0;i<this.db[t].length;i++){this.id[t].push([]);for(let s=0;s<this.db[t][i].length;s++){let n=this.getInteraction(e);n&&(this.db[t][i][s]=n),this.id[t][i].push(e),e++}}return e}score(){var t;if(!this.active||!this.score)return;let e=0,i=0,s=0,n=0;for(let t=0;t<this.db.quiz.length;t++)for(let o=0;o<this.db.quiz[t].length;o++)switch(n=this.db.quiz[t][o].score,e+=n,this.db.quiz[t][o].solved){case 1:i+=n;case-1:s+=n}const o=0===i?0:i/e;this.write("cmi.core.score.min","0"),this.write("cmi.core.score.max","100"),this.write("cmi.core.score.raw",function(t){const e=t.toFixed(4),[i,s]=e.toString().split(".");return`${i}.${s.padEnd(10,"0")}`}(100*o));let c=r.jsonParse((null===(t=this.scorm)||void 0===t?void 0:t.LMSGetValue("cmi.student_data.mastery_score"))||"null");null==c?this.write("cmi.core.lesson_status","not attempted"):o>=c/100?this.write("cmi.core.lesson_status","passed"):s+i===e?this.write("cmi.core.lesson_status","failed"):this.write("cmi.core.lesson_status","incomplete"),window.SCORE=o}open(t,e,i){null!==this.location&&window.LIA.goto(this.location)}slide(t){this.location=t,this.scorm&&(this.scorm.LMSSetValue("cmi.core.lesson_location",JSON.stringify(t)),this.scorm.LMSCommit(""))}countInteractions(){if(!this.scorm)return null;return parseInt(this.scorm.LMSGetValue("cmi.objectives._count"))||null}setInteraction(t,e){return e.length<=255?(this.write(`cmi.objectives.${t}.id`,r.encodeJSON(e)),!0):(this.write(`cmi.objectives.${t}.id`,"Objective could not be stored, content exceeds 256Bytes!"),!1)}initSettings(t,e=!1){return o.Settings.init(t,!1,this.setSettings)}setSettings(t){this.write("cmi.suspend_data",JSON.stringify(t))}getSettings(){let t="";try{var e;t=(null===(e=this.scorm)||void 0===e?void 0:e.LMSGetValue("cmi.suspend_data"))||null}catch(t){l("cannot read settings from cmi.suspend_data")}let i=null;if("string"==typeof t){try{i=JSON.parse(t)}catch(t){l("getSettings =>",t)}i||(i=o.Settings.data),window.innerWidth<=768&&(i.table_of_contents=!1)}return i}write(t,e){this.scorm?(this.scorm.LMSSetValue(t,e),this.scorm.LMSCommit("")):l("could not write",t,e)}getInteraction(t){if(!this.active)return null;let e;try{if(this.scorm&&(e=this.scorm.LMSGetValue(`cmi.objectives.${t}.id`),e))return r.decodeJSON(e)}catch(i){l("getInteraction =>",i,`cmi.objectives.${t}.id`,e)}return null}updateInteraction(t,e){this.write(`cmi.objectives.${t}.id`,r.encodeJSON(e))}load(t){if(this.active)switch(t.table){case"quiz":case"survey":case"task":return a("loading ",t.table,t.id,this.db.task[t.id]),this.db[t.table][t.id]}}store(t){if(this.active)switch(l("store",t),t.table){case"quiz":this.storeHelper(t),this.score();break;case"survey":case"task":this.storeHelper(t)}}storeHelper(t){for(let e=0;e<this.db[t.table][t.id].length;e++)r.neq(t.data[e],this.db[t.table][t.id][e])&&(this.updateInteraction(this.id[t.table][t.id][e],t.data[e]),this.db[t.table][t.id][e]=t.data[e],"quiz"==t.table&&this.updateQuiz(this.id[t.table][t.id][e],t.data[e]))}updateQuiz(t,e){if(this.active)switch(e.solved){case 0:e.trial>0&&this.write(`cmi.objectives.${t}.status`,"failed");break;case 1:this.write(`cmi.objectives.${t}.status`,"completed");break;case-1:this.write(`cmi.objectives.${t}.status`,"incomplete")}}constructor(){if(super(),this.active=!1,this.db={quiz:[],survey:[],task:[]},this.id={quiz:[],survey:[],task:[]},console.warn("Hello, this is LiaScript from within a SCORM 1.2 package. You should definitely try out the SCORM 2004 exporter, since this one cannot be used to store states or any kind of progress. The only thing that is stores, is currently the user location...\n\nIF YOU ARE AN ELABORATE AND EXPERIENCED SCORM DEVELOPER?\n========================================================\n\nAnd you want to help us, to extend this service, please contact us via LiaScript@web.de\n\nHava fun ;-)"),window.top&&window.top.API){a("successfully opened API"),this.scorm=window.top.API,a("LMSInitialize",this.scorm.LMSInitialize("")),a("loading quizzes ...");try{this.db.quiz=window.config_.quiz||[[]],a(" ... done")}catch(t){l("... failed",t)}a("loading surveys ...");try{this.db.survey=window.config_.survey||[[]],a(" ... done")}catch(t){l("... failed",t)}a("loading tasks ...");try{this.db.task=window.config_.task||[[]],a(" ... done")}catch(t){l("... failed",t)}this.init()}}}function a(...t){console.log("SCORM1.2: ",...t)}function l(...t){console.log("SCORM1.2: ",...t)}})),e.register("jXXgq",(function(i,s){t(i.exports,"Connector",(function(){return r}));var n=e("3MPaZ"),o=e("ayIBF");class r{hasIndex(){return!1}storage(){return new n.LiaStorage}initSettings(t,e=!1){return o.Settings.init(t,e,this.setSettings)}setSettings(t){try{localStorage.setItem(o.Settings.PORT,JSON.stringify(t))}catch(t){console.warn("cannot write to localStorage")}}getSettings(){let t="";try{t=localStorage.getItem(o.Settings.PORT)}catch(t){console.warn("cannot write to localStorage")}let e=null;if("string"==typeof t){try{e=JSON.parse(t)}catch(t){console.warn("getSettings =>",t)}e||(e=o.Settings.data),window.innerWidth<=768&&(e.table_of_contents=!1)}return e}open(t,e,i){}load(t){}store(t){}update(t,e){}slide(t){}getIndex(){}deleteFromIndex(t){}storeToIndex(t){}restoreFromIndex(t,e){}reset(t,e){this.initSettings(null,!0)}async getFromIndex(t){return null}constructor(){}}})),e.register("3MPaZ",(function(e,i){t(e.exports,"LiaStorage",(function(){return s}));class s{getItems(t=[]){"string"==typeof t&&(t=[t]);let e={};for(let i=0;i<t.length;i++){let s=localStorage.getItem(t[i]);e[t[i]]=s?JSON.parse(s):s}return e}setItems(t){this._setLocal(t)}_setLocal(t){if("object"==typeof t)for(const[e,i]of Object.entries(t))localStorage.setItem(e,JSON.stringify(i))}constructor(){}}})),e.register("5aa3i",(function(e,i){t(e.exports,"encodeJSON",(function(){return r})),t(e.exports,"decodeJSON",(function(){return c})),t(e.exports,"jsonParse",(function(){return a})),t(e.exports,"neq",(function(){return l}));const s={SingleChoice:"sc",MultipleChoice:"mc",Text:"tx",Select:"st",Matrix:"mx",Generic:"gn",error_msg:"err"},n=Object.entries(s).reduce(((t,[e,i])=>(t[i]=e,t)),{});function o(t,e){if("object"!=typeof t||null===t)return t;if(Array.isArray(t))return t.map((t=>o(t,e)));const i={};for(const[s,n]of Object.entries(t))i[e[s]||s]=o(n,e);return i}function r(t){return JSON.stringify(o(t,s))}function c(t){return o(JSON.parse(t),n)}function a(t){try{return JSON.parse(t)}catch(t){}return null}function l(t,e){return JSON.stringify(t)!=JSON.stringify(e)}}));
