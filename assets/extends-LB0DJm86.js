import{n as e}from"./rolldown-runtime-DF2fYuay.js";import{i as t}from"./vendor-react-CIQ0kHvD.js";import{At as n,Ct as r,D as i,E as a,It as o,Q as s,Y as c}from"./useSize-229M87MN.js";var l=e(t());function u(e){return e.replace(/-(.)/g,(e,t)=>t.toUpperCase())}function d(e,t){o(e,`[@ant-design/icons] ${t}`)}function f(e){return typeof e==`object`&&typeof e.name==`string`&&typeof e.theme==`string`&&(typeof e.icon==`object`||typeof e.icon==`function`)}function p(e={}){return Object.keys(e).reduce((t,n)=>{let r=e[n];switch(n){case`class`:t.className=r,delete t.class;break;default:delete t[n],t[u(n)]=r}return t},{})}function m(e,t,n){return n?l.createElement(e.tag,{key:t,...p(e.attrs),...n},(e.children||[]).map((n,r)=>m(n,`${t}-${e.tag}-${r}`))):l.createElement(e.tag,{key:t,...p(e.attrs)},(e.children||[]).map((n,r)=>m(n,`${t}-${e.tag}-${r}`)))}function h(e){return s(e)[0]}function g(e){return e?Array.isArray(e)?e:[e]:[]}var _=`
.anticon {
  display: inline-flex;
  align-items: center;
  color: inherit;
  font-style: normal;
  line-height: 0;
  text-align: center;
  text-transform: none;
  vertical-align: -0.125em;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.anticon > * {
  line-height: 1;
}

.anticon svg {
  display: inline-block;
  vertical-align: inherit;
}

.anticon::before {
  display: none;
}

.anticon .anticon-icon {
  display: block;
}

.anticon[tabindex] {
  cursor: pointer;
}

.anticon-spin {
  -webkit-animation: loadingCircle 1s infinite linear;
  animation: loadingCircle 1s infinite linear;
}

@-webkit-keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
`,v=e=>{let{csp:t,prefixCls:n,layer:o}=(0,l.useContext)(i),s=_;n&&(s=s.replace(/anticon/g,n)),o&&(s=`@layer ${o} {\n${s}\n}`),(0,l.useEffect)(()=>{let n=e.current,i=a(n);r(s,`@ant-design-icons`,{prepend:!o,csp:t,attachTo:i})},[])},y={primaryColor:`#333`,secondaryColor:`#E6E6E6`,calculated:!1};function b({primaryColor:e,secondaryColor:t}){y.primaryColor=e,y.secondaryColor=t||h(e),y.calculated=!!t}function x(){return{...y}}var S=e=>{let{icon:t,className:n,onClick:r,style:i,primaryColor:a,secondaryColor:o,...s}=e,c=l.useRef(null),u=y;if(a&&(u={primaryColor:a,secondaryColor:o||h(a)}),v(c),d(f(t),`icon should be icon definiton, but got ${t}`),!f(t))return null;let p=t;return p&&typeof p.icon==`function`&&(p={...p,icon:p.icon(u.primaryColor,u.secondaryColor)}),m(p.icon,`svg-${p.name}`,{className:n,onClick:r,style:i,"data-icon":p.name,width:`1em`,height:`1em`,fill:`currentColor`,"aria-hidden":`true`,...s,ref:c})};S.displayName=`IconReact`,S.getTwoToneColors=x,S.setTwoToneColors=b;function C(e){let[t,n]=g(e);return S.setTwoToneColors({primaryColor:t,secondaryColor:n})}function w(){let e=S.getTwoToneColors();return e.calculated?[e.primaryColor,e.secondaryColor]:e.primaryColor}function T(){return T=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},T.apply(this,arguments)}C(c.primary);var E=l.forwardRef((e,t)=>{let{className:r,icon:a,spin:o,rotate:s,tabIndex:c,onClick:u,twoToneColor:d,...f}=e,{prefixCls:p=`anticon`,rootClassName:m}=l.useContext(i),h=n(m,p,{[`${p}-${a.name}`]:!!a.name,[`${p}-spin`]:!!o||a.name===`loading`},r),_=c;_===void 0&&u&&(_=-1);let v=s?{msTransform:`rotate(${s}deg)`,transform:`rotate(${s}deg)`}:void 0,[y,b]=g(d);return l.createElement(`span`,T({role:`img`,"aria-label":a.name},f,{ref:t,tabIndex:_,onClick:u,className:h}),l.createElement(S,{icon:a,primaryColor:y,secondaryColor:b,style:v}))});E.getTwoToneColor=w,E.setTwoToneColor=C;var D=e=>`${e}-css-var`,O={MAC_ENTER:3,BACKSPACE:8,TAB:9,NUM_CENTER:12,ENTER:13,SHIFT:16,CTRL:17,ALT:18,PAUSE:19,CAPS_LOCK:20,ESC:27,SPACE:32,PAGE_UP:33,PAGE_DOWN:34,END:35,HOME:36,LEFT:37,UP:38,RIGHT:39,DOWN:40,PRINT_SCREEN:44,INSERT:45,DELETE:46,ZERO:48,ONE:49,TWO:50,THREE:51,FOUR:52,FIVE:53,SIX:54,SEVEN:55,EIGHT:56,NINE:57,QUESTION_MARK:63,A:65,B:66,C:67,D:68,E:69,F:70,G:71,H:72,I:73,J:74,K:75,L:76,M:77,N:78,O:79,P:80,Q:81,R:82,S:83,T:84,U:85,V:86,W:87,X:88,Y:89,Z:90,META:91,WIN_KEY_RIGHT:92,CONTEXT_MENU:93,NUM_ZERO:96,NUM_ONE:97,NUM_TWO:98,NUM_THREE:99,NUM_FOUR:100,NUM_FIVE:101,NUM_SIX:102,NUM_SEVEN:103,NUM_EIGHT:104,NUM_NINE:105,NUM_MULTIPLY:106,NUM_PLUS:107,NUM_MINUS:109,NUM_PERIOD:110,NUM_DIVISION:111,F1:112,F2:113,F3:114,F4:115,F5:116,F6:117,F7:118,F8:119,F9:120,F10:121,F11:122,F12:123,NUMLOCK:144,SEMICOLON:186,DASH:189,EQUALS:187,COMMA:188,PERIOD:190,SLASH:191,APOSTROPHE:192,SINGLE_QUOTE:222,OPEN_SQUARE_BRACKET:219,BACKSLASH:220,CLOSE_SQUARE_BRACKET:221,WIN_KEY:224,MAC_FF_META:224,WIN_IME:229,isTextModifyingKeyEvent:function(e){let{keyCode:t}=e;if(e.altKey&&!e.ctrlKey||e.metaKey||t>=O.F1&&t<=O.F12)return!1;switch(t){case O.ALT:case O.CAPS_LOCK:case O.CONTEXT_MENU:case O.CTRL:case O.DOWN:case O.END:case O.ESC:case O.HOME:case O.INSERT:case O.LEFT:case O.MAC_FF_META:case O.META:case O.NUMLOCK:case O.NUM_CENTER:case O.PAGE_DOWN:case O.PAGE_UP:case O.PAUSE:case O.PRINT_SCREEN:case O.RIGHT:case O.SHIFT:case O.UP:case O.WIN_KEY:case O.WIN_KEY_RIGHT:return!1;default:return!0}},isCharacterKey:function(e){if(e>=O.ZERO&&e<=O.NINE||e>=O.NUM_ZERO&&e<=O.NUM_MULTIPLY||e>=O.A&&e<=O.Z||window.navigator.userAgent.indexOf(`WebKit`)!==-1&&e===0)return!0;switch(e){case O.SPACE:case O.QUESTION_MARK:case O.NUM_PLUS:case O.NUM_MINUS:case O.NUM_PERIOD:case O.NUM_DIVISION:case O.SEMICOLON:case O.DASH:case O.EQUALS:case O.COMMA:case O.PERIOD:case O.SLASH:case O.APOSTROPHE:case O.SINGLE_QUOTE:case O.OPEN_SQUARE_BRACKET:case O.BACKSLASH:case O.CLOSE_SQUARE_BRACKET:return!0;default:return!1}},isEditableTarget:function(e){let t=e.target;if(!(t instanceof HTMLElement))return!1;let n=t.tagName;return!!(n===`INPUT`||n===`TEXTAREA`||n===`SELECT`||t.isContentEditable)}},k=()=>({height:0,opacity:0}),A=e=>{let{scrollHeight:t}=e;return{height:t,opacity:1}},j=e=>({height:e?e.offsetHeight:0}),M=(e,t)=>t?.deadline===!0||t.propertyName===`height`,N=(e=`ant`)=>({motionName:`${e}-motion-collapse`,onAppearStart:k,onEnterStart:k,onAppearActive:A,onEnterActive:A,onLeaveStart:j,onLeaveActive:k,onAppearEnd:M,onEnterEnd:M,onLeaveEnd:M,motionDeadline:500}),P=(e,t,n)=>n===void 0?`${e}-${t}`:n;function F(){return F=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)({}).hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},F.apply(null,arguments)}export{D as a,O as i,P as n,E as o,N as r,F as t};