var e=("undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{}).parcelRequire55a5;e.register("hBeOF",(function(t,n){var s,o,d,i;s=t.exports,o="Sync",d=()=>l,Object.defineProperty(s,o,{get:d,set:i,enumerable:!0,configurable:!0});var c=e("c1rx7"),a=e("2e1Xj"),r=e("7xGNU");class l extends a.Sync{async connect(e){super.connect(e),this.init(!0)}destroy(){super.destroy()}init(e,t){if(e){this.subject=this.room||"liasync";let e=this;window.addEventListener("message",(function(t){try{let n=t.data;if("init"===n.subject)n.body&&(e.connected=!0,e.sendConnect());else n.body=JSON.parse(n.body),n.body.message.param.id!==e.token&&n.body&&e.applyUpdate((0,r.decode)(n.body))}catch(e){console.warn("Edrys",e.message)}})),window.parent.postMessage({subject:"init",body:""},"*"),setTimeout((function(){e.connected||e.sendDisconnectError("This seems not to be an Edrys classroom")}),2e3)}}broadcast(e){window.parent.postMessage({subject:this.subject,body:e?(0,r.encode)(e):null},"*")}constructor(...e){super(...e),(0,c.default)(this,"subject","liasync"),(0,c.default)(this,"connected",!1)}}}));