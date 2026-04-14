/**
 * Fahadderek AI — Main JavaScript
 * Features: Particle canvas, smooth scroll, navbar, FAQ accordion,
 *           counter animation, scroll reveal, form validation, cookie banner
 */

'use strict';

/* ============================================================
   UTILITIES
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const lerp = (a, b, t) => a + (b - a) * t;

/* ============================================================
   1. PARTICLE CANVAS BACKGROUND
   ============================================================ */
function initParticles() {
  const canvas = $('#particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animId;

  const CONFIG = {
    count:       window.innerWidth < 768 ? 40 : 80,
    speed:       0.3,
    maxRadius:   2.5,
    minRadius:   0.5,
    connectDist: 140,
    colors:      ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981'],
  };

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function randomColor() {
    return CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
  }

  function createParticle() {
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * CONFIG.speed,
      vy: (Math.random() - 0.5) * CONFIG.speed,
      r:  Math.random() * (CONFIG.maxRadius - CONFIG.minRadius) + CONFIG.minRadius,
      color: randomColor(),
      alpha: Math.random() * 0.6 + 0.2,
    };
  }

  function init() {
    particles = Array.from({ length: CONFIG.count }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.connectDist) {
          const alpha = (1 - dist / CONFIG.connectDist) * 0.25;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
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

  // Handle resize with debounce
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      init();
    }, 200);
  });

  // Pause animation when tab hidden (performance)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      loop();
    }
  });

  resize();
  init();
  loop();
}

/* ============================================================
   2. NAVBAR — SCROLL BEHAVIOUR & MOBILE MENU
   ============================================================ */
function initNavbar() {
  const navbar    = $('#navbar');
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobile-menu');
  if (!navbar) return;

  // Scroll: add .scrolled class
  const onScroll = () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile menu when a link is clicked
    $$('.mobile-link', mobileMenu).forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!navbar.contains(e.target) && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Smooth scroll for all anchor links
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = $(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ============================================================
   3. ACTIVE NAV LINK (highlight on scroll)
   ============================================================ */
function initActiveNav() {
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link[href^="#"]');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const matches = link.getAttribute('href') === `#${id}`;
          link.style.color = matches ? 'var(--clr-white)' : '';
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
    const target = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = clamp(elapsed / duration, 0, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(lerp(0, target, ease));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ============================================================
   5. SCROLL REVEAL
   ============================================================ */
function initReveal() {
  // Add reveal class to elements
  const selectors = [
    '.service-card', '.portfolio-card', '.testimonial-card',
    '.pricing-card', '.step', '.faq-item', '.contact-item',
    '.section-header',
  ];

  selectors.forEach(sel => {
    $$(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 60}ms`;
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

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

      // Close all others
      $$('.faq-question[aria-expanded="true"]').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          const otherAnswer = $(`#${other.getAttribute('aria-controls')}`);
          if (otherAnswer) otherAnswer.classList.remove('open');
        }
      });

      // Toggle current
      btn.setAttribute('aria-expanded', !isExpanded);
      if (answer) answer.classList.toggle('open', !isExpanded);
    });
  });
}

/* ============================================================
   7. CONTACT FORM — VALIDATION & SUBMISSION
   ============================================================ */
