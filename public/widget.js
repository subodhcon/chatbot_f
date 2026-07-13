var f=Object.defineProperty;var y=(d,c,h)=>c in d?f(d,c,{enumerable:!0,configurable:!0,writable:!0,value:h}):d[c]=h;var o=(d,c,h)=>y(d,typeof c!="symbol"?c+"":c,h);(function(d){"use strict";class c{constructor(e,t){o(this,"options");o(this,"parent");o(this,"launcherBtn");o(this,"windowFrame");o(this,"messagesContainer");o(this,"quickLinksMenu");o(this,"inputForm");o(this,"textInput");o(this,"closeBtn");o(this,"isOpen",!1);o(this,"isMenuOpen",!1);o(this,"touchStartY",0);o(this,"isSwiping",!1);o(this,"typingRow",null);o(this,"handleKeyDown",e=>{if(this.isOpen){if(e.key==="Escape"){this.close();return}if(e.key==="Tab"){const n=Array.from(this.windowFrame.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'));if(n.length===0)return;const i=n[0],r=n[n.length-1];e.shiftKey?this.parent.activeElement===i&&(r.focus(),e.preventDefault()):this.parent.activeElement===r&&(i.focus(),e.preventDefault())}}});o(this,"handleTouchStart",e=>{window.innerWidth>480||(this.touchStartY=e.touches[0].clientY,this.isSwiping=!0,this.windowFrame.style.transition="none")});o(this,"handleTouchMove",e=>{if(!this.isSwiping||window.innerWidth>480)return;const t=e.touches[0].clientY-this.touchStartY;t>0&&(e.preventDefault(),this.windowFrame.style.transform=`translateY(${t}px)`)});o(this,"handleTouchEnd",e=>{if(!this.isSwiping||window.innerWidth>480)return;this.isSwiping=!1,this.windowFrame.style.transition="",e.changedTouches[0].clientY-this.touchStartY>120?(this.close(),setTimeout(()=>{this.windowFrame.style.transform=""},300)):this.windowFrame.style.transform=""});o(this,"streamingBubble",null);this.parent=e,this.options=t,this.render(),this.setupListeners(),this.addInitialMessage()}render(){this.launcherBtn=document.createElement("button"),this.launcherBtn.className="widget-launcher",this.launcherBtn.setAttribute("aria-label","Open Chatbot"),this.launcherBtn.setAttribute("aria-haspopup","dialog"),this.launcherBtn.setAttribute("aria-expanded","false"),this.launcherBtn.innerHTML=`
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
      </svg>
    `,this.windowFrame=document.createElement("div"),this.windowFrame.className="chat-window",this.windowFrame.setAttribute("role","dialog"),this.windowFrame.setAttribute("aria-label",`Chat with ${this.options.botName}`),this.windowFrame.setAttribute("aria-modal","true"),this.windowFrame.setAttribute("tabindex","-1");const e=this.options.avatarUrl?`<img src="${this.options.avatarUrl}" alt="${this.options.botName}">`:'<svg viewBox="0 0 24 24" width="24" height="24" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm0-4h-2V7h2v7z"/></svg>',t=document.createElement("div");t.className="chat-header",t.innerHTML=`
      <div class="drag-handle"></div>
      <div class="chat-header-content">
        <div class="bot-info">
          <div class="bot-avatar">${e}</div>
          <div class="bot-details">
            <div class="bot-name">${this.options.botName}</div>
            <div class="bot-status">
              <span class="bot-status-dot"></span>Online
            </div>
          </div>
        </div>
      </div>
    `,this.closeBtn=document.createElement("button"),this.closeBtn.className="close-button",this.closeBtn.setAttribute("aria-label","Close Chatbot"),this.closeBtn.innerHTML=`
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    `,t.querySelector(".chat-header-content").appendChild(this.closeBtn),this.messagesContainer=document.createElement("div"),this.messagesContainer.className="messages-container",this.messagesContainer.setAttribute("role","log"),this.messagesContainer.setAttribute("aria-live","polite");const i=this.options.quickLinks&&this.options.quickLinks.length>0;this.quickLinksMenu=document.createElement("div"),this.quickLinksMenu.className="quick-links-menu",this.renderQuickLinksMenu(),this.inputForm=document.createElement("form"),this.inputForm.className="input-form",this.inputForm.innerHTML=`
      ${i?`
      <button type="button" class="menu-button" aria-label="Toggle menu" aria-haspopup="true" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      `:""}
      <input type="text" class="message-input" placeholder="Type a message..." required autocomplete="off" aria-label="Write a message">
      <button type="submit" class="send-button" aria-label="Send message">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    `,this.textInput=this.inputForm.querySelector(".message-input");const r=document.createElement("div");r.className="widget-footer",r.innerHTML='Powered by <a href="#" target="_blank">Confluxaa</a>',this.windowFrame.appendChild(t),this.windowFrame.appendChild(this.messagesContainer),this.windowFrame.appendChild(this.quickLinksMenu),this.windowFrame.appendChild(this.inputForm),this.windowFrame.appendChild(r),this.parent.appendChild(this.launcherBtn),this.parent.appendChild(this.windowFrame)}setupListeners(){this.launcherBtn.addEventListener("click",()=>this.toggle()),this.closeBtn.addEventListener("click",()=>this.close());const e=this.inputForm.querySelector(".menu-button");e&&e.addEventListener("click",()=>this.toggleQuickLinksMenu()),this.inputForm.addEventListener("submit",n=>{n.preventDefault();const i=this.textInput.value.trim();i&&(this.textInput.value="",this.addMessage("user",i),this.options.onSendMessage&&this.options.onSendMessage(i))}),this.parent.addEventListener("keydown",this.handleKeyDown);const t=this.windowFrame.querySelector(".chat-header");t&&(t.addEventListener("touchstart",this.handleTouchStart,{passive:!0}),t.addEventListener("touchmove",this.handleTouchMove,{passive:!1}),t.addEventListener("touchend",this.handleTouchEnd,{passive:!0}))}addInitialMessage(){this.addMessage("bot",this.options.greetingMessage)}toggle(){this.isOpen?this.close():this.open()}open(){this.isOpen=!0,this.windowFrame.classList.add("open"),this.launcherBtn.classList.add("hidden"),this.launcherBtn.setAttribute("aria-expanded","true"),this.textInput.focus(),this.options.onOpen&&this.options.onOpen()}close(){this.isOpen=!1,this.windowFrame.classList.remove("open"),this.launcherBtn.classList.remove("hidden"),this.launcherBtn.setAttribute("aria-expanded","false"),setTimeout(()=>this.launcherBtn.focus(),50),this.options.onClose&&this.options.onClose()}addMessage(e,t,n="smooth"){const i=document.createElement("div");i.className=`message-row ${e}`;const r=e==="bot"?this.options.botName.charAt(0).toUpperCase():"G",a=document.createElement("div");a.className="msg-avatar",a.setAttribute("aria-hidden","true"),a.textContent=r;const s=document.createElement("span");s.className="sr-only",s.textContent=`${e==="bot"?this.options.botName:"You"}: `;const l=document.createElement("div");l.className="message-bubble",l.textContent=t,i.appendChild(a),i.appendChild(s),i.appendChild(l),this.messagesContainer.appendChild(i),this.scrollToBottom(n),this.options.onMessageAdded&&this.options.onMessageAdded(e,t)}clearMessages(){this.messagesContainer.innerHTML=""}showTypingIndicator(){if(this.typingRow)return;const e=document.createElement("div");e.className="message-row bot typing-indicator-row";const t=document.createElement("div");t.className="msg-avatar",t.setAttribute("aria-hidden","true"),t.textContent=this.options.botName.charAt(0).toUpperCase();const n=document.createElement("div");n.className="message-bubble typing-bubble",n.setAttribute("aria-label","Bot is typing"),n.setAttribute("aria-live","polite"),n.innerHTML="<span></span><span></span><span>",e.appendChild(t),e.appendChild(n),this.typingRow=e,this.messagesContainer.appendChild(e),this.scrollToBottom()}hideTypingIndicator(){this.typingRow&&(this.typingRow.remove(),this.typingRow=null)}setInputLocked(e){this.textInput.disabled=e;const t=this.inputForm.querySelector(".send-button");t&&(t.disabled=e),this.inputForm.classList.toggle("input-locked",e)}scrollToBottom(e="smooth"){this.messagesContainer.scrollTo({top:this.messagesContainer.scrollHeight,behavior:e})}startStreamingMessage(){const e=document.createElement("div");e.className="message-row bot";const t=document.createElement("div");t.className="msg-avatar",t.setAttribute("aria-hidden","true"),t.textContent=this.options.botName.charAt(0).toUpperCase();const n=document.createElement("span");n.className="sr-only",n.textContent=`${this.options.botName}: `;const i=document.createElement("div");i.className="message-bubble",i.textContent="",e.appendChild(t),e.appendChild(n),e.appendChild(i),this.messagesContainer.appendChild(e),this.scrollToBottom(),this.streamingBubble=i}updateStreamingMessage(e){this.streamingBubble&&(this.streamingBubble.textContent+=e,this.scrollToBottom())}completeStreamingMessage(){this.streamingBubble&&this.options.onMessageAdded&&this.options.onMessageAdded("bot",this.streamingBubble.textContent||""),this.streamingBubble=null}toggleQuickLinksMenu(){this.isMenuOpen?this.closeQuickLinksMenu():this.openQuickLinksMenu()}openQuickLinksMenu(){this.isMenuOpen=!0,this.quickLinksMenu.classList.add("open");const e=this.inputForm.querySelector(".menu-button");e&&e.setAttribute("aria-expanded","true")}closeQuickLinksMenu(){this.isMenuOpen=!1,this.quickLinksMenu.classList.remove("open");const e=this.inputForm.querySelector(".menu-button");e&&e.setAttribute("aria-expanded","false")}renderQuickLinksMenu(){if(!this.options.quickLinks||this.options.quickLinks.length===0){this.quickLinksMenu.style.display="none";return}this.quickLinksMenu.innerHTML="";const e=document.createElement("div");e.className="menu-container",this.options.quickLinks.forEach(t=>{const n=document.createElement("div");n.className="menu-section";const i=document.createElement("div");i.className="menu-section-title",i.textContent=t.section_title||"",n.appendChild(i);const r=document.createElement("div");r.className="menu-items-list",(t.items||[]).forEach(a=>{const s=document.createElement("button");s.type="button",s.className="menu-item-btn";let l="";a.icon?l=this.getIconSvg(a.icon):l=this.getIconSvg("HelpCircle"),s.innerHTML=`
          <div class="menu-item-icon">${l}</div>
          <div class="menu-item-text">
            <span class="menu-item-label">${a.label||""}</span>
            <span class="menu-item-desc">${a.desc||""}</span>
          </div>
        `,s.addEventListener("click",()=>{this.closeQuickLinksMenu(),a.query&&(this.textInput.value="",this.addMessage("user",a.query),this.options.onSendMessage&&this.options.onSendMessage(a.query))}),r.appendChild(s)}),n.appendChild(r),e.appendChild(n)}),this.quickLinksMenu.appendChild(e)}getIconSvg(e){const t={Calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',Briefcase:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',Layers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',LayoutGrid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',Monitor:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',Cloud:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>',Eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',Cpu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>',Gamepad2:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line><rect x="2" y="6" width="20" height="12" rx="3"></rect></svg>',Shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',ShoppingBag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',HelpCircle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',Phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',Globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',Mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',Info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'};return t[e]||t.HelpCircle}destroy(){this.launcherBtn.remove(),this.windowFrame.remove();const e=this.windowFrame.querySelector(".chat-header");e&&(e.removeEventListener("touchstart",this.handleTouchStart),e.removeEventListener("touchmove",this.handleTouchMove),e.removeEventListener("touchend",this.handleTouchEnd))}}function h(u){return{async fetchConfig(e){const t=await fetch(`${u}/bots/${e}`);if(!t.ok)throw new Error("Failed to load bot config");const n=await t.json();if(!n.success)throw new Error(n.error?.message||"Failed to load bot config");return n.data},async initSession(e,t){const n=await fetch(`${u}/conversations`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bot_id:e,browser_info:t})});if(!n.ok)throw new Error("Failed to initialize session");const i=await n.json();if(!i.success)throw new Error(i.error?.message||"Failed to initialize session");return i.data},async fetchHistory(e,t=0,n=50){const i=await fetch(`${u}/widgets/conversations/${e}?skip=${t}&limit=${n}`);if(!i.ok)throw new Error("Failed to load conversation history");const r=await i.json();if(!r.success)throw new Error(r.error?.message||"Failed to load conversation history");return r.data},async postMessage(e,t){const n=await fetch(`${u}/conversations/${e}/messages`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:t})});if(!n.ok)throw new Error("Failed to send message");const i=await n.json();if(!i.success)throw new Error(i.error?.message||"Failed to send message");return i.data},async reportError(e,t,n){try{await fetch(`${u}/errors`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:e,stack:t,url:typeof window<"u"?window.location.href:void 0,userAgent:typeof navigator<"u"?navigator.userAgent:void 0,bot_id:n})})}catch(i){console.warn("Failed to report widget error to backend:",i)}}}}const b=`/* Chatbot Widget Stylesheet */

:host {
  font-family: var(--widget-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
  color-scheme: dark;
}

/* Floating Action Button Launcher */
.widget-launcher {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: var(--widget-launcher-bg, linear-gradient(135deg, #f59e0b 0%, #d97706 100%));
  box-shadow: 0 4px 20px var(--widget-launcher-shadow, rgba(245, 158, 11, 0.4));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  outline: none;
  color: var(--widget-launcher-color, white);
}

.widget-launcher:hover {
  transform: scale(1.05) rotate(5deg);
  box-shadow: 0 6px 24px var(--widget-launcher-hover-shadow, rgba(245, 158, 11, 0.5));
}

.widget-launcher.hidden {
  opacity: 0;
  transform: scale(0) rotate(-45deg);
  pointer-events: none;
}

.widget-launcher:active {
  transform: scale(0.95);
}

.widget-launcher svg {
  width: 26px;
  height: 26px;
  fill: currentColor;
  transition: transform 0.3s ease;
}

/* Chat Window Frame */
.chat-window {
  position: fixed;
  bottom: 90px;
  right: 0;
  width: 380px;
  height: 600px;
  max-height: calc(100vh - 120px);
  background-color: var(--widget-bg, #0f172a);
  border: 1px solid var(--widget-border, #1e293b);
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100000;
}

.chat-window.open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

/* Header */
.chat-header {
  padding: 12px 16px 16px 16px;
  background-color: var(--widget-header-bg, #1e293b);
  border-bottom: 1px solid var(--widget-header-border, #334155);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.drag-handle {
  display: none;
}

.chat-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.bot-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.bot-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.bot-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bot-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bot-name {
  font-size: 14px;
  font-weight: 700;
  color: #f8fafc;
}

.bot-status {
  font-size: 10px;
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 4px;
}

.bot-status-dot {
  width: 6px;
  height: 6px;
  background-color: #10b981;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.close-button {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: #334155;
  color: #f1f5f9;
}

/* Messages Area */
.messages-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #020617;
  scrollbar-width: thin;
  scrollbar-color: #334155 #020617;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: #020617;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: #334155;
  border-radius: 3px;
}

.message-row {
  display: flex;
  gap: 8px;
  max-width: 85%;
}

.message-row.user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-row.bot {
  margin-right: auto;
}

.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.message-row.bot .msg-avatar {
  background-color: var(--widget-bot-avatar-bg, rgba(99, 102, 241, 0.1));
  color: var(--widget-bot-avatar-color, #818cf8);
  border: 1px solid var(--widget-bot-avatar-border, rgba(99, 102, 241, 0.2));
}

.message-row.user .msg-avatar {
  background-color: var(--widget-user-avatar-bg, #334155);
  color: var(--widget-user-avatar-color, #cbd5e1);
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.message-row.bot .message-bubble {
  background-color: var(--widget-bot-bubble-bg, #0f172a);
  border: 1px solid var(--widget-bot-bubble-border, #1e293b);
  color: var(--widget-bot-bubble-color, #e2e8f0);
  border-top-left-radius: 0;
}

.message-row.user .message-bubble {
  background-color: var(--widget-user-bubble-bg, #4f46e5);
  color: var(--widget-user-bubble-color, #ffffff);
  border-top-right-radius: 0;
}

/* Message Input Form */
.input-form {
  padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
  background-color: var(--widget-input-form-bg, #0f172a);
  border-top: 1px solid var(--widget-input-form-border, #1e293b);
  display: flex;
  gap: 8px;
  box-sizing: border-box;
}

.message-input {
  flex: 1;
  background-color: var(--widget-input-bg, #020617);
  border: 1px solid var(--widget-input-border, #1e293b);
  border-radius: 12px;
  padding: 12px 14px; /* Increased padding for touch target height */
  font-size: 14px;    /* Prevents iOS zoom on focus */
  color: var(--widget-input-color, #f8fafc);
  outline: none;
  transition: border-color 0.2s ease;
  height: 44px;       /* 44px standard mobile touch size */
  box-sizing: border-box;
}

.message-input:focus {
  border-color: var(--widget-primary, #f59e0b);
}

.send-button {
  background-color: var(--widget-send-btn-bg, #f59e0b);
  color: var(--widget-send-btn-color, white);
  border: none;
  border-radius: 12px;
  width: 44px;        /* Match touch size */
  height: 44px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.send-button:hover {
  background-color: var(--widget-send-btn-hover-bg, #d97706);
}

.send-button:active {
  transform: scale(0.92);
}

.send-button svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

/* Footer branding */
.widget-footer {
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
  background-color: #0f172a;
  text-align: center;
  font-size: 10px;
  color: #475569;
  border-top: 1px solid #1e293b;
}

.widget-footer a {
  color: #f59e0b;
  text-decoration: none;
  font-weight: 600;
}

/* Animations */
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.5; }
}

/* Responsive Rules for Small Devices */
@media (max-width: 480px) {
  .chat-window {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
    border: none;
  }

  .drag-handle {
    display: block;
    width: 40px;
    height: 4px;
    background-color: #475569;
    border-radius: 2px;
    margin-bottom: 4px;
    cursor: grab;
  }

  .chat-header {
    padding: 8px 16px calc(16px + env(safe-area-inset-top));
    height: auto;
  }
}

/* Typing Indicator Bubble */
.typing-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 12px 16px !important;
  min-width: 52px;
}

.typing-bubble span {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #f59e0b;
  animation: typing-bounce 1.2s ease-in-out infinite;
}

.typing-bubble span:nth-child(1) { animation-delay: 0s; }
.typing-bubble span:nth-child(2) { animation-delay: 0.2s; }
.typing-bubble span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%            { transform: translateY(-5px); opacity: 1; }
}

/* Locked Input State */
.input-form.input-locked .message-input,
.input-form.input-locked .send-button {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Screen Reader Only Utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Menu Button Styling */
.menu-button {
  background: transparent;
  color: var(--widget-menu-btn-color, #64748b);
  border: none;
  width: 44px;
  height: 44px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease, transform 0.2s ease;
  flex-shrink: 0;
  border-radius: 12px;
  padding: 0;
  box-sizing: border-box;
}

.menu-button:hover {
  color: var(--widget-menu-btn-hover-color, #e2e8f0);
}

.menu-button:active {
  transform: scale(0.92);
}

.menu-button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.input-form.input-locked .menu-button {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Quick Links Menu Styling */
.quick-links-menu {
  position: absolute;
  bottom: 80px;
  left: 12px;
  right: 12px;
  background-color: var(--widget-bg, #0f172a);
  border: 1px solid var(--widget-border, #1e293b);
  border-radius: 16px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.4);
  max-height: 280px;
  overflow-y: auto;
  z-index: 100010;
  opacity: 0;
  transform: translateY(10px) scale(0.95);
  pointer-events: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 12px;
  box-sizing: border-box;
}

.quick-links-menu.open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.menu-section {
  margin-bottom: 12px;
}

.menu-section:last-child {
  margin-bottom: 0;
}

.menu-section-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--widget-primary, #f59e0b);
  margin-bottom: 6px;
  letter-spacing: 0.05em;
}

.menu-items-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

@media (min-width: 320px) {
  .menu-items-list {
    grid-template-columns: 1fr 1fr;
  }
}

.menu-item-btn {
  background-color: var(--widget-bot-bubble-bg, #1e293b);
  border: 1px solid var(--widget-border, #334155);
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.menu-item-btn:hover {
  background-color: var(--widget-primary, #f59e0b);
  border-color: var(--widget-primary, #f59e0b);
}

.menu-item-btn:hover .menu-item-icon {
  color: white;
}

.menu-item-btn:hover .menu-item-label {
  color: white;
}

.menu-item-btn:hover .menu-item-desc {
  color: rgba(255, 255, 255, 0.7);
}

.menu-item-icon {
  width: 16px;
  height: 16px;
  color: var(--widget-primary, #f59e0b);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-item-icon svg {
  width: 100%;
  height: 100%;
}

.menu-item-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.menu-item-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--widget-bot-bubble-color, #e2e8f0);
  line-height: 1.2;
}

.menu-item-desc {
  font-size: 9px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
`;class p{constructor(e){o(this,"config");o(this,"container",null);o(this,"shadowRoot",null);o(this,"chatWindow",null);o(this,"sessionId","");o(this,"fallbackMessage","I'm sorry, I am unable to assist with that query at the moment.");o(this,"pendingMessages",[]);o(this,"api",h("http://localhost:8000/api/v1/public"));o(this,"socket",null);o(this,"reconnectAttempts",0);o(this,"maxReconnectAttempts",5);o(this,"reconnectInterval",3e3);o(this,"onOpen");o(this,"onClose");o(this,"onMessage");o(this,"handleResize",()=>{this.chatWindow&&this.chatWindow.isOpen&&this.updateMobileLayout(!0)});o(this,"handleViewportChange",()=>{if(!(!this.container||typeof window>"u"||!window.visualViewport)&&window.innerWidth<=480&&this.chatWindow&&this.chatWindow.isOpen){const e=window.visualViewport;Object.assign(this.container.style,{top:`${e.offsetTop}px`,left:`${e.offsetLeft}px`,width:`${e.width}px`,height:`${e.height}px`})}});this.config=e;const t=e.apiBase;t&&(this.api=h(t)),this.init()}reportWidgetError(e){const t=e instanceof Error?e.message:String(e),n=e instanceof Error?e.stack:void 0;this.api.reportError(t,n,this.config.botId)}init(){console.log("ChatbotWidget initialized with config:",this.config);try{this.injectContainer(),this.loadWidgetData()}catch(e){console.error("ChatbotWidget: Initialization failed:",e),this.reportWidgetError(e)}}async loadWidgetData(){try{const e=await this.api.fetchConfig(this.config.botId);this.fallbackMessage=e.fallback_message||this.fallbackMessage;const t=`confluxaa_session_${this.config.botId}`;let n="",i=[];if(typeof window<"u"&&(n=localStorage.getItem(t)||""),n)try{console.log("Attempting session recovery for ID:",n);const s=await this.api.fetchHistory(n);s&&s.conversation&&s.conversation.status==="active"?(this.sessionId=n,i=s.messages||[],console.log("Session recovered successfully.")):(console.log("Recovered session was closed or invalid. Initializing new session."),typeof window<"u"&&localStorage.removeItem(t))}catch(s){console.warn("Session recovery failed or session is invalid, clearing storage:",s),typeof window<"u"&&localStorage.removeItem(t)}let r="";if(!this.sessionId){const s=typeof window<"u"?{language:navigator.language,userAgent:navigator.userAgent,screenWidth:window.screen.width,screenHeight:window.screen.height}:{},l=await this.api.initSession(this.config.botId,s);this.sessionId=l.conversation_id,r=l.welcome_message,typeof window<"u"&&localStorage.setItem(t,this.sessionId)}const a=e.extra_config||{};if(this.container&&this.shadowRoot){const s=this.config.widgetColor||a.widget_color||"#f59e0b",l=this.config.widgetTheme||a.widget_theme||"dark",m=this.config.fontFamily||a.font_family||"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",w=a.launcher_bg||`linear-gradient(135deg, ${s} 0%, ${s}dd 100%)`,g=a.user_bubble_color||s;this.container.style.setProperty("--widget-primary",s),this.container.style.setProperty("--widget-font-family",m),this.container.style.setProperty("--widget-launcher-bg",w),this.container.style.setProperty("--widget-user-bubble-bg",g),this.container.style.setProperty("--widget-send-btn-bg",g),l==="light"?(this.container.style.setProperty("--widget-bg","#ffffff"),this.container.style.setProperty("--widget-border","#e2e8f0"),this.container.style.setProperty("--widget-header-bg","#f1f5f9"),this.container.style.setProperty("--widget-header-border","#e2e8f0"),this.container.style.setProperty("--widget-bot-bubble-bg","#f1f5f9"),this.container.style.setProperty("--widget-bot-bubble-border","#e2e8f0"),this.container.style.setProperty("--widget-bot-bubble-color","#0f172a"),this.container.style.setProperty("--widget-input-form-bg","#ffffff"),this.container.style.setProperty("--widget-input-form-border","#e2e8f0"),this.container.style.setProperty("--widget-input-bg","#f8fafc"),this.container.style.setProperty("--widget-input-border","#cbd5e1"),this.container.style.setProperty("--widget-input-color","#0f172a"),this.container.style.setProperty("--widget-bot-avatar-bg","#e2e8f0"),this.container.style.setProperty("--widget-bot-avatar-color",s)):(this.container.style.setProperty("--widget-bg","#0f172a"),this.container.style.setProperty("--widget-border","#1e293b"),this.container.style.setProperty("--widget-header-bg","#1e293b"),this.container.style.setProperty("--widget-header-border","#334155"),this.container.style.setProperty("--widget-bot-bubble-bg","#0f172a"),this.container.style.setProperty("--widget-bot-bubble-border","#1e293b"),this.container.style.setProperty("--widget-bot-bubble-color","#e2e8f0"),this.container.style.setProperty("--widget-input-form-bg","#0f172a"),this.container.style.setProperty("--widget-input-form-border","#1e293b"),this.container.style.setProperty("--widget-input-bg","#020617"),this.container.style.setProperty("--widget-input-border","#1e293b"),this.container.style.setProperty("--widget-input-color","#f8fafc"),this.container.style.setProperty("--widget-bot-avatar-bg","rgba(245, 158, 11, 0.1)"),this.container.style.setProperty("--widget-bot-avatar-color","#fbbf24"))}if(this.chatWindow=new c(this.shadowRoot,{botName:e.name||this.config.botName||"AI Assistant",avatarUrl:e.avatar_url||this.config.avatarUrl||null,greetingMessage:r||e.greeting_message||"Hello!",quickLinks:a.quick_links||[],onOpen:()=>{this.updateMobileLayout(!0),this.connectWebSocket(),this.triggerHook("onOpen")},onClose:()=>{this.updateMobileLayout(!1),this.disconnectWebSocket(),this.triggerHook("onClose")},onMessageAdded:(s,l)=>this.triggerHook("onMessage",{sender:s,content:l}),onSendMessage:s=>this.handleSendMessage(s)}),i.length>0){this.chatWindow.clearMessages();for(const s of i)this.chatWindow.addMessage(s.sender,s.content,"auto")}if(this.pendingMessages.length>0){const s=[...this.pendingMessages];this.pendingMessages=[];for(const l of s)await this.handleSendMessage(l)}}catch(e){console.error("ChatbotWidget: Failed to load backend configuration:",e),this.reportWidgetError(e);try{this.chatWindow=new c(this.shadowRoot,{botName:this.config.botName||"Assistant",avatarUrl:this.config.avatarUrl||null,greetingMessage:"Connection Error: We are currently experiencing connection issues. Please try again later.",quickLinks:[],onOpen:()=>{this.updateMobileLayout(!0),this.triggerHook("onOpen")},onClose:()=>{this.updateMobileLayout(!1),this.triggerHook("onClose")}})}catch(t){console.error("ChatbotWidget: Critical error rendering fallback UI:",t)}}}async handleSendMessage(e){if(!this.sessionId){this.pendingMessages.push(e);return}if(this.chatWindow){this.chatWindow.setInputLocked(!0),this.chatWindow.showTypingIndicator();try{const t=await this.api.postMessage(this.sessionId,e);this.chatWindow.hideTypingIndicator(),this.chatWindow.addMessage("bot",t.content)}catch(t){console.error("ChatbotWidget: Failed to send message:",t),this.reportWidgetError(t),this.chatWindow.hideTypingIndicator(),this.chatWindow.addMessage("bot",this.fallbackMessage)}finally{this.chatWindow.setInputLocked(!1)}}}triggerHook(e,t={}){const n=this.config[e]||this[e];typeof n=="function"&&setTimeout(()=>{try{n({sessionId:this.sessionId,timestamp:Date.now(),...t})}catch(i){console.error(`ChatbotWidget: Error in ${e} callback:`,i)}},0)}injectContainer(){if(typeof document>"u")return;const e=document.getElementById("chatbot-widget-container");e&&e.remove(),this.container=document.createElement("div"),this.container.id="chatbot-widget-container",Object.assign(this.container.style,{position:"fixed",bottom:"20px",right:"20px",zIndex:"999999",width:"auto",height:"auto",display:"block"}),this.shadowRoot=this.container.attachShadow({mode:"open"});const t=document.createElement("style");t.textContent=b,this.shadowRoot.appendChild(t),document.body.appendChild(this.container),window.addEventListener("resize",this.handleResize),typeof window<"u"&&window.visualViewport&&(window.visualViewport.addEventListener("resize",this.handleViewportChange),window.visualViewport.addEventListener("scroll",this.handleViewportChange))}updateMobileLayout(e){if(!(!this.container||typeof window>"u"))if(e&&window.innerWidth<=480){const t=window.visualViewport,n=t?`${t.height}px`:"100%",i=t?`${t.offsetTop}px`:"0",r=t?`${t.offsetLeft}px`:"0",a=t?`${t.width}px`:"100%";Object.assign(this.container.style,{bottom:"auto",right:"auto",left:r,top:i,width:a,height:n})}else Object.assign(this.container.style,{bottom:"20px",right:"20px",left:"auto",top:"auto",width:"auto",height:"auto"})}destroy(){this.disconnectWebSocket(),window.removeEventListener("resize",this.handleResize),typeof window<"u"&&window.visualViewport&&(window.visualViewport.removeEventListener("resize",this.handleViewportChange),window.visualViewport.removeEventListener("scroll",this.handleViewportChange)),this.chatWindow&&(this.chatWindow.destroy(),this.chatWindow=null),this.container&&(this.container.remove(),this.container=null,this.shadowRoot=null),console.log("ChatbotWidget destroyed and cleaned up.")}getWebSocketUrl(){return`${(this.config.apiBase||"http://localhost:8000/api/v1/public").replace(/^http:/,"ws:").replace(/^https:/,"wss:").replace(/\/public$/,"/ws")}/${this.sessionId}`}connectWebSocket(){if(this.socket&&(this.socket.readyState===WebSocket.OPEN||this.socket.readyState===WebSocket.CONNECTING))return;const e=this.getWebSocketUrl();console.log("Connecting WebSocket to:",e);try{this.socket=new WebSocket(e),this.socket.onopen=()=>{console.log("WebSocket connection established successfully."),this.reconnectAttempts=0},this.socket.onmessage=t=>{try{const n=JSON.parse(t.data);if(console.log("WebSocket message received:",n),!this.chatWindow)return;n&&n.event==="typing"?n.state===!0?this.chatWindow.showTypingIndicator():this.chatWindow.hideTypingIndicator():n&&n.event==="stream_start"?this.chatWindow.startStreamingMessage():n&&n.event==="stream_chunk"?this.chatWindow.updateStreamingMessage(n.text):n&&n.event==="stream_end"&&this.chatWindow.completeStreamingMessage()}catch{console.warn("Failed to parse WebSocket message:",t.data)}},this.socket.onclose=t=>{console.log("WebSocket connection closed:",t),this.handleReconnect()},this.socket.onerror=t=>{console.error("WebSocket error encountered:",t),this.reportWidgetError("WebSocket error encountered")}}catch(t){console.error("Failed to initialize WebSocket:",t),this.reportWidgetError(t),this.handleReconnect()}}handleReconnect(){if(this.reconnectAttempts<this.maxReconnectAttempts){this.reconnectAttempts++;const e=this.reconnectInterval*Math.min(this.reconnectAttempts,4);console.log(`Attempting WebSocket reconnection in ${e}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`),setTimeout(()=>{this.connectWebSocket()},e)}else console.error("Max WebSocket reconnection attempts reached.")}disconnectWebSocket(){this.socket&&(this.socket.onclose=null,this.socket.close(),this.socket=null,console.log("WebSocket connection manually closed."))}static isValidUuid(e){return/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e)}static autoLoad(){if(typeof document>"u")return;const e=document.currentScript||document.querySelector("script[src*='widget.js']");if(!e){console.warn("ChatbotWidget: Script tag could not be identified.");return}const t=e.getAttribute("data-bot-id")||e.dataset.botId,n=e.getAttribute("data-api-url")||void 0,i=e.getAttribute("data-widget-color")||void 0,r=e.getAttribute("data-widget-theme")||void 0;if(!t){console.error("ChatbotWidget: 'data-bot-id' attribute is missing on the script tag.");return}if(!this.isValidUuid(t)){console.error(`ChatbotWidget: Invalid UUID format for bot-id "${t}".`);return}new p({botId:t,...n?{apiBase:n}:{},...i?{widgetColor:i}:{},...r?{widgetTheme:r}:{}})}}typeof window<"u"&&(window.ChatbotWidget=p,document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>p.autoLoad()):p.autoLoad()),d.ChatbotWidget=p,Object.defineProperty(d,Symbol.toStringTag,{value:"Module"})})(this.ChatbotWidget=this.ChatbotWidget||{});
