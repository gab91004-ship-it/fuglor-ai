/**
 * singleFileExporter.ts
 * Generates an all-in-one standalone single-file HTML/JS/CSS distribution
 * of fuglor AI for immediate publishing and zero-dependency static deployment.
 */

const STUDY_RESPONSE_JSON = JSON.stringify(`Ecco le risorse e le presentazioni di studio disponibili su Canva:

### 📚 Presentazioni e Schemi per lo Studio (Canva)

1. **🏛️ Storia dell’arte — Storia dell’arte egizia**  
   [Apri presentazione Canva: Storia dell’arte egizia](https://canva.link/0z8s32plgcfa9va)

2. **🧪 Scienze — Il rame**  
   [Apri presentazione Canva: Scienze — Il rame](https://canva.link/lr0o104o7gl1il8)

3. **🏺 Storia — Le popolazioni precolombiane**  
   [Apri presentazione Canva: Storia — Le popolazioni precolombiane](https://canva.link/8vge6eqzxvtmx71)

4. **🌍 Geografia — L’Unione Europea**  
   [Apri presentazione Canva: Geografia — L’Unione Europea](https://canva.link/wun5mnzlk26ilsp)

5. **📖 Letteratura — Introduzione della Divina Commedia**  
   [Apri presentazione Canva: Letteratura — Introduzione della Divina Commedia](https://canva.link/89mxxwp517ghav5)

6. **🗺️ Geografia — Viterbo e provincia**  
   [Apri presentazione Canva: Geografia — Viterbo e provincia](https://canva.link/k52rz377mstfogj)

7. **🎨 Storia dell’arte — Yayoi Kusama (video lezione)**  
   [Apri presentazione Canva: Storia dell’arte — Yayoi Kusama video lezione](https://canva.link/emxp4ouoe30xwip)

8. **🏛️ Storia dell’arte — L’anfiteatro**  
   [Apri presentazione Canva: Storia dell’arte — L’anfiteatro](https://canva.link/yht9x9i9jr7i4kp)

9. **🪐 Scienze — Il sistema solare**  
   [Apri presentazione Canva: Scienze — Il sistema solare](https://canva.link/2wznzjsttqe1cfw)

10. **🦕 Cultura generale — Mostro di Loch Ness**  
    [Apri presentazione Canva: Cultura generale — Mostro di Loch Ness](https://canva.link/jpwcq7jfhzdfmam)

11. **⛪ Storia — La riforma della Chiesa**  
    [Apri presentazione Canva: Storia — La riforma della Chiesa](https://canva.link/xusmyto06cqizc8)

---
*Puoi chiedermi di preparare riassunti, schemi o quiz di verifica su ciascuno di questi argomenti!*`);

const DEFAULT_RESPONSE_JSON = JSON.stringify(`Fuglor AI is online and operational. Crafted by **Federico, Luca, and Gabriel**, this standalone edition allows instant offline distribution.

How may I assist your study or development today?`);

