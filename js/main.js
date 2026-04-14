/**
 * ClearPathDigital — Main JavaScript
 * Mobile-optimised: adaptive particles, touch-safe 3D, responsive nav
 */

'use strict';

/* ============================================================
   UTILITIES
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const lerp  = (a, b, t) => a + (b - a) * t;

/* Device helpers */
const isTouchDevice = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;
const isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const vw = () => Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);

/* ============================================================
   1. PARTICLE CANVAS — adaptive count & connect distance
   ============================================================ */
function initParticles() {
  const canvas = $('#particles-canvas');
  if (!canvas || isReducedMotion()) return;

  /* Skip particles entirely on very small screens to save battery */
  if (vw() < 480 && isTouchDevice()) { canvas.style.display = 'none'; return; }

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animId;

  function getConfig() {
    const w = vw();
    return {
      count:       w < 480 ? 20 : w < 768 ? 35 : w < 1024 ? 55 : 80,
      speed:       w < 768 ? 0.2 : 0.3,
      maxRadius:   w < 768 ? 1.8 : 2.5,
      minRadius:   0.5,
      connectDist: w < 768 ? 90 : 140,
      colors: ['#0077ff', '#00c3ff', '#00ffee', '#0040cc'],
    };
  }

  let CONFIG = getConfig();

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * CONFIG.speed,
      vy: (Math.random() - 0.5) * CONFIG.speed,
      r:  Math.random() * (CONFIG.maxRadius - CONFIG.minRadius) + CONFIG.minRadius,
      color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
      alpha: Math.random() * 0.6 + 0.2,
    };
  }

  function init() {
    particles = Array.from({ length: CONFIG.count }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Connections */
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.connectDist) {
          const alpha = (1 - dist / CONFIG.connectDist) * 0.2;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 149, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    /* Dots */
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function update() {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -p.r) p.x = W + p.r;
      else if (p.x > W + p.r) p.x = -p.r;
      if (p.y < -p.r) p.y = H + p.r;
      else if (p.y > H + p.r) p.y = -p.r;
    });
  }

  function loop() {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  /* Resize with debounce */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      CONFIG = getConfig();
      resize();
      init();
    }, 250);
  }, { passive: true });

  /* Pause when tab hidden */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animId);
    else loop();
  });

  resize();
  init();
  loop();
}

/* ============================================================
   2. NAVBAR — scroll behaviour + mobile menu
   ============================================================ */
