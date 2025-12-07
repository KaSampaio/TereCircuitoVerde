// Mostrar botões de editar/remover nas páginas de parque quando admin autenticado
document.addEventListener('DOMContentLoaded', () => {
  function getAuth() {
    try { const raw = localStorage.getItem('tv_auth'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  const auth = getAuth();
  if (!auth || auth.role !== 'admin') return;

  // adiciona botões na área principal do parque
  try {
    const parkDetail = document.querySelector('.park_detail');
    if (parkDetail) {
      const h2 = parkDetail.querySelector('h2');
      const actions = document.createElement('div');
      actions.className = 'admin-park-actions';
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'edit-btn';
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => { window.alert('Editar (área do parque) — implemente a ação de edição no admin se necessário.'); });
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'edit-btn';
      delBtn.textContent = 'Remover';
      delBtn.addEventListener('click', () => {
        if (!confirm('Remover este parque do site? Esta ação afeta apenas a visualização local.')) return;
        // simples ocultação como placeholder para remoção real
        parkDetail.style.display = 'none';
      });
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      if (h2) h2.parentNode.insertBefore(actions, h2.nextSibling);
      else parkDetail.insertBefore(actions, parkDetail.firstChild);
    }

    // adiciona botões para cada trilha (se existir)
    const trailItems = document.querySelectorAll('.trail-item');
    trailItems.forEach(item => {
      const info = item.querySelector('.trail-info');
      if (!info) return;
      // evitar duplicar se os botões já existirem
      if (info.querySelector('.admin-trail-actions')) return;
      const box = document.createElement('div');
      box.className = 'admin-trail-actions';
      box.style.marginTop = '8px';
      const e = document.createElement('button'); e.type='button'; e.className='edit-btn'; e.textContent='Editar';
      const r = document.createElement('button'); r.type='button'; r.className='edit-btn'; r.textContent='Remover';
      e.addEventListener('click', () => { window.alert('Editar trilha — ação de admin.'); });
      r.addEventListener('click', () => { if (confirm('Remover esta trilha?')) item.remove(); });
      box.appendChild(e); box.appendChild(r);
      info.appendChild(box);
    });
  } catch (err) {
    // silently ignore
    console.error('park-admin error', err);
  }
});
