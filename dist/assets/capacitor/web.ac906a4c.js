!function(){function e(e){return e&&e.__esModule?e.default:e}var t=("undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{}).parcelRequire55a5;t.register("692hz",(function(n,r){var s,i,o,u;s=n.exports,i="TextToSpeechWeb",o=function(){return h},Object.defineProperty(s,i,{get:o,set:u,enumerable:!0,configurable:!0});var a=t("iDmjL"),c=t("1JCPQ"),h=function(t){"use strict";a.inherits(r,t);var n=a.createSuper(r);function r(){var e;return a.classCallCheck(this,r),(e=n.call(this)).speechSynthesis=null,"speechSynthesis"in window&&(e.speechSynthesis=window.speechSynthesis),e}return a.createClass(r,[{key:"speak",value:function(t){return a.asyncToGenerator(e(c).mark((function n(){var r,s;return e(c).wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return this.speechSynthesis||this.throwUnsupportedError(),e.next=3,this.stop();case 3:return r=this.speechSynthesis,s=this.createSpeechSynthesisUtterance(t),e.abrupt("return",new Promise((function(e,t){s.onend=function(){e()},s.onerror=function(e){t(e)},r.speak(s)})));case 6:case"end":return e.stop()}}),n,this)})).bind(this))()}},{key:"stop",value:function(){return a.asyncToGenerator(e(c).mark((function t(){return e(c).wrap((function(e){for(;;)switch(e.prev=e.next){case 0:this.speechSynthesis||this.throwUnsupportedError(),this.speechSynthesis.cancel();case 2:case"end":return e.stop()}}),t,this)})).bind(this))()}},{key:"getSupportedLanguages",value:function(){return a.asyncToGenerator(e(c).mark((function t(){var n,r,s;return e(c).wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return n=this.getSpeechSynthesisVoices(),r=n.map((function(e){return e.lang})),s=r.filter((function(e,t,n){return n.indexOf(e)==t})),e.abrupt("return",{languages:s});case 4:case"end":return e.stop()}}),t,this)})).bind(this))()}},{key:"getSupportedVoices",value:function(){return a.asyncToGenerator(e(c).mark((function t(){var n;return e(c).wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return n=this.getSpeechSynthesisVoices(),e.abrupt("return",{voices:n});case 2:case"end":return e.stop()}}),t,this)})).bind(this))()}},{key:"isLanguageSupported",value:function(t){return a.asyncToGenerator(e(c).mark((function n(){var r,s;return e(c).wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,this.getSupportedLanguages();case 2:return r=e.sent,s=r.languages.includes(t.lang),e.abrupt("return",{supported:s});case 5:case"end":return e.stop()}}),n,this)})).bind(this))()}},{key:"openInstall",value:function(){return a.asyncToGenerator(e(c).mark((function t(){return e(c).wrap((function(e){for(;;)switch(e.prev=e.next){case 0:this.throwUnimplementedError();case 1:case"end":return e.stop()}}),t,this)})).bind(this))()}},{key:"createSpeechSynthesisUtterance",value:function(e){var t=this.getSpeechSynthesisVoices(),n=new SpeechSynthesisUtterance,r=e.text,s=e.lang,i=e.rate,o=e.pitch,u=e.volume,a=e.voice;return a&&(n.voice=t[a]),u&&(n.volume=u>=0&&u<=1?u:1),i&&(n.rate=i>=.1&&i<=10?i:1),o&&(n.pitch=o>=0&&o<=2?o:2),s&&(n.lang=s),n.text=r,n}},{key:"getSpeechSynthesisVoices",value:function(){return this.speechSynthesis||this.throwUnsupportedError(),(!this.supportedVoices||this.supportedVoices.length<1)&&(this.supportedVoices=this.speechSynthesis.getVoices()),this.supportedVoices}},{key:"throwUnsupportedError",value:function(){throw this.unavailable("SpeechSynthesis API not available in this browser.")}},{key:"throwUnimplementedError",value:function(){throw this.unimplemented("Not implemented on web.")}}]),r}(t("aX4Va").WebPlugin)}))}();