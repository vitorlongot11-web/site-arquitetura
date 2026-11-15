(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- Janelas geradas nos desenhos ---------- */
  document.querySelectorAll('[data-win]').forEach((g) => {
    const [x, y, cols, rows, w, h, gx, gy] = g.dataset.win.split(',').map(Number);
    let d = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        d += `M${x + c * gx} ${y + r * gy}h${w}v${h}h${-w}z`;
      }
    }
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', 'tr fino');
    g.appendChild(p);
    p.style.setProperty('--d', g.style.getPropertyValue('--d') || '0');
  });
  document.querySelectorAll('.tr').forEach((el) => el.setAttribute('pathLength', '1'));

  /* ---------- Seções ---------- */
  const secs = [...document.querySelectorAll('.prancha')];
  const total = secs.length;
  let cur = 0;
  const pad = (n) => String(n).padStart(2, '0');
  const contador = document.getElementById('contador');
  const pontos = document.getElementById('pontos');
  const menuLista = document.getElementById('menu-lista');

  secs.forEach((s, i) => {
    s.dataset.i = i;
    const nome = s.dataset.nome || `Seção ${i + 1}`;

    const a = document.createElement('a');
    a.href = '#' + s.id;
    a.setAttribute('aria-label', nome);
    a.title = nome;
    pontos.appendChild(a);

    const li = document.createElement('li');
    li.innerHTML = `<a href="#${s.id}"><span>${pad(i + 1)}</span>${nome}</a>`;
    menuLista.appendChild(li);
  });

  function setActive(i) {
    cur = i;
    secs.forEach((s, k) => s.classList.toggle('is-active', k === i));
    contador.textContent = `${pad(i + 1)} / ${pad(total)}`;
    [...pontos.children].forEach((a, k) => {
      if (k === i) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setActive(+e.target.dataset.i);
      });
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  );
  secs.forEach((s) => io.observe(s));
  setActive(0);

  /* ---------- Mestre/detalhe e carrossel ---------- */
  const steppers = new Map();
  document.querySelectorAll('[data-mestre]').forEach((m) => {
    const tabs = [...m.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    let idx = 0;

    const set = (k) => {
      idx = k;
      tabs.forEach((t, j) => {
        t.setAttribute('aria-selected', String(j === k));
        t.tabIndex = j === k ? 0 : -1;
        t.style.setProperty('--o', j - k);
        t.style.setProperty('--ao', Math.abs(j - k));
      });
      panels.forEach((p, j) => {
        p.hidden = j !== k;
        if (j === k && !reduce) {
          p.classList.remove('painel');
          void p.offsetWidth;
          p.classList.add('painel');
        }
      });
    };
    tabs.forEach((t, j) => t.addEventListener('click', () => set(j)));
    steppers.set(m.closest('.prancha'), { count: tabs.length, get: () => idx, set });
    set(0);
  });

  /* ---------- Prancha 01: os 4 cartões aparecem um a um com as setas ---------- */
  const oque = document.getElementById('oque');
  if (oque && root.classList.contains('anim')) {
    /* Ao chegar na prancha, os 4 cartões surgem JUNTOS (devagar) enquanto o croqui é
       "construído" no mesmo ritmo: os traços a nanquim sobem do chão ao telhado e,
       em seguida, a aquarela vai pintando o desenho (tudo feito em CSS, ver heron.css). */
    let rodou = false, liberado = false, visivel = false;
    const rodar = () => { if (rodou) return; rodou = true; oque.classList.add('mostra'); };
    const tentar = () => { if (liberado && visivel) setTimeout(rodar, 500); };
    addEventListener('pre:fim', () => { liberado = true; tentar(); });
    new IntersectionObserver((es) => es.forEach((e) => {
      visivel = e.isIntersecting;
      if (visivel) tentar();
      else if (e.boundingClientRect.top < 0 && !rodou) { rodou = true; oque.classList.add('instante', 'mostra'); }
    }), { threshold: 0.55 }).observe(oque);
  }

  /* ---------- Navegação ---------- */
  function goto(i) {
    i = Math.max(0, Math.min(total - 1, i));
    secs[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setActive(i);
  }
  function step(d) {
    const s = steppers.get(secs[cur]);
    if (s) {
      const n = s.get() + d;
      if (n >= 0 && n < s.count) { s.set(n); return; }
    }
    const t = cur + d;
    if (t < 0 || t >= total) return;
    goto(t);
    const ts = steppers.get(secs[t]);
    if (ts) ts.set(d > 0 ? 0 : ts.count - 1);
  }

  const menu = document.getElementById('menu');
  const menuBtn = document.getElementById('menu-btn');
  const menuFechar = document.getElementById('menu-fechar');
  function abrirMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) menuFechar.focus(); else menuBtn.focus();
  }
  menuBtn.addEventListener('click', () => abrirMenu(true));
  menuFechar.addEventListener('click', () => abrirMenu(false));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); } });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable) return;
    const onBtn = tag === 'button' || tag === 'a';

    if (e.key === 'Escape' && !menu.hidden) { abrirMenu(false); return; }
    if (!menu.hidden) return;

    switch (e.key) {
      case 'ArrowRight': case 'PageDown': e.preventDefault(); step(1); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); step(-1); break;
      case ' ': if (!onBtn) { e.preventDefault(); step(e.shiftKey ? -1 : 1); } break;
      case 'ArrowDown': e.preventDefault(); goto(cur + 1); break;
      case 'ArrowUp': e.preventDefault(); goto(cur - 1); break;
      case 'Home': e.preventDefault(); goto(0); break;
      case 'End': e.preventDefault(); goto(total - 1); break;
    }
  });
})();
