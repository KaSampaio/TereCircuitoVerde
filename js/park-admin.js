// Mostrar botões de editar/remover nas páginas de parque quando admin autenticado
document.addEventListener('DOMContentLoaded', () => {
  function getAuth() {
    try { const raw = localStorage.getItem('tv_auth'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  const auth = getAuth();
  if (!auth || auth.role !== 'admin') return;

  // mark page as admin-mode so CSS reveals admin controls
  try { document.body.classList.add('admin-mode'); } catch (e) { /* ignore */ }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  // Referência aos itens originais de trilhas (na div oculta)
  const trailItems = Array.from(document.querySelectorAll('.trails-data .trail-item'));
  let currentTrailIndex = 0;

  // Parser de trilhas para extrair dados estruturados do HTML
  function parseTrailInfo(item) {
    const info = item.querySelector('.trail-info');
    if (!info) return null;
    
    const h3 = info.querySelector('h3');
    const name = h3 ? h3.textContent.trim() : '';
    
    const metaEls = info.querySelectorAll('.trail-meta');
    let recommendation = '', difficulty = '', km = '';
    
    metaEls.forEach(meta => {
      const text = meta.textContent || '';
      if (text.includes('Recomendada:')) {
        recommendation = text.replace('Recomendada:', '').trim();
      } else if (text.includes('Dificuldade:')) {
        difficulty = text.replace('Dificuldade:', '').trim();
      } else if (text.includes('Km:')) {
        km = text.replace('Km:', '').trim();
      }
    });
    
    const descEl = info.querySelector('.trail-desc');
    const description = descEl ? descEl.textContent.trim() : '';
    
    const imgEl = item.querySelector('.trail-image img');
    const image = imgEl ? imgEl.getAttribute('src') : '';
    const imageAlt = imgEl ? imgEl.getAttribute('alt') : '';
    
    return { name, recommendation, difficulty, km, description, image, imageAlt };
  }

  // Função para atualizar o HTML da trilha com os novos dados (no item original)
  function updateTrailItem(item, data) {
    const info = item.querySelector('.trail-info');
    if (!info) return;
    
    // Limpa o conteúdo atual
    info.innerHTML = '';
    
    // Reconstrói o conteúdo
    const h3 = document.createElement('h3');
    h3.textContent = data.name || 'Trilha';
    info.appendChild(h3);
    
    if (data.recommendation) {
      const p = document.createElement('p');
      p.className = 'trail-meta';
      p.innerHTML = `<strong>Recomendada:</strong> ${escapeHtml(data.recommendation)}`;
      info.appendChild(p);
    }
    
    if (data.difficulty) {
      const p = document.createElement('p');
      p.className = 'trail-meta';
      p.innerHTML = `<strong>Dificuldade:</strong> ${escapeHtml(data.difficulty)}`;
      info.appendChild(p);
    }
    
    if (data.km) {
      const p = document.createElement('p');
      p.className = 'trail-meta';
      p.innerHTML = `<strong>Km:</strong> ${escapeHtml(data.km)}`;
      info.appendChild(p);
    }
    
    if (data.description) {
      const p = document.createElement('p');
      p.className = 'trail-desc';
      p.textContent = data.description;
      info.appendChild(p);
    }
    
    // Atualiza a imagem se houver
    if (data.image) {
      const imgEl = item.querySelector('.trail-image img');
      if (imgEl) {
        imgEl.setAttribute('src', data.image);
        if (data.imageAlt) imgEl.setAttribute('alt', data.imageAlt);
      }
    }
    
    // Força o slider a re-renderizar a trilha atual
    triggerSliderUpdate();
  }

  // Função para forçar atualização do slider
  function triggerSliderUpdate() {
    // Simula um clique nas setas para forçar re-renderização
    const visibleInfo = document.querySelector('.trail-slide .trail-info');
    if (visibleInfo && trailItems[currentTrailIndex]) {
      const sourceInfo = trailItems[currentTrailIndex].querySelector('.trail-info');
      if (sourceInfo) {
        visibleInfo.innerHTML = sourceInfo.innerHTML;
        attachAdminButtons(visibleInfo, currentTrailIndex);
      }
    }
  }

  // Função para iniciar edição de uma trilha
  function startEditTrail(index) {
    const item = trailItems[index];
    if (!item) return;
    
    const data = parseTrailInfo(item);
    if (!data) return;
    
    const visibleInfo = document.querySelector('.trail-slide .trail-info');
    if (!visibleInfo) return;
    
    // Adiciona classe de edição
    visibleInfo.classList.add('card-editing');
    visibleInfo.innerHTML = '';
    
    // Campos de edição
    const nameInput = document.createElement('input');
    nameInput.className = 'inline-input';
    nameInput.placeholder = 'Nome da Trilha';
    nameInput.value = data.name || '';
    nameInput.style.marginBottom = '8px';
    
    const recInput = document.createElement('input');
    recInput.className = 'inline-input';
    recInput.placeholder = 'Recomendação (ex: ★★★★★)';
    recInput.value = data.recommendation || '';
    recInput.style.marginBottom = '8px';
    
    const diffInput = document.createElement('input');
    diffInput.className = 'inline-input';
    diffInput.placeholder = 'Dificuldade (ex: Difícil, Moderada, Fácil)';
    diffInput.value = data.difficulty || '';
    diffInput.style.marginBottom = '8px';
    
    const kmInput = document.createElement('input');
    kmInput.className = 'inline-input';
    kmInput.placeholder = 'Distância (ex: ~ 6,8 km)';
    kmInput.value = data.km || '';
    kmInput.style.marginBottom = '8px';
    
    const descTextarea = document.createElement('textarea');
    descTextarea.className = 'inline-textarea';
    descTextarea.placeholder = 'Descrição da trilha';
    descTextarea.value = data.description || '';
    descTextarea.style.marginBottom = '8px';
    descTextarea.rows = 3;
    
    const imageInput = document.createElement('input');
    imageInput.className = 'inline-input';
    imageInput.placeholder = 'Caminho da imagem (ex: ./src/trilha.jpg)';
    imageInput.value = data.image || '';
    imageInput.style.marginBottom = '8px';
    
    visibleInfo.appendChild(nameInput);
    visibleInfo.appendChild(recInput);
    visibleInfo.appendChild(diffInput);
    visibleInfo.appendChild(kmInput);
    visibleInfo.appendChild(descTextarea);
    visibleInfo.appendChild(imageInput);
    
    // Botões de ação
    const actions = document.createElement('div');
    actions.className = 'inline-actions';
    actions.style.marginTop = '12px';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-btn primary';
    saveBtn.textContent = 'Salvar';
    saveBtn.addEventListener('click', () => {
      if (!nameInput.value.trim()) {
        alert('O nome da trilha é obrigatório.');
        return;
      }
      
      const updatedData = {
        name: nameInput.value.trim(),
        recommendation: recInput.value.trim(),
        difficulty: diffInput.value.trim(),
        km: kmInput.value.trim(),
        description: descTextarea.value.trim(),
        image: imageInput.value.trim(),
        imageAlt: nameInput.value.trim()
      };
      
      visibleInfo.classList.remove('card-editing');
      updateTrailItem(item, updatedData);
    });
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-btn';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => {
      visibleInfo.classList.remove('card-editing');
      triggerSliderUpdate();
    });
    
    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    visibleInfo.appendChild(actions);
  }

  // Função para anexar botões de admin ao elemento visível do slider
  function attachAdminButtons(infoEl, index) {
    if (!infoEl) return;
    
    // Remove botões existentes se houver
    const existing = infoEl.querySelector('.admin-trail-actions');
    if (existing) existing.remove();
    
    const box = document.createElement('div');
    box.className = 'admin-trail-actions';
    box.style.marginTop = '8px';
    
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => startEditTrail(index));
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'edit-btn';
    removeBtn.textContent = 'Remover';
    removeBtn.addEventListener('click', () => {
      if (confirm('Deseja realmente excluir esta trilha?')) {
        trailItems[index].remove();
        // Força reload da página para atualizar o slider
        location.reload();
      }
    });
    
    box.appendChild(editBtn);
    box.appendChild(removeBtn);
    infoEl.appendChild(box);
  }

  // Observer para detectar quando o slider atualiza o conteúdo
  function observeSlider() {
    const visibleInfo = document.querySelector('.trail-slide .trail-info');
    if (!visibleInfo) {
      // Tenta novamente após um delay
      setTimeout(observeSlider, 500);
      return;
    }

    // Anexa botões inicialmente
    attachAdminButtons(visibleInfo, 0);

    // Observa mudanças no conteúdo
    const observer = new MutationObserver(() => {
      // Detecta qual trilha está sendo exibida baseado no conteúdo
      const h3Text = visibleInfo.querySelector('h3')?.textContent || '';
      const index = trailItems.findIndex(item => {
        const itemH3 = item.querySelector('.trail-info h3')?.textContent || '';
        return itemH3 === h3Text;
      });
      
      if (index !== -1) {
        currentTrailIndex = index;
        // Remove botões existentes antes de adicionar novos
        const existing = visibleInfo.querySelector('.admin-trail-actions');
        if (!existing) {
          attachAdminButtons(visibleInfo, index);
        }
      }
    });

    observer.observe(visibleInfo, { childList: true, subtree: true });
  }

  // Inicia observação após o DOM estar pronto
  if (trailItems.length > 0) {
    setTimeout(observeSlider, 100);
  }
});
