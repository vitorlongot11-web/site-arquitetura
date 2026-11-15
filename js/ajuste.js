/* Ajuste automático à tela (projetor de tamanho desconhecido).
   Mede cada prancha, inclusive com cada item das listas aberto, e reduz o conteúdo
   (CSS zoom) só o necessário para tudo caber na altura da tela. Se já cabe, não mexe.
   Refaz o cálculo quando a janela muda de tamanho (ex.: ao entrar em tela cheia). */
(() => {
  'use strict';
  if (!(window.CSS && CSS.supports && CSS.supports('zoom', '1'))) return;   /* navegador sem zoom: fica como está */

  const secs = [...document.querySelectorAll('.prancha')];
  const MIN = 0.5;                                                          /* nunca menor que metade */

  /* A prancha "cabe" se a altura dela não passa da altura da janela (min-height:100svh). */
  function cabe(s, paineis) {
    const vh = window.innerHeight;
    if (!paineis.length) return s.getBoundingClientRect().height <= vh + 2;
    const antes = paineis.map((p) => p.hidden);
    let ok = true;
    for (let k = 0; k < paineis.length && ok; k++) {
      paineis.forEach((p, j) => { p.hidden = j !== k; });
      if (s.getBoundingClientRect().height > vh + 2) ok = false;
    }
    paineis.forEach((p, j) => { p.hidden = antes[j]; });
    return ok;
  }

  function ajustar() {
    /* telas maiores que Full HD (2K, 4K): amplia o conteúdo na mesma proporção */
    const base = Math.min(2.2, Math.max(1, window.innerHeight / 1080));
    document.querySelectorAll('.topo, .pontos').forEach((e) => { e.style.zoom = base > 1.02 ? base.toFixed(3) : ''; });
    secs.forEach((s) => {
      const wrap = s.querySelector('.wrap');
      if (!wrap) return;
      const paineis = [...s.querySelectorAll('[role="tabpanel"]')];
      wrap.style.zoom = base.toFixed(4);
      if (cabe(s, paineis)) return;
      let lo = MIN, hi = base;                                              /* busca o maior zoom que cabe */
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        wrap.style.zoom = mid.toFixed(4);
        if (cabe(s, paineis)) lo = mid; else hi = mid;
      }
      wrap.style.zoom = (lo * 0.995).toFixed(4);                            /* pequena margem de segurança */
    });
  }
  window.__ajustar = ajustar;

  let t = 0;
  const agendar = () => { clearTimeout(t); t = setTimeout(ajustar, 120); };
  addEventListener('resize', agendar);
  addEventListener('orientationchange', agendar);
  addEventListener('load', ajustar);
  addEventListener('pre:fim', ajustar);
  document.addEventListener('fullscreenchange', agendar);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustar);
  ajustar();
})();
