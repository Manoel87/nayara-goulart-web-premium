/* ==========================================================
   Nayara Goulart · Estética Avançada — interações
   JS leve, sem dependências.
   ========================================================== */
(() => {
  'use strict';

  /* ---------- CONFIGURAÇÃO ---------- */
  const WHATSAPP = '5581999434460';           // DDI + DDD + número (somente dígitos)
  const CLINIC   = 'Nayara Goulart · Estética Avançada';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Preloader ---------- */
  const preloader = $('#preloader');
  const finishLoading = () => {
    preloader.classList.add('is-done');
    document.body.classList.add('is-loaded');
  };
  window.addEventListener('load', () => setTimeout(finishLoading, reduceMotion ? 0 : 1400));
  setTimeout(finishLoading, 3500); // segurança: nunca bloquear o usuário

  /* ---------- Header: estado ao rolar + esconder ao descer ---------- */
  const header = $('#header');
  const fab = $('#fab');
  let lastY = 0, ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > lastY && y > 500 && !nav.classList.contains('is-open'));
    fab.classList.toggle('is-visible', y > innerHeight * 0.8);
    lastY = y;
    parallax(y);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---------- Menu mobile ---------- */
  const burger = $('#burger');
  const nav = $('#nav');
  const toggleMenu = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('is-locked', open);
    header.style.color = '';
  };
  burger.addEventListener('click', () => toggleMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

  /* ---------- Reveal ao rolar (IntersectionObserver) ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Parallax discreto ---------- */
  const pxEls = $$('[data-parallax]');
  function parallax(y) {
    if (reduceMotion) return;
    pxEls.forEach(el => {
      const host = el.closest('section, figure') || el;
      const r = host.getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight + 100) return;
      const speed = parseFloat(el.dataset.parallax) || 0.08;
      const offset = (r.top + r.height / 2 - innerHeight / 2) * speed * -1;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
    // hero: leve afastamento do conteúdo
    const hc = $('.hero__content');
    if (hc && y < innerHeight) {
      hc.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
      hc.style.opacity = 1 - y / (innerHeight * 0.95);
    }
  }

  /* ---------- Vídeo do hero: só carrega quando faz sentido ---------- */
  (function heroVideo() {
    const v = $('#heroVideo');
    const conn = navigator.connection || {};
    const slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
    if (!v || reduceMotion || slow) return;

    const start = () => {
      const mp4 = document.createElement('source');  mp4.src  = v.dataset.src;     mp4.type  = 'video/mp4';
      const web = document.createElement('source');  web.src  = v.dataset.srcWebm; web.type  = 'video/webm';
      v.append(web, mp4);
      v.playbackRate = 0.6;                               // efeito slow-motion sutil
      v.addEventListener('canplay', () => { v.classList.add('is-ready'); v.play().catch(() => {}); }, { once: true });
      v.addEventListener('error', () => v.remove(), { capture: true, once: true }); // sem arquivo = mantém fundo animado
      v.load();
    };
    // aguarda a página carregar para não competir com recursos críticos
    window.addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 1200)));

    // pausa fora da viewport para economizar bateria
    new IntersectionObserver(([e]) => { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }).observe(v);
  })();

  /* ---------- Holofote dourado nos cards ---------- */
  $$('.card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Botões magnéticos (desktop) ---------- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduceMotion) {
    $$('.btn--gold').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.12;
        const y = (e.clientY - r.top - r.height / 2) * 0.25;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
      btn.style.transition += ', transform .5s cubic-bezier(.22,.8,.2,1)';
    });
  }

  /* ---------- Carrossel de depoimentos ---------- */
  (function carousel() {
    const track = $('#track');
    const slides = $$('.slide', track);
    const dotsBox = $('#dots');
    let i = 0, timer, startX = 0, dx = 0, dragging = false;

    const dots = slides.map((_, n) => {
      const b = document.createElement('button');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Depoimento ${n + 1}`);
      b.addEventListener('click', () => { go(n); restart(); });
      dotsBox.append(b);
      return b;
    });

    function go(n) {
      i = (n + slides.length) % slides.length;
      track.style.transform = `translateX(${-i * 100}%)`;
      dots.forEach((d, k) => d.setAttribute('aria-selected', k === i));
      slides.forEach((s, k) => s.setAttribute('aria-hidden', k !== i));
    }
    const restart = () => { clearInterval(timer); if (!reduceMotion) timer = setInterval(() => go(i + 1), 7500); };

    $('#prev').addEventListener('click', () => { go(i - 1); restart(); });
    $('#next').addEventListener('click', () => { go(i + 1); restart(); });

    // arrastar / deslizar
    track.addEventListener('pointerdown', e => { dragging = true; startX = e.clientX; dx = 0; track.classList.add('is-drag'); clearInterval(timer); track.setPointerCapture(e.pointerId); });
    track.addEventListener('pointermove', e => {
      if (!dragging) return;
      dx = e.clientX - startX;
      track.style.transform = `translateX(calc(${-i * 100}% + ${dx}px))`;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false; track.classList.remove('is-drag');
      if (Math.abs(dx) > 60) go(i + (dx < 0 ? 1 : -1)); else go(i);
      restart();
    };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);

    const box = $('#carousel');
    box.addEventListener('mouseenter', () => clearInterval(timer));
    box.addEventListener('mouseleave', restart);
    box.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); });

    go(0); restart();
  })();

  /* ---------- Agendamento (concierge via WhatsApp) ---------- */
  (function booking() {
    const dlg = $('#booking');
    const form = $('#bookingForm');
    const name = $('#bName');
    const proc = $('#bProc');
    const date = $('#bDate');

    // data mínima = hoje
    date.min = new Date().toISOString().split('T')[0];

    const open = (selected) => {
      if (selected) {
        const opt = [...proc.options].find(o => o.textContent.toLowerCase().includes(selected.toLowerCase().split(' ')[0]));
        if (opt) proc.value = opt.textContent;
      }
      toggleMenu(false);
      dlg.showModal();
      document.body.classList.add('is-locked');
      setTimeout(() => name.focus(), 350);
    };

    $$('[data-open-booking]').forEach(btn => btn.addEventListener('click', () => {
      const card = btn.closest('[data-proc]');
      open(card ? card.dataset.proc : null);
    }));

    dlg.addEventListener('close', () => document.body.classList.remove('is-locked'));
    dlg.addEventListener('click', e => {          // clique no fundo fecha
      const r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!name.value.trim()) { name.classList.add('is-error'); name.focus(); return; }
      name.classList.remove('is-error');

      const periodo = form.periodo.value;
      let msg = `Olá! Meu nome é ${name.value.trim()} e gostaria de agendar uma consulta exclusiva na ${CLINIC}.\n\n` +
                `Interesse: ${proc.value}\nPeríodo preferido: ${periodo}`;
      if (date.value) {
        const [y, m, d] = date.value.split('-');
        msg += `\nData de preferência: ${d}/${m}/${y}`;
      }
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      dlg.close();
      form.reset();
    });
    name.addEventListener('input', () => name.classList.remove('is-error'));
  })();

  /* ---------- Links de WhatsApp (footer + flutuante) ---------- */
  const waBase = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá! Gostaria de falar com a concierge da ' + CLINIC + '.')}`;
  ['#fab', '#waFooter'].forEach(s => { const a = $(s); if (a) a.href = waBase; });

  /* ---------- Mapa: carrega só quando próximo da tela ---------- */
  const mapFrame = $('#map iframe');
  if (mapFrame) {
    new IntersectionObserver(([e], obs) => {
      if (e.isIntersecting) { mapFrame.src = mapFrame.dataset.src; obs.disconnect(); }
    }, { rootMargin: '400px' }).observe($('#map'));
  }

  /* ---------- Imagens: se uma foto falhar, usa a ilustração local ---------- */
  $$('img[data-fallback]').forEach(img => {
    const useFallback = () => {
      const fb = img.dataset.fallback;
      if (fb && !img.src.endsWith(fb)) { img.removeAttribute('srcset'); img.src = fb; }
    };
    img.addEventListener('error', useFallback);
    if (img.complete && img.naturalWidth === 0) useFallback();
  });

  /* ---------- Ano no rodapé ---------- */
  $('#year').textContent = new Date().getFullYear();

  onScroll();
})();