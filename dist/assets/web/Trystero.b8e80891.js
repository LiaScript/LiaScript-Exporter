var e=("undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{}).parcelRequire55a5;e.register("aYlFN",(function(t,n){var i,r;i=t.exports,r=function(){return c},Object.defineProperty(i,"Sync",{get:r,set:undefined,enumerable:!0,configurable:!0});var o=e("5Owdb"),s={nostr:null,mqtt:null,torrent:null};class c extends o.Sync{destroy(){this.connection&&this.connection.leave(),super.destroy()}async connect(t){if(super.connect(t),s[this.backend])this.init(!0);else switch(this.backend){case"nostr":e("2Alpu").then((e=>{s.nostr=e.joinRoom,this.init(!0)})).catch((e=>{this.init(!1,e.message)}));break;case"mqtt":e("8VwUG").then((e=>{s.mqtt=e.joinRoom,this.init(!0)})).catch((e=>{this.init(!1,e.message)}));break;case"torrent":e("bSCfm").then((e=>{s.torrent=e.joinRoom,this.init(!0)})).catch((e=>{this.init(!1,e.message)}))}}init(e,t){const n=this.uniqueID();if(e&&n){const e={appId:"liascript"};this.password&&(e.password=this.password);const t=JSON.parse("null");t&&(e.rtcConfig=t),this.connection=s[this.backend](e,n),this.connection.onPeerJoin((e=>console.log(`${e} joined`))),this.connection.onPeerLeave((e=>console.log(`${e} left`)));const[i,r]=this.connection.makeAction("message");this.pub=i,this.sub=r;const c=this;this.sub(((e,t)=>{if(e)try{const[t,n,i]=e;if(t){if(null===n)return;i==c.db.timestamp?c.applyUpdate(o.base64_to_unit8(n)):i>c.db.timestamp?c.broadcast(!0,c.db.encode()):(c.db.timestamp=i,c.applyUpdate(o.base64_to_unit8(n),!0))}else c.pubsubReceive(o.base64_to_unit8(n))}catch(e){console.warn(c.backend,e.message)}})),this.sendConnect()}else{let e=this.backend+" unknown error";t&&(e="Could not load resource: "+t),this.sendDisconnectError(e)}}broadcast(e,t){if(!this.publish)return;const n=null==t?null:o.uint8_to_base64(t);this.pub([e,n,this.db.timestamp])}constructor(e,t,n,i,r,o=!1,s=!0){super(t,n,i,r,o,s),this.backend=e}}})),e.register("2Alpu",(function(t,n){t.exports=e("ebDiK")(e("ey3S0").getBundleURL("17irQ")+e("abmWv").resolve("lYuyw")).then((()=>e("g9MJ9")))})),e.register("8VwUG",(function(t,n){t.exports=e("ebDiK")(e("ey3S0").getBundleURL("17irQ")+e("abmWv").resolve("7bLGf")).then((()=>e("i0BT1")))})),e.register("bSCfm",(function(t,n){t.exports=e("ebDiK")(e("ey3S0").getBundleURL("17irQ")+e("abmWv").resolve("1lfZ9")).then((()=>e("hsMrW")))})),e.register("jhEmn",(function(e,t){var n,i,r=e.exports={};function o(){throw new Error("setTimeout has not been defined")}function s(){throw new Error("clearTimeout has not been defined")}function c(e){if(n===setTimeout)return setTimeout(e,0);if((n===o||!n)&&setTimeout)return n=setTimeout,setTimeout(e,0);try{return n(e,0)}catch(t){try{return n.call(null,e,0)}catch(t){return n.call(this,e,0)}}}!function(){try{n="function"==typeof setTimeout?setTimeout:o}catch(e){n=o}try{i="function"==typeof clearTimeout?clearTimeout:s}catch(e){i=s}}();var u,a=[],l=!1,h=-1;function f(){l&&u&&(l=!1,u.length?a=u.concat(a):h=-1,a.length&&d())}function d(){if(!l){var e=c(f);l=!0;for(var t=a.length;t;){for(u=a,a=[];++h<t;)u&&u[h].run();h=-1,t=a.length}u=null,l=!1,function(e){if(i===clearTimeout)return clearTimeout(e);if((i===s||!i)&&clearTimeout)return i=clearTimeout,clearTimeout(e);try{i(e)}catch(t){try{return i.call(null,e)}catch(t){return i.call(this,e)}}}(e)}}function p(e,t){this.fun=e,this.array=t}function b(){}r.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];a.push(new p(e,t)),1!==a.length||l||c(d)},p.prototype.run=function(){this.fun.apply(null,this.array)},r.title="browser",r.browser=!0,r.env={},r.argv=[],r.version="",r.versions={},r.on=b,r.addListener=b,r.once=b,r.off=b,r.removeListener=b,r.removeAllListeners=b,r.emit=b,r.prependListener=b,r.prependOnceListener=b,r.listeners=function(e){return[]},r.binding=function(e){throw new Error("process.binding is not supported")},r.cwd=function(){return"/"},r.chdir=function(e){throw new Error("process.chdir is not supported")},r.umask=function(){return 0}}));