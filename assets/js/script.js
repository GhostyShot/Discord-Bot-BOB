// Performance Throttler
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Detect mobile device
const isMobile = () => window.innerWidth <= 768 || /Mobi|Android|iPhone/.test(navigator.userAgent);
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Particle System
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.maxParticles = isMobile() ? 12 : 34;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  addParticle(x, y) {
    // don't exceed max on mobile
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();  // remove oldest
    }
    
    const particle = {
      x: x || Math.random() * this.canvas.width,
      y: y || Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      decay: Math.random() * 0.01 + 0.002,
      size: Math.random() * 2 + 1,
      color: Math.random() > 0.5 ? 'rgba(0, 240, 255' : 'rgba(255, 0, 255'
    };
    this.particles.push(particle);
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.fillStyle = `${p.color}, ${p.life})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollEffects();
  initInteractions();
});

function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (canvas && !prefersReducedMotion()) {
    window.particleSystem = new ParticleSystem(canvas);
    
    // throttled mousemove to reduce event firing
    const throttledAdd = throttle((e) => {
      if (!isMobile() && Math.random() > 0.9) {
        window.particleSystem.addParticle(e.clientX, e.clientY);
      }
    }, 50);
    
    document.addEventListener('mousemove', throttledAdd);
  }
}

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');

  // throttled scroll handler to reduce reflows
  const throttledScroll = throttle(() => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= sectionTop - 300) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href && href.slice(1) === current) {
        link.classList.add('active');
      }
    });
  }, 100);

  window.addEventListener('scroll', throttledScroll);

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function initScrollEffects() {
  if (prefersReducedMotion()) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.8s ease forwards';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.live-card').forEach(card => {
    observer.observe(card);
  });

  document.querySelectorAll('.social-node').forEach(node => {
    observer.observe(node);
  });
}

function initInteractions() {
  // Cyber button interactions
  document.querySelectorAll('.cyber-button').forEach(button => {
    button.addEventListener('mouseenter', function() {
      this.classList.add('hovered');
    });
    button.addEventListener('mouseleave', function() {
      this.classList.remove('hovered');
    });
  });

  // Node hover effects
  document.querySelectorAll('.social-node').forEach(node => {
    node.addEventListener('mouseenter', function() {
      this.classList.add('hovered');
    });
    node.addEventListener('mouseleave', function() {
      this.classList.remove('hovered');
    });
  });

  // Live card alerts
  document.querySelectorAll('.status-indicator.live').forEach(indicator => {
    const card = indicator.closest('.live-card');
    if (card) {
      card.style.animation = 'pulse 1s ease-in-out infinite';
    }
  });
}

// Add CSS animation styles dynamically (subtle, accent-based)
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .nav-link.active {
    color: var(--accent) !important;
    text-shadow: 0 0 6px rgba(255,140,0,0.12) !important;
  }

  .pulse {
    animation: pulse-accent 1.6s ease-in-out infinite !important;
  }

  @keyframes pulse-accent {
    0%, 100% { box-shadow: 0 0 12px rgba(255,140,0,0.12); }
    50% { box-shadow: 0 0 20px rgba(255,140,0,0.18); }
  }

  .loading-spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 3px solid rgba(255,160,60,0.12);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .skeleton {
    background: linear-gradient(90deg, rgba(255,160,60,0.06) 25%, rgba(255,160,60,0.03) 50%, rgba(255,160,60,0.06) 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.6s infinite;
  }

  @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;
document.head.appendChild(style);

// Subtle hover for section titles (no glitch)
if (!prefersReducedMotion()) {
  document.querySelectorAll('.section-title').forEach(title => {
    title.addEventListener('mouseenter', function() {
      this.style.transition = 'color 0.25s ease, text-shadow 0.25s ease';
      this.style.color = 'var(--accent)';
      this.style.textShadow = '0 0 6px rgba(255,140,0,0.12)';
    });

    title.addEventListener('mouseleave', function() {
      this.style.color = '';
      this.style.textShadow = '';
    });
  });
}



// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Any modal close logic here
  }
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    const saveBtn = document.getElementById('save-config');
    if (saveBtn) saveBtn.click();
  }
});
