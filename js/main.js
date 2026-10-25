/* =========================================================
   CONFLUYE · interacciones y animaciones
   ========================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopMQ = window.matchMedia('(min-width: 960px)');
  const canAnimate = () => window.gsap && !reduceMQ.matches;

  /* ---------- Año del footer ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Header: fondo, ocultar al bajar, botón volver arriba ---------- */
  const header = $('.header');
  const toTop = $('.to-top');
  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const delta = y - lastY;
    header.classList.toggle('is-scrolled', y > 24);
    if (Math.abs(delta) > 6) {
      const hide = delta > 0 && y > 400 && !root.classList.contains('nav-open');
      header.classList.toggle('is-hidden', hide);
      lastY = y;
    }
    toTop.classList.toggle('is-visible', y > 900);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // Al enfocar con teclado algo dentro del header, que vuelva a mostrarse
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  /* ---------- Enlace activo en la navegación ---------- */
  const navLinks = $$('.nav__link');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const current = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('is-current', current);
        if (current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((link) => {
    const section = $(link.getAttribute('href'));
    if (section) sectionObserver.observe(section);
  });

  /* ---------- Menú móvil ---------- */
  const toggle = $('.menu-toggle');
  const nav = $('#site-nav');
  const toggleLabel = $('.sr-only', toggle);

  function setMenu(open) {
    root.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? 'Cerrar menú' : 'Abrir menú';
    if (open) {
      header.classList.remove('is-hidden');
      $('a', nav).focus({ preventScroll: true });
    }
  }

  toggle.addEventListener('click', () => setMenu(!root.classList.contains('nav-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (!root.classList.contains('nav-open')) return;
    if (e.key === 'Escape') { setMenu(false); toggle.focus(); return; }
    if (e.key !== 'Tab') return;
    // Trampa de foco dentro del menú abierto
    const focusables = [toggle, ...$$('a', nav)];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  desktopMQ.addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Pestañas de públicos ---------- */
  const tabs = $$('[role="tab"]');
  const panelOf = (tab) => $(`#${tab.getAttribute('aria-controls')}`);

  function selectTab(tab, focus) {
    if (tab.getAttribute('aria-selected') === 'true') return;
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      panelOf(t).hidden = !selected;
    });
    if (focus) tab.focus();

    if (canAnimate()) {
      const panel = panelOf(tab);
      gsap.fromTo(panel, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' });
      gsap.fromTo($$('.panel__intro > *, .panel__list li', panel),
        { autoAlpha: 0, x: -14 },
        { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.05, delay: 0.08, ease: 'power2.out' });
    }
    // La altura del panel cambia: las secciones siguientes se desplazan
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      const keys = {
        ArrowRight: tabs[(i + 1) % tabs.length],
        ArrowLeft: tabs[(i - 1 + tabs.length) % tabs.length],
        Home: tabs[0],
        End: tabs[tabs.length - 1],
      };
      const next = keys[e.key];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  /* ---------- Niveles de impacto ↔ anillos ---------- */
  const levels = $$('.level');
  const rings = $$('.ring');
  function activateLevel(n) {
    levels.forEach((l) => l.classList.toggle('is-active', l.dataset.level === n));
    rings.forEach((r) => r.classList.toggle('is-active', r.dataset.level === n));
  }
  levels.forEach((level) => {
    level.addEventListener('mouseenter', () => activateLevel(level.dataset.level));
  });

  /* ---------- Formulario (Formspree) ---------- */
  const form = $('.form');
  const status = $('.form__status', form);
  const submit = $('.form__submit', form);
  const fields = $$('[required]', form);

  function setStatus(message, type) {
    status.textContent = message;
    status.classList.toggle('is-success', type === 'success');
    status.classList.toggle('is-error', type === 'error');
  }

  function validate(field) {
    const error = $(`#${field.getAttribute('aria-describedby')}`);
    const v = field.validity;
    let message = '';
    if (v.valueMissing) message = field.tagName === 'SELECT' ? 'Selecciona una opción.' : 'Este campo es obligatorio.';
    else if (v.typeMismatch) message = 'Escribe un correo válido, por ejemplo nombre@dominio.com.';
    else if (v.tooShort) message = `Escribe al menos ${field.minLength} caracteres.`;
    field.setAttribute('aria-invalid', String(Boolean(message)));
    if (error) error.textContent = message;
    return !message;
  }

  fields.forEach((field) => {
    field.addEventListener('blur', () => validate(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validate(field);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invalid = fields.filter((field) => !validate(field));
    if (invalid.length) {
      invalid[0].focus();
      setStatus('Revisa los campos marcados.', 'error');
      return;
    }
    // Honeypot: si un bot lo llenó, fingimos éxito sin enviar
    if ($('#f-hp').value) {
      form.reset();
      setStatus('¡Gracias! Recibimos tu mensaje.', 'success');
      return;
    }
    if (form.action.includes('TU_ID_FORMSPREE')) {
      setStatus('El formulario aún no está conectado: reemplaza TU_ID_FORMSPREE por el ID de tu formulario en Formspree.', 'error');
      return;
    }

    submit.classList.add('is-loading');
    setStatus('', null);
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      fields.forEach((field) => field.removeAttribute('aria-invalid'));
      setStatus('¡Gracias! Recibimos tu mensaje y te responderemos pronto.', 'success');
    } catch {
      setStatus('No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos por correo.', 'error');
    } finally {
      submit.classList.remove('is-loading');
    }
  });

  /* =========================================================
     Animaciones (GSAP)
     ========================================================= */
  const ready = window.gsap && window.ScrollTrigger && window.SplitText && window.DrawSVGPlugin;
  if (!ready || window.__animFallbackFired) {
    root.classList.remove('js-anim');
    return;
  }
  clearTimeout(window.__animFallback);
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

  // SplitText necesita las fuentes definitivas para medir; esperamos como máximo 1.5 s
  const fontsReady = document.fonts
    ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))])
    : Promise.resolve();
  const mm = gsap.matchMedia();

  fontsReady.then(() => mm.add({
    isDesktop: '(min-width: 960px)',
    isMobile: '(max-width: 959px)',
    reduceMotion: '(prefers-reduced-motion: reduce)',
  }, (context) => {
    const { isDesktop, reduceMotion } = context.conditions;

    if (reduceMotion) {
      // Sin movimiento: todo visible, sin pins ni scrub
      root.classList.remove('js-anim');
      return undefined;
    }
    root.classList.add('js-anim');

    const cleanups = [];
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    /* ---- Hero: corrientes que confluyen ---- */
    const heroSplit = SplitText.create('.hero__title', { type: 'words', mask: 'words', wordsClass: 'split-word' });

    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro
      .set(['.hero__title', '.streams'], { opacity: 1 })
      .fromTo('.stream', { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 2.4, stagger: 0.22, ease: 'power2.inOut' }, 0)
      .fromTo('.dot', { scale: 0, opacity: 0, transformOrigin: '50% 50%' },
        { scale: 1, opacity: 1, duration: 0.8, stagger: { each: 0.08, from: 'random' }, ease: 'back.out(2.5)' }, 1.2)
      .fromTo('.hero__logo', { opacity: 0, scale: 0.8, rotation: -14 },
        { opacity: 1, scale: 1, rotation: 0, duration: 1.8, ease: 'expo.out' }, 1.1)
      .from(heroSplit.words, { yPercent: 110, duration: 1.1, stagger: 0.06, ease: 'power4.out' }, 0.15)
      .fromTo('.hero [data-hero]', { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, 0.35)
      .add(() => {
        // Movimiento ambiental continuo
        gsap.to('.streams__paths', { rotation: 5, svgOrigin: '300 300', duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        gsap.to('.hero__logo img', { scale: 1.03, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        $$('.dot').forEach((dot) => {
          gsap.to(dot, {
            x: gsap.utils.random(-16, 16),
            y: gsap.utils.random(-16, 16),
            duration: gsap.utils.random(3, 6),
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          });
        });
      });

    // Al salir del hero, el visual se aleja suavemente
    gsap.to('.hero__visual', {
      yPercent: 14,
      scale: 0.9,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero__copy', {
      yPercent: -10,
      opacity: 0.25,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'center 40%', end: 'bottom top', scrub: true },
    });

    /* ---- Barra de progreso de lectura ---- */
    gsap.to('.progress__bar', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
    });

    /* ---- Enfoque: preguntas que se suceden (pin en escritorio) ----
       Los pins se crean antes que el resto para que los demás triggers
       midan sus posiciones con el espacio del pin ya aplicado. */
    const questions = $$('.question');
    if (isDesktop) {
      const enfoque = $('.enfoque');
      const dots = $$('.enfoque__dots li');
      enfoque.classList.add('is-stacked');
      cleanups.push(() => {
        enfoque.classList.remove('is-stacked');
        dots.forEach((d) => d.classList.remove('is-active'));
      });

      const setDot = (i) => dots.forEach((d, j) => d.classList.toggle('is-active', j === i));
      setDot(0);
      gsap.set(questions, { autoAlpha: 0, yPercent: 40 });
      gsap.set(questions[0], { autoAlpha: 1, yPercent: 0 });

      const qTl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        // en el timeline (no en el ScrollTrigger) para seguir también la inercia del scrub
        onUpdate() { setDot(Number((this.currentLabel() || 'q0').slice(1))); },
        scrollTrigger: {
          trigger: '.enfoque__inner',
          start: 'top top',
          end: () => `+=${window.innerHeight * questions.length * 0.75}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
      qTl.addLabel('q0').to({}, { duration: 0.4 });
      questions.slice(1).forEach((q, i) => {
        // la pregunta anterior sale antes de que entre la siguiente: nunca se superponen
        qTl
          .to(questions[i], { autoAlpha: 0, yPercent: -30, duration: 0.6 })
          .addLabel(`q${i + 1}`)
          .fromTo(q, { autoAlpha: 0, yPercent: 30 }, { autoAlpha: 1, yPercent: 0, duration: 0.8 })
          .to({}, { duration: 0.6 });
      });
    } else {
      gsap.from(questions, {
        opacity: 0,
        y: 30,
        duration: 0.9,
        stagger: 0.14,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.questions', start: 'top 85%' },
      });
    }

    /* ---- Servicios: carrusel horizontal (escritorio) ---- */
    if (isDesktop) {
      const services = $('.services');
      const track = $('.services__track');
      services.classList.add('is-horizontal');
      cleanups.push(() => services.classList.remove('is-horizontal'));

      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.timeline({
        scrollTrigger: {
          trigger: '.services__viewport',
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      })
        .to(track, { x: () => -distance(), ease: 'none' }, 0)
        .to('.services__progress span', { scaleX: 1, ease: 'none' }, 0);
    }

    /* ---- Revelado de bloques ---- */
    gsap.set('[data-reveal]', { y: 36 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: (els) => gsap.to(els, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.09,
        overwrite: true,
      }),
    });

    /* ---- Títulos por líneas con máscara ---- */
    $$('[data-split]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { opacity: 1 });
          return gsap.from(self.lines, {
            yPercent: 110,
            duration: 1.1,
            stagger: 0.1,
            ease: 'power4.out',
            scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          });
        },
      });
    });

    /* ---- Manifiesto que se ilumina palabra por palabra ---- */
    const manifesto = SplitText.create('[data-manifesto]', { type: 'words' });
    gsap.fromTo(manifesto.words, { opacity: 0.14 }, {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: '[data-manifesto]', start: 'top 80%', end: 'bottom 45%', scrub: true },
    });

    /* ---- Flor de dimensiones: los círculos confluyen ---- */
    gsap.fromTo('.petal', {
      x: (i, el) => Math.cos((el.dataset.angle * Math.PI) / 180) * 110,
      y: (i, el) => Math.sin((el.dataset.angle * Math.PI) / 180) * 110,
      scale: 0.5,
      opacity: 0,
      transformOrigin: '50% 50%',
    }, {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 0.55,
      stagger: 0.06,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.dimensions__layout', start: 'top 85%', end: 'top 25%', scrub: 1 },
    });
    gsap.fromTo('.flower__center', { scale: 0, opacity: 0, transformOrigin: '50% 50%' }, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: 'back.out(2)',
      scrollTrigger: { trigger: '.dimensions__layout', start: 'top 30%', toggleActions: 'play none none reverse' },
    });
    gsap.to('.flower__petals', {
      rotation: 360,
      svgOrigin: '200 200',
      duration: 80,
      ease: 'none',
      repeat: -1,
      scrollTrigger: { trigger: '.flower', start: 'top bottom', end: 'bottom top', toggleActions: 'play pause resume pause' },
    });

    /* ---- Proceso: la línea se dibuja con el scroll ---- */
    gsap.fromTo('.steps__fill', { scaleY: 0 }, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: '.steps-wrap', start: 'top 65%', end: 'bottom 65%', scrub: 0.5 },
    });
    $$('.step').forEach((step) => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 65%',
        onEnter: () => step.classList.add('is-active'),
        onLeaveBack: () => step.classList.remove('is-active'),
      });
      gsap.from($$('.step__num, h3, p', step), {
        opacity: 0,
        y: 24,
        duration: 0.9,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: step, start: 'top 82%' },
      });
    });
    cleanups.push(() => $$('.step').forEach((s) => s.classList.remove('is-active')));

    /* ---- Impacto: ondas del yo al nosotros ---- */
    gsap.fromTo(rings.slice().reverse(), { scale: 0, transformOrigin: '50% 50%' }, {
      scale: 1,
      duration: 1.3,
      stagger: 0.14,
      ease: 'elastic.out(1, 0.75)',
      scrollTrigger: { trigger: '.ripples', start: 'top 80%' },
    });
    gsap.fromTo('.ripples__pulse circle', { scale: 0.2, opacity: 0.7, transformOrigin: '50% 50%' }, {
      scale: 1.1,
      opacity: 0,
      duration: 4.5,
      ease: 'sine.out',
      stagger: { each: 1.5, repeat: -1 },
      scrollTrigger: { trigger: '.ripples', start: 'top bottom', end: 'bottom top', toggleActions: 'play pause resume pause' },
    });
    levels.forEach((level) => {
      ScrollTrigger.create({
        trigger: level,
        start: 'top 60%',
        end: 'bottom 60%',
        onToggle: (self) => { if (self.isActive) activateLevel(level.dataset.level); },
      });
    });

    /* ---- Propósito: corrientes que atraviesan la cita ---- */
    gsap.fromTo('.purpose__streams path', { drawSVG: '0% 0%' }, {
      drawSVG: '0% 100%',
      stagger: 0.12,
      ease: 'none',
      scrollTrigger: { trigger: '.purpose', start: 'top 85%', end: 'bottom 40%', scrub: 1 },
    });

    /* ---- Solo escritorio con puntero fino ---- */
    if (isDesktop && finePointer) {
      // Parallax del hero con el mouse
      const hero = $('.hero');
      const vx = gsap.quickTo('.hero__visual', 'x', { duration: 1, ease: 'power3' });
      const vy = gsap.quickTo('.hero__visual', 'y', { duration: 1, ease: 'power3' });
      const dx = gsap.quickTo('.streams__dots', 'x', { duration: 1.4, ease: 'power3' });
      const dy = gsap.quickTo('.streams__dots', 'y', { duration: 1.4, ease: 'power3' });
      const onHeroMove = (e) => {
        const px = e.clientX / window.innerWidth - 0.5;
        const py = e.clientY / window.innerHeight - 0.5;
        vx(px * -20); vy(py * -20);
        dx(px * 36); dy(py * 36);
      };
      hero.addEventListener('pointermove', onHeroMove);
      cleanups.push(() => hero.removeEventListener('pointermove', onHeroMove));

      // Halo que sigue al cursor
      const halo = $('.halo');
      gsap.set(halo, { x: window.innerWidth / 2, y: window.innerHeight / 3 });
      const hx = gsap.quickTo(halo, 'x', { duration: 0.9, ease: 'power3' });
      const hy = gsap.quickTo(halo, 'y', { duration: 0.9, ease: 'power3' });
      const onMove = (e) => { hx(e.clientX); hy(e.clientY); };
      halo.classList.add('is-on');
      window.addEventListener('pointermove', onMove, { passive: true });
      cleanups.push(() => {
        window.removeEventListener('pointermove', onMove);
        halo.classList.remove('is-on');
      });

      // Inclinación 3D suave de las tarjetas
      $$('.card').forEach((card) => {
        gsap.set(card, { transformPerspective: 900 });
        const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
        const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
        const onCardMove = (e) => {
          const r = card.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 10);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
        };
        const onCardLeave = () => { rx(0); ry(0); };
        card.addEventListener('pointermove', onCardMove);
        card.addEventListener('pointerleave', onCardLeave);
        cleanups.push(() => {
          card.removeEventListener('pointermove', onCardMove);
          card.removeEventListener('pointerleave', onCardLeave);
        });
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }));
})();