function initNavbar() {
  const navbar     = $('#navbar');
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobile-menu');
  if (!navbar) return;

  /* Scrolled class */
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Hamburger */
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      /* Prevent body scroll when menu open */
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    $$('.mobile-link', mobileMenu).forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    /* Close on outside tap/click */
    document.addEventListener('click', e => {
      if (!navbar.contains(e.target) && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    /* Close on Escape */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }

  /* Smooth scroll for anchor links — offset by nav height */
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = $(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = parseInt(
          getComputedStyle(document.documentElement)
            .getPropertyValue('--nav-h')
        ) || 72;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ============================================================
   3. ACTIVE NAV LINK
   ============================================================ */
function initActiveNav() {
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link[href^="#"]');
  if (!sections.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.style.color = link.getAttribute('href') === `#${id}` ? 'var(--clr-white)' : '';
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));
}

/* ============================================================
   4. COUNTER ANIMATION
   ============================================================ */
function initCounters() {
  const counters = $$('[data-target]');
  if (!counters.length) return;

  function animateCounter(el) {
    if (isReducedMotion()) { el.textContent = el.dataset.target; return; }
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const start    = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = clamp(elapsed / duration, 0, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(lerp(0, target, ease));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { animateCounter(entry.target); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ============================================================
   5. SCROLL REVEAL
   ============================================================ */
function initReveal() {
  if (isReducedMotion()) return;   /* CSS already forces visible on reduced-motion */

  const selectors = [
    '.service-card', '.portfolio-card', '.testimonial-card',
    '.pricing-card', '.step', '.faq-item', '.contact-item',
    '.section-header', '.approach-card', '.timeline-item',
    '.contact-info-card', '.response-badge',
  ];

  selectors.forEach(sel => {
    $$(sel).forEach((el, i) => {
      el.classList.add('reveal');
      /* Stagger: cap at 4 items to avoid long waits on mobile */
      el.style.transitionDelay = `${Math.min(i, 4) * 60}ms`;
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  $$('.reveal').forEach(el => observer.observe(el));
}

/* ============================================================
   6. FAQ ACCORDION
   ============================================================ */
function initFAQ() {
  $$('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      const answerId   = btn.getAttribute('aria-controls');
      const answer     = $(`#${answerId}`);

      /* Close all others */
      $$('.faq-question[aria-expanded="true"]').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          const a = $(`#${other.getAttribute('aria-controls')}`);
          if (a) a.classList.remove('open');
        }
      });

      btn.setAttribute('aria-expanded', !isExpanded);
      if (answer) answer.classList.toggle('open', !isExpanded);
    });
  });
}

/* ============================================================
   7. CONTACT FORM — validation + submission
   ============================================================ */
function initContactForm() {
  const form    = $('#contact-form');
  const success = $('#form-success');
  if (!form) return;

  function showError(input, message) {
    const group   = input.closest('.form-group');
    const errorEl = group && group.querySelector('.form-error');
    if (errorEl) errorEl.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errorEl ? errorEl.id : '');
  }

  function clearError(input) {
    const group   = input.closest('.form-group');
    const errorEl = group && group.querySelector('.form-error');
    if (errorEl) errorEl.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  function validateField(input) {
    clearError(input);
    if (input.required && !input.value.trim()) {
      showError(input, 'This field is required.');
      return false;
    }
    if (input.type === 'email' && input.value.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
        showError(input, 'Please enter a valid email address.');
        return false;
      }
    }
    return true;
  }

  $$('input, select, textarea', form).forEach(input => {
    input.addEventListener('blur', () => validateField(input), { passive: true });
    input.addEventListener('input', () => clearError(input), { passive: true });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    const inputs = $$('input[required], select[required], textarea[required]', form);
    const valid  = inputs.every(input => validateField(input));

    if (!valid) {
      const first = inputs.find(i => i.getAttribute('aria-invalid') === 'true');
      if (first) first.focus();
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Sending…';

    /* Populate reply email in success message (contact.html) */
    const emailInput = $('#email', form);
    const replyEl = $('#reply-email');
    if (emailInput && replyEl) replyEl.textContent = emailInput.value;

    setTimeout(() => {
      form.reset();
      form.hidden = true;
      if (success) success.hidden = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      /* Scroll success into view on mobile */
      if (success) success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1200);
  });
}

/* ============================================================
   8. BACK TO TOP
   ============================================================ */
function initBackToTop() {
  const btn = $('#back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============================================================
   9. COOKIE BANNER
   ============================================================ */
function initCookieBanner() {
  const banner  = $('#cookie-banner');
  const accept  = $('#cookie-accept');
  const decline = $('#cookie-decline');
  if (!banner) return;

  if (localStorage.getItem('cookie-consent')) { banner.classList.add('hidden'); return; }

  accept?.addEventListener('click', () => {
    localStorage.setItem('cookie-consent', 'accepted');
    banner.classList.add('hidden');
  });

  decline?.addEventListener('click', () => {
    localStorage.setItem('cookie-consent', 'declined');
    banner.classList.add('hidden');
  });
}

/* ============================================================
   10. FOOTER YEAR
   ============================================================ */
function initYear() {
  const el = $('#current-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ============================================================
   11. TRUST BAR — pause marquee on hover/focus
   ============================================================ */
function initLogoSlider() {
  const slide = $('.logo-slide');
  if (!slide || isReducedMotion()) return;

  const pause = () => slide.style.animationPlayState = 'paused';
  const play  = () => slide.style.animationPlayState = 'running';

  slide.parentElement.addEventListener('mouseenter', pause);
  slide.parentElement.addEventListener('mouseleave', play);
  slide.parentElement.addEventListener('focusin',    pause);
  slide.parentElement.addEventListener('focusout',   play);
}

/* ============================================================
   12. 3D CARD TILT — desktop only, skipped on touch/mobile
   ============================================================ */
function initCardTilt() {
  /* Only apply on non-touch, hover-capable devices */
  if (isTouchDevice() || isReducedMotion() || vw() < 768) return;

  $$('.service-card, .portfolio-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-8px) perspective(600px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    }, { passive: true });

    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ============================================================
   13. TYPED / BADGE ANIMATION — skipped on reduced motion
   ============================================================ */
function initTypedEffect() {
  if (isReducedMotion() || vw() < 480) return;

  const badge = $('.hero-badge');
  if (!badge) return;

  const words = ['AI Websites', 'AI Chatbots', 'AI Agents', 'Automation', 'AI Videos'];
  const span  = document.createElement('span');
  badge.appendChild(span);

  let idx = 0, char = 0, deleting = false;

  function type() {
    const word = words[idx];
    span.textContent = word.slice(0, deleting ? --char : ++char);

    if (!deleting && char === word.length)   { deleting = true; setTimeout(type, 1600); return; }
    if  (deleting && char === 0)             { deleting = false; idx = (idx + 1) % words.length; }
    setTimeout(type, deleting ? 45 : 85);
  }
  setTimeout(type, 2000);
}

/* ============================================================
   14. VIEWPORT HEIGHT FIX — mobile browser chrome
       Fixes 100vh including/excluding browser address bar
   ============================================================ */
function initVhFix() {
  function setVh() {
    document.documentElement.style.setProperty('--real-vh', `${window.innerHeight * 0.01}px`);
  }
  setVh();
  window.addEventListener('resize', setVh, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(setVh, 300), { passive: true });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initVhFix();
  initParticles();
  initNavbar();
  initActiveNav();
  initCounters();
  initReveal();
  initFAQ();
  initContactForm();
  initBackToTop();
  initCookieBanner();
  initYear();
  initLogoSlider();
  initCardTilt();
  initTypedEffect();

  console.log(
    '%c ClearPathDigital %c clearpathdigital.tech ',
    'background:linear-gradient(135deg,#0077ff,#00c3ff);color:#000c1a;padding:4px 8px;border-radius:4px 0 0 4px;font-weight:bold;',
    'background:#030d1f;color:#00c3ff;padding:4px 8px;border-radius:0 4px 4px 0;border:1px solid #00c3ff;'
  );
});
