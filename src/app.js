/* ZCraft Studios — vanilla JS site engine */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const h = (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  const pageKey = document.body.getAttribute('data-page') || 'home';

  function applySEO(cfg) {
    const seo = cfg.seo[pageKey] || cfg.seo.home;
    document.title = seo.title;
    const meta = (name, content, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    meta('description', seo.description);
    meta('keywords', seo.keywords);
    meta('author', cfg.site.author);
    meta('theme-color', cfg.branding.themeColor);
    meta('og:title', seo.title, 'property');
    meta('og:description', seo.description, 'property');
    meta('og:type', 'website', 'property');
    meta('og:image', cfg.branding.ogImage, 'property');
    meta('og:url', cfg.site.domain + seo.canonical, 'property');
    meta('twitter:card', 'summary_large_image');
    meta('twitter:title', seo.title);
    meta('twitter:description', seo.description);
    meta('twitter:image', cfg.branding.ogImage);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = cfg.site.domain + seo.canonical;

    let fav = document.querySelector('link[rel="icon"]');
    if (!fav) { fav = document.createElement('link'); fav.rel = 'icon'; document.head.appendChild(fav); }
    fav.href = cfg.branding.favicon;
  }

  function topbar(cfg) {
    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    return `
      <header class="topbar">
        <div class="topbar-inner">
          <a class="topbar-logo" href="/">
            <img class="topbar-logo-img" src="${esc(cfg.branding.logo)}" alt="${esc(cfg.site.name)} logo" />
            <span>${esc(cfg.site.name)}</span>
          </a>
          <nav class="topbar-nav">
            ${cfg.nav.map(n => {
              const targetPath = (n.href || '/').replace(/\/+$/, '') || '/';
              return `<a href="${esc(n.href)}" class="${targetPath === currentPath ? 'active' : ''}">${esc(n.label)}</a>`;
            }).join('')}
          </nav>
        </div>
      </header>`;
  }

  function footer(cfg) {
    return `
      <footer>
        <div class="footer-inner">
          <div class="footer-left"><span>// </span>${esc(cfg.footer.left)} · ${cfg.site.year}</div>
          <div class="footer-links">
            ${cfg.footer.links.map(l => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}
          </div>
        </div>
      </footer>`;
  }

  function windowBox(title, bodyHTML, opts = {}) {
    const cls = opts.class ? ` ${opts.class}` : '';
    const bodyCls = opts.bodyClass ? ` class="${opts.bodyClass}"` : ' class="window-body"';
    return `
      <div class="window${cls}">
        <div class="window-bar">
          <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
          <span class="window-title">${title}</span>
        </div>
        <div${bodyCls}>${bodyHTML}</div>
      </div>`;
  }

  function stars(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    let out = '';
    for (let i=0;i<full;i++) out += '<span class="star star-full">★</span>';
    if (half) out += '<span class="star star-half">★</span>';
    for (let i=0;i<empty;i++) out += '<span class="star star-empty">★</span>';
    out += `<span class="stars-num">${rating.toFixed(1)}</span>`;
    return `<span class="stars" aria-label="${rating} out of 5">${out}</span>`;
  }

  function projectCard(p) {
    return `
      <article class="project-card">
        <img class="project-img" src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" />
        <div class="project-content">
          <div class="project-head">
            <h3 class="project-name">${esc(p.title)} ${p.featured ? '<span class="featured-pill">featured</span>' : ''}</h3>
            <span class="project-brand">${esc(p.brand || p.category || '')}</span>
          </div>
          <p class="project-summary">${esc(p.summary)}</p>
          <div class="tags">${(p.tags||[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          ${p.status ? `<div class="project-status">// status: ${esc(p.status)}</div>` : ''}
          <div class="project-actions">
            ${(p.links||[]).map(l => `<a class="btn btn-${l.variant||'ghost'}" href="${esc(l.href)}" ${/^https?:/.test(l.href)?'target="_blank" rel="noopener"':''}>${esc(l.label)}</a>`).join('')}
          </div>
        </div>
      </article>`;
  }

  function resourceCard(r, index) {
    const icons = { config: '⚙', template: '📦', kit: '🎨', ui: '✨', plugin: '🔧', other: '📄' };
    const icon = icons[r.category] || icons.other;
    return `
      <article class="resource-card" data-resource-index="${index}">
        <img class="resource-card-image" src="${esc(r.image)}" alt="${esc(r.title)}" loading="lazy" />
        <div class="resource-card-body">
          <div class="resource-card-header">
            <div class="resource-card-icon">
              <div style="font-size: 48px; color: var(--main); opacity: 0.4;">${icon}</div>
            </div>
            <div class="resource-card-status">${esc(r.status)}</div>
          </div>
          <div class="resource-card-content">
            <h3 class="resource-card-title">${esc(r.title)}</h3>
            <p class="resource-card-summary">${esc(r.summary)}</p>
            <div class="tags">${(r.tags||[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            <div class="resource-card-actions">
              ${(r.links||[]).map(l => `<a class="btn btn-${l.variant||'primary'}" href="${esc(l.href)}" ${/^https?:/.test(l.href)?'target="_blank" rel="noopener"':''}>${esc(l.label)}</a>`).join('')}
            </div>
          </div>
        </div>
      </article>`;
  }

  function parseBBCode(text) {
    return text
      .replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>')
      .replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>')
      .replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>')
      .replace(/\[s\](.*?)\[\/s\]/gi, '<s>$1</s>')
      .replace(/\[color=(.*?)\](.*?)\[\/color\]/gi, '<span style="color:$1">$2</span>')
      .replace(/\[size=(.*?)\](.*?)\[\/size\]/gi, '<span style="font-size:$1">$2</span>')
      .replace(/\[url=(.*?)\](.*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener">$2</a>')
      .replace(/\[url\](.*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\[img\](.*?)\[\/img\]/gi, '<img src="$1" alt="" style="max-width:100%;height:auto;" />')
      .replace(/\[list\](.*?)\[\/list\]/gi, '<ul>$1</ul>')
      .replace(/\[li\](.*?)\[\/li\]/gi, '<li>$1</li>')
      .replace(/\[code\](.*?)\[\/code\]/gi, '<code>$1</code>')
      .replace(/\[quote\](.*?)\[\/quote\]/gi, '<blockquote>$1</blockquote>')
      .replace(/\n/g, '<br>');
  }

  function loadPayPalSDK() {
    return new Promise((resolve, reject) => {
      if (window.paypal) return resolve(window.paypal);
      const existing = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.paypal));
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=ARM7vUNfOeuKYBARRVZ8-jg1_XFZ5zPd8b6MPhhK-_uovP34AimpuweE8nce97y8N7-7gR268vAC_lEW&currency=USD';
      script.onload = () => resolve(window.paypal);
      script.onerror = () => reject(new Error('PayPal SDK failed to load'));
      document.head.appendChild(script);
    });
  }

  function initPayPalDonation() {
    const container = document.getElementById('paypal-button-container');
    const amountInput = document.getElementById('donation-amount');
    if (!container || !amountInput) return;
    loadPayPalSDK().then(paypal => {
      paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'donate' },
        createOrder(data, actions) {
          const amount = parseFloat(amountInput.value) || 10.00;
          return actions.order.create({
            purchase_units: [{
              amount: { value: amount.toFixed(2) },
              description: 'ZCraft Studios donation'
            }]
          });
        },
        onApprove(data, actions) {
          return actions.order.capture().then(() => {
            window.location.href = '/thankyou?status=success';
          });
        },
        onError(err) {
          console.error('PayPal error', err);
          container.innerHTML = '<p class="page-copy">Unable to load PayPal right now. Please try again later or <a href="/contact">contact us</a>.</p>';
        }
      }).render('#paypal-button-container');
    }).catch(err => {
      console.error(err);
      container.innerHTML = '<p class="page-copy">Unable to load PayPal right now. Please try again later or <a href="/contact">contact us</a>.</p>';
    });
  }

  function renderDonate(cfg) {
    return `
      <section class="page-hero">
        <span class="page-label">// support</span>
        <h1>Support ZCraft Studios with a donation.</h1>
        <p class="page-copy">Help keep premium Minecraft resources, plugin work, and modern web experiences running. Your donation goes straight to development, hosting, and studio growth.</p>
      </section>
      <div class="window window-highlight">
        <div class="window-body">
          <h2>Donate with PayPal</h2>
          <p class="page-copy">Choose an amount and complete your payment securely. After approval, you will be redirected to a confirmation page.</p>
          <div class="donation-field">
            <label for="donation-amount">Donation amount (USD)</label>
            <input id="donation-amount" type="number" min="1" step="1" value="10" />
          </div>
          <div id="paypal-button-container" style="margin-top:22px;"></div>
          <p class="page-copy" style="margin-top:18px;">Prefer another option? Reach out on the contact page and we’ll help you complete your support.</p>
        </div>
      </div>`;
  }

  function renderThankYou(cfg) {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const title = status === 'success' ? 'Payment confirmed.' : 'Thank you for supporting ZCraft Studios.';
    const copy = status === 'success'
      ? 'Your donation has been received successfully. We appreciate your support and will follow up if needed.'
      : 'Thank you for visiting. If this was a PayPal redirect, your payment is still being processed and will be confirmed shortly.';

    return `
      <section class="page-hero">
        <span class="page-label">// thank you</span>
        <h1>${esc(title)}</h1>
        <p class="page-copy">${esc(copy)}</p>
      </section>
      <div class="window window-highlight">
        <div class="window-body">
          <h2>Appreciation confirmed</h2>
          <p class="page-copy">Your support keeps ZCraft Studios building Minecraft plugins, server tools, and web experiences. If you need help, reach out on the contact page.</p>
          <ul class="page-copy">
            <li>Transaction status: ${esc(status === 'success' ? 'Success' : 'Pending')}</li>
            <li>Next step: you can return home or make another donation.</li>
          </ul>
          <div class="window-actions">
            <a class="btn btn-primary" href="/">return home</a>
            <a class="btn btn-ghost" href="/donate">donate again</a>
          </div>
        </div>
      </div>`;
  }

  function closeResourceDetail() {
    const overlay = document.getElementById('resource-detail-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  }

  function openResourceDetail(resource) {
    closeResourceDetail();
    const overlay = document.createElement('div');
    overlay.id = 'resource-detail-overlay';
    overlay.className = 'resource-detail-overlay';
    overlay.innerHTML = `
      <div class="resource-detail-panel">
        <button type="button" class="resource-detail-close" aria-label="Close product detail">×</button>
        <div class="resource-detail-media">
          <img class="resource-detail-image" src="${esc(resource.image)}" alt="${esc(resource.title)}" loading="lazy" />
        </div>
        <div class="resource-detail-body">
          <div class="resource-detail-meta">
            <span class="resource-detail-tag">${esc(resource.category || 'resource')}</span>
            <span class="resource-detail-price">${esc(resource.status || 'free')}</span>
          </div>
          <h2 class="resource-detail-title">${esc(resource.title)}</h2>
          <div class="resource-detail-copy">${parseBBCode(esc(resource.summary))}</div>
          <div class="tags">${(resource.tags||[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <div class="resource-detail-actions">
            ${(resource.links||[]).map(l => `<a class="btn btn-primary" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}
          </div>
        </div>
      </div>`;

    overlay.addEventListener('click', event => {
      if (event.target === overlay) closeResourceDetail();
    });

    overlay.querySelector('.resource-detail-close').addEventListener('click', closeResourceDetail);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    document.addEventListener('keydown', function escHandler(event) {
      if (event.key === 'Escape') {
        closeResourceDetail();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  function attachResourceDetailListeners(resources) {
    document.querySelectorAll('.resource-card[data-resource-index]').forEach(card => {
      card.addEventListener('click', event => {
        if (event.target.closest('a')) return;
        const index = parseInt(card.dataset.resourceIndex, 10);
        const resource = resources[index];
        if (resource) openResourceDetail(resource);
      });
    });
  }

  function reviewCard(r) {
    return `
      <div class="review-card">
        <div class="review-head">
          <img class="review-avatar" src="${esc(r.avatar)}" alt="${esc(r.name)}" loading="lazy" />
          <div class="review-meta">
            <div class="review-name">${esc(r.name)}</div>
            <div class="review-handle">${esc(r.handle)}</div>
            ${r.project ? `<div class="review-project">// ${esc(r.project)}</div>` : ''}
          </div>
          ${stars(Number(r.rating)||0)}
        </div>
        <p class="review-text">"${esc(r.text)}"</p>
        ${r.date ? `<div class="review-date">${esc(r.date)}</div>` : ''}
      </div>`;
  }

  function profileCardHTML(profile) {
    return `
      <a class="profile-card" href="${esc(profile.redirect)}" target="_blank" rel="noopener">
        <img class="skin-img" src="${esc(profile.image)}" alt="${esc(profile.name)}" loading="lazy" />
        <div class="profile-name">${esc(profile.name)}</div>
        <div class="profile-handle">${esc(profile.handle)}</div>
        <div class="profile-note">${esc(profile.note)}</div>
        <div class="profile-chips">${(profile.chips||[]).map(c => `<span class="profile-chip">${esc(c)}</span>`).join('')}</div>
        <div class="skin-meta">
          ${(profile.metaLinks||[]).map(m => `<span class="profile-meta-link">${esc(m.label)}</span>`).join('')}
        </div>
      </a>`;
  }

  function statsRow(stats) {
    return `
      <div class="stats-row">
        ${stats.map(s => `
          <div class="stat-cell">
            <div class="stat-n" data-count="${s.value}" data-suffix="${esc(s.suffix||'')}">0${esc(s.suffix||'')}</div>
            <div class="stat-l">${esc(s.label)}</div>
          </div>`).join('')}
      </div>`;
  }

  function animateCounters() {
    document.querySelectorAll('.stat-n[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1100; const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1-p, 3);
        el.textContent = Math.floor(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- PAGES ---------- */

  function renderHome(cfg) {
    const hero = cfg.hero;

    const bootLines = (hero.boot || []).map(l => {
      const cls = l.startsWith('$') ? 'boot-cmd'
        : /\bok\b/.test(l) ? 'boot-ok'
        : l.startsWith('›') ? 'boot-step'
        : 'boot-line';
      return `<div class="${cls}">${esc(l)}</div>`;
    }).join('');

    const heroLeft = `
      <div class="home-lead">
        <div class="hero-prompt">${esc(hero.prompt)}</div>
        <h1 class="hero-name hero-cursor">${esc(hero.name)} <span class="hero-name-accent">${esc(hero.nameAccent)}</span></h1>
        <div class="hero-role">${esc(hero.role)}</div>
        <div class="status-row">
          <span class="status-dot"></span><span class="status-text">${esc(hero.status)}</span>
        </div>
        <p class="hero-desc">${esc(hero.description)}</p>
        <div class="hero-actions">
          ${hero.actions.map(a => `<a class="btn btn-${a.variant}" href="${esc(a.href)}">${esc(a.label)}</a>`).join('')}
        </div>
      </div>`;

    const bootBox = windowBox(`
      <span class="boot-logo-title"><img src="${esc(cfg.branding.logo)}" alt="${esc(cfg.site.name)} logo" /></span>
      <span>~/</span>studio.boot
    `, `
      <pre class="boot-pre">${bootLines}</pre>
    `);

    const heroHTML = `
      <section class="hero">
        <div class="home-hero-grid">
          ${heroLeft}
          <div class="home-hero-side">${bootBox}</div>
        </div>
      </section>`;

    const servicesHTML = windowBox(`<span>~/</span>studio.services`, `
      <div class="section-label">// what we craft</div>
      <div class="services-grid">
        ${(hero.services||[]).map(s => `
          <div class="service-card">
            <div class="service-icon">${esc(s.icon)}</div>
            <div class="service-title">${esc(s.title)}</div>
            <div class="service-desc">${esc(s.desc)}</div>
          </div>`).join('')}
      </div>
    `);

    const statsHTML = statsRow(cfg.stats);

    const featured = cfg.projects.filter(p => p.featured).slice(0, 3);
    const featuredHTML = windowBox(`<span>~/</span>featured.work`, `
      <div class="section-label">// featured releases</div>
      <div class="projects-grid">${featured.map(projectCard).join('')}</div>
      <a class="link-sm" href="/resources">browse resources</a>
    `);

    const ctaHTML = windowBox(`<span>~/</span>commission.open`, `
      <div class="cta-row">
        <div>
          <div class="section-label">// commissions open</div>
          <h2 class="cta-title">have something to ship?</h2>
          <p class="cta-copy">Plugins, server setups, and web work — built fast, polished, and production-ready.</p>
        </div>
        <div class="cta-actions">
          <a class="btn btn-primary" href="/contact">start a project</a>
          <a class="btn btn-ghost" href="/resources">browse resources</a>
        </div>
      </div>
    `);

    const reviewsHTML = windowBox(`<span>~/</span>testimonials.log`, `
      <div class="section-label">// what clients say</div>
      <div class="reviews-grid">${cfg.reviews.map(reviewCard).join('')}</div>
    `);

    return heroHTML + servicesHTML + statsHTML + featuredHTML + ctaHTML + reviewsHTML;
  }

  function renderAbout(cfg) {
    const a = cfg.about;
    const bioHL = esc(a.bio)
      .replace(/(\/\/[^\n]*)/g, '<span class="kw-comment">$1</span>')
      .replace(/'([^']*)'/g, '<span class="kw-string">\'$1\'</span>')
      .replace(/\b(const|let|var|true|false)\b/g, '<span class="kw-fn">$1</span>')
      .replace(/\b(zain|name|studio|focus|stack|shipping)\b/g, '<span class="kw-var">$1</span>');

    const bioCard = `
      <div class="about-card">
        <div class="about-card-header">
          <h3 class="about-card-title">// studio profile</h3>
        </div>
        <div class="about-card-content">
          <pre class="about-bio">${bioHL}</pre>
        </div>
      </div>`;

    const skillsCard = `
      <div class="about-card">
        <div class="about-card-header">
          <h3 class="about-card-title">// capabilities</h3>
        </div>
        <div class="about-card-content">
          <div class="skills-list">
            ${a.skills.map(s => `
              <div class="skill-row">
                <div class="skill-row-name">${esc(s.name)}</div>
                <div class="skill-bar-track"><div class="skill-bar-fill" style="width:${s.value}%"></div></div>
                <div class="skill-pct">${s.value}%</div>
              </div>`).join('')}
          </div>
          ${a.techGroups.map(g => `
            <div class="tech-group">
              <div class="tech-group-label">${esc(g.label)}</div>
              <div class="tags">${g.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            </div>`).join('')}
        </div>
      </div>`;

    return `
      <section class="page-hero">
        <span class="page-label">// about</span>
        <h1>Studio-first craft for modern Minecraft products.</h1>
        <p class="page-copy">ZCraft Studios builds server systems, plugins, and web experiences for teams, communities, and creators. We combine design, performance, and polished delivery for commercial-grade releases.</p>
      </section>
      <div class="about-cards-grid">
        ${bioCard}
        ${skillsCard}
      </div>`;
  }

  function renderPortfolio(cfg) {
    const f = cfg.portfolio.featured;
    const featuredWindow = `
      <div class="window portfolio-window">
        <div class="window-bar">
          <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
          <span class="window-title"><span>~/</span>studio.featured</span>
        </div>
        <div class="window-body">
          <div class="portfolio-top">
            <div class="portfolio-img-side"><img class="portfolio-logo" src="${esc(f.logo)}" alt="${esc(f.title)}" /></div>
            <div class="portfolio-info">
              <h2 class="portfolio-title">${esc(f.title)}</h2>
              <p class="portfolio-desc">${esc(f.description)}</p>
              <div class="portfolio-nums">
                ${f.nums.map(n => `<div><div class="p-num-val">${esc(n.value)}</div><div class="p-num-lbl">${esc(n.label)}</div></div>`).join('')}
              </div>
            </div>
          </div>
          <div class="commissions-wrap">
            <div class="featured-label">// commissions open</div>
            <div class="commissions-grid-fluid">
              ${cfg.portfolio.commissions.map(c => `
                <div class="commission-card">
                  <div class="commission-title">${esc(c.title)}</div>
                  <div class="commission-desc">${esc(c.desc)}</div>
                </div>`).join('')}
            </div>
            <a class="link-sm" href="/contact">request a commission</a>
          </div>
        </div>
      </div>`;

    const projectsBox = windowBox(`<span>~/</span>projects.all`, `
      <div class="section-label">// all projects</div>
      <div class="projects-grid">${cfg.projects.map(projectCard).join('')}</div>
    `);

    const reviewsHTML = windowBox(`<span>~/</span>testimonials.log`, `
      <div class="section-label">// reviews</div>
      <div class="reviews-grid">${cfg.reviews.map(reviewCard).join('')}</div>
    `);

    return featuredWindow + projectsBox + reviewsHTML;
  }

  function renderResources(cfg) {
    const featured = cfg.resources.find(r => r.featured) || cfg.resources[0] || {};

    const featuredCard = `
      <div class="resource-featured-card">
        <div class="resource-featured-header">
          <div class="resource-featured-badge">${esc(featured.brand)} · ${esc(featured.status)}</div>
          <h2 class="resource-featured-title">${esc(featured.title)}</h2>
        </div>
        <div class="resource-featured-content">
          <p class="resource-featured-summary">${esc(featured.summary)}</p>
          ${featured.links?.[0] ? `<a class="btn btn-primary" href="${esc(featured.links[0].href)}">${esc(featured.links[0].label)}</a>` : ''}
        </div>
      </div>`;

    const resourceCards = cfg.resources.map((r, i) => resourceCard(r, i)).join('');

    return `
      <section class="page-hero">
        <span class="page-label">// resources</span>
        <h1>Tools, configs, and kits built for real servers.</h1>
        <p class="page-copy">A studio-grade toolkit for server operators and plugin teams. Every download is designed to ship fast and scale cleanly.</p>
      </section>
      <div class="resources-layout">
        ${featuredCard}
        <div class="resources-grid">
          ${resourceCards}
        </div>
      </div>`;
  }

  function renderContact(cfg) {
    const c = cfg.contact;

    const contactCards = `
      <div class="contact-cards-grid">
        <div class="contact-info-card">
          <div class="contact-info-header">
            <h3 class="contact-info-title">// contact info</h3>
          </div>
          <div class="contact-info-content">
            ${c.notes.map(n => `
              <div class="contact-note-item">
                <span class="contact-note-label">${esc(n.label)}</span>
                <strong class="contact-note-value">${esc(n.value)}</strong>
              </div>`).join('')}
          </div>
        </div>
        <a class="contact-primary-card" href="${esc(c.primary.href)}" target="_blank" rel="noopener">
          <div class="contact-primary-header">
            <span class="contact-primary-badge">${esc(c.primary.badge)}</span>
          </div>
          <div class="contact-primary-content">
            <span class="contact-primary-platform">${esc(c.primary.platform)}</span>
            <span class="contact-primary-handle">${esc(c.primary.handle)}</span>
            <span class="contact-primary-cta">${esc(c.primary.cta)}</span>
          </div>
        </a>
      </div>`;

    const platformCards = c.platforms.map(p => `
      <a class="contact-platform-card" href="${esc(p.href)}" ${/^https?:|^mailto:/.test(p.href)?'target="_blank" rel="noopener"':''}>
        <div class="contact-platform-icon">${esc(p.icon)}</div>
        <div class="contact-platform-content">
          <div class="contact-platform-name">${esc(p.platform)}</div>
          <div class="contact-platform-handle">${esc(p.handle)}</div>
          ${p.meta ? `<div class="contact-platform-meta">${esc(p.meta)}</div>` : ''}
        </div>
      </a>`).join('');

    return `
      <section class="page-hero">
        <span class="page-label">${esc(c.kicker)}</span>
        <h1>${esc(c.title)}</h1>
        <p class="page-copy">${esc(c.copy)}</p>
      </section>
      ${contactCards}
      <div class="contact-platforms-section">
        <h3 class="contact-platforms-title">// all channels</h3>
        <div class="contact-platforms-grid">
          ${platformCards}
        </div>
      </div>`;
  }

  function renderTeam(cfg) {
    // Group team members by level (higher level = higher in pyramid)
    const groupedByLevel = cfg.team.reduce((acc, member) => {
      const level = member.level || 0;
      if (!acc[level]) acc[level] = [];
      acc[level].push(member);
      return acc;
    }, {});

    // Sort levels from highest to lowest (999, 100, 0, etc.)
    const sortedLevels = Object.keys(groupedByLevel).sort((a, b) => parseInt(b) - parseInt(a));

    const pyramidRows = sortedLevels.map(level => {
      const members = groupedByLevel[level];
      const rowCards = members.map(member => {
        const tag = member.website ? 'a' : 'div';
        const href = member.website ? ` href="${esc(member.website)}" target="_blank" rel="noopener"` : '';
        return `
          <${tag} class="team-member-card" data-level="${level}"${href}>
            <div class="team-member-avatar">
              <img src="${esc(member.pfp)}" alt="${esc(member.name)}" loading="lazy" />
            </div>
            <div class="team-member-content">
              <h3 class="team-member-name">${esc(member.name)}</h3>
              <p class="team-member-role">${esc(member.role)}</p>
              <p class="team-member-bio">${esc(member.bio)}</p>
            </div>
          </${tag}>`;
      }).join('');

      return `<div class="team-pyramid-row" data-level="${level}">${rowCards}</div>`;
    }).join('');

    return `
      <section class="page-hero">
        <span class="page-label">// team</span>
        <h1>Built by a small but experienced studio crew.</h1>
        <p class="page-copy">Every release is reviewed, supported, and polished for real server environments. Meet the people who ship the experience.</p>
      </section>
      <div class="team-pyramid">
        ${pyramidRows}
      </div>`;
  }

  function renderNotFound(cfg) {
    const path = window.location.pathname + window.location.search;
    return `
      <div class="notfound-wrap">
        <div class="notfound-card">
          <div class="notfound-code">404</div>
          <h1 class="notfound-title">route not found</h1>
          <p class="notfound-copy">The page you tried to load doesn't exist on ${esc(cfg.site.name)}.</p>
          <pre class="notfound-trace">$ resolve ${esc(path)}
› status ........ 404
› reason ........ no matching route
› suggestion .... return to a known path below</pre>
          <div class="notfound-actions">
            <a class="btn btn-primary" href="/">go home</a>
            <a class="btn btn-ghost" href="/resources">view resources</a>
            <a class="btn btn-ghost" href="/contact">contact</a>
          </div>
        </div>
      </div>`;
  }

  const PAGES = { home: renderHome, about: renderAbout, portfolio: renderPortfolio, resources: renderResources, donate: renderDonate, thankyou: renderThankYou, contact: renderContact, team: renderTeam, notfound: renderNotFound };

  /* ---------- BOOT ---------- */

  fetch('/config/config.json?v=' + Date.now()).then(r => r.json()).then(cfg => {
    applySEO(cfg);
    const app = $('#app');
    const renderer = PAGES[pageKey] || renderHome;
    document.body.insertAdjacentHTML('afterbegin', topbar(cfg));
    app.innerHTML = renderer(cfg);
    document.body.insertAdjacentHTML('beforeend', footer(cfg));
    if (pageKey === 'resources') attachResourceDetailListeners(cfg.resources);
    if (pageKey === 'donate') initPayPalDonation();
    requestAnimationFrame(animateCounters);
  }).catch(err => {
    console.error('Failed to load config:', err);
    $('#app').innerHTML = '<div style="padding:48px;text-align:center;color:#ef4444">Failed to load site config.</div>';
  });
})();
