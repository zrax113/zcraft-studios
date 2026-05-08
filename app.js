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
    const file = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const current = file === '' ? 'index.html' : file;
    return `
      <header class="topbar">
        <div class="topbar-inner">
          <a class="topbar-logo" href="/index.html">${esc(cfg.site.name)}</a>
          <nav class="topbar-nav">
            ${cfg.nav.map(n => {
              const target = (n.href.split('/').pop() || 'index.html').toLowerCase();
              return `<a href="${esc(n.href)}" class="${target === current ? 'active' : ''}">${esc(n.label)}</a>`;
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

  function reviewCard(r) {
    return `
      <div class="review-card">
        <div class="review-head">
          <img class="review-avatar" src="${esc(r.avatar)}" alt="${esc(r.name)}" loading="lazy" />
          <div class="review-meta">
            <div class="review-name">${esc(r.name)}</div>
            <div class="review-handle">${esc(r.handle)}</div>
          </div>
          ${stars(Number(r.rating)||0)}
        </div>
        <p class="review-text">"${esc(r.text)}"</p>
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

    const bootBox = windowBox(`<span>~/</span>studio.boot`, `
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
      <a class="link-sm" href="/portfolio.html">view full portfolio</a>
    `);

    const ctaHTML = windowBox(`<span>~/</span>commission.open`, `
      <div class="cta-row">
        <div>
          <div class="section-label">// commissions open</div>
          <h2 class="cta-title">have something to ship?</h2>
          <p class="cta-copy">Plugins, server setups, and web work — built fast, polished, and production-ready.</p>
        </div>
        <div class="cta-actions">
          <a class="btn btn-primary" href="/contact.html">start a project</a>
          <a class="btn btn-ghost" href="/resources.html">browse resources</a>
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

    const bioBox = windowBox(`<span>~/</span>about.me`, `
      <div class="section-label">// who am i</div>
      <pre class="about-bio">${bioHL}</pre>
    `);

    const skillsHTML = `
      <div class="section-label">// skills</div>
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
    `;

    const skillsBox = windowBox(`<span>~/</span>stack.json`, skillsHTML);

    return `
      <section class="hero" style="padding:32px 0 16px">
        <div class="contact-kicker">// about</div>
        <h1 class="contact-title" style="max-width:none">about ${esc(cfg.site.author)}</h1>
        <p class="contact-copy">${esc(cfg.site.tagline)}</p>
      </section>
      ${statsRow(cfg.stats)}
      <div class="about-grid">${bioBox}${skillsBox}</div>
    `;
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
            <a class="link-sm" href="/contact.html">request a commission</a>
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
    const intro = `
      <section class="hero" style="padding:32px 0 16px">
        <div class="contact-kicker">// resources</div>
        <h1 class="contact-title" style="max-width:none">free & premium drops.</h1>
        <p class="contact-copy">Tools, configs, and templates I use across every ZCraft project. All free unless noted.</p>
      </section>`;
    const grid = windowBox(`<span>~/</span>resources.index`, `
      <div class="section-label">// downloads</div>
      <div class="projects-grid">${cfg.resources.map(projectCard).join('')}</div>
    `);
    return intro + grid;
  }

  function renderContact(cfg) {
    const c = cfg.contact;
    const shell = `
      <section class="contact-shell">
        <div class="contact-lead">
          <div class="contact-kicker">${esc(c.kicker)}</div>
          <h1 class="contact-title">${esc(c.title)}</h1>
          <p class="contact-copy">${esc(c.copy)}</p>
          <div class="contact-notes">
            ${c.notes.map(n => `
              <div class="contact-note-card">
                <span class="contact-note-label">${esc(n.label)}</span>
                <strong>${esc(n.value)}</strong>
              </div>`).join('')}
          </div>
        </div>
        <a class="contact-primary-card" href="${esc(c.primary.href)}" target="_blank" rel="noopener">
          <span class="contact-primary-badge">${esc(c.primary.badge)}</span>
          <span class="contact-primary-platform">${esc(c.primary.platform)}</span>
          <span class="contact-primary-handle">${esc(c.primary.handle)}</span>
          <span class="contact-primary-cta">${esc(c.primary.cta)}</span>
        </a>
      </section>`;

    const platforms = windowBox(`<span>~/</span>contact.channels`, `
      <div class="section-label">// all channels</div>
      <div class="contact-grid-fluid">
        ${c.platforms.map(p => `
          <a class="contact-item" href="${esc(p.href)}" ${/^https?:|^mailto:/.test(p.href)?'target="_blank" rel="noopener"':''}>
            <div class="contact-icon">${esc(p.icon)}</div>
            <div>
              <div class="contact-text-platform">${esc(p.platform)}</div>
              <div class="contact-text-handle">${esc(p.handle)}</div>
              ${p.meta ? `<div class="contact-text-meta">${esc(p.meta)}</div>` : ''}
            </div>
          </a>`).join('')}
      </div>
    `);

    return shell + '<div style="height:24px"></div>' + platforms;
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
            <a class="btn btn-primary" href="/index.html">go home</a>
            <a class="btn btn-ghost" href="/portfolio.html">view portfolio</a>
            <a class="btn btn-ghost" href="/contact.html">contact</a>
          </div>
        </div>
      </div>`;
  }

  const PAGES = { home: renderHome, about: renderAbout, portfolio: renderPortfolio, resources: renderResources, contact: renderContact, notfound: renderNotFound };

  /* ---------- BOOT ---------- */

  fetch('/config.json').then(r => r.json()).then(cfg => {
    applySEO(cfg);
    const app = $('#app');
    const renderer = PAGES[pageKey] || renderHome;
    document.body.insertAdjacentHTML('afterbegin', topbar(cfg));
    app.innerHTML = renderer(cfg);
    document.body.insertAdjacentHTML('beforeend', footer(cfg));
    requestAnimationFrame(animateCounters);
  }).catch(err => {
    console.error('Failed to load config:', err);
    $('#app').innerHTML = '<div style="padding:48px;text-align:center;color:#ef4444">Failed to load site config.</div>';
  });
})();
