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
  const vid = document.getElementById('pre-video');
  const VELOCIDADE = 1.3;                 /* 10 s de vídeo viram ~7,7 s de tela de carregamento */
  let acabou = false;

  let fechou = false;
  const botao = document.getElementById('pre-entrar');
  function fechar() {
    if (fechou || !acabou) return; fechou = true;
    pre.classList.add('fim');
    root.classList.remove('pre-ativo');
    window.scrollTo(0, 0);
    setTimeout(fim, 650);                 /* o site começa a animar quando a cortina já subiu */
    setTimeout(() => { pre.classList.add('some'); vid.removeAttribute('src'); vid.load(); }, 1200);
  }
  function sair() {
    if (acabou) return; acabou = true;
    num.textContent = '100';
    barra.style.transform = 'scaleX(1)';
    pre.classList.add('info', 'pronto');  /* garante o texto e mostra o botão Entrar */
    setTimeout(() => botao.focus({ preventScroll: true }), 1400);
  }
  /* o site só abre quando a pessoa clica em Entrar (ou aperta Enter / espaço) */
  botao.addEventListener('click', fechar);
  addEventListener('keydown', (e) => { if (acabou && !fechou && /^(Enter| )$/.test(e.key)) { e.preventDefault(); fechar(); } });

  /* o contador acompanha o tempo do vídeo: 100% = última imagem da obra */
  function atualiza() {
    if (acabou) return;
    const dur = vid.duration || 0;
    const p = dur ? Math.min(1, vid.currentTime / (dur - 0.05)) : 0;
    num.textContent = String(Math.round(p * 100)).padStart(2, '0');
    barra.style.transform = `scaleX(${p})`;
    if (p >= 0.8) pre.classList.add('info');
    if (p >= 0.995 || vid.ended) sair(); else requestAnimationFrame(atualiza);
  }
  vid.playbackRate = VELOCIDADE;
  vid.addEventListener('ended', sair);
  vid.addEventListener('error', () => setTimeout(sair, 600));   /* sem vídeo: segue para o site */
  const tocar = vid.play();
  if (tocar && tocar.catch) tocar.catch(() => setTimeout(sair, 600));
  requestAnimationFrame(atualiza);
  setTimeout(sair, 16000);                /* rede de segurança (internet lenta): mostra o botão */

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
  rotulos.forEach((el) => el.setAttribute('aria-label', el.textContent.trim()));
  addEventListener('pre:fim', () => rotulos.forEach((el) => io.observe(el)));

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
