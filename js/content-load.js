// Carrega conteúdo editável salvo em localStorage para as páginas públicas
document.addEventListener('DOMContentLoaded', () => {
  function getAuth() {
    try { const raw = localStorage.getItem('tv_auth'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  const isAdmin = (() => { const a = getAuth(); return a && a.role === 'admin'; })();

  // helpers
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function saveContactsToStorage(arr) {
    try {
      localStorage.setItem('contacts', JSON.stringify(arr));
      const html = arr.map(c => `<div class=\"contact-card\"><h3>${escapeHtml(c.name||'')}</h3>${c.email?`<p><a href=\"mailto:${escapeHtml(c.email)}\">${escapeHtml(c.email)}</a></p>`:''}${c.phone?`<p>${escapeHtml(c.phone)}</p>`:''}${c.address?`<p>${escapeHtml(c.address)}</p>`:''}</div>`).join('\n');
      localStorage.setItem('contacts_html', html);
    } catch (e) { /* ignore */ }
  }

  function saveEventsToStorage(arr) {
    try {
      localStorage.setItem('events', JSON.stringify(arr));
      const html = arr.map(ev => `<div class=\"event-card\">${ev.image?`<img src=\"${escapeHtml(ev.image)}\"/>`:''}<h3>${escapeHtml(ev.title||'')}</h3><div class=\"event-meta\">${escapeHtml(ev.date||'')}${ev.location? ' — '+escapeHtml(ev.location):''}</div><p>${escapeHtml(ev.description||'')}</p></div>`).join('\n');
      localStorage.setItem('events_html', html);
    } catch (e) { /* ignore */ }
  }

  // parse fallback HTML into structured objects (used when JSON not present)
  function parseContactsHtml(html) {
    try {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      const nodes = wrapper.querySelectorAll('.contact-card');
      const parsed = [];
      if (nodes.length) {
        nodes.forEach(n => {
          const nameEl = n.querySelector('h3');
          const mailEl = n.querySelector('a[href^="mailto:"]');
          const ps = Array.from(n.querySelectorAll('p'));
          const texts = ps.map(p => p.textContent.trim());
          const email = mailEl ? (mailEl.getAttribute('href')||'').replace(/^mailto:/,'') : '';
          // remove email paragraph from texts
          const nonMail = ps.filter(p => !p.querySelector('a')).map(p=>p.textContent.trim());
          const phone = nonMail[0] || '';
          const address = nonMail[1] || '';
          parsed.push({ name: nameEl?nameEl.textContent.trim(): '', email, phone, address });
        });
      }
      return parsed;
    } catch (e) { return []; }
  }

  function parseEventsHtml(html) {
    try {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      const nodes = wrapper.querySelectorAll('.event-card');
      const parsed = [];
      if (nodes.length) {
        nodes.forEach(n => {
          const titleEl = n.querySelector('h3');
          const metaEl = n.querySelector('.event-meta');
          const descEl = n.querySelector('p');
          let date = '';
          let location = '';
          if (metaEl) {
            const txt = metaEl.textContent || '';
            const parts = txt.split('—').map(s=>s.trim());
            date = parts[0] || '';
            location = parts[1] || '';
          }
          parsed.push({ title: titleEl?titleEl.textContent.trim(): '', date, location, description: descEl?descEl.textContent.trim(): '' });
        });
      }
      return parsed;
    } catch (e) { return []; }
  }

  // Render contacts with inline edit controls for admin
  const contactsEl = document.getElementById('editable-contacts');
  if (contactsEl) {
    let contacts = [];
    const raw = localStorage.getItem('contacts');
    if (raw) {
      try { contacts = JSON.parse(raw); } catch (e) { contacts = []; }
    } else {
      const fallback = localStorage.getItem('contacts_html');
      if (fallback) contacts = parseContactsHtml(fallback);
    }

    function renderContacts() {
      contactsEl.innerHTML = '';
      // admin toolbar
      if (isAdmin) {
        const bar = document.createElement('div'); bar.className = 'edit-bar';
        const addBtn = document.createElement('button'); addBtn.className = 'edit-btn primary'; addBtn.textContent = 'Adicionar Contato';
        addBtn.addEventListener('click', () => { contacts.push({ name:'', email:'', phone:'', address:'' }); renderContacts(); startEdit(contacts.length-1); });
        const saveAll = document.createElement('button'); saveAll.className = 'edit-btn'; saveAll.textContent = 'Salvar Alterações';
        saveAll.addEventListener('click', () => { saveContactsToStorage(contacts); window.location.reload(); });
        bar.appendChild(addBtn); bar.appendChild(saveAll);
        contactsEl.appendChild(bar);
      }

      if (!contacts.length) {
        const empty = document.createElement('div'); empty.className = 'small-muted'; empty.textContent = 'Nenhum contato cadastrado.'; contactsEl.appendChild(empty); return;
      }

      contacts.forEach((c, idx) => {
        const card = document.createElement('div'); card.className = 'contact-card';
        const title = document.createElement('h3'); title.textContent = c.name || 'Contato'; card.appendChild(title);
        if (c.email) { const p = document.createElement('p'); p.innerHTML = `<a href=\"mailto:${escapeHtml(c.email)}\">${escapeHtml(c.email)}</a>`; card.appendChild(p); }
        if (c.phone) { const p = document.createElement('p'); p.textContent = c.phone; card.appendChild(p); }
        if (c.address) { const p = document.createElement('p'); p.textContent = c.address; card.appendChild(p); }

        if (isAdmin) {
          const actions = document.createElement('div'); actions.className = 'inline-actions';
          const editBtn = document.createElement('button'); editBtn.className = 'edit-btn'; editBtn.textContent = 'Editar';
          editBtn.addEventListener('click', () => startEdit(idx));
          const delBtn = document.createElement('button'); delBtn.className = 'edit-btn'; delBtn.textContent = 'Remover';
          delBtn.addEventListener('click', () => { contacts.splice(idx,1); saveContactsToStorage(contacts); renderContacts(); });
          actions.appendChild(editBtn); actions.appendChild(delBtn); card.appendChild(actions);
        }

        contactsEl.appendChild(card);
      });
    }

    function startEdit(idx) {
      const current = contacts[idx];
      const cards = contactsEl.querySelectorAll('.contact-card');
      const card = cards[idx];
      if (!card) return renderContacts();
      card.classList.add('card-editing');
      card.innerHTML = '';
      const nameIn = document.createElement('input'); nameIn.className='inline-input'; nameIn.placeholder='Nome'; nameIn.value = current.name||'';
      const emailIn = document.createElement('input'); emailIn.className='inline-input'; emailIn.placeholder='E-mail'; emailIn.value = current.email||'';
      const phoneIn = document.createElement('input'); phoneIn.className='inline-input'; phoneIn.placeholder='Telefone'; phoneIn.value = current.phone||'';
      const addrIn = document.createElement('textarea'); addrIn.className='inline-textarea'; addrIn.placeholder='Endereço'; addrIn.value = current.address||'';
      card.appendChild(nameIn); card.appendChild(emailIn); card.appendChild(phoneIn); card.appendChild(addrIn);
      const actions = document.createElement('div'); actions.className='inline-actions';
      const saveBtn = document.createElement('button'); saveBtn.className='edit-btn primary'; saveBtn.textContent='Salvar';
      const cancelBtn = document.createElement('button'); cancelBtn.className='edit-btn'; cancelBtn.textContent='Cancelar';
      saveBtn.addEventListener('click', () => {
        // basic validation: name or email
        if (!(nameIn.value.trim() || emailIn.value.trim())) { alert('Informe nome ou e-mail.'); return; }
        contacts[idx] = { name: nameIn.value.trim(), email: emailIn.value.trim(), phone: phoneIn.value.trim(), address: addrIn.value.trim() };
        saveContactsToStorage(contacts);
        renderContacts();
      });
      cancelBtn.addEventListener('click', () => renderContacts());
      actions.appendChild(saveBtn); actions.appendChild(cancelBtn); card.appendChild(actions);
    }

    renderContacts();
  }

  // Render events with inline edit controls for admin
  const eventsEl = document.getElementById('editable-events');
  const featuredEl = document.getElementById('featured-events');
  if (eventsEl) {
    let events = [];
    const rawE = localStorage.getItem('events');
    if (rawE) {
      try { events = JSON.parse(rawE); } catch (e) { events = []; }
    } else {
      const fallback = localStorage.getItem('events_html');
      if (fallback) events = parseEventsHtml(fallback);
    }

    function renderEvents() {
      eventsEl.innerHTML = '';
      // render featured area if present
      if (featuredEl) {
        featuredEl.innerHTML = '';
        // prefer events explicitly marked as featured; fallback to first 3
        let featured = events.filter(e => e.featured);
        if (!featured.length) featured = events.slice(0,3);
        featured.slice(0,3).forEach((ev) => {
          const card = document.createElement('div'); card.className = 'featured-card';
          // if event has an image, render it behind content
          if (ev.image) {
            const img = document.createElement('img'); img.src = ev.image; img.alt = ev.title || 'Imagem'; card.appendChild(img);
          }
          const badge = document.createElement('div'); badge.className = 'badge'; badge.textContent = ev.category || 'Evento';
          const datePill = document.createElement('div'); datePill.className = 'date-pill'; datePill.textContent = ev.date || '';
          const title = document.createElement('div'); title.className = 'title'; title.textContent = ev.title || '';
          card.appendChild(badge); card.appendChild(datePill); card.appendChild(title);
          if (isAdmin) {
            const actions = document.createElement('div'); actions.className = 'featured-actions';
            const idx = events.indexOf(ev);
            const editBtn = document.createElement('button'); editBtn.className='edit-btn'; editBtn.textContent='Editar'; editBtn.addEventListener('click', () => startEditEvent(idx));
            const delBtn = document.createElement('button'); delBtn.className='edit-btn'; delBtn.textContent='Remover'; delBtn.addEventListener('click', ()=>{ events.splice(idx,1); saveEventsToStorage(events); renderEvents(); });
            actions.appendChild(editBtn); actions.appendChild(delBtn); card.appendChild(actions);
          }
          featuredEl.appendChild(card);
        });
      }
      if (isAdmin) {
        const bar = document.createElement('div'); bar.className = 'edit-bar';
        const addBtn = document.createElement('button'); addBtn.className = 'edit-btn primary'; addBtn.textContent = 'Adicionar Evento';
        addBtn.addEventListener('click', () => { events.push({ title:'', date:'', location:'', description:'', image:'', featured:false, category:'' }); renderEvents(); startEditEvent(events.length-1); });
        const saveAll = document.createElement('button'); saveAll.className = 'edit-btn'; saveAll.textContent = 'Salvar Alterações';
        saveAll.addEventListener('click', () => { saveEventsToStorage(events); window.location.reload(); });
        bar.appendChild(addBtn); bar.appendChild(saveAll); eventsEl.appendChild(bar);
      }

      if (!events.length) { const empty = document.createElement('div'); empty.className='small-muted'; empty.textContent='Nenhum evento cadastrado.'; eventsEl.appendChild(empty); return; }

      events.forEach((ev, idx) => {
        const card = document.createElement('div'); card.className='event-card';
        const title = document.createElement('h3'); title.textContent = ev.title || 'Evento'; card.appendChild(title);
        const meta = document.createElement('div'); meta.className='event-meta'; meta.textContent = `${ev.date || ''}${ev.location ? ' — '+ev.location : ''}`; card.appendChild(meta);
        if (ev.description) { const p = document.createElement('p'); p.textContent = ev.description; card.appendChild(p); }

        if (isAdmin) {
          const actions = document.createElement('div'); actions.className='inline-actions';
          const editBtn = document.createElement('button'); editBtn.className='edit-btn'; editBtn.textContent='Editar'; editBtn.addEventListener('click', ()=>startEditEvent(idx));
          const delBtn = document.createElement('button'); delBtn.className='edit-btn'; delBtn.textContent='Remover'; delBtn.addEventListener('click', ()=>{ events.splice(idx,1); saveEventsToStorage(events); renderEvents(); });
          actions.appendChild(editBtn); actions.appendChild(delBtn); card.appendChild(actions);
        }

        eventsEl.appendChild(card);
      });
    }

    function startEditEvent(idx) {
      const current = events[idx];
      const cards = eventsEl.querySelectorAll('.event-card');
      const card = cards[idx];
      if (!card) return renderEvents();
      card.classList.add('card-editing');
      card.innerHTML = '';
      const titleIn = document.createElement('input'); titleIn.className='inline-input'; titleIn.placeholder='Título'; titleIn.value = current.title||'';
      const dateIn = document.createElement('input'); dateIn.className='inline-input'; dateIn.placeholder='Data (dd/mm/aaaa)'; dateIn.value = current.date||'';
      const locIn = document.createElement('input'); locIn.className='inline-input'; locIn.placeholder='Local'; locIn.value = current.location||'';

      // image URL input (kept for flexibility) and file upload input
      const imgIn = document.createElement('input'); imgIn.className='inline-input'; imgIn.placeholder='URL da imagem (opcional)'; imgIn.value = current.image||'';
      const fileIn = document.createElement('input'); fileIn.type = 'file'; fileIn.accept = 'image/*'; fileIn.style.marginTop = '8px';
      const preview = document.createElement('img'); preview.className = 'img-preview';
      if (current.image) { preview.src = current.image; preview.style.display = 'block'; }

      // checkbox to mark featured
      const featuredIn = document.createElement('label'); featuredIn.style.display = 'inline-block'; featuredIn.style.margin = '8px 0'; const featCheckbox = document.createElement('input'); featCheckbox.type='checkbox'; featCheckbox.style.marginRight='8px'; featCheckbox.checked = !!current.featured; featuredIn.appendChild(featCheckbox); featuredIn.appendChild(document.createTextNode('Destacar evento'));

      const descIn = document.createElement('textarea'); descIn.className='inline-textarea'; descIn.placeholder='Descrição'; descIn.value = current.description||'';

      // file reader: when user selects a file, convert to dataURL and store in imgIn.value
      fileIn.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        if (!f.type.startsWith('image/')) { alert('Selecione um arquivo de imagem válido.'); return; }
        const reader = new FileReader();
        reader.onload = () => {
          imgIn.value = reader.result; // data URL
          preview.src = reader.result; preview.style.display = 'block';
        };
        reader.readAsDataURL(f);
      });

      // remove image button
      const removeImgBtn = document.createElement('button'); removeImgBtn.className = 'edit-btn'; removeImgBtn.textContent = 'Remover imagem'; removeImgBtn.style.marginLeft = '8px';
      removeImgBtn.addEventListener('click', (ev) => { ev.preventDefault(); imgIn.value = ''; preview.src = ''; preview.style.display = 'none'; fileIn.value = null; });

      card.appendChild(titleIn);
      const row = document.createElement('div'); row.className='field-row'; row.appendChild(dateIn); row.appendChild(locIn); card.appendChild(row);
      card.appendChild(imgIn);
      card.appendChild(fileIn);
      card.appendChild(preview);
      card.appendChild(removeImgBtn);
      card.appendChild(featuredIn);
      card.appendChild(descIn);

      const actions = document.createElement('div'); actions.className='inline-actions';
      const saveBtn = document.createElement('button'); saveBtn.className='edit-btn primary'; saveBtn.textContent='Salvar';
      const cancelBtn = document.createElement('button'); cancelBtn.className='edit-btn'; cancelBtn.textContent='Cancelar';
      saveBtn.addEventListener('click', ()=>{
        if (!titleIn.value.trim() || !dateIn.value.trim()) { alert('Título e data são obrigatórios.'); return; }
        // warn if image is large? we just save the data URL
        events[idx] = { title: titleIn.value.trim(), date: dateIn.value.trim(), location: locIn.value.trim(), description: descIn.value.trim(), image: imgIn.value.trim(), featured: !!featCheckbox.checked, category: current.category||'' };
        saveEventsToStorage(events); renderEvents();
      });
      cancelBtn.addEventListener('click', ()=>renderEvents());
      actions.appendChild(saveBtn); actions.appendChild(cancelBtn); card.appendChild(actions);
    }

    renderEvents();
  }
});