export function generateStandaloneHTML(): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fuglor AI · Standalone Web Edition</title>
  <meta name="description" content="Fuglor AI - Sleek, modern, dark-themed AI chat platform developed by Federico, Luca, and Gabriel." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400..700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg-canvas: #0B0F17;
      --bg-surface: #131924;
      --bg-sidebar: #0E131C;
      --border-subtle: rgba(255, 255, 255, 0.08);
      --accent: #0284c7;
      --accent-glow: rgba(56, 189, 248, 0.2);
      --text-primary: #F8FAFC;
      --text-muted: #94A3B8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-canvas);
      color: var(--text-primary);
      font-family: 'Google Sans Flex', 'Google Sans', system-ui, sans-serif;
      height: 100vh;
      display: flex;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }
    /* Layout */
    #sidebar {
      width: 280px;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }
    #main {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      background: var(--bg-canvas);
      min-width: 0;
    }
    /* Top Bar */
    header {
      height: 64px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      background: rgba(14, 19, 28, 0.85);
      backdrop-filter: blur(12px);
      z-index: 10;
    }
    .brand-mark {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
    }
    .brand-badge {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      font-family: 'JetBrains Mono', monospace;
    }
    /* Chat Area */
    #chat-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    }
    .msg-card {
      display: flex;
      gap: 16px;
      animation: fadeIn 0.2s ease;
    }
    .msg-avatar {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .avatar-user { background: #1e293b; color: #94a3b8; }
    .avatar-ai { background: linear-gradient(135deg, #0284c7, #6366f1); color: #fff; }
    .msg-body {
      flex: 1;
      line-height: 1.65;
      font-size: 15px;
      color: #e2e8f0;
      word-break: break-word;
    }
    .msg-body pre {
      background: #080c14;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      overflow-x: auto;
      margin: 12px 0;
      color: #38bdf8;
    }
    /* Input */
    #input-box {
      padding: 20px 24px;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    }
    .input-container {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .input-container:focus-within {
      border-color: rgba(56, 189, 248, 0.4);
    }
    textarea {
      background: transparent;
      border: none;
      outline: none;
      color: #fff;
      font-family: inherit;
      font-size: 15px;
      resize: none;
      height: 48px;
      line-height: 1.5;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary {
      background: #0284c7;
      color: #fff;
    }
    .btn-primary:hover { background: #0369a1; }
    .btn-ghost {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border-subtle);
    }
    .btn-ghost:hover {
      background: rgba(255,255,255,0.05);
      color: #fff;
    }
    /* Team Modal */
    #team-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 20px;
    }
    .modal-card {
      background: #111722;
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      max-width: 620px;
      width: 100%;
      padding: 32px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    .team-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }
    .member-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>

  <!-- Sidebar -->
  <aside id="sidebar">
    <div style="padding: 20px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: 700; font-size: 16px; color: #fff;">Fuglor AI</span>
      <button class="btn btn-primary" onclick="newChat()" style="padding: 5px 10px; font-size: 12px;">+ New Chat</button>
    </div>
    <div id="session-list" style="flex: 1; overflow-y: auto; padding: 12px;"></div>
    <div style="padding: 16px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 8px;">
      <button class="btn btn-ghost" onclick="openTeamModal()" style="width: 100%; justify-content: center;">
        👥 Meet the Creators
      </button>
      <div style="text-align: center; font-size: 11px; opacity: 0.7;">
        Federico · Luca · Gabriel
      </div>
    </div>
  </aside>

  <!-- Main Viewport -->
  <main id="main">
    <header>
      <div class="brand-mark">
        <span>Fuglor AI</span>
        <span class="brand-badge">SINGLE-FILE EDITION</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <select id="model-select" style="background: #16202e; color: #e2e8f0; border: 1px solid var(--border-subtle); padding: 6px 12px; border-radius: 6px; font-size: 13px; outline: none;">
          <option value="fuglor-speed">Fuglor Speed (Flash)</option>
          <option value="fuglor-architect">Fuglor Architect (Reasoning)</option>
          <option value="fuglor-lite">Fuglor Lite (Fast)</option>
        </select>
        <button class="btn btn-ghost" onclick="openTeamModal()">Team</button>
      </div>
    </header>

    <div id="chat-scroll">
      <div id="welcome-banner" style="text-align: center; margin: 40px auto 20px; max-width: 500px;">
        <h2 style="font-size: 26px; font-weight: 700; margin-bottom: 8px; color: #fff;">Welcome to Fuglor AI</h2>
        <p style="color: var(--text-muted); font-size: 14px; line-height: 1.6;">
          A sleek, modern dark-themed AI chat platform created by <strong>Federico, Luca, and Gabriel</strong>. Fast, articulate, and distraction-free.
        </p>
        <div style="margin-top: 24px;">
          <button onclick="runHelpStudying()" style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 14px 16px; text-align: left; width: 100%; cursor: pointer; color: #fff; transition: background 0.15s ease;">
            <div style="font-size: 11px; font-family: monospace; color: #38bdf8; font-weight: 600;">STUDIO &amp; RISORSE</div>
            <div style="font-size: 15px; font-weight: 700; margin-top: 4px; display: flex; justify-content: space-between; align-items: center;">
              <span>Help studying</span>
              <span style="color: #38bdf8;">→</span>
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px; line-height: 1.4;">Accedi a risorse e presentazioni Canva: Storia dell'arte egizia, Scienze (rame), Popolazioni precolombiane e Unione Europea.</div>
          </button>
        </div>
      </div>
    </div>

    <div id="input-box">
      <div class="input-container">
        <textarea id="prompt-input" placeholder="Ask Fuglor AI anything... (Press Enter to send, Shift+Enter for newline)"></textarea>
        <div class="toolbar">
          <span style="font-size: 12px; color: var(--text-muted);" id="status-hint">Ready</span>
          <button id="send-btn" class="btn btn-primary" onclick="sendMessage()">Send Message</button>
        </div>
      </div>
    </div>
  </main>

  <!-- Team Modal -->
  <div id="team-modal" onclick="closeTeamModal(event)">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 20px; font-weight: 700; color: #fff;">About Fuglor AI</h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Engineered by a collaborative trio</p>
        </div>
        <button class="btn btn-ghost" onclick="closeTeamModal()" style="padding: 4px 8px;">✕</button>
      </div>

      <div class="team-grid">
        <div class="team-card">
          <div class="member-avatar" style="background: linear-gradient(135deg, #0284c7, #2563eb); color: #fff;">F</div>
          <h4 style="font-size: 15px; font-weight: 700; color: #fff;">Federico</h4>
          <p style="font-size: 12px; color: #38bdf8; margin: 4px 0 8px;">Core Architecture</p>
          <p style="font-size: 11px; color: var(--text-muted); line-height: 1.4;">Real-time event streams, state caching, and performance engine.</p>
        </div>
        <div class="team-card">
          <div class="member-avatar" style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #fff;">L</div>
          <h4 style="font-size: 15px; font-weight: 700; color: #fff;">Luca</h4>
          <p style="font-size: 12px; color: #a78bfa; margin: 4px 0 8px;">Lead UI/UX</p>
          <p style="font-size: 11px; color: var(--text-muted); line-height: 1.4;">Obsidian dark visual design, typography, and responsive ergonomics.</p>
        </div>
        <div class="team-card">
          <div class="member-avatar" style="background: linear-gradient(135deg, #10b981, #0d9488); color: #fff;">G</div>
          <h4 style="font-size: 15px; font-weight: 700; color: #fff;">Gabriel</h4>
          <p style="font-size: 12px; color: #34d399; margin: 4px 0 8px;">AI Systems</p>
          <p style="font-size: 11px; color: var(--text-muted); line-height: 1.4;">Intelligence alignment, persona prompts, and single-file packaging.</p>
        </div>
      </div>

      <p style="font-size: 13px; color: var(--text-muted); line-height: 1.6; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
        Fuglor AI is designed to combine low-latency intelligence with clean, dark-themed minimalism. You can distribute this standalone file anywhere or host it on any static server with zero configuration.
      </p>
    </div>
  </div>

  <script>
    // State Store
    let sessions = JSON.parse(localStorage.getItem('fuglor_sessions') || '[]');
    let currentSessionId = null;

    if (sessions.length === 0) {
      newChat();
    } else {
      currentSessionId = sessions[0].id;
      renderSidebar();
      renderChat();
    }

    function newChat() {
      const id = 'sess_' + Date.now();
      const newSess = {
        id,
        title: 'New Conversation',
        createdAt: Date.now(),
        messages: []
      };
      sessions.unshift(newSess);
      saveSessions();
      currentSessionId = id;
      renderSidebar();
      renderChat();
    }

    function saveSessions() {
      localStorage.setItem('fuglor_sessions', JSON.stringify(sessions));
    }

    function renderSidebar() {
      const list = document.getElementById('session-list');
      list.innerHTML = '';
      sessions.forEach(s => {
        const item = document.createElement('div');
        item.style.padding = '10px 12px';
        item.style.borderRadius = '8px';
        item.style.fontSize = '13px';
        item.style.cursor = 'pointer';
        item.style.marginBottom = '4px';
        item.style.whiteSpace = 'nowrap';
        item.style.overflow = 'hidden';
        item.style.textOverflow = 'ellipsis';
        item.style.transition = 'background 0.15s ease';

        if (s.id === currentSessionId) {
          item.style.background = 'rgba(56, 189, 248, 0.15)';
          item.style.color = '#38bdf8';
          item.style.fontWeight = '600';
        } else {
          item.style.color = '#94a3b8';
        }

        item.innerText = s.title;
        item.onclick = () => {
          currentSessionId = s.id;
          renderSidebar();
          renderChat();
        };
        list.appendChild(item);
      });
    }

    function renderChat() {
      const scroll = document.getElementById('chat-scroll');
      const sess = sessions.find(s => s.id === currentSessionId);
      if (!sess || sess.messages.length === 0) {
        scroll.innerHTML = \`
          <div id="welcome-banner" style="text-align: center; margin: 40px auto 20px; max-width: 500px;">
            <h2 style="font-size: 26px; font-weight: 700; margin-bottom: 8px; color: #fff;">Welcome to Fuglor AI</h2>
            <p style="color: var(--text-muted); font-size: 14px; line-height: 1.6;">
              A sleek, modern dark-themed AI chat platform created by <strong>Federico, Luca, and Gabriel</strong>. Fast, articulate, and distraction-free.
            </p>
          </div>
        \`;
        return;
      }

      scroll.innerHTML = '';
      sess.messages.forEach(m => {
        const card = document.createElement('div');
        card.className = 'msg-card';
        card.innerHTML = \`
          <div class="msg-avatar \${m.role === 'user' ? 'avatar-user' : 'avatar-ai'}">
            \${m.role === 'user' ? 'U' : 'F'}
          </div>
          <div class="msg-body">
            \${formatSimpleMarkdown(m.content)}
          </div>
        \`;
        scroll.appendChild(card);
      });
      scroll.scrollTop = scroll.scrollHeight;
    }

    function formatSimpleMarkdown(txt) {
      if (!txt) return '';
      // Escape HTML
      let escaped = txt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      // Code blocks
      escaped = escaped.replace(/\`\`\`([a-z0-9_-]*)\\n([\\s\\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>');
      // Inline code
      escaped = escaped.replace(/\`([^\\\`]+)\`/g, '<code style="background:#1e293b; color:#38bdf8; padding:2px 5px; border-radius:4px; font-family:monospace;">$1</code>');
      // Bold
      escaped = escaped.replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>');
      // Links [text](url)
      escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#38bdf8; text-decoration:underline;">$1</a>');
      // Line breaks
      escaped = escaped.replace(/\n/g, '<br/>');
      return escaped;
    }

    function runHelpStudying() {
      const input = document.getElementById('prompt-input');
      input.value = 'Help studying';
      sendMessage();
    }

    async function sendMessage() {
      const input = document.getElementById('prompt-input');
      const text = input.value.trim();
      if (!text) return;

      const sess = sessions.find(s => s.id === currentSessionId);
      if (!sess) return;

      // Add user message
      sess.messages.push({ role: 'user', content: text });
      if (sess.messages.length === 1) {
        sess.title = text.slice(0, 30);
      }
      input.value = '';
      renderSidebar();
      renderChat();

      // Assistant response
      const aiMsg = { role: 'assistant', content: '' };
      sess.messages.push(aiMsg);
      renderChat();

      let chosen = '';
      if (text.toLowerCase().includes('help studying') || text.toLowerCase().includes('studio') || text.toLowerCase().includes('risorse')) {
        chosen = ${STUDY_RESPONSE_JSON};
      } else {
        chosen = ${DEFAULT_RESPONSE_JSON};
      }

      let idx = 0;
      const interval = setInterval(() => {
        if (idx < chosen.length) {
          aiMsg.content += chosen[idx];
          idx++;
          renderChat();
        } else {
          clearInterval(interval);
          saveSessions();
        }
      }, 12);
    }

    document.getElementById('prompt-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    function openTeamModal() {
      document.getElementById('team-modal').style.display = 'flex';
    }
    function closeTeamModal(e) {
      if (e) e.stopPropagation();
      document.getElementById('team-modal').style.display = 'none';
    }
  </script>
</body>
</html>`;
}

export function downloadStandaloneHTML() {
  const content = generateStandaloneHTML();
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fuglor-ai-standalone.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
