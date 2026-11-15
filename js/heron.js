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
  const itens = [...pre.querySelectorAll('.pre-log li')];
  const DUR = 2400;
  const t0 = performance.now();
  let acabou = false;
  const ease = (t) => 1 - Math.pow(1 - t, 2.2);

  function sair() {
    if (acabou) return; acabou = true;
    num.textContent = '100';
    barra.style.transform = 'scaleX(1)';
    itens.forEach((li) => li.classList.add('on'));
    setTimeout(() => {
      pre.classList.add('fim');
      root.classList.remove('pre-ativo');
      setTimeout(fim, 650);               /* capa começa a abrir quando a cortina já subiu */
      setTimeout(() => pre.classList.add('some'), 1200);
    }, 280);
  }
  (function passo(agora) {
    if (acabou) return;
    const t = Math.min(1, (agora - t0) / DUR);
    const v = Math.round(ease(t) * 100);
    num.textContent = String(v).padStart(2, '0');
    barra.style.transform = `scaleX(${ease(t)})`;
    itens.forEach((li, i) => li.classList.toggle('on', v >= (i + 1) * (100 / itens.length) - 4));
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
