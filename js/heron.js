/* Camada "Heron": preloader, rótulos embaralhados, rótulo lateral da moldura.
   Só roda com html.anim (movimento permitido). Sem bibliotecas. */
(() => {
  'use strict';
  const root = document.documentElement;
  const pre = document.getElementById('pre');
  const fim = () => { window.dispatchEvent(new Event('pre:fim')); };
  if (!root.classList.contains('anim') || !pre) { if (pre) pre.remove(); fim(); return; }

  /* ---------- 1. Preloader: contador 0-100 + log de inicialização ---------- */
  root.classList.add('pre-ativo');
  const num = pre.querySelector('.pre-n');
  const barra = pre.querySelector('.pre-barra i');
  const DUR = 4600;                        /* tempo em que a casa é construída */
  const t0 = performance.now();
  let acabou = false;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const ease = (t) => 0.5 - Math.cos(Math.PI * t) / 2;

  /* a casa: cada grupo [data-a, data-b] é desenhado entre esses pontos do progresso */
  const grupos = [...pre.querySelectorAll('g[data-a]')].map((g) => ({
    a: parseFloat(g.dataset.a), b: parseFloat(g.dataset.b),
    linhas: [...g.querySelectorAll('.l')], fundos: [...g.querySelectorAll('.f')],
  }));
  grupos.forEach((g) => g.linhas.forEach((l) => l.setAttribute('pathLength', '1')));
  function casa(p) {
    grupos.forEach((g) => {
      const t = clamp((p - g.a) / (g.b - g.a));
      g.linhas.forEach((l) => { l.style.strokeDashoffset = (1 - clamp(t * 1.6)).toFixed(3); });
      g.fundos.forEach((f) => { f.style.opacity = clamp((t - 0.3) * 1.8).toFixed(3); });
    });
  }

  function sair() {
    if (acabou) return; acabou = true;
    num.textContent = '100';
    barra.style.transform = 'scaleX(1)';
    casa(1);
    setTimeout(() => {
      pre.classList.add('fim');
      root.classList.remove('pre-ativo');
      setTimeout(fim, 650);               /* capa começa a abrir quando a cortina já subiu */
      setTimeout(() => pre.classList.add('some'), 1200);
    }, 700);                              /* casa pronta fica visível um instante */
  }
  (function passo(agora) {
    if (acabou) return;
    const t = Math.min(1, (agora - t0) / DUR);
    const e = ease(t);
    num.textContent = String(Math.round(e * 100)).padStart(2, '0');
    barra.style.transform = `scaleX(${e})`;
    casa(e);
    if (t < 1) requestAnimationFrame(passo); else sair();
  })(t0);
  setTimeout(sair, DUR + 2500);           /* rede de segurança */

  /* ---------- 2. Rótulos que se embaralham ao entrar na tela ---------- */
  const GLIFOS = '/\\|_-+<>[]0123456789';
  function embaralhar(el) {
    const alvo = el.dataset.alvo || el.textContent;
    el.dataset.alvo = alvo;
    const ini = performance.now(), dur = 700 + alvo.length * 18;
    (function rodar(agora) {
      const p = Math.min(1, (agora - ini) / dur);
      const fixo = Math.floor(p * alvo.length);
      let s = '';
      for (let i = 0; i < alvo.length; i++) {
        s += i < fixo || alvo[i] === ' ' ? alvo[i] : GLIFOS[(Math.random() * GLIFOS.length) | 0];
      }
      el.textContent = s;
      if (p < 1) requestAnimationFrame(rodar); else el.textContent = alvo;
    })(ini);
  }
  const rotulos = document.querySelectorAll('.prancha:not(.capa) .tag, .card .cnt');
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    setTimeout(() => embaralhar(e.target), 250);
  }), { threshold: 0.6 });
  rotulos.forEach((el) => {
    el.setAttribute('aria-label', el.textContent.trim());
    io.observe(el);
  });

  /* ---------- 3. Rótulo lateral da moldura: prancha atual + progresso ---------- */
  const lado = document.getElementById('moldura-rotulo');
  const secs = [...document.querySelectorAll('.prancha')];
  let pend = false;
  function lateral() {
    pend = false;
    const meio = innerHeight / 2;
    let i = 0;
    secs.forEach((s, k) => { const r = s.getBoundingClientRect(); if (r.top <= meio) i = k; });
    const total = root.scrollHeight - innerHeight;
    const pct = total > 0 ? Math.round((scrollY / total) * 100) : 0;
    const nome = (secs[i].dataset.nome || '').toUpperCase();
    lado.textContent = `PRANCHA ${String(i + 1).padStart(2, '0')}/${String(secs.length).padStart(2, '0')} · ${nome} · ${String(pct).padStart(3, '0')}%`;
  }
  const pedir = () => { if (!pend) { pend = true; requestAnimationFrame(lateral); } };
  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', pedir);
  lateral();
})();
