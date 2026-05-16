(function () {
  'use strict';

  var KEY = 'AIzaSyDjltC3gDG6OwZq9bEjEKmqJkpmHrl2Jvc';
  var API  = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + KEY;
  var SYS  = 'You are the ClearPath Digital website assistant. ClearPathDigital is a boutique AI consultancy that offers three services: (1) Website Revamp — redesigning outdated websites into fast, modern, conversion-focused sites delivered in 2-4 weeks; (2) SEO & AEO Optimisation — helping businesses rank on Google and get discovered by AI search engines like ChatGPT and Perplexity through on-page SEO, technical SEO, and Answer Engine Optimisation; (3) AI Chatbot Integration — adding a 24/7 AI assistant trained on the client\'s business to answer questions, capture leads, and book calls. To contact or book a discovery call, visitors can email support@clearpathdigital.digital or use the contact page. Be helpful, concise, and friendly. If asked about pricing, say projects start from $999 and encourage them to book a free discovery call.';

  var history = [];
  var isOpen  = false;

  /* ── CSS ── */
  var style = document.createElement('style');
  style.textContent = [
    '#cpd-fab{position:fixed;bottom:28px;right:28px;width:56px;height:56px;border-radius:50%;',
    'background:linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 100%);border:2px solid #c9a84c;',
    'box-shadow:0 4px 20px rgba(201,168,76,.35);cursor:pointer;display:flex;align-items:center;',
    'justify-content:center;z-index:9999;transition:transform .2s,box-shadow .2s;}',

    '#cpd-fab:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(201,168,76,.55);}',
    '#cpd-fab svg{pointer-events:none;}',

    '#cpd-window{position:fixed;bottom:96px;right:28px;width:340px;border-radius:16px;',
    'background:#fff;box-shadow:0 12px 48px rgba(0,0,0,.22);display:flex;flex-direction:column;',
    'z-index:9998;overflow:hidden;transition:opacity .22s,transform .22s;',
    'font-family:"Inter",system-ui,sans-serif;}',

    '#cpd-window.cpd-hidden{opacity:0;transform:translateY(14px) scale(.97);pointer-events:none;}',

    '#cpd-header{background:linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 100%);padding:13px 16px;',
    'display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #c9a84c;}',

    '#cpd-title{color:#fff;font-size:14px;font-weight:600;letter-spacing:.3px;display:flex;',
    'align-items:center;gap:8px;}',
    '#cpd-title::before{content:"";width:8px;height:8px;border-radius:50%;background:#4ade80;}',

    '#cpd-close{background:none;border:none;color:#c9a84c;cursor:pointer;padding:4px;font-size:18px;',
    'line-height:1;display:flex;align-items:center;justify-content:center;border-radius:4px;',
    'transition:background .15s;}',
    '#cpd-close:hover{background:rgba(201,168,76,.18);}',

    '#cpd-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;',
    'min-height:200px;max-height:320px;background:#f8f9fa;}',
    '#cpd-msgs::-webkit-scrollbar{width:4px;}',
    '#cpd-msgs::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:2px;}',

    '.cpd-msg{max-width:84%;padding:10px 13px;border-radius:12px;font-size:13.5px;',
    'line-height:1.55;word-break:break-word;}',

    '.cpd-user{background:linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 100%);color:#fff;',
    'border-radius:12px 12px 2px 12px;align-self:flex-end;}',

    '.cpd-bot{background:#fff;color:#1a1a2e;border:1px solid #e5e7eb;',
    'border-radius:12px 12px 12px 2px;align-self:flex-start;box-shadow:0 1px 3px rgba(0,0,0,.06);}',

    '.cpd-dots{display:flex;gap:4px;align-items:center;padding:11px 14px;background:#fff;',
    'border:1px solid #e5e7eb;border-radius:12px 12px 12px 2px;align-self:flex-start;',
    'box-shadow:0 1px 3px rgba(0,0,0,.06);}',
    '.cpd-dots span{width:7px;height:7px;border-radius:50%;background:#c9a84c;',
    'animation:cpdBounce 1.2s infinite;}',
    '.cpd-dots span:nth-child(2){animation-delay:.2s;}',
    '.cpd-dots span:nth-child(3){animation-delay:.4s;}',
    '@keyframes cpdBounce{0%,80%,100%{transform:translateY(0);opacity:.5;}40%{transform:translateY(-5px);opacity:1;}}',

    '#cpd-input-row{display:flex;padding:10px 12px;gap:8px;border-top:1px solid #e5e7eb;background:#fff;}',

    '#cpd-input{flex:1;border:1px solid #d1d5db;border-radius:8px;padding:9px 12px;',
    'font-size:13.5px;outline:none;font-family:inherit;transition:border-color .2s;}',
    '#cpd-input:focus{border-color:#c9a84c;}',

    '#cpd-send{background:linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 100%);border:none;',
    'border-radius:8px;padding:9px 14px;cursor:pointer;color:#c9a84c;display:flex;',
    'align-items:center;justify-content:center;transition:opacity .2s;min-width:40px;}',
    '#cpd-send:hover{opacity:.82;}',
    '#cpd-send:disabled{opacity:.42;cursor:not-allowed;}',

    '@media(max-width:400px){#cpd-window{width:calc(100vw - 16px);right:8px;bottom:82px;}',
    '#cpd-fab{bottom:16px;right:16px;}}'
  ].join('');
  document.head.appendChild(style);

  /* ── HTML ── */
  document.body.insertAdjacentHTML('beforeend',
    '<button id="cpd-fab" aria-label="Open chat with ClearPath Assistant">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">' +
        '<path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="#c9a84c"/>' +
      '</svg>' +
    '</button>' +

    '<div id="cpd-window" class="cpd-hidden" role="dialog" aria-label="ClearPath Digital chat assistant">' +
      '<div id="cpd-header">' +
        '<div id="cpd-title">ClearPath Assistant</div>' +
        '<button id="cpd-close" aria-label="Close chat">✕</button>' +
      '</div>' +
      '<div id="cpd-msgs" aria-live="polite">' +
        '<div class="cpd-msg cpd-bot">Hi! I\'m your ClearPath Digital assistant. Ask me anything about our AI services — I\'m here to help!</div>' +
      '</div>' +
      '<div id="cpd-input-row">' +
        '<input id="cpd-input" type="text" placeholder="Type your message…" autocomplete="off" maxlength="500" aria-label="Chat message" />' +
        '<button id="cpd-send" aria-label="Send">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none">' +
            '<path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
    '</div>'
  );

  /* ── Elements ── */
  var fab     = document.getElementById('cpd-fab');
  var win     = document.getElementById('cpd-window');
  var msgsEl  = document.getElementById('cpd-msgs');
  var inputEl = document.getElementById('cpd-input');
  var sendBtn = document.getElementById('cpd-send');
  var closeBtn= document.getElementById('cpd-close');

  /* ── Helpers ── */
  function scrollBottom() {
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function addMsg(text, role) {
    var div = document.createElement('div');
    div.className = 'cpd-msg ' + (role === 'user' ? 'cpd-user' : 'cpd-bot');
    div.textContent = text;
    msgsEl.appendChild(div);
    scrollBottom();
    return div;
  }

  function showDots() {
    var d = document.createElement('div');
    d.className = 'cpd-dots';
    d.innerHTML = '<span></span><span></span><span></span>';
    msgsEl.appendChild(d);
    scrollBottom();
    return d;
  }

  function toggleChat() {
    isOpen = !isOpen;
    win.classList.toggle('cpd-hidden', !isOpen);
    if (isOpen) { inputEl.focus(); scrollBottom(); }
  }

  /* ── Send ── */
  function sendMessage() {
    var text = inputEl.value.trim();
    if (!text || sendBtn.disabled) return;

    inputEl.value = '';
    sendBtn.disabled = true;
    addMsg(text, 'user');
    history.push({ role: 'user', parts: [{ text: text }] });

    var dots = showDots();

    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYS }] },
        contents: history
      })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      dots.remove();

      if (data && data.error) {
        console.error('Gemini error:', data.error);
        addMsg('API error: ' + (data.error.message || data.error.status || 'unknown'), 'bot');
        sendBtn.disabled = false;
        inputEl.focus();
        return;
      }

      var reply = (
        data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text
      ) || 'Sorry, I could not get a response right now. Please email support@clearpathdigital.digital';

      history.push({ role: 'model', parts: [{ text: reply }] });
      addMsg(reply, 'bot');
      sendBtn.disabled = false;
      inputEl.focus();
    })
    .catch(function (err) {
      dots.remove();
      console.error('Chatbot fetch error:', err);
      addMsg('Network error — could not reach the AI. Please email support@clearpathdigital.digital', 'bot');
      sendBtn.disabled = false;
      inputEl.focus();
    });
  }

  /* ── Events ── */
  fab.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);
  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
  });

}());
