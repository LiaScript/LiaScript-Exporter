var e=("undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{}).parcelRequire55a5;e.register("eL57a",(function(s,n){var t,i;t=s.exports,i=function(){return b},Object.defineProperty(t,"Sync",{get:i,set:undefined,enumerable:!0,configurable:!0});var u=e("c1rx7"),r=e("2e1Xj"),o=e("eHia3");class b extends r.Sync{destroy(){this.pubnub&&(this.pubnub.unsubscribeAll(),this.pubnub.stop()),super.destroy()}async connect(e){super.connect(e),this.publishKey=e.config.publishKey,this.subscribeKey=e.config.subscribeKey,window.PubNub?this.init(!0):this.load(["//cdn.pubnub.com/sdk/javascript/pubnub.4.33.1.min.js"],this)}init(e,s){if(!this.publishKey||!this.subscribeKey)return this.sendDisconnectError("You have to provide a valid pair of keys");const n=this.uniqueID();if(e&&window.PubNub&&n){this.channel=btoa(n),this.pubnub=new PubNub({publishKey:this.publishKey,subscribeKey:this.subscribeKey,uuid:this.token,heartbeatInterval:30,cipherKey:this.password}),this.pubnub.subscribe({channels:[this.channel],withPresence:!0,restore:!1});let e=this;this.pubnub.addListener({status:function(s){o.default.info("PUBNUB status:",s),"PNConnectedCategory"===s.category?e.sendConnect():"PNBadRequestCategory"===s.category&&e.sendDisconnectError(s.errorData.message)},message:function(s){s.publisher!==e.token&&e.applyUpdate(r.base64_to_unit8(s.message))},presence:function(s){"leave"===s.action&&e.db.removePeer(s.uuid)}})}}broadcast(e){this.pubnub&&this.pubnub.publish({channel:this.channel,message:r.uint8_to_base64(e),storeInHistory:!1},(function(e,s){}))}constructor(...e){super(...e),(0,u.default)(this,"channel","")}}}));
