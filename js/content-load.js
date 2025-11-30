// Carrega conteúdo editável salvo em localStorage para as páginas públicas
document.addEventListener('DOMContentLoaded', () => {
  // Contato
  const contactsEl = document.getElementById('editable-contacts');
  if (contactsEl) {
    const raw = localStorage.getItem('contacts');
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        contactsEl.innerHTML = arr.map(c => `\n          <div class="contact-card">\n            <h3>${(c.name||'').trim() || ''}</h3>\n            ${c.email ? `<p><a href=\"mailto:${c.email}\">${c.email}</a></p>` : ''}\n            ${c.phone ? `<p>${c.phone}</p>` : ''}\n            ${c.address ? `<p>${c.address}</p>` : ''}\n          </div>`).join('\n');
      } catch (e) {
        // fallback to old html
        const saved = localStorage.getItem('contacts_html');
        if (saved) contactsEl.innerHTML = saved;
      }
    } else {
      const saved = localStorage.getItem('contacts_html');
      if (saved) contactsEl.innerHTML = saved;
    }
  }

  // Eventos
  const eventsEl = document.getElementById('editable-events');
  if (eventsEl) {
    const rawE = localStorage.getItem('events');
    if (rawE) {
      try {
        const arr = JSON.parse(rawE);
        eventsEl.innerHTML = arr.map(ev => `\n          <div class="event-card">\n            <h3>${(ev.title||'').trim()}</h3>\n            <div class=\"event-meta\">${(ev.date||'')} ${ev.location ? '— ' + ev.location : ''}</div>\n            <p>${(ev.description||'')}</p>\n          </div>`).join('\n');
      } catch (e) {
        const saved = localStorage.getItem('events_html');
        if (saved) eventsEl.innerHTML = saved;
      }
    } else {
      const saved = localStorage.getItem('events_html');
      if (saved) eventsEl.innerHTML = saved;
    }
  }
});
