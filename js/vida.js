/* Vida: abertura da capa e efeitos de scroll (sem bibliotecas).
   Só roda se o <head> ligou html.anim (movimento permitido). */
(() => {
  'use strict';
  const root = document.documentElement;
  if (!root.classList.contains('anim')) return;
  window.__vida = true;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const secs = [...document.querySelectorAll('.prancha')];
  const barra = document.getElementById('barra');

  /* ---------- 1. Abertura da capa: espera as fontes para não "pular" ---------- */
  const abrir = () => {
    if (root.classList.contains('abre')) return;
    requestAnimationFrame(() => requestAnimationFrame(() => { root.classList.add('abre'); if (window.__vidaIniciar) window.__vidaIniciar(); }));
  };
  /* a capa só abre quando as fontes carregaram E o preloader (heron.js) terminou */
  let fontesOk = !(document.fonts && document.fonts.load), preOk = !document.getElementById('pre');
  const tenta = () => { if (fontesOk && preOk) abrir(); };
  if (!fontesOk) {
    Promise.all([
      document.fonts.load('64px "Instrument Serif"'),
      document.fonts.load('16px "IBM Plex Sans"'),
      document.fonts.load('16px "IBM Plex Mono"'),
    ]).catch(() => {}).then(() => { fontesOk = true; tenta(); });
  }
  addEventListener('pre:fim', () => { preOk = true; tenta(); });
  setTimeout(abrir, 6000);

  /* ---------- 2. Títulos por máscara + conteúdo em sequência ---------- */
  const itens = '.tag, .lead, .beneficios li, .pontos-chave li, .mestre .lista li, .mestre .detalhe, .carrossel, .rolo, .cards-vest li, .fontes-grid > div, .rodape, .fonte';
  secs.forEach((sec) => {
    const frase = sec.querySelector('.frase');
    if (frase) {
      const texto = frase.textContent.trim();
      frase.setAttribute('aria-label', texto);
      frase.textContent = '';
      texto.split(/(\s+)/).forEach((parte, k) => {
        if (!parte.trim()) { frase.appendChild(document.createTextNode(' ')); return; }
        const m = document.createElement('span');
        m.className = 'wm';
        m.setAttribute('aria-hidden', 'true');
        const w = document.createElement('span');
        w.className = 'w2';
        w.style.setProperty('--k', Math.floor(k / 2));
        w.textContent = parte;
        m.appendChild(w);
        frase.appendChild(m);
      });
    }
    sec.querySelectorAll(itens).forEach((el, i) => el.style.setProperty('--i', Math.min(i, 12)));
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  /* só começa a observar depois que o preloader sai (senão a 1ª prancha anima escondida) */
  let observando = false;
  const iniciar = () => { if (observando) return; observando = true; secs.forEach((s) => io.observe(s)); };
  window.__vidaIniciar = iniciar;

  /* ---------- 3. Desenhos que se traçam conforme o scroll ---------- */
  const desenhos = [...document.querySelectorAll('.prancha:not(.capa) .draw')].map((svg) => {
    const paths = [...svg.querySelectorAll('.tr')].map((el) => ({ el, d: parseFloat(el.style.getPropertyValue('--d')) || 0 }));
    return {
      svg,
      sec: svg.closest('.prancha'),
      paths,
      textos: [...svg.querySelectorAll('text')],
      maxD: Math.max(0, ...paths.map((p) => p.d)),
      par: svg.matches('.planta, .escudo') ? 0.07 : 0,
      ty: 0,
    };
  });

  let pendente = false;
  function atualizar() {
    pendente = false;
    const vh = innerHeight;
    const y = scrollY;

    desenhos.forEach((o) => {
      const r = o.svg.getBoundingClientRect();
      const topo = r.top - o.ty; /* posição sem o deslocamento da paralaxe */
      if (topo + r.height < -150 || topo > vh + 150) return;
      const P = clamp((vh * 0.95 - topo) / (vh * 0.45 + r.height * 0.3));
      const T = 1 + o.maxD * 0.5;
      o.paths.forEach((p) => { p.el.style.strokeDashoffset = (1 - clamp(P * T - p.d * 0.5)).toFixed(3); });
      const op = P > 0.85 ? '1' : '0';
      o.textos.forEach((t) => { t.style.opacity = op; });
      if (o.par) {
        const sr = o.sec.getBoundingClientRect();
        const c = sr.top + sr.height / 2 - vh / 2;
        o.ty = -c * o.par;
        o.svg.style.transform = `translate3d(0, ${o.ty.toFixed(1)}px, 0)`;
      }
    });

    const total = document.documentElement.scrollHeight - vh;
    barra.style.transform = `scaleX(${total > 0 ? clamp(y / total).toFixed(4) : 0})`;
  }
  const pedir = () => { if (!pendente) { pendente = true; requestAnimationFrame(atualizar); } };
  window.__vidaAtualizar = atualizar; /* usado nos testes */
  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', pedir);
  addEventListener('load', pedir);
  atualizar();

})();
