function t(t,e,i,s){Object.defineProperty(t,e,{get:i,set:s,enumerable:!0,configurable:!0})}var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},i={},n={},s=e.parcelRequire55a5;null==s&&((s=function(t){if(t in i)return i[t].exports;if(t in n){var e=n[t];delete n[t];var s={id:t,exports:{}};return i[t]=s,e.call(s.exports,s,s.exports),s.exports}var r=new Error("Cannot find module '"+t+"'");throw r.code="MODULE_NOT_FOUND",r}).register=function(t,e){n[t]=e},e.parcelRequire55a5=s),s.register("gHkO2",(function(e,i){t(e.exports,"initTooltip",(function(){return g}));var n=s("c1rx7"),r=s("d1WII"),o=s("7ciDo"),c=s("lsMwC"),l=s("hplFA");const h="lia-tooltip",a=/(?:https?:)(?:\/\/)liascript\.github\.io\/course\/\?(.+\.md)/i;var u=Object();class d extends HTMLElement{connectedCallback(){this.sourceUrl=this.getAttribute("src")||"",this.sourceUrl&&(this.sourceUrl.endsWith("/")&&(this.sourceUrl=this.sourceUrl.slice(0,-1)),this.container=document.getElementById(h)||void 0,this.container&&this.firstChild&&(this.firstChild.addEventListener("mouseenter",this._onmouseenter),this.firstChild.addEventListener("mouseout",this._onmouseout),this.firstChild.addEventListener("click",this._onclick),this.firstChild.addEventListener("focus",this._onfocus),this.firstChild.addEventListener("focusout",this._onfocusout),this.firstChild.addEventListener("keyup",this._onescape)))}disconnectedCallback(){this.firstChild&&(this.firstChild.removeEventListener("mouseenter",this._onmouseenter),this.firstChild.removeEventListener("mouseout",this._onmouseout),this.firstChild.removeEventListener("click",this._onclick),this.firstChild.removeEventListener("focus",this._onfocus),this.firstChild.removeEventListener("focusout",this._onfocusout),this.firstChild.removeEventListener("keyup",this._onescape))}_onclick(){const t=this.parentElement;t.isActive=!1,t.isClicked=!0}_onescape(t){if("Escape"===t.code){const t=this.parentElement;t.setAttribute("data-active","false"),t.deactivate()}}_onmouseenter(){this.style.cursor="progress";const t=this.getBoundingClientRect();this.parentElement.activate(t.left+t.width/2,t.top+t.height/2)}_onmouseout(){this.parentElement.deactivate()}_onfocus(t){const e=this.getBoundingClientRect();this.parentElement.activate(e.left+e.width/2,e.top+e.height/2)}_onfocusout(){const t=this.parentElement;t.container&&t.container.setAttribute("data-active","false"),t.deactivate()}activate(t,e){if(this.container){if(this.isActive=!0,this.isClicked)return void(this.isClicked=!1);if(this.container.style.left=t-425*t/window.innerWidth+"px",1.5*e>window.innerHeight?(this.container.style.top="",this.container.style.bottom=window.innerHeight-e+10+"px"):(this.container.style.top=`${e+10}px`,this.container.style.bottom=""),this.cache)this.show();else if(u[this.sourceUrl])this.cache=u[this.sourceUrl],this.show();else if(!this.isFetching){this.isFetching=!0;let e=this,i=this.sourceUrl.match(a);if(i)o.fetch(i[1],(function(t,i,s,n,r){e.cache=f(e.sourceUrl,i,s,n,r),e.show()}));else try{r.extract(this.sourceUrl,{}).then((t=>{e.cache=f(e.sourceUrl,t.title,void 0,t.thumbnail_url),e.show()})).catch((t=>{p(this.sourceUrl,(function(t){e.parse(t)}))}))}catch(t){}}}}deactivate(){this.container&&"false"===this.container.getAttribute("data-active")&&(this.isActive=!1,this.container.style.display="none",this.container.style.zIndex="-1000")}parse(t){if(null!==this.cache)return void this.show();let e=l.parse(this.sourceUrl,t);if("string"==typeof e.image){const t=e.image.match(/.*?%22(.*)\/%22/);t&&2==t.length&&(e.image=t[1])}this.cache=f(e.url,e.title,e.description,e.image,e.image_alt),""===this.cache&&(this.container=void 0),this.show()}show(){this.container&&this.cache&&this.isActive&&(this.lightMode?(this.container.style.background="white",this.container.style.boxShadow="0 30px 90px -20px rgba(0, 0, 0, 0.3)"):(this.container.style.background="#202020",this.container.style.boxShadow="0 30px 90px -20px rgba(120, 120, 120, 0.3)"),this.container.style.zIndex="20000",this.container.style.display="inline-block",this.container.innerHTML=this.cache),this.firstChild&&(this.firstChild.style.cursor="")}set light(t){this.lightMode!==t&&(this.lightMode=t,this.show())}get light(){return this.lightMode}constructor(){super(),(0,n.default)(this,"sourceUrl",""),(0,n.default)(this,"cache",null),(0,n.default)(this,"isFetching",!1),(0,n.default)(this,"isClicked",!1),(0,n.default)(this,"isActive",!1),(0,n.default)(this,"lightMode",!0)}}function f(t,e,i,s,n){if(!t)return"";t=t.replace(c.PROXY,"");let r="";if(s)try{c.allowedProtocol(s)||(s=new URL(s,t).toString()),r+=`<img src="${s}" ${n=n?`alt="${n}"`:""} style="background-color:white; margin-bottom: 1.5rem;">`}catch(t){}return e&&(r+=`<h4>${e}</h4>`),i&&(r+=i),""!=r&&(r+=`<hr style="border: 0px; height:1px; background:#888;"/><a style="font-size:x-small; display:block" href="${t}" target="_blank">${t}</a>`),u[t]=r,r}function g(){document.getElementById(h)||setTimeout((function(){const t=document.createElement("div");t.id=h,t.style.zIndex="-1000",t.style.width="425px",t.style.padding="15px",t.style.background="white",t.style.boxShadow="0 30px 90px -20px rgba(0, 0, 0, 0.3)",t.style.position="fixed",t.style.display="none",t.style.maxHeight="480px",t.style.overflow="auto",t.setAttribute("data-active","true"),t.addEventListener("mouseenter",(()=>{t.style.display="inline-block",t.style.zIndex="20000",t.setAttribute("data-active","true")})),t.addEventListener("mouseleave",(()=>{t.style.display="none",t.style.zIndex="-1000",t.setAttribute("data-active","false")})),document.body.appendChild(t)}),0)}function p(t,e,i=0){if(0==i&&function(t){return!!t.search(/wikipedia\.org/gi)}(t))return void p(c.PROXY+t,e,1);let s=new XMLHttpRequest;s.open("GET",t,!0),s.onload=function(t){if(4===s.readyState&&200===s.status)try{let i=s.responseText;try{i=JSON.parse(i).contents}catch(t){}e(i)}catch(t){console.warn("fetching",t)}},s.onerror=function(s){0===i&&p(c.PROXY+t,e,1)},s.send()}customElements.define("preview-link",d)})),s.register("hplFA",(function(e,i){t(e.exports,"parse",(function(){return u}));var n=s("lsMwC");const r=/href=[\"'](.*?)[\"']/gi,o=/src=[\"'](.*?)[\"']/gi,c=/alt=[\"'](.*?)[\"']/gi,l=/<h1.*?>(.*?)<\/h1>/gi,h=/<h2.*?>(.*?)<\/h2>/gi,a=/<title>(.*?)<\/title>/gi;function u(t,e){const i=function(t){const e=p("og:image",t);if(e)return{url:e,alt:p("og:image:alt",t)};const i=g(/<link.*?rel=[\"']image_src[\"'].*?>/gi,t);if(i)return{url:g(r,i)};const s=p("twitter:image",t);if(s)return{url:s,alt:p("twitter:image:alt",t)};const n=g(/<img .*?>/gi,t);return n?{url:g(o,n),alt:g(c,n)}:{}}(e),s=new URL(function(t){return g(/<base.*?href\s*=\s*[\"'](.*?)[\"']>/gi,t)}(e)||t);return{url:t,title:d(e),description:f(s,e),image:i.url,image_alt:i.alt}}function d(t){const e=p("og:title",t);if(e&&e.length>0)return e;const i=p("twitter:title",t);if(i&&i.length>0)return i;const s=g(a,t);if(s&&s.length>0)return s;const n=g(l,t);if(n&&n.length>0)return n;const r=g(h,t);return r&&r.length>0?r:void 0}function f(t,e){const i=p("og:description",e);if(i&&i.length>0)return i;const s=p("twitter:description",e);if(s&&s.length>0)return s;const r=g(/<meta.*?name=[\"']description[\"'].*?>/gi,e);if(r){const t=g(/content=[\"'](.*?)[\"']/gi,r);if(t&&t.length>0)return t}let o=g(/<p>([\s\S]+?)<\/p>/gi,e);return o?(o=o.replace(/(href|src)\s*=\s*[\"'].*?[\"']/g,(function(e){return function(t,e){const i=e.search(/[\"']/);e.startsWith("href")&&(e+=' target="blank_"');const s=e.slice(0,i+1),r=e.slice(i+1);return n.allowedProtocol(s)||r.startsWith("//")?e:r.startsWith("/")?s+t.origin+r:r.startsWith("#")?s+t.href+r:s+t.origin+"/"+r}(t,e)})),o):void 0}function g(t,e){const i=e.matchAll(t).next();return i.value?i.value[i.value.length-1]:void 0}function p(t,e){const i=g(new RegExp(`<meta[^>]+?property=["']${t}["'][^>]*?>`,"gi"),e);if(i)return g(/content=[\"'](.*?)[\"']/gi,i)}})),s("gHkO2");
