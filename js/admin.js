// Admin page script: requires admin authentication stored in localStorage under 'tv_auth'
const ADMIN_EMAIL = 'admin@unifeso.com.br';

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast show ${type === 'error' ? 'error' : 'success'}`;
  setTimeout(() => { toast.className = 'toast'; }, 3800);
}

document.addEventListener('DOMContentLoaded', () => {
  const authRaw = localStorage.getItem('tv_auth');
  let auth = null;
  try { auth = authRaw ? JSON.parse(authRaw) : null; } catch (e) { auth = null; }
  if (!auth || auth.email !== ADMIN_EMAIL) {
    window.location.href = 'login.html';
    return;
  }

  // state
  let contacts = [];
  let events = [];

  const contactsList = document.getElementById('contactsList');
  const eventsList = document.getElementById('eventsList');
  const addContactBtn = document.getElementById('addContactBtn');
  const addEventBtn = document.getElementById('addEventBtn');
  const saveContactsBtn = document.getElementById('saveContacts');
  const saveEventsBtn = document.getElementById('saveEvents');
  const loadContactsBtn = document.getElementById('loadContacts');
  const loadEventsBtn = document.getElementById('loadEvents');
  const logoutBtn = document.getElementById('logoutBtn');

  function createInput({ tag = 'input', value = '', placeholder = '', cls = '', attrs = {} } = {}) {
    const el = document.createElement(tag === 'textarea' ? 'textarea' : 'input');
    if (tag === 'textarea') el.rows = 3;
    el.className = `form-input ${cls}`.trim();
    if (tag !== 'textarea') el.type = attrs.type || 'text';
    el.placeholder = placeholder;
    el.value = value || '';
    Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
    return el;
  }

  function renderContacts() {
    contactsList.innerHTML = '';
    if (!contacts.length) {
      contactsList.innerHTML = '<div class="small">Nenhum contato. Clique em "Adicionar Contato" para criar um.</div>';
      return;
    }

    contacts.forEach((c, idx) => {
      const card = document.createElement('div');
      card.className = 'item-card';

      const fields = document.createElement('div');
      fields.className = 'item-fields';

      const name = createInput({ value: c.name || '', placeholder: 'Nome *' });
      const email = createInput({ value: c.email || '', placeholder: 'E-mail *', attrs: { type: 'email' } });
      const phone = createInput({ value: c.phone || '', placeholder: 'Telefone' });
      const address = createInput({ tag: 'textarea', value: c.address || '', placeholder: 'Endereço' });

      name.addEventListener('input', e => contacts[idx].name = e.target.value);
      email.addEventListener('input', e => contacts[idx].email = e.target.value);
      phone.addEventListener('input', e => contacts[idx].phone = e.target.value);
      address.addEventListener('input', e => contacts[idx].address = e.target.value);

      fields.appendChild(name);
      fields.appendChild(email);
      fields.appendChild(phone);
      fields.appendChild(address);

      const actions = document.createElement('div');
      actions.className = 'item-actions';
      const del = document.createElement('button');
      del.className = 'btn';
      del.textContent = 'Remover';
      del.addEventListener('click', () => {
        contacts.splice(idx, 1);
        renderContacts();
      });

      actions.appendChild(del);

      card.appendChild(fields);
      card.appendChild(actions);
      contactsList.appendChild(card);
    });
  }

  function renderEvents() {
    eventsList.innerHTML = '';
    if (!events.length) {
      eventsList.innerHTML = '<div class="small">Nenhum evento. Clique em "Adicionar Evento" para criar um.</div>';
      return;
    }

    events.forEach((ev, idx) => {
      const card = document.createElement('div');
      card.className = 'item-card';

      const fields = document.createElement('div');
      fields.className = 'item-fields';

      const title = createInput({ value: ev.title || '', placeholder: 'Título *' });
      const date = createInput({ value: ev.date || '', placeholder: 'Data (dd/mm/aaaa) *' });
      const location = createInput({ value: ev.location || '', placeholder: 'Local' });
      const desc = createInput({ tag: 'textarea', value: ev.description || '', placeholder: 'Descrição' });

      title.addEventListener('input', e => events[idx].title = e.target.value);
      date.addEventListener('input', e => events[idx].date = e.target.value);
      location.addEventListener('input', e => events[idx].location = e.target.value);
      desc.addEventListener('input', e => events[idx].description = e.target.value);

      fields.appendChild(title);
      const row = document.createElement('div'); row.className = 'field-row'; row.appendChild(date); row.appendChild(location);
      fields.appendChild(row);
      fields.appendChild(desc);

      const actions = document.createElement('div');
      actions.className = 'item-actions';
      const del = document.createElement('button');
      del.className = 'btn';
      del.textContent = 'Remover';
      del.addEventListener('click', () => {
        events.splice(idx, 1);
        renderEvents();
      });

      actions.appendChild(del);

      card.appendChild(fields);
      card.appendChild(actions);
      eventsList.appendChild(card);
    });
  }

  function addContact(def = {}) {
    contacts.push({ name: def.name || '', email: def.email || '', phone: def.phone || '', address: def.address || '' });
    renderContacts();
  }

  function addEvent(def = {}) {
    events.push({ title: def.title || '', date: def.date || '', location: def.location || '', description: def.description || '' });
    renderEvents();
  }

  function validateContacts() {
    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      if ((!c.name || !c.name.trim()) && (!c.email || !c.email.trim())) {
        return { ok: false, msg: `Contato ${i+1}: informe nome ou e-mail.` };
      }
      if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
        return { ok: false, msg: `Contato ${i+1}: e-mail inválido.` };
      }
    }
    return { ok: true };
  }

  function validateEvents() {
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (!e.title || !e.title.trim()) return { ok: false, msg: `Evento ${i+1}: título obrigatório.` };
      if (!e.date || !e.date.trim()) return { ok: false, msg: `Evento ${i+1}: data obrigatória.` };
    }
    return { ok: true };
  }

  function saveContacts() {
    const v = validateContacts();
    if (!v.ok) { showToast(v.msg, 'error'); return; }
    try {
      localStorage.setItem('contacts', JSON.stringify(contacts));
      // also store a simple HTML fallback for older pages
      const html = contacts.map(c => `<div class=\"contact-card\"><h3>${escapeHtml(c.name || '')}</h3><p><a href=\"mailto:${escapeHtml(c.email||'')}\">${escapeHtml(c.email||'')}</a></p><p>${escapeHtml(c.phone||'')}</p><p>${escapeHtml(c.address||'')}</p></div>`).join('\n');
      localStorage.setItem('contacts_html', html);
      showToast('Contatos salvos com sucesso.');
    } catch (e) {
      showToast('Erro ao salvar contatos.', 'error');
    }
  }

  function saveEvents() {
    const v = validateEvents();
    if (!v.ok) { showToast(v.msg, 'error'); return; }
    try {
      localStorage.setItem('events', JSON.stringify(events));
      const html = events.map(ev => `<div class=\"event-card\"><h3>${escapeHtml(ev.title)}</h3><div class=\"event-meta\">${escapeHtml(ev.date)} — ${escapeHtml(ev.location||'')}</div><p>${escapeHtml(ev.description||'')}</p></div>`).join('\n');
      localStorage.setItem('events_html', html);
      showToast('Eventos salvos com sucesso.');
    } catch (e) {
      showToast('Erro ao salvar eventos.', 'error');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function loadInitialData() {
    // contacts
    const raw = localStorage.getItem('contacts');
    if (raw) {
      try { contacts = JSON.parse(raw); } catch (e) { contacts = []; }
    } else {
      const html = localStorage.getItem('contacts_html');
      if (html) contacts = [{ name: '', email: '', phone: '', address: '', html }];
    }

    // events
    const rawE = localStorage.getItem('events');
    if (rawE) {
      try { events = JSON.parse(rawE); } catch (e) { events = []; }
    } else {
      const html = localStorage.getItem('events_html');
      if (html) events = [{ title: '', date: '', location: '', description: '', html }];
    }
  }

  // wire
  addContactBtn.addEventListener('click', () => addContact());
  addEventBtn.addEventListener('click', () => addEvent());
  saveContactsBtn.addEventListener('click', saveContacts);
  saveEventsBtn.addEventListener('click', saveEvents);
  loadContactsBtn.addEventListener('click', () => { loadInitialData(); renderContacts(); showToast('Contatos recarregados.'); });
  loadEventsBtn.addEventListener('click', () => { loadInitialData(); renderEvents(); showToast('Eventos recarregados.'); });
  logoutBtn.addEventListener('click', () => { localStorage.removeItem('tv_auth'); window.location.href = 'login.html'; });

  // initial
  loadInitialData();
  if (!contacts.length) addContact();
  if (!events.length) addEvent();
  renderContacts();
  renderEvents();
});