function initContactForm() {
  const form    = $('#contact-form');
  const success = $('#form-success');
  if (!form) return;

  function showError(input, message) {
    const group = input.closest('.form-group');
    const errorEl = group && group.querySelector('.form-error');
    if (errorEl) errorEl.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError(input) {
    const group = input.closest('.form-group');
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
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(input.value.trim())) {
        showError(input, 'Please enter a valid email address.');
        return false;
      }
    }

    return true;
  }

  // Real-time validation on blur
  $$('input, select, textarea', form).forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => clearError(input));
  });

  // Submit handler
  form.addEventListener('submit', e => {
    e.preventDefault();

    const inputs = $$('input[required], select[required], textarea[required]', form);
    const valid  = inputs.every(input => validateField(input));

    if (!valid) {
      // Focus first invalid field
      const firstInvalid = inputs.find(i => i.getAttribute('aria-invalid') === 'true');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Simulate form submission (replace with your actual endpoint)
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    setTimeout(() => {
      form.reset();
      form.hidden = true;
      success.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
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

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   9. COOKIE BANNER
   ============================================================ */
function initCookieBanner() {
  const banner  = $('#cookie-banner');
  const accept  = $('#cookie-accept');
  const decline = $('#cookie-decline');
  if (!banner) return;

  // Check if already decided
  if (localStorage.getItem('cookie-consent')) {
    banner.classList.add('hidden');
    return;
  }

  if (accept) {
    accept.addEventListener('click', () => {
      localStorage.setItem('cookie-consent', 'accepted');
      banner.classList.add('hidden');
      // Here you would initialize analytics
    });
  }

  if (decline) {
    decline.addEventListener('click', () => {
      localStorage.setItem('cookie-consent', 'declined');
      banner.classList.add('hidden');
    });
  }
}

/* ============================================================
   10. FOOTER — CURRENT YEAR
   ============================================================ */
function initYear() {
  const el = $('#current-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ============================================================
   11. TRUST BAR — PAUSE ON HOVER
   ============================================================ */
function initLogoSlider() {
  const slide = $('.logo-slide');
  if (!slide) return;

  slide.parentElement.addEventListener('mouseenter', () => {
    slide.style.animationPlayState = 'paused';
  });
  slide.parentElement.addEventListener('mouseleave', () => {
    slide.style.animationPlayState = 'running';
  });
}

/* ============================================================
   12. SERVICE CARD — MOUSE PARALLAX TILT
   ============================================================ */
function initCardTilt() {
  if (window.matchMedia('(hover: none)').matches) return; // Skip on touch

  $$('.service-card, .portfolio-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-6px) perspective(600px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ============================================================
   13. TYPED HERO TEXT EFFECT
   ============================================================ */
function initTypedEffect() {
  const words   = ['AI Websites', 'Smart Chatbots', 'AI Agents', 'Automation', 'AI Videos'];
  const target  = document.createElement('span');
  const headline = $('.hero-headline');
  if (!headline) return;

  // Find and replace the last word in headline if desired — skip if reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let wIdx = 0, cIdx = 0, deleting = false;

  // Create a dynamic text span only for the badge
  const badge = $('.hero-badge');
  if (!badge) return;

  const dynamicSpan = document.createElement('span');
  badge.appendChild(dynamicSpan);
  let badgeWords = ['AI Websites', 'AI Chatbots', 'AI Agents', 'Automation', 'AI Videos'];
  let bIdx = 0, bChar = 0, bDeleting = false;

  function typeBadge() {
    const word = badgeWords[bIdx];
    if (!bDeleting) {
      dynamicSpan.textContent = word.slice(0, ++bChar);
      if (bChar === word.length) {
        bDeleting = true;
        setTimeout(typeBadge, 1800);
        return;
      }
    } else {
      dynamicSpan.textContent = word.slice(0, --bChar);
      if (bChar === 0) {
        bDeleting = false;
        bIdx = (bIdx + 1) % badgeWords.length;
      }
    }
    setTimeout(typeBadge, bDeleting ? 50 : 90);
  }

  // Start after a small delay
  setTimeout(typeBadge, 2000);
}

/* ============================================================
   14. LAZY IMAGES (future-proof)
   ============================================================ */
function initLazyImages() {
  if ('loading' in HTMLImageElement.prototype) return; // Browser supports native lazy load
  // Polyfill via IntersectionObserver
  const imgs = $$('img[loading="lazy"]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        observer.unobserve(img);
      }
    });
  });
  imgs.forEach(img => observer.observe(img));
}

/* ============================================================
   INIT — Run everything on DOMContentLoaded
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
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
  initLazyImages();

  // Log to console for developers
  console.log(
    '%c Fahadderek AI %c fahadderek.ai ',
    'background: linear-gradient(135deg, #6366f1, #06b6d4); color: white; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold;',
    'background: #0a0e1a; color: #6366f1; padding: 4px 8px; border-radius: 0 4px 4px 0; font-weight: bold; border: 1px solid #6366f1;'
  );
});
