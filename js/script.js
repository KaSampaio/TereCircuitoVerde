// ===== Slider Script =====
const slides = Array.from(document.querySelectorAll('.slide'));
const titleEl = document.querySelector('.title');
const leftBtn = document.querySelector('.arrow.left');
const rightBtn = document.querySelector('.arrow.right');
const dotsContainer = document.querySelector('.dots');
let index = 0;
let timer = null;

// Criar dots dinamicamente
function createDots() {
  slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.dataset.index = i;
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });
}

// Atualizar slider
function updateSlider() {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });

  const activeSlide = slides[index];
  const newTitle = activeSlide.dataset.title || '';
  titleEl.textContent = newTitle;

  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

// Controle
function prevSlide() {
  index = (index - 1 + slides.length) % slides.length;
  updateSlider();
  resetTimer();
}

function nextSlide() {
  index = (index + 1) % slides.length;
  updateSlider();
  resetTimer();
}

function goToSlide(i) {
  index = i;
  updateSlider();
  resetTimer();
}

// Auto-play
function resetTimer() {
  clearInterval(timer);
  timer = setInterval(nextSlide, 6000);
}

// Eventos
leftBtn.addEventListener('click', prevSlide);
rightBtn.addEventListener('click', nextSlide);

// Pausar autoplay no hover
const hero = document.querySelector('.hero');
hero.addEventListener('mouseenter', () => clearInterval(timer));
hero.addEventListener('mouseleave', resetTimer);

// Navegação por teclado
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') prevSlide();
  if (event.key === 'ArrowRight') nextSlide();
});

// Inicialização
createDots();
updateSlider();
resetTimer();