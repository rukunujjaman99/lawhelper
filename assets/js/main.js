/* ==========================================================
   Law Helper – main.js (demo interactions, no backend)
   Each feature is wired through data-* attributes so the markup
   can later be bound to PHP / Laravel endpoints.
   ========================================================== */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
  };
  const fmtTime = (t) => {
    if (!t) return '';
    let [h, m] = t.split(':').map(Number);
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, '0')} ${ap}`;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- Theme (light / dark) ---------- */
  const applyTheme = (t) => {
    document.documentElement.setAttribute('data-bs-theme', t);
    $$('[data-theme-toggle] .bi').forEach((i) => (i.className = 'bi ' + (t === 'dark' ? 'bi-sun' : 'bi-moon-stars')));
  };
  try { applyTheme(localStorage.getItem('lh-theme') || 'light'); } catch (e) { applyTheme('light'); }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-theme-toggle]')) {
      const next = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('lh-theme', next); } catch (err) { /* ignore */ }
    }
  });

  /* ---------- Toasts ---------- */
  function toast(message, type = 'success') {
    let box = $('#toastBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toastBox';
      box.className = 'toast-container position-fixed top-0 end-0 p-3';
      box.style.zIndex = 2000;
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    const icons = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
    const el = document.createElement('div');
    el.className = `toast align-items-center text-bg-${type} border-0`;
    el.setAttribute('role', 'status');
    el.innerHTML = `<div class="d-flex"><div class="toast-body d-flex gap-2 align-items-center"><i class="bi ${icons[type] || icons.success}"></i><span>${esc(message)}</span></div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
    box.appendChild(el);
    const t = new bootstrap.Toast(el, { delay: 3600 });
    el.addEventListener('hidden.bs.toast', () => el.remove());
    t.show();
  }
  window.LHToast = toast;

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-toast-btn]');
    if (b) { e.preventDefault(); toast(b.dataset.toastBtn, b.dataset.toastType || 'success'); }
  });

  /* ---------- Sidebar (mobile / tablet) ---------- */
  const sidebar = $('#sidebar');
  const backdrop = $('#sidebarBackdrop');
  const setSidebar = (open) => {
    if (!sidebar) return;
    sidebar.classList.toggle('open', open);
    if (backdrop) backdrop.classList.toggle('show', open);
    $$('[data-sidebar-toggle]').forEach((b) => b.setAttribute('aria-expanded', open));
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-sidebar-toggle]')) setSidebar(!sidebar.classList.contains('open'));
    else if (e.target === backdrop) setSidebar(false);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setSidebar(false); });

  /* ---------- Password show / hide ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-toggle-password]');
    if (!b) return;
    const input = $('input', b.closest('.password-wrap'));
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    b.innerHTML = `<i class="bi ${show ? 'bi-eye-slash' : 'bi-eye'}"></i>`;
    b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  /* ---------- Countdown ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  function tickCountdowns() {
    $$('[data-countdown]').forEach((box) => {
      const target = new Date(box.dataset.countdown).getTime();
      let diff = target - Date.now();
      const done = diff <= 0;
      if (done) diff = 0;
      const s = Math.floor(diff / 1000);
      const vals = { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
      Object.entries(vals).forEach(([k, v]) => { const el = $(`[data-unit="${k}"]`, box); if (el) el.textContent = pad(v); });
      box.classList.toggle('is-over', done);
    });
    $$('[data-days-to]').forEach((el) => {
      const d = new Date(el.dataset.daysTo + 'T00:00:00+06:00');
      const n = Math.ceil((d - Date.now()) / 86400000);
      const plain = el.dataset.daysFmt === 'plain';
      if (plain) el.textContent = n === 1 ? '1 day' : (n <= 0 ? 'today' : `${n} days`);
      else if (n > 1) el.textContent = `${n} days remaining`;
      else if (n === 1) el.textContent = '1 day remaining';
      else if (n === 0) el.textContent = 'Hearing today';
      else el.textContent = 'Hearing date passed';
    });
  }
  if ($('[data-countdown]') || $('[data-days-to]')) { tickCountdowns(); setInterval(tickCountdowns, 1000); }

  /* ---------- Form validation ---------- */
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form.needs-validation');
    if (!form) return;
    e.preventDefault();
    if (!form.checkValidity()) { e.stopPropagation(); form.classList.add('was-validated'); const bad = $(':invalid', form); if (bad) bad.focus(); return; }
    form.classList.remove('was-validated');
    const handler = form.dataset.handler && handlers[form.dataset.handler];
    if (handler) handler(form);
    if (form.dataset.toast) toast(form.dataset.toast, form.dataset.toastType || 'success');
    const modalEl = form.closest('.modal');
    if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
    if (form.dataset.redirect) setTimeout(() => (location.href = form.dataset.redirect), 900);
    if (form.dataset.reset !== 'false' && !form.dataset.redirect) form.reset();
  });

  /* ---------- Generic row actions (status change / remove) ---------- */
  let pendingAction = null;
  function runRowAction(btn) {
    const row = btn.closest('[data-row]');
    const spec = btn.dataset.rowAction;
    if (row) {
      if (spec === 'remove') { row.remove(); refreshLists(); }
      else if (spec.startsWith('status:')) {
        const key = spec.split(':')[1];
        const badge = $('.badge-status', row);
        if (badge) { badge.className = `badge-status st-${key}`; badge.textContent = btn.dataset.label || cap(key); }
        row.dataset.status = key;
        $$('.status-label', row).forEach((s) => (s.textContent = btn.dataset.label || cap(key)));
      }
    }
    if (btn.dataset.toast) toast(btn.dataset.toast, btn.dataset.toastType || 'success');
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-row-action]');
    if (!btn) return;
    e.preventDefault();
    if (btn.dataset.confirm) {
      pendingAction = btn;
      const m = $('#confirmModal');
      if (m) { $('#confirmText', m).textContent = btn.dataset.confirm; bootstrap.Modal.getOrCreateInstance(m).show(); }
      else if (window.confirm(btn.dataset.confirm)) runRowAction(btn);
    } else runRowAction(btn);
  });
  const confirmBtn = $('#confirmOk');
  if (confirmBtn) confirmBtn.addEventListener('click', () => {
    if (pendingAction) runRowAction(pendingAction);
    pendingAction = null;
    bootstrap.Modal.getInstance($('#confirmModal'))?.hide();
  });

  /* ---------- Case status dropdown (case details) ---------- */
  document.addEventListener('click', (e) => {
    const item = e.target.closest('[data-case-status]');
    if (!item) return;
    e.preventDefault();
    const key = item.dataset.caseStatus;
    $$('[data-case-status-badge]').forEach((b) => { b.className = `badge-status st-${key}`; b.textContent = item.textContent.trim(); });
    toast('Case status changed to ' + item.textContent.trim());
  });

  /* ---------- List filter / sort / pagination ---------- */
  const lists = {};
  function initLists() {
    $$('[data-list]').forEach((container) => {
      const id = container.id;
      lists[id] = { container, page: 1, size: Number(container.dataset.pageSize || 0) };
    });
    $$('[data-filter-for]').forEach((ctl) => {
      const ev = ctl.tagName === 'INPUT' && ctl.type === 'text' || ctl.type === 'search' ? 'input' : 'change';
      ctl.addEventListener(ev, () => { if (lists[ctl.dataset.filterFor]) lists[ctl.dataset.filterFor].page = 1; refreshLists(); });
    });
    $$('[data-sort-for]').forEach((ctl) => ctl.addEventListener('change', refreshLists));
    $$('[data-filter-reset]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.filterReset;
      $$(`[data-filter-for="${id}"]`).forEach((c) => { if (c.type === 'checkbox') c.checked = false; else if (c.type === 'range') c.value = c.max; else c.value = ''; });
      if (lists[id]) lists[id].page = 1;
      refreshLists();
    }));
  }
  function refreshLists() {
    Object.values(lists).forEach((L) => {
      const id = L.container.id;
      const ctls = $$(`[data-filter-for="${id}"]`);
      const rows = $$('[data-row]', L.container);
      const matched = rows.filter((row) => ctls.every((c) => {
        const key = c.dataset.key;
        if (c.type === 'checkbox') {
          if (!c.checked) return true;
          return (row.dataset[key] || '').split(',').includes(c.value);
        }
        const v = c.value.trim().toLowerCase();
        if (!v) return true;
        if (!key) return row.textContent.toLowerCase().includes(v);
        const rv = (row.dataset[key] || '').toLowerCase();
        if (key === 'exp') return Number(row.dataset.exp) >= Number(v);
        if (key === 'rating') return Number(row.dataset.rating) >= Number(v);
        if (key === 'fee') return Number(row.dataset.fee) <= Number(v);
        return rv.split(',').includes(v) || rv === v;
      }));
      const sortCtl = $(`[data-sort-for="${id}"]`);
      if (sortCtl && sortCtl.value) {
        const [k, dir] = sortCtl.value.split(':');
        matched.sort((a, b) => (Number(a.dataset[k]) - Number(b.dataset[k])) * (dir === 'asc' ? 1 : -1));
        matched.forEach((r) => r.parentElement.appendChild(r));
      }
      const pages = L.size ? Math.max(1, Math.ceil(matched.length / L.size)) : 1;
      L.page = Math.min(L.page, pages);
      rows.forEach((r) => (r.hidden = true));
      matched.forEach((r, i) => { r.hidden = L.size ? !(i >= (L.page - 1) * L.size && i < L.page * L.size) : false; });
      const empty = $(`#${id}-empty`);
      if (empty) empty.hidden = matched.length > 0;
      const count = $(`[data-count-for="${id}"]`);
      if (count) count.textContent = matched.length;
      renderPager(L, pages);
    });
  }
  function renderPager(L, pages) {
    const pager = $(`[data-pager-for="${L.container.id}"]`);
    if (!pager) return;
    if (pages <= 1) { pager.innerHTML = ''; return; }
    let html = `<li class="page-item ${L.page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${L.page - 1}" aria-label="Previous">&laquo;</a></li>`;
    for (let i = 1; i <= pages; i++) html += `<li class="page-item ${i === L.page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    html += `<li class="page-item ${L.page === pages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${L.page + 1}" aria-label="Next">&raquo;</a></li>`;
    pager.innerHTML = html;
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-pager-for] [data-page]');
    if (!a) return;
    e.preventDefault();
    const L = lists[a.closest('[data-pager-for]').dataset.pagerFor];
    L.page = Number(a.dataset.page);
    refreshLists();
    L.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  initLists();
  // Pre-fill find-lawyer filters from homepage search query string
  if ($('#lawyerGrid')) {
    const p = new URLSearchParams(location.search);
    const map = { q: 'q', area: 'area', loc: 'loc', exp: 'exp', rating: 'rating' };
    Object.entries(map).forEach(([param, id]) => { const el = $('#f-' + id); if (el && p.get(param)) el.value = p.get(param); });
    const sh = $('#shownFilterNote'); if (sh && [...p.keys()].length) sh.hidden = false;
  }
  refreshLists();

  /* ---------- Likes / comments / save / share ---------- */
  document.addEventListener('click', (e) => {
    const like = e.target.closest('[data-like]');
    if (like) {
      const c = $('[data-like-count]', like.closest('.post-card') || document);
      const on = like.classList.toggle('active');
      like.querySelector('.bi').className = 'bi ' + (on ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up');
      if (c) c.textContent = Number(c.textContent) + (on ? 1 : -1);
    }
    const save = e.target.closest('[data-save-post]');
    if (save) {
      const on = save.classList.toggle('saved');
      save.querySelector('.bi').className = 'bi ' + (on ? 'bi-bookmark-fill' : 'bi-bookmark');
      toast(on ? 'Post saved to your list' : 'Post removed from saved', 'info');
    }
    const cm = e.target.closest('[data-toggle-comments]');
    if (cm) { const box = $('.comments-box', cm.closest('.post-card')); if (box) { box.hidden = !box.hidden; if (!box.hidden) $('input', box)?.focus(); } }
    const share = e.target.closest('[data-share]');
    if (share) {
      const m = $('#shareModal');
      if (m) { $('#shareTitle', m).textContent = share.dataset.share; bootstrap.Modal.getOrCreateInstance(m).show(); }
    }
    if (e.target.closest('[data-copy-link]')) {
      const input = $('#shareLink');
      (navigator.clipboard ? navigator.clipboard.writeText(input.value) : Promise.reject()).catch(() => { input.select(); document.execCommand && document.execCommand('copy'); });
      toast('Link copied to clipboard');
    }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-comment-form]');
    if (!f) return;
    e.preventDefault();
    const input = $('input', f);
    const text = input.value.trim();
    if (!text) return;
    const list = $('.comment-list', f.closest('.comments-box'));
    const who = f.dataset.commentForm || 'You';
    const ini = who.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    list.insertAdjacentHTML('beforeend', `<div class="comment"><span class="avatar avatar-sm av-2">${esc(ini)}</span><div class="bubble"><div class="fw-semibold small">${esc(who)}</div><div>${esc(text)}</div></div></div>`);
    input.value = '';
    const cnt = $('[data-comment-count]', f.closest('.post-card')); if (cnt) cnt.textContent = Number(cnt.textContent) + 1;
  });

  /* ---------- Notifications ---------- */
  function updateBell() {
    const n = $$('.notif-menu .notif-item.unread').length;
    $$('.bell-badge').forEach((b) => { b.textContent = n; b.hidden = n === 0; });
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-mark-all-read]')) {
      e.preventDefault();
      $$('.notif-item.unread').forEach((i) => i.classList.remove('unread'));
      $$('.reminder-card').forEach((c) => c.classList.add('read'));
      updateBell(); toast('All notifications marked as read', 'info');
    }
    const d = e.target.closest('[data-dismiss]');
    if (d) { const t = d.closest('.notif-item, .reminder-card, .alert-hearing'); if (t) { t.remove(); updateBell(); } toast('Notification dismissed', 'info'); }
    const filterBtn = e.target.closest('[data-notif-filter]');
    if (filterBtn) {
      $$('[data-notif-filter]').forEach((b) => b.classList.toggle('active', b === filterBtn));
      const k = filterBtn.dataset.notifFilter;
      $$('#notifList [data-type]').forEach((n) => (n.hidden = k !== 'all' && n.dataset.type !== k));
    }
  });
  updateBell();

  /* ---------- Auto-reminder settings ---------- */
  const autoToggle = $('#autoReminderToggle');
  if (autoToggle) {
    const sync = () => {
      $('#autoReminderLabel').textContent = autoToggle.checked ? 'AUTO REMINDER ON' : 'AUTO REMINDER OFF';
      $('#autoReminderLabel').className = 'fw-bold ' + (autoToggle.checked ? 'text-success' : 'text-danger');
      $('#reminderSettings').disabled = !autoToggle.checked;
      $('#reminderSettings').style.opacity = autoToggle.checked ? 1 : .5;
    };
    autoToggle.addEventListener('change', sync); sync();
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('#addReminderRule')) {
      const list = $('#ruleList');
      const n = $$('.tier', list).length + 1;
      if (n > 6) return toast('You can add up to 6 reminders', 'warning');
      list.insertAdjacentHTML('beforeend', `<div class="tier"><span class="badge text-bg-warning">Reminder ${n}</span><div class="input-group" style="max-width:190px"><input type="number" class="form-control" min="0" max="60" value="14" aria-label="Days before hearing"><span class="input-group-text">Days before</span></div><div class="form-check form-switch ms-auto mb-0"><input class="form-check-input" type="checkbox" checked aria-label="Enable reminder ${n}"></div><button type="button" class="btn btn-sm btn-light-lh text-danger remove-rule" aria-label="Remove reminder"><i class="bi bi-trash"></i></button></div>`);
    }
    const rm = e.target.closest('.remove-rule');
    if (rm) { rm.closest('.tier').remove(); $$('#ruleList .tier .badge').forEach((b, i) => (b.textContent = 'Reminder ' + (i + 1))); }
    const sr = e.target.closest('[data-send-reminder]');
    if (sr) {
      const m = $('#reminderModal'); if (!m) return;
      $('#remCase', m).textContent = sr.dataset.case;
      $('#remClient', m).textContent = sr.dataset.client;
      $('#reminderMessage', m).value = `Reminder: Your next court hearing for Case ${sr.dataset.case} is scheduled for ${sr.dataset.date} at ${sr.dataset.court}. Please arrive 30 minutes early with your documents.`;
      bootstrap.Modal.getOrCreateInstance(m).show();
    }
  });

  /* ---------- Handlers for modal / page forms ---------- */
  const handlers = {
    addCase(form) {
      const f = new FormData(form);
      const tbody = $('#casesTable tbody');
      const status = f.get('status') || 'Active';
      if (tbody) {
        const tr = document.createElement('tr');
        tr.dataset.row = ''; tr.dataset.status = status.toLowerCase(); tr.dataset.type = f.get('type');
        tr.innerHTML = `<td data-label="Case No"><strong>${esc(f.get('number'))}</strong></td><td data-label="Title">${esc(f.get('title'))}</td><td data-label="Client">${esc(f.get('client'))}</td><td data-label="Court">${esc(f.get('court'))}</td><td data-label="Next hearing"><strong>${fmtDate(f.get('hearing'))}</strong><div class="small text-muted-lh">${fmtTime(f.get('time'))}</div></td><td data-label="Status"><span class="badge-status st-${status.toLowerCase()}">${esc(status)}</span></td><td class="actions"><a href="case-details.html" class="btn btn-sm btn-light-lh">View</a></td>`;
        tbody.prepend(tr);
      }
      const banner = $('#nextHearingBanner');
      if (banner) {
        $('#nhTitle', banner).textContent = `${f.get('number')} · ${f.get('title')}`;
        $('#nhDate', banner).textContent = fmtDate(f.get('hearing'));
        $('#nhMeta', banner).textContent = `${fmtTime(f.get('time'))} · ${f.get('court')}`;
        const cd = $('[data-countdown]', banner);
        if (cd && f.get('hearing')) cd.dataset.countdown = `${f.get('hearing')}T${f.get('time') || '10:00'}:00+06:00`;
        banner.hidden = false; tickCountdowns();
        banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      refreshLists();
    },
    addClient(form) {
      const f = new FormData(form);
      const tbody = $('#clientsTable tbody');
      if (!tbody) return;
      const tr = document.createElement('tr');
      tr.dataset.row = ''; tr.dataset.status = 'active';
      tr.innerHTML = `<td data-label="Client"><div class="d-flex align-items-center gap-2"><span class="avatar avatar-sm av-3">${esc((f.get('name') || 'N')[0])}</span><strong>${esc(f.get('name'))}</strong></div></td><td data-label="Phone">${esc(f.get('phone'))}</td><td data-label="Case">New client</td><td data-label="Case type">${esc(f.get('type'))}</td><td data-label="Status"><span class="badge-status st-active">Active</span></td><td data-label="Last contact">Today</td><td class="actions"><a href="client-details.html" class="btn btn-sm btn-light-lh">View</a></td>`;
      tbody.prepend(tr); refreshLists();
    },
    upload(form) {
      const list = $('#docList'); const file = $('input[type=file]', form).files[0];
      if (!list) return;
      list.insertAdjacentHTML('afterbegin', `<div class="doc-item"><span class="doc-ico tone-info"><i class="bi bi-file-earmark-text"></i></span><div class="flex-grow-1"><div class="fw-semibold">${esc(form.elements.title.value || (file && file.name) || 'New document')}</div><div class="small text-muted-lh">${esc(form.elements.category.value)} · Uploaded just now</div></div><button class="btn btn-sm btn-light-lh" data-toast-btn="Opening document preview" data-toast-type="info">View</button></div>`);
    },
    reminder(form) { /* toast text set by data-toast */ },
    consult() { /* demo */ },
    post(form) {
      const feed = $('#postFeed'); if (!feed) return;
      const text = form.elements.content.value.trim();
      const tpl = $('#postTemplate'); if (!tpl) return;
      const node = tpl.content.cloneNode(true);
      $('.post-body', node).textContent = text;
      $('.post-title', node).textContent = form.elements.title.value;
      feed.prepend(node);
    },
  };

  /* ---------- Consultation accept/reject handled by row actions ---------- */

  /* ---------- Chat ---------- */
  const chat = $('#chat');
  if (chat) {
    const scroll = () => { const b = $('.chat-body:not([hidden])', chat); if (b) b.scrollTop = b.scrollHeight; };
    $$('.conv', chat).forEach((c) => c.addEventListener('click', () => {
      $$('.conv', chat).forEach((x) => x.classList.toggle('active', x === c));
      $$('.chat-body', chat).forEach((b) => (b.hidden = b.id !== c.dataset.thread));
      $('#chatName').textContent = c.dataset.name;
      $('#chatAvatar').textContent = c.dataset.ini;
      $('#chatAvatar').className = `avatar ${c.dataset.av}`;
      $('#chatStatus').innerHTML = c.dataset.online === '1' ? '<span class="avail-dot on"></span> Online' : '<span class="avail-dot"></span> Last seen ' + (c.dataset.seen || 'recently');
      $('.unread-pill', c)?.remove();
      chat.classList.add('open-thread'); scroll();
    }));
    $('#chatBack')?.addEventListener('click', () => chat.classList.remove('open-thread'));
    const now = () => { const d = new Date(); return fmtTime(`${d.getHours()}:${d.getMinutes()}`); };
    const add = (html, me) => {
      const b = $('.chat-body:not([hidden])', chat);
      b.insertAdjacentHTML('beforeend', `<div class="msg ${me ? 'me' : ''}">${html}<time>${now()}</time></div>`); scroll();
    };
    $('#chatForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const i = $('#chatInput'); const t = i.value.trim(); if (!t) return;
      add(esc(t), true); i.value = '';
      const typing = $('#chatStatus').innerHTML;
      $('#chatStatus').textContent = 'typing…';
      setTimeout(() => { add('Thank you. I have noted this and will review the documents today.', false); $('#chatStatus').innerHTML = typing; }, 1400);
    });
    $('#emojiBtn')?.addEventListener('click', () => $('#emojiPop').classList.toggle('show'));
    $$('#emojiPop button').forEach((b) => b.addEventListener('click', () => { const i = $('#chatInput'); i.value += b.textContent; i.focus(); $('#emojiPop').classList.remove('show'); }));
    $('#attachBtn')?.addEventListener('click', () => $('#chatFile').click());
    $('#chatFile')?.addEventListener('change', (e) => { const f = e.target.files[0]; if (f) { add(`<i class="bi bi-paperclip"></i> ${esc(f.name)}`, true); e.target.value = ''; } });
    scroll();
  }

  /* ---------- Hearing calendar ---------- */
  const cal = $('#calendar');
  if (cal) {
    const events = JSON.parse(cal.dataset.hearings);
    let view = new Date(2026, 9, 1);
    const draw = () => {
      const y = view.getFullYear(), m = view.getMonth();
      $('#calTitle').textContent = `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m]} ${y}`;
      const first = new Date(y, m, 1).getDay();
      const days = new Date(y, m + 1, 0).getDate();
      let html = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<div class="cal-dow">${d}</div>`).join('');
      for (let i = 0; i < first; i++) html += '<div></div>';
      const t = new Date(2026, 9, 8);
      for (let d = 1; d <= days; d++) {
        const key = `${y}-${pad(m + 1)}-${pad(d)}`;
        const dow = new Date(y, m, d).getDay();
        const evs = events.filter((e) => e.date === key).map((e) => `<button type="button" class="ev ${e.tone || ''}" data-ev='${esc(JSON.stringify(e))}'>${esc(e.time)} ${esc(e.case)}</button>`).join('');
        const isToday = y === t.getFullYear() && m === t.getMonth() && d === t.getDate();
        html += `<div class="cal-day ${dow === 5 || dow === 6 ? 'off' : ''} ${isToday ? 'today' : ''}"><strong>${d}</strong>${evs}</div>`;
      }
      cal.innerHTML = html;
    };
    $('#calPrev').addEventListener('click', () => { view.setMonth(view.getMonth() - 1); draw(); });
    $('#calNext').addEventListener('click', () => { view.setMonth(view.getMonth() + 1); draw(); });
    cal.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ev]'); if (!b) return;
      const ev = JSON.parse(b.dataset.ev);
      $('#calInfo').innerHTML = `<div class="fw-bold">${esc(ev.case)} · ${esc(ev.title)}</div><div class="text-muted-lh small mb-2">${fmtDate(ev.date)} at ${esc(ev.time)}</div><div><i class="bi bi-bank me-1"></i>${esc(ev.court)}</div><div><i class="bi bi-person me-1"></i>${esc(ev.client)}</div><a class="btn btn-sm btn-primary mt-3" href="case-details.html">Open case</a>`;
    });
    draw();
  }

  /* ---------- Charts ---------- */
  if (window.Chart) {
    const palette = ['#173B57', '#C9A227', '#0D6EFD', '#198754', '#DC3545', '#6f42c1'];
    Chart.defaults.font.family = '"Plus Jakarta Sans", system-ui, sans-serif';
    Chart.defaults.color = '#5f6b76';
    $$('canvas[data-chart]').forEach((cv) => {
      const type = cv.dataset.chart;
      const labels = JSON.parse(cv.dataset.labels);
      const sets = JSON.parse(cv.dataset.datasets);
      const pie = type === 'doughnut';
      new Chart(cv, {
        type,
        data: { labels, datasets: sets.map((s, i) => ({ label: s.label, data: s.data, borderColor: palette[(s.c ?? i) % 6], backgroundColor: pie ? palette : (type === 'line' ? palette[(s.c ?? i) % 6] + '22' : palette[(s.c ?? i) % 6]), fill: type === 'line', tension: .35, borderRadius: type === 'bar' ? 6 : 0, borderWidth: pie ? 0 : 2, pointRadius: type === 'line' ? 3 : 0 })) },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: sets.length > 1 || pie, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } }, scales: pie ? {} : { y: { beginAtZero: true, grid: { color: 'rgba(120,140,160,.15)' }, border: { display: false } }, x: { grid: { display: false } } } },
      });
    });
  }

  /* ---------- Verification modal ---------- */
  document.addEventListener('click', (e) => {
    const v = e.target.closest('[data-verify-view]');
    if (!v) return;
    const row = v.closest('[data-row]'); const m = $('#verifyModal'); if (!m) return;
    ['name', 'email', 'phone', 'bar', 'area', 'exp', 'loc', 'date'].forEach((k) => { const el = $(`[data-v="${k}"]`, m); if (el) el.textContent = row.dataset['v' + cap(k)]; });
    $('[data-v="ini"]', m).textContent = row.dataset.vName.replace('Adv. ', '').split(' ').map((w) => w[0]).join('').slice(0, 2);
    $$('[data-row-action]', m).forEach((b) => (b.dataset.target = row.dataset.vName));
    m.dataset.rowRef = row.dataset.vId;
    bootstrap.Modal.getOrCreateInstance(m).show();
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#verifyModal [data-modal-verdict]');
    if (!b) return;
    const row = $(`[data-v-id="${$('#verifyModal').dataset.rowRef}"]`);
    if (row) { const k = b.dataset.modalVerdict; const badge = $('.badge-status', row); badge.className = `badge-status st-${k}`; badge.textContent = cap(k); row.dataset.status = k; }
    toast(`Application ${b.dataset.modalVerdict}`, b.dataset.modalVerdict === 'approved' ? 'success' : 'danger');
    bootstrap.Modal.getInstance($('#verifyModal')).hide();
  });

  /* ---------- Switch preferences ---------- */
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-toast-btn-change]')) toast('Preference saved', 'info');
  });

  /* ---------- Export / print / misc ---------- */
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-print]')) window.print();
    const ex = e.target.closest('[data-export-csv]');
    if (ex) {
      const table = $(ex.dataset.exportCsv); if (!table) return;
      const rows = $$('tr', table).filter((r) => !r.hidden).map((r) => $$('th,td', r).filter((c) => !c.classList.contains('actions')).map((c) => '"' + c.innerText.replace(/\s+/g, ' ').trim().replace(/"/g, '""') + '"').join(','));
      const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (ex.dataset.filename || 'export') + '.csv'; a.click();
      toast('Export started. Your CSV file is downloading', 'info');
    }
    const rt = e.target.closest('[data-report-tab]');
    if (rt) {
      $$('[data-report-tab]').forEach((b) => b.classList.toggle('active', b === rt));
      $('#reportTitle').textContent = rt.dataset.reportTab;
      toast(rt.dataset.reportTab + ' loaded', 'info');
    }
  });
  const billing = $('#billingToggle');
  if (billing) billing.addEventListener('change', () => $$('[data-monthly]').forEach((el) => (el.textContent = billing.checked ? el.dataset.yearly : el.dataset.monthly)));

  // Registration role switch
  $$('input[name="role"]').forEach((r) => r.addEventListener('change', () => {
    const lawyer = $('input[name="role"]:checked').value === 'lawyer';
    const lf = $('#lawyerFields'); if (!lf) return;
    lf.hidden = !lawyer;
    $$('input, select, textarea', lf).forEach((i) => { if (i.dataset.req !== undefined) i.required = lawyer; });
    $('#lawyerNotice').hidden = !lawyer;
  }));
  if (location.hash === '#lawyer') { const r = $('#role-lawyer'); if (r) { r.checked = true; r.dispatchEvent(new Event('change')); } }

  // Appointment slots
  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-slot]'); if (!s) return;
    $$('[data-slot]').forEach((x) => x.classList.remove('btn-primary')); $$('[data-slot]').forEach((x) => x.classList.add('btn-light-lh'));
    s.classList.remove('btn-light-lh'); s.classList.add('btn-primary');
    const i = $('#slotValue'); if (i) i.value = s.dataset.slot;
  });

  // Today's date labels
  $$('[data-today]').forEach((el) => (el.textContent = fmtDate('2026-10-08')));
  /* ==========================================================
     EXTENDED INTERACTIONS (language, sliders, directory, booking…)
     ========================================================== */

  /* ---------- Language switcher + Google Translate ---------- */
  const LANG = { bn: { g: 'bn', n: 'বাংলা' }, en: { g: 'en', n: 'English' }, ja: { g: 'ja', n: '日本語' }, zh: { g: 'zh-CN', n: '中文' }, ar: { g: 'ar', n: 'العربية', rtl: true } };
  let gtRequested = false;
  function loadTranslate() {
    if (gtRequested) return;
    gtRequested = true;
    window.googleTranslateElementInit = () => new google.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: 'bn,ja,zh-CN,ar', autoDisplay: false }, 'google_translate_element');
    const sc = document.createElement('script');
    sc.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    sc.async = true;
    sc.onerror = () => toast('Translation needs an internet connection. Please try again online.', 'warning');
    document.head.appendChild(sc);
  }
  function applyTranslate(code, tries = 0) {
    const combo = $('select.goog-te-combo');
    if (!combo) { if (tries < 60) setTimeout(() => applyTranslate(code, tries + 1), 250); return; }
    combo.value = LANG[code].g;
    combo.dispatchEvent(new Event('change'));
  }
  function clearTranslateCookie() {
    const exp = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'googtrans=; ' + exp;
    document.cookie = 'googtrans=; ' + exp + '; domain=' + location.hostname;
  }
  function paintLang(code) {
    $$('[data-lang-label]').forEach((l) => (l.textContent = LANG[code].n));
    const src = $(`[data-set-lang="${code}"] .flag`);
    if (src) $$('[data-lang-flag]').forEach((f) => (f.style.backgroundImage = src.style.backgroundImage));
    $$('[data-set-lang]').forEach((b) => b.classList.toggle('active', b.dataset.setLang === code));
    document.documentElement.setAttribute('dir', LANG[code].rtl ? 'rtl' : 'ltr');
  }
  function setLang(code, fromUser) {
    try { localStorage.setItem('lh-lang', code); } catch (e) { /* ignore */ }
    paintLang(code);
    const translated = /translated/.test(document.documentElement.className);
    if (code === 'en') {
      if (translated || fromUser) { clearTranslateCookie(); if (translated) location.reload(); }
    } else { loadTranslate(); applyTranslate(code); if (fromUser) toast('Translating page to ' + LANG[code].n + '…', 'info'); }
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-set-lang]');
    if (b) setLang(b.dataset.setLang, true);
  });
  let savedLang = 'en';
  try { savedLang = localStorage.getItem('lh-lang') || 'en'; } catch (e) { /* ignore */ }
  paintLang(savedLang);
  if (!LANG[savedLang]) savedLang = 'en';
  if (savedLang !== 'en') setLang(savedLang, false);

  /* ---------- Sliders ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-slider]').forEach((sl) => {
    const track = $('.slides', sl), dots = $('[data-slider-dots]', sl);
    const auto = Number(sl.dataset.autoplay || 0);
    let timer = null, paused = false;
    const pages = () => Math.max(1, Math.ceil((track.scrollWidth - track.clientWidth - 30) / track.clientWidth) + 1);
    const atEndNow = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 6;
    const cur = () => (atEndNow() && track.scrollLeft > 6 ? pages() - 1 : Math.min(pages() - 1, Math.round(track.scrollLeft / track.clientWidth)));
    const build = () => {
      dots.innerHTML = '';
      for (let i = 0; i < pages(); i++) { const d = document.createElement('button'); d.type = 'button'; d.setAttribute('aria-label', 'Go to slide group ' + (i + 1)); d.addEventListener('click', () => track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' })); dots.appendChild(d); }
      mark();
    };
    const mark = () => $$('button', dots).forEach((d, i) => d.classList.toggle('on', i === cur()));
    const step = () => { const s = $('.slide:not([hidden])', track); return s ? s.getBoundingClientRect().width + 16 : track.clientWidth; };
    const atEnd = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 6;
    const next = () => (atEnd() ? track.scrollTo({ left: 0, behavior: 'smooth' }) : track.scrollBy({ left: step(), behavior: 'smooth' }));
    const prev = () => (track.scrollLeft < 6 ? track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' }) : track.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('[data-slider-next]', sl).addEventListener('click', () => { next(); });
    $('[data-slider-prev]', sl).addEventListener('click', () => { prev(); });
    track.addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true });
    track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); next(); } if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); } });
    window.addEventListener('resize', build);
    sl._rebuild = () => { track.scrollTo({ left: 0 }); build(); };
    if (auto && !reduceMotion) {
      ['mouseenter', 'focusin', 'touchstart'].forEach((ev) => sl.addEventListener(ev, () => (paused = true), { passive: true }));
      ['mouseleave', 'focusout'].forEach((ev) => sl.addEventListener(ev, () => (paused = false)));
      timer = setInterval(() => { if (!paused && !document.hidden) next(); }, auto);
    }
    build();
  });
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-review-filter]');
    if (!f) return;
    $$('[data-review-filter]').forEach((b) => { const on = b === f; b.classList.toggle('active', on); b.classList.toggle('btn-primary', on); b.classList.toggle('btn-light-lh', !on); });
    const sl = $('#reviewSlider'); const k = f.dataset.reviewFilter;
    $$('.slide', sl).forEach((s) => (s.hidden = k !== 'all' && s.dataset.kind !== k));
    sl._rebuild();
  });

  /* ---------- Count-up numbers ---------- */
  function countUp(el) {
    const t = el.textContent.trim();
    const m = t.match(/\d[\d,]*(\.\d+)?/);
    if (!m) return;
    const target = parseFloat(m[0].replace(/,/g, ''));
    if (!isFinite(target) || target < 3) return;
    const dec = m[1] ? m[1].length - 1 : 0;
    const loc = /\d{1,2},\d{2},\d{3}/.test(t) ? 'en-IN' : 'en-US';
    const fmt = (n) => n.toLocaleString(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const start = performance.now(), dur = 1100;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur), v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = t.replace(m[0], fmt(p === 1 ? target : v));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { countUp(en.target); io.unobserve(en.target); } }), { threshold: .4 });
    $$('[data-count], .stat-card .value, .stat-strip .num').forEach((el) => io.observe(el));
    $$('[data-grow]').forEach((b) => { b.closest('.tab-pane') && document.addEventListener('shown.bs.tab', () => (b.style.width = b.dataset.grow + '%')); });
  } else $$('[data-grow]').forEach((b) => (b.style.width = b.dataset.grow + '%'));

  /* ---------- Home: reminder preview ---------- */
  const rd = $('[data-reminder-demo]');
  if (rd) {
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDemo = new Date(2026, 9, 8);
    const render = () => {
      const v = $('#rpDate').value; if (!v) return;
      const [y, m, d] = v.split('-').map(Number);
      const chans = [['#rpPush', 'Push'], ['#rpEmail', 'Email'], ['#rpSms', 'SMS']].filter(([id]) => $(id).checked).map((c) => c[1]);
      $$('.rp-item', rd).forEach((it) => {
        const n = Number(it.dataset.rp), when = new Date(y, m - 1, d - n);
        const iso = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`;
        const past = when < todayDemo, now = when.getTime() === todayDemo.getTime();
        $('[data-rp-date]', it).textContent = `${DAYS[when.getDay()]}, ${fmtDate(iso)} · ${chans.length ? chans.join(', ') : 'No channel selected'}`;
        const st = $('[data-rp-state]', it);
        st.className = 'badge-status ' + (past ? 'st-draft' : now ? 'st-today' : 'st-scheduled');
        st.textContent = past ? 'Too late' : now ? 'Sends today' : 'Scheduled';
        it.classList.toggle('past', past);
        it.classList.add('pop'); setTimeout(() => it.classList.remove('pop'), 220);
      });
    };
    rd.addEventListener('input', render); rd.addEventListener('change', render); render();
  }

  /* ---------- Home: feature showcase + stepper + FAQ search ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-sc-tab]');
    if (t) {
      $$('[data-sc-tab]').forEach((b) => { const on = b === t; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
      $$('[data-sc-panel]').forEach((p) => (p.hidden = p.dataset.scPanel !== t.dataset.scTab));
    }
  });
  const stepper = $('[data-stepper]');
  if (stepper) {
    const btns = $$('.stp', stepper), panels = $$('[data-stp-panel]', stepper), fill = $('[data-stp-fill]', stepper);
    let idx = 0, hover = false, userDriven = false;
    const go = (i) => {
      idx = i;
      btns.forEach((b, k) => { b.classList.toggle('active', k === i); b.classList.toggle('done', k < i); });
      panels.forEach((p, k) => (p.hidden = k !== i));
      fill.style.width = (i / (btns.length - 1)) * 100 + '%';
    };
    btns.forEach((b, i) => b.addEventListener('click', () => { userDriven = true; go(i); }));
    stepper.addEventListener('mouseenter', () => (hover = true)); stepper.addEventListener('mouseleave', () => (hover = false));
    if (!reduceMotion) setInterval(() => { if (!hover && !userDriven && !document.hidden) go((idx + 1) % btns.length); }, 4500);
    go(0);
  }
  const faqS = $('[data-faq-search]');
  if (faqS) faqS.addEventListener('input', () => {
    const q = faqS.value.trim().toLowerCase(); let n = 0;
    $$('#faq .accordion-item').forEach((it) => { const ok = !q || it.textContent.toLowerCase().includes(q); it.hidden = !ok; if (ok) n++; });
    $('#faqEmpty').hidden = n > 0;
  });

  /* ---------- Directory: favourites, quick view, view mode, chips ---------- */
  const updateSaved = () => { const c = $('#savedCount'); if (c) c.textContent = $$('#lawyerGrid .lc-fav.on').length; };
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-fav]');
    if (f) {
      const on = f.classList.toggle('on');
      f.setAttribute('aria-pressed', on);
      const ic = $('.bi', f); if (ic) ic.className = 'bi ' + (on ? 'bi-heart-fill' : 'bi-heart');
      updateSaved(); toast(on ? 'Lawyer saved to your list' : 'Removed from your saved list', on ? 'success' : 'info');
    }
    if (e.target.closest('#savedBtn')) {
      const names = $$('#lawyerGrid .lc-fav.on').map((b) => b.getAttribute('aria-label').replace('Save ', ''));
      toast(names.length ? 'Saved: ' + names.join(', ') : 'No saved lawyers yet. Tap the heart on a card.', names.length ? 'success' : 'info');
    }
    const qv = e.target.closest('[data-quickview]');
    if (qv) {
      const L = JSON.parse(qv.closest('[data-profile]').dataset.profile), m = $('#quickModal');
      const set = (k, v) => { const el = $(`[data-qv="${k}"]`, m); if (el) el.textContent = v; };
      set('name', L.name); set('area', L.area); set('bio', L.bio); set('exp', L.exp + ' yrs'); set('cases', L.cases + '+'); set('fee', '৳ ' + L.fee); set('loc', L.loc); set('langs', L.langs); set('bar', L.bar);
      const av = $('[data-qv="ini"]', m); av.textContent = L.ini; av.className = `avatar avatar-lg av-${L.av}`;
      $('[data-qv="rating"]', m).textContent = '★ ' + L.rating + ' (' + L.rev + ' reviews)';
      $('[data-qv="subs"]', m).innerHTML = L.subs.map((s) => `<span class="chip">${esc(s)}</span>`).join('');
      bootstrap.Modal.getOrCreateInstance(m).show();
    }
    const vw = e.target.closest('[data-view]');
    if (vw) {
      $$('[data-view]').forEach((b) => { const on = b === vw; b.classList.toggle('btn-primary', on); b.classList.toggle('btn-light-lh', !on); });
      $('#lawyerGrid').classList.toggle('list-view', vw.dataset.view === 'list');
    }
    const qa = e.target.closest('[data-quick-area]');
    if (qa) { const s = $('#f-area'); s.value = s.value === qa.dataset.quickArea ? '' : qa.dataset.quickArea; s.dispatchEvent(new Event('change', { bubbles: true })); $$('[data-quick-area]').forEach((b) => b.classList.toggle('btn-primary', b.dataset.quickArea === s.value)); }
  });
  const consultM = $('#consultModal');
  if (consultM) consultM.addEventListener('show.bs.modal', (e) => {
    const l = e.relatedTarget && e.relatedTarget.dataset.lawyer, sel = $('#cmLawyer');
    if (l && sel) sel.value = l;
  });
  function renderChips() {
    const box = $('#activeChips'); if (!box) return;
    const items = [];
    $$('[data-filter-for="lawyerGrid"]').forEach((c) => {
      if (c.type === 'checkbox') { if (c.checked) items.push([c, c.dataset.chip || c.value]); }
      else if (c.type === 'range') { if (c.value !== c.dataset.rangeMax) items.push([c, 'Up to ৳ ' + Number(c.value).toLocaleString('en-US')]); }
      else if (c.value.trim()) items.push([c, c.tagName === 'SELECT' ? c.options[c.selectedIndex].text : '“' + c.value.trim() + '”']);
    });
    box.innerHTML = '';
    items.forEach(([c, t]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip chip-x'; b.setAttribute('aria-label', 'Remove filter ' + t); b.innerHTML = esc(t) + ' <i class="bi bi-x-lg"></i>';
      b.addEventListener('click', () => { if (c.type === 'checkbox') c.checked = false; else if (c.type === 'range') c.value = c.dataset.rangeMax; else c.value = ''; c.dispatchEvent(new Event('change', { bubbles: true })); });
      box.appendChild(b);
    });
  }
  $$('input[type=range][data-filter-for]').forEach((r) => {
    const out = $(r.dataset.rangeOut);
    const upd = () => { if (out) out.textContent = r.value === r.dataset.rangeMax ? 'Any' : '৳ ' + Number(r.value).toLocaleString('en-US'); };
    r.addEventListener('input', () => { upd(); lists[r.dataset.filterFor].page = 1; refreshLists(); renderChips(); });
    r.addEventListener('change', upd);
  });
  if ($('#activeChips')) {
    ['input', 'change'].forEach((ev) => document.addEventListener(ev, (e) => { if (e.target.matches('[data-filter-for="lawyerGrid"]')) renderChips(); }));
    document.addEventListener('click', (e) => { if (e.target.closest('[data-filter-reset="lawyerGrid"]')) setTimeout(() => { renderChips(); const o = $('#feeOut'); if (o) o.textContent = 'Any'; $$('[data-quick-area]').forEach((b) => b.classList.remove('btn-primary')); }, 0); });
    renderChips();
  }

  /* ---------- Lawyer profile: booking widget, reviews ---------- */
  const bk = $('[data-booking]');
  if (bk) {
    const datesBox = $('[data-bk-dates]'), slotsBox = $('[data-bk-slots]');
    const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const times = ['10:00 AM', '11:30 AM', '2:00 PM', '4:00 PM', '5:30 PM', '7:00 PM'];
    const days = []; const d0 = new Date(2026, 9, 11);
    while (days.length < 7) { if (d0.getDay() !== 5 && d0.getDay() !== 6) days.push(new Date(d0)); d0.setDate(d0.getDate() + 1); }
    const state = { date: null, slot: null };
    const money = (n) => n.toLocaleString('en-US');
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    datesBox.innerHTML = days.map((d, i) => `<button type="button" class="bk-date" data-i="${i}"><span>${WD[d.getDay()]}</span><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></button>`).join('');
    const drawSlots = () => {
      const d = state.date;
      slotsBox.innerHTML = times.map((t, i) => `<button type="button" class="bk-slot ${state.slot === t ? 'on' : ''}" data-t="${t}" ${d && (d.getDate() + i) % 4 === 0 ? 'disabled' : ''}>${t}</button>`).join('');
    };
    const chosen = () => { $('#bkChosen').textContent = state.date && state.slot ? `${WD[state.date.getDay()]}, ${fmtDate(iso(state.date))} at ${state.slot}` : state.date ? 'Now pick a time.' : 'Pick a date and time to continue.'; };
    const fee = () => { const f = Number($('input[name="bkType"]:checked', bk).dataset.fee); $('#bkFee').textContent = $('#bkSub').textContent = money(f); $('#bkTotal').textContent = money(f + 50); };
    datesBox.addEventListener('click', (e) => { const b = e.target.closest('.bk-date'); if (!b) return; state.date = days[b.dataset.i]; state.slot = null; $$('.bk-date', datesBox).forEach((x) => x.classList.toggle('on', x === b)); drawSlots(); chosen(); });
    slotsBox.addEventListener('click', (e) => { const b = e.target.closest('.bk-slot'); if (!b || b.disabled) return; state.slot = b.dataset.t; drawSlots(); chosen(); });
    $$('input[name="bkType"]', bk).forEach((r) => r.addEventListener('change', fee));
    $('[data-bk-submit]', bk).addEventListener('click', (ev) => {
      if (!state.date || !state.slot) { toast('Please pick a date and a time first', 'warning'); return; }
      toast('Consultation Request Sent'); ev.currentTarget.innerHTML = '<i class="bi bi-check2-circle"></i> Request sent'; ev.currentTarget.disabled = true;
      $('#bkChosen').textContent = 'Request sent for ' + $('#bkChosen').textContent + '. You will be notified when the lawyer responds.';
    });
    drawSlots(); fee();
  }
  document.addEventListener('click', (e) => {
    const sc = e.target.closest('[data-scroll-to]');
    if (sc && $(sc.getAttribute('href'))) { const t = $(sc.getAttribute('href')); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); }
    const h = e.target.closest('[data-helpful]');
    if (h && !h.dataset.done) { h.dataset.done = '1'; const n = $('span', h); n.textContent = Number(n.textContent) + 1; h.classList.add('active', 'btn-primary'); h.classList.remove('btn-light-lh'); }
    const fl = e.target.closest('[data-follow]');
    if (fl) { const on = fl.classList.toggle('active'); $('span', fl).textContent = on ? 'Following' : 'Follow'; $('.bi', fl).className = 'bi ' + (on ? 'bi-person-check-fill' : 'bi-person-plus'); toast(on ? 'You are now following Adv. Farhana Rahman' : 'Unfollowed', on ? 'success' : 'info'); }
    const sf = e.target.closest('[data-star-filter]');
    if (sf) {
      const k = sf.dataset.starFilter;
      $$('[data-star-filter]').forEach((b) => b.classList.toggle('on', b === sf && k !== 'all'));
      let n = 0; $$('#reviewList .review').forEach((r) => { const ok = k === 'all' || r.dataset.stars === k; r.hidden = !ok; if (ok) n++; });
      const old = $('#noRev'); if (old) old.remove();
      if (!n) $('#reviewList').insertAdjacentHTML('beforeend', '<p id="noRev" class="text-muted-lh">No reviews with this rating yet.</p>');
    }
  });
  handlers.review = (form) => {
    const f = new FormData(form), list = $('#reviewList'); if (!list) return;
    const st = Number(f.get('stars')), name = String(f.get('name') || 'You');
    const ini = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    list.insertAdjacentHTML('afterbegin', `<div class="review" data-stars="${st}"><div class="d-flex gap-2 align-items-center mb-1"><span class="avatar avatar-sm av-1">${esc(ini)}</span><div><strong class="small">${esc(name)}</strong><div class="small text-muted-lh">Just now</div></div><span class="rating ms-auto">${'<i class="bi bi-star-fill"></i>'.repeat(st)}</span></div><p class="mb-2">${esc(f.get('rvText'))}</p></div>`);
  };

  /* ---------- Panels: collapse, global search, sortable tables, live alerts ---------- */
  try { if (localStorage.getItem('lh-sb') === '1') document.body.classList.add('sb-collapsed'); } catch (e) { /* ignore */ }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-sidebar-collapse]')) { const on = document.body.classList.toggle('sb-collapsed'); try { localStorage.setItem('lh-sb', on ? '1' : '0'); } catch (er) { /* ignore */ } }
  });
  const gs = $('#globalSearch');
  if (gs) {
    const idx = JSON.parse(gs.dataset.searchIndex), box = $('#searchResults');
    let sel = -1;
    const hl = (t, q) => { const i = t.toLowerCase().indexOf(q); return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); };
    const draw = () => {
      const q = gs.value.trim().toLowerCase();
      if (!q) { box.hidden = true; return; }
      const hits = idx.filter((x) => (x.t + ' ' + x.s).toLowerCase().includes(q)).slice(0, 7);
      box.innerHTML = hits.length ? hits.map((h) => `<a href="${h.h}"><span class="sr-ico"><i class="bi bi-${h.i}"></i></span><span class="min-w-0"><span class="d-block small fw-semibold">${hl(h.t, q)}</span><span class="d-block small text-muted-lh">${h.s}</span></span></a>`).join('') : '<div class="p-3 small text-muted-lh">No results found.</div>';
      box.hidden = false; sel = -1;
    };
    gs.addEventListener('input', draw);
    gs.addEventListener('keydown', (e) => {
      const links = $$('a', box);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % (links.length || 1); links.forEach((l, i) => l.classList.toggle('on', i === sel)); }
      if (e.key === 'Enter' && links.length) { e.preventDefault(); location.href = (links[sel] || links[0]).getAttribute('href'); }
      if (e.key === 'Escape') { box.hidden = true; gs.blur(); }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.search')) box.hidden = true; });
    document.addEventListener('keydown', (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); gs.focus(); gs.select(); }
    });
  }
  const parseCell = (t) => {
    t = t.trim();
    const d = t.match(/^(\d{2}) (\w{3}) (\d{4})/);
    if (d) return new Date(`${d[2]} ${d[1]}, ${d[3]}`).getTime();
    const n = parseFloat(t.replace(/[৳,\s]/g, ''));
    return isNaN(n) || !/\d/.test(t.slice(0, 3)) && !/^[৳\d]/.test(t) ? t.toLowerCase() : n;
  };
  $$('table.table-lh').forEach((tb) => {
    const body = $('tbody', tb); if (!body || !$('[data-row]', body)) return;
    $$('thead th', tb).forEach((th, i) => {
      if (/^(action|actions|push|email|sms|reminder)$/i.test(th.textContent.trim())) return;
      th.classList.add('sortable'); th.tabIndex = 0; th.setAttribute('role', 'button');
      const sort = () => {
        const asc = !th.classList.contains('sort-asc');
        $$('thead th', tb).forEach((x) => x.classList.remove('sort-asc', 'sort-desc'));
        th.classList.add(asc ? 'sort-asc' : 'sort-desc');
        const rows = $$('tr', body);
        rows.sort((a, b) => { const x = parseCell(a.children[i].innerText), y = parseCell(b.children[i].innerText); return (x > y ? 1 : x < y ? -1 : 0) * (asc ? 1 : -1); });
        rows.forEach((r) => body.appendChild(r));
      };
      th.addEventListener('click', sort); th.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sort(); } });
    });
  });
  const menu = $('.notif-menu');
  if (menu && $('.bell-badge')) setTimeout(() => {
    const head = menu.firstElementChild;
    head.insertAdjacentHTML('afterend', '<div class="notif-item unread" data-type="message"><span class="notif-ico tone-primary"><i class="bi bi-chat-dots"></i></span><div><div class="fw-semibold small">New Message</div><div class="small text-muted-lh">Adv. Mahmudul Hasan: I have reviewed your documents.</div><div class="small text-muted-lh opacity-75">Just now</div></div></div>');
    updateBell(); toast('New message from Adv. Mahmudul Hasan', 'info');
  }, 20000);
  $$('[data-bs-toggle="tooltip"]').forEach((el) => new bootstrap.Tooltip(el));

  /* ---------- Back to top + nav shadow ---------- */
  const bt = $('[data-back-top]'), snav = $('.site-nav');
  const onScroll = () => { if (bt) bt.hidden = window.scrollY < 600; if (snav) snav.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (bt) bt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  /* ---------- Home: problem finder, hero tilt, scroll progress, reveal ---------- */
  document.addEventListener('click', (e) => {
    const q = e.target.closest('[data-qz]');
    if (!q) return;
    $$('[data-qz]').forEach((b) => { const on = b === q; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
    $$('[data-qz-panel]').forEach((p) => (p.hidden = p.dataset.qzPanel !== q.dataset.qz));
    if (window.innerWidth < 992) { const card = $('.qz-card'); if (card) card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' }); }
  });
  const art = $('.hero-art');
  if (art && window.matchMedia('(hover: hover)').matches && !reduceMotion) {
    const a = $('.hearing-ticket', art), b = $('.mini-lawyer', art);
    art.addEventListener('mousemove', (e) => {
      const r = art.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      if (a) a.style.transform = `translate(${x * -14}px, ${y * -10}px)`;
      if (b) b.style.transform = `translate(${x * 16}px, ${y * 12}px)`;
    });
    art.addEventListener('mouseleave', () => { if (a) a.style.transform = ''; if (b) b.style.transform = ''; });
  }
  const bar = $('[data-progress]');
  if (bar) window.addEventListener('scroll', () => { const h = document.documentElement; bar.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100 + '%'; }, { passive: true });
  if ('IntersectionObserver' in window && !reduceMotion && $('.scroll-progress')) {
    const rv = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); rv.unobserve(en.target); } }), { threshold: .08, rootMargin: '0px 0px -40px 0px' });
    $$('main .section > .container > *, main .section-sm > .container > *').forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add('reveal'); rv.observe(el);
    });
  }
})();
