/* Vida: abertura da capa e efeitos de scroll (sem bibliotecas).
   Só roda se o <head> ligou html.anim (movimento permitido). */
(() => {
  'use strict';
  const root = document.documentElement;
  if (!root.classList.contains('anim')) return;
  window.__vida = true;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const secs = [...document.querySelectorAll('.prancha')];
  const capa = document.getElementById('capa');
  const barra = document.getElementById('barra');

  /* ---------- 1. Abertura da capa: espera as fontes para não "pular" ---------- */
  const abrir = () => {
    if (root.classList.contains('abre')) return;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('abre')));
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

  capa.querySelectorAll('.ficha p').forEach((p, i) => p.style.setProperty('--h', (1.5 + i * 0.1).toFixed(2) + 's'));

  /* ---------- 2. Títulos por máscara + conteúdo em sequência ---------- */
  const itens = '.tag, .lead, .beneficios li, .pontos-chave li, .mestre .lista li, .mestre .detalhe, .carrossel, .rolo, .cards-vest li, .fontes-grid > div, .rodape, .fonte';
  secs.forEach((sec) => {
    if (sec === capa) return;
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
  secs.forEach((s) => { if (s !== capa) io.observe(s); });

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

    capa.style.setProperty('--py', Math.min(y, vh * 1.2).toFixed(1));
    const total = document.documentElement.scrollHeight - vh;
    barra.style.transform = `scaleX(${total > 0 ? clamp(y / total).toFixed(4) : 0})`;
  }
  const pedir = () => { if (!pendente) { pendente = true; requestAnimationFrame(atualizar); } };
  window.__vidaAtualizar = atualizar; /* usado nos testes */
  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', pedir);
  addEventListener('load', pedir);
  atualizar();

  /* ---------- 4. Desenho da capa segue o mouse, devagar ---------- */
  if (!matchMedia('(pointer: coarse)').matches) {
    let tx = 0, ty = 0, mx = 0, my = 0, rodando = false;
    const passo = () => {
      mx += (tx - mx) * 0.07;
      my += (ty - my) * 0.07;
      capa.style.setProperty('--mx', mx.toFixed(2) + 'px');
      capa.style.setProperty('--my', my.toFixed(2) + 'px');
      if (Math.abs(tx - mx) > 0.05 || Math.abs(ty - my) > 0.05) requestAnimationFrame(passo);
      else rodando = false;
    };
    capa.addEventListener('pointermove', (e) => {
      tx = (e.clientX / innerWidth - 0.5) * 2 * 14;
      ty = (e.clientY / innerHeight - 0.5) * 2 * 10;
      if (!rodando) { rodando = true; requestAnimationFrame(passo); }
    });
    capa.addEventListener('pointerleave', () => {
      tx = 0; ty = 0;
      if (!rodando) { rodando = true; requestAnimationFrame(passo); }
    });
  }
})();
