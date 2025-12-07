// Mostrar botões de editar/remover nas páginas de parque quando admin autenticado
document.addEventListener('DOMContentLoaded', () => {
  function getAuth() {
    try { const raw = localStorage.getItem('tv_auth'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  const auth = getAuth();
  if (!auth || auth.role !== 'admin') return;

  // mark page as admin-mode so CSS reveals admin controls
  try { document.body.classList.add('admin-mode'); } catch (e) { /* ignore */ }

  // adiciona botões apenas para cada trilha (se existir)
  try {
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
