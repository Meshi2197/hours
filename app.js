/* Product Pulse – אפליקציית שעות עבודה */
(() => {
  'use strict';

  const CFG = window.APP_CONFIG || {};
  const BUSINESS = CFG.BUSINESS_NAME || 'Product Pulse';
  const DEMO = !CFG.API_URL;
  const KEYS = { session: 'pp.session', cache: 'pp.cache', demo: 'pp.demo.v1', view: 'pp.view' };
  const GIS_URL = 'https://accounts.google.com/gsi/client';

  const USER_COLORS = ['#5B4CF0', '#E2577A', '#0E9F8E', '#E08A1E'];
  const CLIENT_COLORS = ['#5B4CF0', '#0E9F8E', '#E2577A', '#E08A1E', '#2F80ED', '#9B51E0', '#219653', '#D35400', '#C2185B', '#00838F'];

  /* ---------- helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };
  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => toISO(new Date());
  const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return toISO(d); };
  const monthOf = (s) => s.slice(0, 7);
  const monthStart = (k) => `${k}-01`;
  const monthEnd = (k) => { const [y, m] = k.split('-').map(Number); return toISO(new Date(y, m, 0)); };
  const shiftMonth = (k, n) => { const [y, m] = k.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
  const fmtMonth = (k) => new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(parseISO(`${k}-01`));
  const fmtDay = (s) => new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(parseISO(s));
  const fmtDate = (s) => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
  const fmtH = (h) => String(Math.round((Number(h) || 0) * 100) / 100);
  const sum = (arr) => arr.reduce((a, e) => a + (Number(e.hours) || 0), 0);
  const initial = (name) => Array.from(String(name || '?').trim()).slice(0, 2).join('');
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

  const I = {
    logo: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#5B4CF0"/><path d="M5 17h5l3-7 5 13 3-6h6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21v-1a6 6 0 0 1 12 0v1"/><circle cx="9" cy="8" r="4"/><path d="M17 11a3 3 0 1 0 0-6M21 21v-1a5 5 0 0 0-3-4.6"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
    archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/></svg>',
    restore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10"/></svg>',
    install: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 7v7M9 11l3 3 3-3"/></svg>',
    sheet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  };

  /* ---------- state ---------- */
  const S = {
    session: store.get(KEYS.session),
    me: null, users: [], clients: [], entries: [],
    view: store.get(KEYS.view) || 'add',
    draft: null,
    list: { month: monthOf(today()), client: 'all', user: 'all' },
    sum: { month: monthOf(today()) },
    rep: { clientId: '', preset: 'this', from: monthStart(monthOf(today())), to: monthEnd(monthOf(today())) },
    lastSync: 0,
    installEvt: null,
  };

  const userColor = (email) => { const i = S.users.findIndex((u) => u.email === email); return USER_COLORS[(i < 0 ? 0 : i) % USER_COLORS.length]; };
  const clientIndex = (id) => S.clients.findIndex((c) => c.id === id);
  const clientColor = (id) => { const i = clientIndex(id); return CLIENT_COLORS[(i < 0 ? 0 : i) % CLIENT_COLORS.length]; };
  const clientName = (id, fallback) => (S.clients.find((c) => c.id === id) || {}).name || fallback || 'לקוח';
  const userName = (email, fallback) => (S.users.find((u) => u.email === email) || {}).name || fallback || email;
  const activeClients = () => S.clients.filter((c) => c.active);
  const isMine = (e) => S.me && e.email === S.me.email;

  /* ---------- API ---------- */
  async function api(action, payload = {}) {
    if (DEMO) return Demo.handle(action, { ...payload, session: S.session });
    let res;
    try {
      res = await fetch(CFG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, session: S.session, ...payload }),
        redirect: 'follow',
      });
    } catch {
      throw new Error('אין חיבור לשרת. בדקי את האינטרנט ונסי שוב.');
    }
    let j;
    try { j = await res.json(); } catch { throw new Error('תשובה לא תקינה מהשרת'); }
    if (!j.ok) {
      const err = new Error(j.error || 'משהו השתבש');
      err.code = j.code;
      if (j.code === 'auth' && action !== 'login') logout(err.message);
      throw err;
    }
    return j.data;
  }

  function applyData(d) {
    S.me = d.me; S.users = d.users || []; S.clients = d.clients || []; S.entries = d.entries || [];
    S.lastSync = Date.now();
    saveCache();
  }
  function saveCache() {
    store.set(KEYS.cache, { me: S.me, users: S.users, clients: S.clients, entries: S.entries });
  }

  async function refresh(opts = {}) {
    const btn = $('#refreshBtn');
    if (btn) btn.classList.add('spinning');
    try {
      applyData(await api('data'));
      if (!$('.topbar')) renderShell();
      renderView();
      if (opts.toast) toast('הנתונים עודכנו');
    } catch (e) {
      if (e.code === 'auth') return;
      if (!S.me) renderFatal(e.message);
      else toast(e.message, true);
    } finally {
      const b = $('#refreshBtn');
      if (b) b.classList.remove('spinning');
    }
  }

  /* ---------- login ---------- */
  function renderLogin(message) {
    const app = $('#app');
    app.innerHTML = `
      <section class="login">
        <div class="logo">${I.logo}</div>
        <h1>${esc(BUSINESS)}</h1>
        <p>רישום שעות עבודה ללקוחות</p>
        ${DEMO ? `
          <div class="demo-users">
            ${Demo.db().users.map((u) => `<button class="btn primary" data-act="demo-login" data-email="${esc(u.email)}">כניסה לדמו בתור ${esc(u.name)}</button>`).join('')}
          </div>
          <p class="demo-note">מצב הדגמה: עוד לא הוגדר חיבור לגיליון, הנתונים נשמרים רק בדפדפן הזה.</p>
        ` : `<div id="gbtn" class="gbtn"><div class="spinner sm"></div></div>`}
        ${message ? `<div class="err">${esc(message)}</div>` : ''}
      </section>`;
    if (!DEMO) setupGoogle();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        const s = document.querySelector(`script[src="${src}"]`);
        if (s.dataset.loaded) return resolve();
        s.addEventListener('load', () => resolve());
        s.addEventListener('error', () => reject(new Error('load failed')));
        return;
      }
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => { s.dataset.loaded = '1'; resolve(); };
      s.onerror = () => reject(new Error('load failed'));
      document.head.appendChild(s);
    });
  }

  async function setupGoogle() {
    try {
      await loadScript(GIS_URL);
    } catch {
      const el = $('#gbtn');
      if (el) el.innerHTML = '<div class="err">לא הצלחתי לטעון את ההתחברות של Google. בדקי את החיבור לאינטרנט.</div>';
      return;
    }
    if (!CFG.GOOGLE_CLIENT_ID) {
      $('#gbtn').innerHTML = '<div class="err">חסר GOOGLE_CLIENT_ID בקובץ config.js</div>';
      return;
    }
    google.accounts.id.initialize({
      client_id: CFG.GOOGLE_CLIENT_ID,
      callback: onGoogleCredential,
      auto_select: true,
      cancel_on_tap_outside: false,
      use_fedcm_for_prompt: true,
    });
    const el = $('#gbtn');
    if (!el) return;
    el.innerHTML = '';
    google.accounts.id.renderButton(el, {
      theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'he', width: 280,
    });
    google.accounts.id.prompt();
  }

  async function onGoogleCredential(resp) {
    const el = $('#gbtn');
    if (el) el.innerHTML = '<div class="spinner sm"></div>';
    try {
      const r = await api('login', { idToken: resp.credential });
      S.session = r.session;
      store.set(KEYS.session, r.session);
      await refresh();
    } catch (e) {
      renderLogin(e.message);
    }
  }

  function logout(message) {
    S.session = null; S.me = null;
    store.del(KEYS.session); store.del(KEYS.cache);
    closeModal();
    if (!DEMO && window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
    renderLogin(message);
  }

  function renderFatal(msg) {
    $('#app').innerHTML = `
      <section class="login">
        <div class="logo">${I.logo}</div>
        <h1>${esc(BUSINESS)}</h1>
        <div class="err">${esc(msg)}</div>
        <p></p>
        <button class="btn primary" data-act="retry">נסי שוב</button>
        <button class="btn ghost" data-act="logout">התנתקות</button>
      </section>`;
  }

  /* ---------- shell ---------- */
  const TABS = [
    { id: 'add', label: 'רישום', icon: I.plus },
    { id: 'list', label: 'רישומים', icon: I.list },
    { id: 'summary', label: 'סיכום', icon: I.chart },
    { id: 'report', label: 'דוחות', icon: I.file },
    { id: 'clients', label: 'לקוחות', icon: I.users },
  ];

  function renderShell() {
    $('#app').innerHTML = `
      <header class="topbar">
        <div class="logo">${I.logo}</div>
        <div class="brand">${esc(BUSINESS)}<small>שעות עבודה</small></div>
        <div class="spacer"></div>
        <button class="icon-btn" id="refreshBtn" data-act="refresh" aria-label="רענון">${I.refresh}</button>
        <button class="avatar lg" id="meBtn" data-act="menu" aria-label="חשבון"></button>
      </header>
      ${DEMO ? '<div class="demo-banner">מצב הדגמה: הנתונים נשמרים רק בדפדפן הזה ולא בגיליון.</div>' : ''}
      <main id="main"></main>
      <nav class="navbar"><div class="inner">
        ${TABS.map((t) => `<button data-act="go" data-view="${t.id}" class="${t.id === 'add' ? 'add-tab' : ''}">
          ${t.id === 'add' ? `<span class="bubble">${t.icon}</span>` : t.icon}<span>${t.label}</span></button>`).join('')}
      </div></nav>`;
  }

  function renderView() {
    const main = $('#main');
    if (!main) return;
    if (!TABS.some((t) => t.id === S.view)) S.view = 'add';
    document.querySelectorAll('.navbar button').forEach((b) => b.classList.toggle('on', b.dataset.view === S.view));
    const me = $('#meBtn');
    if (me && S.me) { me.textContent = initial(S.me.name); me.style.setProperty('--c', userColor(S.me.email)); }
    const views = { add: viewAdd, list: viewList, summary: viewSummary, report: viewReport, clients: viewClients };
    main.innerHTML = views[S.view]();
    if (S.view === 'report') renderPreview();
  }

  function go(view) {
    S.view = view;
    store.set(KEYS.view, view);
    renderView();
    window.scrollTo({ top: 0 });
  }

  /* ---------- entry form ---------- */
  function defaultDraft() {
    const last = S.entries.filter(isMine).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0];
    const lastClient = last && S.clients.some((c) => c.id === last.clientId && c.active) ? last.clientId : '';
    const ac = activeClients();
    return { date: today(), clientId: lastClient || (ac.length === 1 ? ac[0].id : ''), hours: '', title: '', details: '' };
  }

  function entryForm(f, mode) {
    const clients = S.clients.filter((c) => c.active || c.id === f.clientId);
    const t = today(), y = addDays(t, -1);
    return `
      <form class="entry-form" data-form="${mode}" novalidate>
        <label class="field-label">תאריך</label>
        <div class="date-row">
          <input type="date" name="date" value="${esc(f.date)}" required>
          <button type="button" class="chip sm ${f.date === t ? 'on' : ''}" data-act="set-date" data-v="${t}">היום</button>
          <button type="button" class="chip sm ${f.date === y ? 'on' : ''}" data-act="set-date" data-v="${y}">אתמול</button>
        </div>

        <label class="field-label">לקוח</label>
        <input type="hidden" name="clientId" value="${esc(f.clientId)}">
        ${clients.length ? `<div class="chips">${clients.map((c) => `
          <button type="button" class="chip ${c.id === f.clientId ? 'on' : ''}" style="--c:${clientColor(c.id)}" data-act="pick-client" data-id="${esc(c.id)}">
            <span class="dot"></span>${esc(c.name)}</button>`).join('')}</div>`
          : `<div class="empty small"><strong>עוד אין לקוחות</strong><button type="button" class="link-btn" data-act="go" data-view="clients">הוסיפי לקוח ראשון</button></div>`}

        <label class="field-label">כמה שעות?</label>
        <div class="hours-ctl">
          <button type="button" class="step" data-act="hours-step" data-v="0.25" aria-label="הוספת רבע שעה">+</button>
          <input type="number" name="hours" inputmode="decimal" step="0.25" min="0.25" max="24" placeholder="0" value="${esc(f.hours)}">
          <button type="button" class="step" data-act="hours-step" data-v="-0.25" aria-label="הפחתת רבע שעה">−</button>
        </div>
        <div class="chips hours-quick">
          ${[0.5, 1, 1.5, 2, 3, 4, 6, 8].map((h) => `<button type="button" class="chip sm ${Number(f.hours) === h ? 'on' : ''}" data-act="set-hours" data-v="${h}">${h}</button>`).join('')}
        </div>

        <label class="field-label">כותרת</label>
        <input type="text" name="title" maxlength="200" placeholder="למשל: אפיון מסך הרשמה" value="${esc(f.title)}" autocomplete="off">

        <label class="field-label">פירוט <span class="opt">(מה עשית בזמן הזה)</span></label>
        <textarea name="details" rows="4" maxlength="5000" placeholder="פירוט שיופיע בדוח ללקוח">${esc(f.details)}</textarea>

        <div class="form-error" hidden></div>
        ${mode === 'add'
          ? '<button class="btn primary big" type="submit">שמירת השעות</button>'
          : `<div class="modal-actions">
               <button class="btn primary" type="submit">שמירת שינויים</button>
               <button class="btn danger" type="button" data-act="ask-delete">מחיקה</button>
             </div>`}
      </form>`;
  }

  function readForm(form) {
    const fd = new FormData(form);
    return {
      date: String(fd.get('date') || ''),
      clientId: String(fd.get('clientId') || ''),
      hours: String(fd.get('hours') || ''),
      title: String(fd.get('title') || '').trim(),
      details: String(fd.get('details') || '').trim(),
    };
  }

  function validateEntry(f) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return 'בחרי תאריך';
    if (!f.clientId) return 'בחרי לקוח';
    const h = Number(f.hours);
    if (!(h > 0)) return 'כמה שעות עבדת?';
    if (h > 24) return 'אי אפשר יותר מ-24 שעות ביום';
    if (!f.title) return 'הוסיפי כותרת קצרה';
    return '';
  }

  /* ---------- view: add ---------- */
  function viewAdd() {
    if (!S.draft) S.draft = defaultDraft();
    const t = today();
    const mineToday = S.entries.filter((e) => isMine(e) && e.date === t);
    const recent = S.entries.filter(isMine)
      .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5);
    return `
      <div class="today-strip">
        <div><div class="lbl">היום רשמת</div><div class="big">${fmtH(sum(mineToday))} <span class="lbl">שעות</span></div></div>
        <div class="lbl">${esc(fmtDay(t))}</div>
      </div>
      <div class="card">${entryForm(S.draft, 'add')}</div>
      <div class="section-title"><span>הרישומים האחרונים שלי</span>
        ${recent.length ? '<button class="link-btn" data-act="go" data-view="list">לכל הרישומים</button>' : ''}</div>
      ${recent.length ? recent.map((e) => entryCard(e, true)).join('') : '<div class="empty small">עוד לא רשמת שעות. הרישום הראשון יופיע כאן.</div>'}`;
  }

  function entryCard(e, showDate) {
    const mine = isMine(e);
    const name = userName(e.email, e.name);
    return `
      <article class="entry ${mine ? 'mine' : ''}" ${mine ? `data-act="edit-entry" data-id="${esc(e.id)}"` : ''}>
        <div class="entry-top">
          <span class="client-tag" style="--c:${clientColor(e.clientId)}"><i class="dot"></i><span>${esc(clientName(e.clientId, e.clientName))}</span></span>
          <span class="entry-hours">${fmtH(e.hours)} <small>שע׳</small></span>
        </div>
        <div class="entry-title">${esc(e.title)}</div>
        ${e.details ? `<div class="entry-details">${esc(e.details)}</div>` : ''}
        <div class="entry-meta">
          <span class="avatar" style="--c:${userColor(e.email)}">${esc(initial(name))}</span>
          <span>${esc(name)}${showDate ? ` · ${esc(fmtDate(e.date))}` : ''}</span>
          ${mine ? `<span class="edit-hint">${I.edit}</span>` : ''}
        </div>
      </article>`;
  }

  /* ---------- view: list ---------- */
  function monthNav(key, act) {
    return `
      <div class="month-nav">
        <button class="icon-btn" data-act="${act}" data-v="-1" aria-label="החודש הקודם">${I.prev}</button>
        <strong>${esc(fmtMonth(key))}</strong>
        <button class="icon-btn" data-act="${act}" data-v="1" aria-label="החודש הבא">${I.next}</button>
      </div>`;
  }

  function userSeg(current, act) {
    return `<div class="seg">
      <button class="${current === 'all' ? 'on' : ''}" data-act="${act}" data-v="all">כולן</button>
      ${S.users.map((u) => `<button class="${current === u.email ? 'on' : ''}" data-act="${act}" data-v="${esc(u.email)}">
        <span class="avatar" style="--c:${userColor(u.email)}">${esc(initial(u.name))}</span>${esc(u.name)}</button>`).join('')}
    </div>`;
  }

  function viewList() {
    const L = S.list;
    const items = S.entries
      .filter((e) => monthOf(e.date) === L.month)
      .filter((e) => L.client === 'all' || e.clientId === L.client)
      .filter((e) => L.user === 'all' || e.email === L.user)
      .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''));
    const byDay = [];
    items.forEach((e) => {
      const last = byDay[byDay.length - 1];
      if (last && last.date === e.date) last.items.push(e); else byDay.push({ date: e.date, items: [e] });
    });
    return `
      <h2 class="page-title">רישומים</h2>
      ${monthNav(L.month, 'list-month')}
      <div class="filters">
        <select data-change="list-client" aria-label="סינון לפי לקוח">
          <option value="all">כל הלקוחות</option>
          ${S.clients.map((c) => `<option value="${esc(c.id)}" ${L.client === c.id ? 'selected' : ''}>${esc(c.name)}${c.active ? '' : ' (ארכיון)'}</option>`).join('')}
        </select>
        ${userSeg(L.user, 'list-user')}
      </div>
      <div class="total-line"><span>${items.length} רישומים</span><span>סה״כ <b>${fmtH(sum(items))}</b> שעות</span></div>
      ${byDay.length ? byDay.map((d) => `
        <div class="day-head"><span>${esc(fmtDay(d.date))}</span><span class="tot">${fmtH(sum(d.items))} שע׳</span></div>
        ${d.items.map((e) => entryCard(e, false)).join('')}`).join('')
        : '<div class="empty" style="margin-top:16px"><strong>אין רישומים</strong>לא נמצאו שעות בחודש הזה עם הסינון שנבחר.</div>'}`;
  }

  /* ---------- view: summary ---------- */
  function viewSummary() {
    const k = S.sum.month;
    const items = S.entries.filter((e) => monthOf(e.date) === k);
    const total = sum(items);
    const rows = S.clients
      .map((c) => {
        const ce = items.filter((e) => e.clientId === c.id);
        return { c, total: sum(ce), per: S.users.map((u) => ({ u, h: sum(ce.filter((e) => e.email === u.email)) })) };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
    const max = Math.max(1, ...rows.map((r) => r.total));
    const days = new Set(items.map((e) => e.date)).size;
    return `
      <h2 class="page-title">סיכום חודשי</h2>
      ${monthNav(k, 'sum-month')}
      <div class="stat-grid">
        <div class="stat total"><div class="lbl">סה״כ החודש</div><div class="val">${fmtH(total)} <small>שעות</small></div></div>
        ${S.users.map((u) => `<div class="stat">
          <div class="lbl"><span class="avatar" style="--c:${userColor(u.email)}">${esc(initial(u.name))}</span>${esc(u.name)}</div>
          <div class="val">${fmtH(sum(items.filter((e) => e.email === u.email)))} <small>שעות</small></div></div>`).join('')}
      </div>
      <div class="card">
        <h3>לפי לקוח</h3>
        ${rows.length ? rows.map((r) => `
          <div class="sum-row">
            <div class="top"><span class="name">${esc(r.c.name)}</span><span class="hrs">${fmtH(r.total)} שע׳</span></div>
            <div class="bar" style="width:${(r.total / max) * 100}%">
              ${r.per.filter((p) => p.h > 0).map((p) => `<span style="width:${(p.h / r.total) * 100}%;background:${userColor(p.u.email)}"></span>`).join('')}
            </div>
            <div class="split">${r.per.map((p) => `<span><i style="background:${userColor(p.u.email)}"></i>${esc(p.u.name)}: ${fmtH(p.h)}</span>`).join('')}</div>
          </div>`).join('') : '<div class="muted">אין שעות בחודש הזה.</div>'}
      </div>
      <div class="muted small" style="text-align:center">${items.length} רישומים · ${days} ימי עבודה</div>`;
  }

  /* ---------- view: report ---------- */
  function reportItems() {
    const R = S.rep;
    return S.entries
      .filter((e) => e.clientId === R.clientId && e.date >= R.from && e.date <= R.to)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || '').localeCompare(b.createdAt || ''));
  }

  function setPreset(p) {
    const R = S.rep;
    R.preset = p;
    const m = monthOf(today());
    if (p === 'this') { R.from = monthStart(m); R.to = monthEnd(m); }
    if (p === 'last') { const lm = shiftMonth(m, -1); R.from = monthStart(lm); R.to = monthEnd(lm); }
  }

  function viewReport() {
    const R = S.rep;
    if (!R.clientId || !S.clients.some((c) => c.id === R.clientId)) R.clientId = (activeClients()[0] || S.clients[0] || {}).id || '';
    if (!S.clients.length) {
      return `<h2 class="page-title">דוח שעות ללקוח</h2>
        <div class="empty"><strong>עוד אין לקוחות</strong><button class="link-btn" data-act="go" data-view="clients">הוסיפי לקוח</button></div>`;
    }
    const items = reportItems();
    const valid = R.from && R.to && R.from <= R.to;
    return `
      <h2 class="page-title">דוח שעות ללקוח</h2>
      <div class="card">
        <label class="field-label">לקוח</label>
        <select data-change="rep-client">
          ${S.clients.map((c) => `<option value="${esc(c.id)}" ${c.id === R.clientId ? 'selected' : ''}>${esc(c.name)}${c.active ? '' : ' (ארכיון)'}</option>`).join('')}
        </select>
        <label class="field-label">תקופה</label>
        <div class="chips" style="margin-bottom:12px">
          <button class="chip sm ${R.preset === 'this' ? 'on' : ''}" data-act="rep-preset" data-v="this">החודש</button>
          <button class="chip sm ${R.preset === 'last' ? 'on' : ''}" data-act="rep-preset" data-v="last">החודש שעבר</button>
          <button class="chip sm ${R.preset === 'custom' ? 'on' : ''}" data-act="rep-preset" data-v="custom">טווח אחר</button>
        </div>
        <div class="date-pair">
          <div><label>מתאריך</label><input type="date" data-change="rep-from" value="${esc(R.from)}"></div>
          <div><label>עד תאריך</label><input type="date" data-change="rep-to" value="${esc(R.to)}"></div>
        </div>
        <div class="report-stats">
          <div><div class="v">${fmtH(sum(items))}</div><div class="l">שעות</div></div>
          <div><div class="v">${items.length}</div><div class="l">רישומים</div></div>
          ${S.users.map((u) => `<div><div class="v">${fmtH(sum(items.filter((e) => e.email === u.email)))}</div><div class="l">${esc(u.name)}</div></div>`).join('')}
        </div>
        ${valid ? '' : '<div class="form-error">תאריך ההתחלה צריך להיות לפני תאריך הסיום</div>'}
        <button class="btn primary big" data-act="download-pdf" ${valid && items.length ? '' : 'disabled'}>${I.download} הורדת PDF</button>
      </div>
      <div class="preview-label">תצוגה מקדימה</div>
      <div class="preview" id="preview"><div class="spinner"></div></div>`;
  }

  /* ---------- PDF report (drawn on canvas → PDF, no external libraries) ---------- */
  const A4 = { w: 794, h: 1123 };
  const PG = { l: 48, r: 746, top: 44, limit: 1123 - 64 };
  const FONT_STACK = "Heebo, 'Noto Sans Hebrew', Arial, sans-serif";
  const fnt = (w, s) => `${w} ${s}px ${FONT_STACK}`;

  async function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.all(['400', '600', '700', '800'].map((w) => document.fonts.load(fnt(w, 14), 'אבג abc 123')));
    } catch { /* fallback fonts are fine */ }
  }

  function wrapText(ctx, str, maxW) {
    const out = [];
    String(str || '').split(/\n/).forEach((para) => {
      const words = para.split(/\s+/).filter(Boolean);
      if (!words.length) { if (out.length) out.push(''); return; }
      let line = '';
      words.forEach((w) => {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width <= maxW) { line = test; return; }
        if (line) out.push(line);
        if (ctx.measureText(w).width <= maxW) { line = w; return; }
        let part = '';
        for (const ch of w) {
          if (ctx.measureText(part + ch).width > maxW) { out.push(part); part = ch; } else part += ch;
        }
        line = part;
      });
      if (line) out.push(line);
    });
    return out;
  }

  function drawLogo(ctx, x, y, size) {
    const s = size / 32;
    ctx.save();
    ctx.fillStyle = '#5B4CF0';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, size, size, 9 * s); else ctx.rect(x, y, size, size);
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.6 * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    [[5, 17], [10, 17], [13, 10], [18, 23], [21, 17], [27, 17]].forEach(([px, py], i) => {
      const fn = i ? 'lineTo' : 'moveTo';
      ctx[fn](x + px * s, y + py * s);
    });
    ctx.stroke();
    ctx.restore();
  }

  function box(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }

  function txt(ctx, str, x, y, o = {}) {
    ctx.font = fnt(o.w || 400, o.s || 13);
    ctx.fillStyle = o.c || '#1D1B2E';
    ctx.direction = o.dir || 'rtl';
    ctx.textAlign = o.a || 'right';
    ctx.fillText(String(str), x, y);
  }

  async function buildReportPages(items, scale) {
    await ensureFonts();
    const R = S.rep;
    const client = clientName(R.clientId);
    const total = sum(items);
    const per = S.users.map((u) => ({ name: u.name, h: sum(items.filter((e) => e.email === u.email)) }));
    const pages = [];
    let ctx; let y;
    const W = PG.r - PG.l;
    const col = { date: PG.r - 10, who: PG.r - 100, task: PG.r - 180, hours: PG.l + 10 };
    const taskW = col.task - (PG.l + 70);

    const tableHeader = () => {
      box(ctx, PG.l, y, W, 34, 8, '#EDEBFE');
      const o = { w: 700, s: 12, c: '#2B2170' };
      txt(ctx, 'תאריך', col.date, y + 22, o);
      txt(ctx, 'מבצעת', col.who, y + 22, o);
      txt(ctx, 'משימה', col.task, y + 22, o);
      txt(ctx, 'שעות', col.hours, y + 22, { ...o, a: 'left' });
      y += 34;
    };

    const newPage = () => {
      const c = document.createElement('canvas');
      c.width = Math.round(A4.w * scale); c.height = Math.round(A4.h * scale);
      ctx = c.getContext('2d');
      ctx.scale(scale, scale);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, A4.w, A4.h);
      ctx.textBaseline = 'alphabetic';
      pages.push(c);
      if (pages.length === 1) {
        y = PG.top;
        txt(ctx, 'פירוט שעות עבודה', PG.r, y + 24, { w: 800, s: 22 });
        txt(ctx, `הופק בתאריך ${fmtDate(today())}`, PG.r, y + 46, { s: 12, c: '#6B6880' });
        drawLogo(ctx, PG.l, y + 4, 36);
        txt(ctx, BUSINESS, PG.l + 46, y + 30, { w: 800, s: 21, a: 'left', dir: 'ltr' });
        y += 64;
        ctx.fillStyle = '#5B4CF0'; ctx.fillRect(PG.l, y, W, 3);
        y += 22;
        const bw = (W - 12) / 2;
        [['לקוח', client], ['תקופה', `${fmtDate(R.from)} עד ${fmtDate(R.to)}`]].forEach(([l, v], i) => {
          const x = PG.r - bw - i * (bw + 12);
          box(ctx, x, y, bw, 56, 10, '#F6F5FB');
          txt(ctx, l, x + bw - 14, y + 20, { s: 11, c: '#6B6880' });
          ctx.font = fnt(700, 15);
          let val = v;
          while (ctx.measureText(val).width > bw - 28 && val.length > 4) val = `${val.slice(0, -2)}…`;
          txt(ctx, val, x + bw - 14, y + 42, { w: 700, s: 15 });
        });
        y += 56 + 12;
        const cells = [{ l: 'סה״כ שעות', v: fmtH(total), main: true }, ...per.map((p) => ({ l: p.name, v: fmtH(p.h) }))];
        const cw = (W - 12 * (cells.length - 1)) / cells.length;
        cells.forEach((cell, i) => {
          const x = PG.r - cw - i * (cw + 12);
          box(ctx, x + 0.5, y + 0.5, cw - 1, 58, 10, cell.main ? '#5B4CF0' : '#fff', cell.main ? null : '#E8E6F1');
          txt(ctx, cell.l, x + cw - 14, y + 20, { s: 11, c: cell.main ? 'rgba(255,255,255,.85)' : '#6B6880' });
          txt(ctx, cell.v, x + cw - 14, y + 45, { w: 800, s: 21, c: cell.main ? '#fff' : '#1D1B2E' });
        });
        y += 58 + 24;
      } else {
        y = PG.top;
        drawLogo(ctx, PG.l, y, 24);
        txt(ctx, BUSINESS, PG.l + 32, y + 18, { w: 800, s: 15, a: 'left', dir: 'ltr' });
        txt(ctx, `פירוט שעות · ${client}`, PG.r, y + 18, { s: 13, c: '#6B6880' });
        y += 36;
        ctx.fillStyle = '#E8E6F1'; ctx.fillRect(PG.l, y, W, 1);
        y += 18;
      }
      if (items.length) tableHeader();
    };

    newPage();

    if (!items.length) {
      txt(ctx, 'אין רישומי שעות בתקופה הזו', A4.w / 2, y + 40, { s: 14, c: '#6B6880', a: 'center' });
    }

    items.forEach((e) => {
      ctx.font = fnt(600, 13);
      const tl = wrapText(ctx, e.title, taskW);
      ctx.font = fnt(400, 12);
      const dl = e.details ? wrapText(ctx, e.details, taskW) : [];
      const lines = [...tl.map((t) => ({ t, w: 600, s: 13, c: '#1D1B2E', h: 19 })), ...dl.map((t) => ({ t, w: 400, s: 12, c: '#5C5973', h: 17 }))];
      const rowH = 22 + lines.reduce((a, l) => a + l.h, 0);
      const fresh = PG.limit - (PG.top + 54 + 34);
      if (y + rowH > PG.limit && (rowH <= fresh || y + 60 > PG.limit)) newPage();
      const top = y;
      txt(ctx, fmtDate(e.date), col.date, top + 24, { s: 13 });
      txt(ctx, userName(e.email, e.name), col.who, top + 24, { s: 13 });
      txt(ctx, fmtH(e.hours), col.hours, top + 24, { w: 700, s: 13, a: 'left' });
      let ly = top + 10;
      lines.forEach((l) => {
        if (ly + l.h > PG.limit) { newPage(); ly = y + 4; }
        txt(ctx, l.t, col.task, ly + 14, { w: l.w, s: l.s, c: l.c });
        ly += l.h;
      });
      y = ly + 12;
      ctx.fillStyle = '#ECEAF3'; ctx.fillRect(PG.l, y - 1, W, 1);
    });

    if (items.length) {
      if (y + 48 > PG.limit) newPage();
      y += 6;
      ctx.fillStyle = '#1D1B2E'; ctx.fillRect(PG.l, y, W, 2);
      txt(ctx, 'סה״כ', col.date, y + 28, { w: 800, s: 15 });
      txt(ctx, `${fmtH(total)} שעות`, col.hours, y + 28, { w: 800, s: 15, a: 'left' });
    }

    pages.forEach((c, i) => {
      const x = c.getContext('2d');
      x.setTransform(scale, 0, 0, scale, 0, 0);
      txt(x, BUSINESS, A4.w / 2, A4.h - 28, { s: 10, c: '#9C99AE', a: 'center', dir: 'ltr' });
      if (pages.length > 1) txt(x, `עמוד ${i + 1} מתוך ${pages.length}`, PG.l, A4.h - 28, { s: 10, c: '#9C99AE', a: 'left' });
    });
    return pages;
  }

  /** בונה קובץ PDF מתמונות JPEG של העמודים (בלי ספריות חיצוניות). */
  function pagesToPdf(canvases) {
    const enc = new TextEncoder();
    const chunks = []; const offsets = []; let len = 0;
    const push = (d) => { const b = typeof d === 'string' ? enc.encode(d) : d; chunks.push(b); len += b.length; };
    const obj = (n, body) => { offsets[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
    const PW = 595.28, PH = 841.89;
    const n = canvases.length;
    const kids = canvases.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`));
    canvases.forEach((c, i) => {
      const p = 3 + i * 3;
      const b64 = c.toDataURL('image/jpeg', 0.9).split(',')[1];
      const bin = atob(b64);
      const img = new Uint8Array(bin.length);
      for (let k = 0; k < bin.length; k += 1) img[k] = bin.charCodeAt(k);
      const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
      obj(p, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${p + 2} 0 R >> >> /Contents ${p + 1} 0 R >>`));
      obj(p + 1, () => { push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`); });
      obj(p + 2, () => {
        push(`<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`);
        push(img);
        push('\nendstream');
      });
    });
    const total = 3 + n * 3;
    const xref = len;
    let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let k = 1; k < total; k += 1) x += `${String(offsets[k]).padStart(10, '0')} 00000 n \n`;
    push(x);
    push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(chunks, { type: 'application/pdf' });
  }

  let previewToken = 0;
  async function renderPreview() {
    const box = $('#preview');
    if (!box) return;
    const token = ++previewToken;
    const pages = await buildReportPages(reportItems(), 1.25);
    if (token !== previewToken || !document.body.contains(box)) return;
    box.innerHTML = '';
    pages.forEach((c) => { c.className = 'preview-page'; box.appendChild(c); });
  }

  async function downloadPdf(btn) {
    const items = reportItems();
    if (!items.length) return;
    setBusy(btn, true, 'מכינה PDF…');
    try {
      const pages = await buildReportPages(items, 2);
      const blob = pagesToPdf(pages);
      const client = clientName(S.rep.clientId).replace(/[\\/:*?"<>|]+/g, ' ').trim();
      const range = `${fmtDate(S.rep.from).replace(/\//g, '.')}-${fmtDate(S.rep.to).replace(/\//g, '.')}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${BUSINESS} - ${client} - ${range}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast('הדוח ירד בהצלחה');
    } catch (e) {
      console.error(e);
      toast('לא הצלחתי ליצור את ה-PDF, נסי שוב', true);
    } finally {
      setBusy(btn, false);
    }
  }

  /* ---------- view: clients ---------- */
  function viewClients() {
    const m = monthOf(today());
    const monthHours = (id) => sum(S.entries.filter((e) => e.clientId === id && monthOf(e.date) === m));
    const totalHours = (id) => sum(S.entries.filter((e) => e.clientId === id));
    const active = activeClients();
    const archived = S.clients.filter((c) => !c.active);
    return `
      <h2 class="page-title">לקוחות</h2>
      <form class="card inline-form" data-form="client-add" novalidate>
        <input type="text" name="name" maxlength="80" placeholder="שם לקוח חדש" autocomplete="off">
        <button class="btn primary" type="submit">${I.plus} הוספה</button>
      </form>
      <div class="card">
        ${active.length ? active.map((c) => `
          <div class="client-row">
            <span class="dot" style="background:${clientColor(c.id)}"></span>
            <div class="info"><b>${esc(c.name)}</b><span>${fmtH(monthHours(c.id))} שעות החודש · ${fmtH(totalHours(c.id))} בסה״כ</span></div>
            <button class="icon-btn" data-act="rename-client" data-id="${esc(c.id)}" aria-label="שינוי שם">${I.edit}</button>
            <button class="icon-btn" data-act="archive-client" data-id="${esc(c.id)}" aria-label="העברה לארכיון">${I.archive}</button>
          </div>`).join('') : '<div class="muted">עוד אין לקוחות פעילים. הוסיפי לקוח למעלה.</div>'}
      </div>
      ${archived.length ? `
        <details class="archive card">
          <summary>ארכיון (${archived.length})</summary>
          ${archived.map((c) => `
            <div class="client-row">
              <span class="dot" style="background:${clientColor(c.id)}"></span>
              <div class="info"><b>${esc(c.name)}</b><span>${fmtH(totalHours(c.id))} שעות בסה״כ</span></div>
              <button class="btn ghost" data-act="restore-client" data-id="${esc(c.id)}">${I.restore} החזרה</button>
            </div>`).join('')}
        </details>` : ''}
      <p class="muted small">לקוח בארכיון לא מופיע במסך הרישום, אבל השעות שלו נשמרות ואפשר להפיק עבורו דוח. לכל לקוח יש גם לשונית משלו בגיליון.</p>`;
  }

  /* ---------- modal ---------- */
  function openModal(title, body) {
    closeModal();
    const el = document.createElement('div');
    el.className = 'modal-back';
    el.id = 'modal';
    el.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
      <div class="grip"></div>
      <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-act="close-modal" aria-label="סגירה">${I.close}</button></div>
      ${body}</div>`;
    el.addEventListener('click', (ev) => { if (ev.target === el) closeModal(); });
    document.body.appendChild(el);
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    const m = $('#modal');
    if (m) m.remove();
    document.body.style.overflow = '';
  }

  function openEdit(id) {
    const e = S.entries.find((x) => x.id === id);
    if (!e || !isMine(e)) return;
    openModal('עריכת רישום', `<div class="card">${entryForm({ ...e, hours: String(e.hours) }, 'edit')}</div>`);
    $('#modal form').dataset.id = id;
  }

  function openMenu() {
    const canInstall = !!S.installEvt;
    const sheetUrl = CFG.SHEET_URL;
    openModal('החשבון שלי', `
      <div class="card">
        <div class="me-card"><span class="avatar lg" style="--c:${userColor(S.me.email)}">${esc(initial(S.me.name))}</span>
          <div><b>${esc(S.me.name)}</b><span class="muted small">${esc(S.me.email)}</span></div></div>
      </div>
      <div class="card menu-list">
        <button data-act="refresh-toast">${I.refresh} רענון נתונים</button>
        ${sheetUrl ? `<button data-act="open-sheet">${I.sheet} פתיחת הגיליון</button>` : ''}
        ${canInstall ? `<button data-act="install">${I.install} התקנה כאפליקציה</button>` : ''}
        <button data-act="logout">${I.logout} התנתקות</button>
      </div>
      ${!canInstall && !isStandalone() ? `<p class="muted small">להתקנה באייפון: בספארי לוחצים על כפתור השיתוף ואז "הוספה למסך הבית". באנדרואיד: תפריט הדפדפן ← "התקנת אפליקציה".</p>` : ''}`);
  }
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  function openRename(id) {
    const c = S.clients.find((x) => x.id === id);
    if (!c) return;
    openModal('שינוי שם לקוח', `
      <form class="card" data-form="client-rename" data-id="${esc(id)}" novalidate>
        <input type="text" name="name" maxlength="80" value="${esc(c.name)}" autocomplete="off">
        <div class="form-error" hidden></div>
        <div class="modal-actions"><button class="btn primary" type="submit">שמירה</button><button class="btn" type="button" data-act="close-modal">ביטול</button></div>
      </form>`);
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg, isError) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = `show${isError ? ' error' : ''}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = ''; }, isError ? 4200 : 2400);
  }

  function setBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<div class="spinner sm"></div>${label ? ` ${label}` : ''}`; }
    else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
  }
  function showFormError(form, msg) {
    const el = form.querySelector('.form-error');
    if (el) { el.textContent = msg; el.hidden = !msg; }
  }

  /* ---------- events ---------- */
  document.addEventListener('click', async (ev) => {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const form = el.closest('form');

    switch (act) {
      case 'demo-login': {
        const r = await api('login', { idToken: el.dataset.email });
        S.session = r.session; store.set(KEYS.session, r.session);
        refresh();
        break;
      }
      case 'retry': $('#app').innerHTML = '<div class="splash"><div class="spinner"></div></div>'; refresh(); break;
      case 'go': closeModal(); go(el.dataset.view); break;
      case 'refresh': refresh({ toast: true }); break;
      case 'refresh-toast': closeModal(); refresh({ toast: true }); break;
      case 'menu': openMenu(); break;
      case 'close-modal': closeModal(); break;
      case 'logout': logout(); break;
      case 'open-sheet': window.open(CFG.SHEET_URL, '_blank', 'noopener'); break;
      case 'install':
        if (S.installEvt) { S.installEvt.prompt(); S.installEvt = null; closeModal(); }
        break;

      case 'set-date': {
        form.elements.date.value = el.dataset.v;
        syncForm(form);
        break;
      }
      case 'pick-client': {
        form.elements.clientId.value = el.dataset.id;
        form.querySelectorAll('[data-act="pick-client"]').forEach((b) => b.classList.toggle('on', b === el));
        syncForm(form);
        break;
      }
      case 'hours-step': {
        const inp = form.elements.hours;
        const v = Math.max(0, Math.min(24, (Number(inp.value) || 0) + Number(el.dataset.v)));
        inp.value = v ? String(v) : '';
        syncForm(form);
        break;
      }
      case 'set-hours': {
        form.elements.hours.value = el.dataset.v;
        syncForm(form);
        break;
      }
      case 'edit-entry': openEdit(el.dataset.id); break;
      case 'ask-delete': {
        el.outerHTML = '<button class="btn danger solid" type="button" data-act="confirm-delete">בטוחה? למחוק</button>';
        break;
      }
      case 'confirm-delete': {
        const id = form.dataset.id;
        setBusy(el, true);
        try {
          await api('deleteEntry', { id });
          S.entries = S.entries.filter((e) => e.id !== id);
          saveCache(); closeModal(); renderView(); toast('הרישום נמחק');
        } catch (e) { setBusy(el, false); showFormError(form, e.message); }
        break;
      }

      case 'list-month': S.list.month = shiftMonth(S.list.month, Number(el.dataset.v)); renderView(); break;
      case 'list-user': S.list.user = el.dataset.v; renderView(); break;
      case 'sum-month': S.sum.month = shiftMonth(S.sum.month, Number(el.dataset.v)); renderView(); break;
      case 'rep-preset': setPreset(el.dataset.v); renderView(); break;
      case 'download-pdf': downloadPdf(el); break;

      case 'rename-client': openRename(el.dataset.id); break;
      case 'archive-client':
      case 'restore-client': {
        const active = act === 'restore-client';
        setBusy(el, true);
        try {
          const c = await api('updateClient', { id: el.dataset.id, changes: { active } });
          S.clients = S.clients.map((x) => (x.id === c.id ? c : x));
          if (!active && S.draft && S.draft.clientId === c.id) S.draft.clientId = '';
          saveCache(); renderView();
          toast(active ? 'הלקוח הוחזר מהארכיון' : 'הלקוח הועבר לארכיון');
        } catch (e) { setBusy(el, false); toast(e.message, true); }
        break;
      }
      default: break;
    }
  });

  function syncForm(form) {
    const f = readForm(form);
    form.querySelectorAll('[data-act="set-date"]').forEach((b) => b.classList.toggle('on', b.dataset.v === f.date));
    form.querySelectorAll('[data-act="set-hours"]').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === Number(f.hours)));
    if (form.dataset.form === 'add') S.draft = f;
  }

  document.addEventListener('input', (ev) => {
    const form = ev.target.closest('form.entry-form');
    if (form) syncForm(form);
  });

  document.addEventListener('change', (ev) => {
    const el = ev.target.closest('[data-change]');
    if (!el) return;
    const v = el.value;
    switch (el.dataset.change) {
      case 'list-client': S.list.client = v; renderView(); break;
      case 'rep-client': S.rep.clientId = v; renderView(); break;
      case 'rep-from': if (v) { S.rep.from = v; S.rep.preset = 'custom'; renderView(); } break;
      case 'rep-to': if (v) { S.rep.to = v; S.rep.preset = 'custom'; renderView(); } break;
      default: break;
    }
  });

  document.addEventListener('submit', async (ev) => {
    const form = ev.target;
    ev.preventDefault();
    const btn = form.querySelector('[type=submit]');
    const kind = form.dataset.form;
    showFormError(form, '');

    if (kind === 'add' || kind === 'edit') {
      const f = readForm(form);
      const err = validateEntry(f);
      if (err) { showFormError(form, err); return; }
      const entry = { ...f, hours: Math.round(Number(f.hours) * 100) / 100 };
      setBusy(btn, true, 'שומרת…');
      try {
        if (kind === 'add') {
          const saved = await api('addEntry', { entry });
          S.entries.push(saved);
          S.draft = { date: f.date, clientId: f.clientId, hours: '', title: '', details: '' };
          saveCache(); renderView();
          toast(`נשמרו ${fmtH(saved.hours)} שעות ל${clientName(saved.clientId)}`);
        } else {
          const saved = await api('updateEntry', { id: form.dataset.id, entry });
          S.entries = S.entries.map((e) => (e.id === saved.id ? saved : e));
          saveCache(); closeModal(); renderView(); toast('הרישום עודכן');
        }
      } catch (e) {
        setBusy(btn, false);
        showFormError(form, e.message);
      }
      return;
    }

    if (kind === 'client-add' || kind === 'client-rename') {
      const name = String(new FormData(form).get('name') || '').trim();
      if (!name) { toast('כתבי שם ללקוח', true); return; }
      setBusy(btn, true);
      try {
        if (kind === 'client-add') {
          const c = await api('addClient', { name });
          S.clients.push(c);
          toast(`הלקוח "${c.name}" נוסף`);
        } else {
          const c = await api('updateClient', { id: form.dataset.id, changes: { name } });
          S.clients = S.clients.map((x) => (x.id === c.id ? c : x));
          S.entries.forEach((e) => { if (e.clientId === c.id) e.clientName = c.name; });
          closeModal();
          toast('השם עודכן');
        }
        saveCache(); renderView();
      } catch (e) {
        setBusy(btn, false);
        if (kind === 'client-rename') showFormError(form, e.message); else toast(e.message, true);
      }
    }
  });

  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeModal(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && S.session && S.me && Date.now() - S.lastSync > 60000) refresh();
  });
  window.addEventListener('beforeinstallprompt', (ev) => { ev.preventDefault(); S.installEvt = ev; });

  /* ---------- demo backend (works only while API_URL is empty) ---------- */
  const Demo = {
    db() {
      let d = store.get(KEYS.demo);
      if (!d) { d = this.seed(); store.set(KEYS.demo, d); }
      return d;
    },
    seed() {
      const users = [{ email: 'meshi@product-pulse.io', name: 'משי' }, { email: 'moran@product-pulse.io', name: 'מורן' }];
      const clients = [
        { id: 'c1', name: 'סטודיו אלמוג', active: true },
        { id: 'c2', name: 'Nova Labs', active: true },
        { id: 'c3', name: 'קפה הגפן', active: true },
      ];
      const tasks = [
        ['אפיון מסך הרשמה', 'מיפוי זרימת משתמש חדש, כתיבת מסמך דרישות ובדיקת מקרי קצה'],
        ['פגישת סטטוס שבועית', 'סקירת התקדמות, תיעדוף משימות לספרינט הבא'],
        ['מחקר מתחרים', 'השוואת 5 מתחרים עיקריים ותיעוד תובנות'],
        ['כתיבת סיפורי משתמש', 'פירוק פיצ׳ר התשלומים לסיפורים וקריטריוני קבלה'],
        ['ראיונות משתמשים', '3 ראיונות עם לקוחות קיימים וסיכום ממצאים'],
        ['בדיקות QA לגרסה', 'מעבר על תסריטי בדיקה ותיעוד באגים'],
        ['עבודה על מפת דרכים', 'עדכון roadmap לרבעון הבא'],
      ];
      const entries = [];
      let seed = 7;
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let i = 0; i < 40; i += 1) {
        const date = addDays(today(), -Math.floor(rnd() * 45));
        const d = parseISO(date).getDay();
        if (d === 5 || d === 6) continue;
        const u = users[Math.floor(rnd() * 2)];
        const c = clients[Math.floor(rnd() * 3)];
        const t = tasks[Math.floor(rnd() * tasks.length)];
        entries.push({ id: uid(), date, clientId: c.id, clientName: c.name, hours: [1, 1.5, 2, 2.5, 3, 4][Math.floor(rnd() * 6)], title: t[0], details: t[1], email: u.email, name: u.name, createdAt: new Date(parseISO(date).getTime() + i * 1000).toISOString() });
      }
      return { users, clients, entries };
    },
    handle(action, p) {
      return new Promise((resolve, reject) => setTimeout(() => {
        try { resolve(JSON.parse(JSON.stringify(this.run(action, p)))); } catch (e) { reject(e); }
      }, 200));
    },
    fail(msg, code) { const e = new Error(msg); e.code = code; throw e; },
    run(action, p) {
      const d = this.db();
      const save = () => store.set(KEYS.demo, d);
      if (action === 'login') {
        const u = d.users.find((x) => x.email === p.idToken) || this.fail('אין הרשאה', 'forbidden');
        return { session: `demo:${u.email}`, user: u };
      }
      const me = d.users.find((x) => `demo:${x.email}` === p.session) || this.fail('נדרשת התחברות', 'auth');
      const clean = (e) => {
        const c = d.clients.find((x) => x.id === e.clientId) || this.fail('הלקוח לא נמצא');
        return { date: e.date, clientId: c.id, clientName: c.name, hours: Number(e.hours), title: e.title, details: e.details || '' };
      };
      switch (action) {
        case 'data': return { me, users: d.users, clients: d.clients, entries: d.entries };
        case 'addEntry': {
          const e = { id: uid(), ...clean(p.entry), email: me.email, name: me.name, createdAt: new Date().toISOString() };
          d.entries.push(e); save(); return e;
        }
        case 'updateEntry': {
          const e = d.entries.find((x) => x.id === p.id) || this.fail('הרישום לא נמצא');
          if (e.email !== me.email) this.fail('אפשר לערוך רק רישומים שלך');
          Object.assign(e, clean(p.entry)); save(); return e;
        }
        case 'deleteEntry': {
          const e = d.entries.find((x) => x.id === p.id);
          if (e && e.email !== me.email) this.fail('אפשר למחוק רק רישומים שלך');
          d.entries = d.entries.filter((x) => x.id !== p.id); save(); return { id: p.id };
        }
        case 'addClient': {
          if (d.clients.some((c) => c.name.toLowerCase() === p.name.toLowerCase())) this.fail('כבר יש לקוח בשם הזה');
          const c = { id: uid(), name: p.name, active: true }; d.clients.push(c); save(); return c;
        }
        case 'updateClient': {
          const c = d.clients.find((x) => x.id === p.id) || this.fail('הלקוח לא נמצא');
          if (p.changes.name !== undefined) {
            if (d.clients.some((x) => x.id !== c.id && x.name.toLowerCase() === p.changes.name.toLowerCase())) this.fail('כבר יש לקוח בשם הזה');
            c.name = p.changes.name;
            d.entries.forEach((e) => { if (e.clientId === c.id) e.clientName = c.name; });
          }
          if (p.changes.active !== undefined) c.active = !!p.changes.active;
          save(); return c;
        }
        default: return this.fail('פעולה לא מוכרת');
      }
    },
  };

  /* ---------- boot ---------- */
  function init() {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    if (!S.session) { renderLogin(); return; }
    const cache = store.get(KEYS.cache);
    if (cache && cache.me) {
      S.me = cache.me; S.users = cache.users || []; S.clients = cache.clients || []; S.entries = cache.entries || [];
      renderShell(); renderView();
    }
    refresh();
  }

  init();
})();
