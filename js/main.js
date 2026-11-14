(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');

  const params = new URLSearchParams(location.search);
  const imprimir = params.has('imprimir');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- Janelas geradas nos desenhos ---------- */
  document.querySelectorAll('[data-win]').forEach((g) => {
    const [x, y, cols, rows, w, h, gx, gy] = g.dataset.win.split(',').map(Number);
    let d = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) d += `M${x + c * gx} ${y + r * gy}h${w}v${h}h${-w}z`;
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
  let palco = false;

  const contador = document.getElementById('contador');
  const pontos = document.getElementById('pontos');
  const menuLista = document.getElementById('menu-lista');
  const barra = document.getElementById('barra');

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

  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    root.style.setProperty('--s', s.toFixed(4));
  }

  function setActive(i) {
    cur = i;
    secs.forEach((s, k) => s.classList.toggle('is-active', k === i));
    contador.textContent = `${pad(i + 1)} / ${pad(total)}`;
    [...pontos.children].forEach((a, k) => {
      if (k === i) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    barra.style.width = `${((i + 1) / total) * 100}%`;
    if (palco) {
      document.body.style.backgroundColor = getComputedStyle(secs[i]).backgroundColor;
      try { history.replaceState(null, '', '#' + secs[i].id); } catch (e) { /* ignora */ }
    }
  }

  /* No modo rolagem (celular), a seção atual vem do que está na tela */
  const io = new IntersectionObserver(
    (entries) => {
      if (palco) return;
      entries.forEach((e) => { if (e.isIntersecting) setActive(+e.target.dataset.i); });
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  );
  secs.forEach((s) => io.observe(s));

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

  /* ---------- Navegação ---------- */
  function goto(i) {
    i = Math.max(0, Math.min(total - 1, i));
    if (!palco) secs[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
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

  /* links internos (#id) levam ao slide que contém o alvo */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !palco) return;
    const alvo = document.getElementById(a.getAttribute('href').slice(1));
    const sec = alvo && alvo.closest('.prancha');
    if (!sec) return;
    e.preventDefault();
    goto(secs.indexOf(sec));
  });

  /* ---------- Menu ---------- */
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
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); }
  });

  document.getElementById('entrar').addEventListener('click', () => goto(1));
  document.getElementById('prev').addEventListener('click', () => step(-1));
  document.getElementById('next').addEventListener('click', () => step(1));

  /* ---------- Tela cheia ---------- */
  function telaCheia() {
    if (!document.fullscreenElement) {
      const r = root.requestFullscreen && root.requestFullscreen();
      if (r && r.catch) r.catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  /* ---------- Teclado ---------- */
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
      case 'f': case 'F': e.preventDefault(); telaCheia(); break;
    }
  });

  /* ---------- Roda do mouse (só no palco) ---------- */
  let ultimaRoda = 0;
  addEventListener('wheel', (e) => {
    if (!palco || !menu.hidden) return;
    e.preventDefault();
    const agora = Date.now();
    if (Math.abs(e.deltaY) < 20 || agora - ultimaRoda < 700) return;
    ultimaRoda = agora;
    step(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  /* ---------- Cursor e barra somem quando o mouse fica parado ---------- */
  let timer;
  const acordar = () => {
    root.classList.remove('ocioso');
    clearTimeout(timer);
    timer = setTimeout(() => root.classList.add('ocioso'), 2500);
  };
  ['mousemove', 'mousedown', 'touchstart'].forEach((ev) => addEventListener(ev, acordar, { passive: true }));
  acordar();

  /* ---------- Modo palco x modo rolagem ---------- */
  const mq = matchMedia('(min-width: 900px) and (min-height: 480px) and (orientation: landscape)');
  function aplicarModo() {
    const novo = imprimir || params.get('modo') === 'palco' || mq.matches;
    const mudou = novo !== palco;
    palco = novo;
    root.classList.toggle('palco', palco);
    if (palco) {
      fit();
      window.scrollTo(0, 0);
    } else {
      document.body.style.backgroundColor = '';
    }
    setActive(cur);
    if (mudou && !palco) secs[cur].scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  mq.addEventListener('change', aplicarModo);
  addEventListener('resize', () => { if (palco) fit(); });

  const inicial = secs.findIndex((s) => s.id === location.hash.slice(1));
  if (inicial > 0) cur = inicial;
  aplicarModo();
  if (!palco && inicial > 0) secs[inicial].scrollIntoView({ behavior: 'auto', block: 'start' });

  /* ---------- Versão para PDF: um slide por página, um por item ---------- */
  if (imprimir) {
    root.classList.add('imprimir');
    const aplicar = (sec, k) => {
      const tabs = [...sec.querySelectorAll('[role="tab"]')];
      const paineis = [...sec.querySelectorAll('[role="tabpanel"]')];
      tabs.forEach((t, j) => {
        t.setAttribute('aria-selected', String(j === k));
        t.style.setProperty('--o', j - k);
        t.style.setProperty('--ao', Math.abs(j - k));
      });
      paineis.forEach((p, j) => { p.hidden = j !== k; p.classList.remove('painel'); });
    };
    secs.forEach((sec) => {
      const st = steppers.get(sec);
      if (!st) return;
      aplicar(sec, 0);
      let ref = sec;
      for (let k = 1; k < st.count; k++) {
        const c = sec.cloneNode(true);
        c.removeAttribute('id');
        c.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
        aplicar(c, k);
        ref.after(c);
        ref = c;
      }
    });
    document.querySelectorAll('.prancha').forEach((s) => s.classList.add('is-active'));
  }
})();
