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
  const cleanBaseUrl = (url) => String(url || '').replace(/\/+$/, '');
  const absoluteUrl = (baseUrl, value) => {
    if (!value) return baseUrl + '/';
    if (/^https?:\/\//i.test(value)) return value;
    const path = String(value).startsWith('/') ? value : `/${value}`;
    return baseUrl + path;
  };
  const pageLabel = (cfg, key, seo) => {
    const navItem = (cfg.nav || []).find(n => (n.href || '/').replace(/\/+$/, '') === (seo.canonical || '/').replace(/\/+$/, ''));
    return navItem?.label || (key === 'notfound' ? '404' : key);
  };
  const titleCase = (value) => String(value || '').replace(/\b\w/g, c => c.toUpperCase());
  const getPageSeo = (cfg) => cfg.seo[pageKey] || cfg.seo.home;
  const breadcrumbItemsForPage = (cfg, seo) => {
    const baseUrl = cleanBaseUrl(cfg.site.domain);
    const items = [{
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl + '/'
    }];

    if (pageKey !== 'home') {
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: titleCase(pageLabel(cfg, pageKey, seo)),
        item: absoluteUrl(baseUrl, seo.canonical)
      });
    }

    return items;
  };

  function applySEO(cfg) {
    const seo = getPageSeo(cfg);
    const baseUrl = cleanBaseUrl(cfg.site.domain);
    const pageUrl = absoluteUrl(baseUrl, seo.canonical);
    const socialImage = absoluteUrl(baseUrl, seo.image || cfg.branding.ogImage);
    const imageAlt = seo.imageAlt || `${cfg.site.name} brand artwork`;
    document.title = seo.title;
    
    const meta = (name, content, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const link = (rel, href, extra = {}) => {
      const selector =
        `link[rel="${rel}"]` +
        (extra.hreflang ? `[hreflang="${extra.hreflang}"]` : '') +
        (extra.type ? `[type="${extra.type}"]` : '') +
        (extra.title ? `[title="${extra.title}"]` : '');
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        if (extra.hreflang) el.hreflang = extra.hreflang;
        document.head.appendChild(el);
      }
      el.href = href;
      Object.entries(extra).forEach(([key, value]) => {
        if (key !== 'hreflang' && value != null) el.setAttribute(key, value);
      });
    };
    
    // Essential meta tags
    meta('description', seo.description);
    if (seo.keywords) meta('keywords', seo.keywords);
    meta('author', cfg.site.author);
    meta('application-name', cfg.site.name);
    meta('generator', cfg.site.name);
    meta('referrer', 'strict-origin-when-cross-origin');
    meta('color-scheme', 'dark');
    meta('theme-color', cfg.branding.themeColor);
    meta('viewport', 'width=device-width, initial-scale=1, maximum-scale=5', 'name');
    meta('robots', seo.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    meta('googlebot', seo.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    
    // Open Graph tags
    meta('og:title', seo.title, 'property');
    meta('og:description', seo.description, 'property');
    meta('og:type', 'website', 'property');
    meta('og:image', socialImage, 'property');
    meta('og:image:secure_url', socialImage, 'property');
    meta('og:image:alt', imageAlt, 'property');
    meta('og:url', pageUrl, 'property');
    meta('og:site_name', cfg.site.name, 'property');
    meta('og:locale', 'en_US', 'property');
    
    // Twitter Card tags
    meta('twitter:card', 'summary_large_image');
    meta('twitter:title', seo.title);
    meta('twitter:description', seo.description);
    meta('twitter:image', socialImage);
    meta('twitter:image:alt', imageAlt);
    meta('twitter:site', '@zraxgaming');
    meta('twitter:creator', '@zraxgaming');
    
    // Additional SEO meta tags
    meta('mobile-web-app-capable', 'yes');
    meta('apple-mobile-web-app-capable', 'yes');
    meta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    meta('apple-mobile-web-app-title', cfg.site.name);
    meta('format-detection', 'telephone=no');
    // Reduce aggressive browser caching for faster preview after deployments
    meta('Cache-Control', 'no-cache, no-store, must-revalidate', 'http-equiv');
    meta('Pragma', 'no-cache', 'http-equiv');
    meta('Expires', '0', 'http-equiv');
    
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = pageUrl;
    link('alternate', pageUrl, { hreflang: 'en' });
    link('alternate', pageUrl, { hreflang: 'x-default' });
    link('alternate', baseUrl + '/site-index.json', { type: 'application/json', title: 'Full generated site index JSON' });
    link('alternate', baseUrl + '/ai-overview.json', { type: 'application/json', title: 'Compact AI overview JSON' });
    link('alternate', baseUrl + '/ai.txt', { type: 'text/plain', title: 'Plain-text AI overview' });

    let fav = document.querySelector('link[rel="icon"]');
    if (!fav) { fav = document.createElement('link'); fav.rel = 'icon'; document.head.appendChild(fav); }
    fav.href = cfg.branding.favicon;

    let apple = document.querySelector('link[rel="apple-touch-icon"]');
    if (!apple) { apple = document.createElement('link'); apple.rel = 'apple-touch-icon'; document.head.appendChild(apple); }
    apple.href = cfg.branding.favicon;

    applySchema(cfg);
  }

  function applySchema(cfg) {
    const seo = getPageSeo(cfg);
    const baseUrl = cleanBaseUrl(cfg.site.domain);
    const pageUrl = absoluteUrl(baseUrl, seo.canonical);
    const breadcrumbItems = breadcrumbItemsForPage(cfg, seo);

    const sameAs = (cfg.contact?.platforms || [])
      .filter(p => /^https?:\/\//.test(p.href))
      .map(p => p.href);

    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: cfg.site.name,
          url: baseUrl,
          logo: cfg.branding.logo,
          image: cfg.branding.logo,
          description: cfg.site.tagline,
          sameAs,
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            email: cfg.contact?.platforms?.find(p => p.platform === 'email')?.handle || 'contact@z-craft.xyz',
            url: cfg.contact?.primary?.href || baseUrl + '/contact'
          },
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'AE'
          }
        },
        {
          '@type': 'WebSite',
          '@id': baseUrl + '#website',
          url: baseUrl,
          name: cfg.site.name,
          description: cfg.site.tagline,
          potentialAction: {
            '@type': 'SearchAction',
            target: baseUrl + '/?s={search_term_string}',
            'query-input': 'required name=search_term_string'
          },
          publisher: { '@type': 'Organization', name: cfg.site.name }
        },
        {
          '@type': 'WebPage',
          '@id': pageUrl + '#webpage',
          url: pageUrl,
          name: seo.title,
          description: seo.description,
          isPartOf: { '@type': 'WebSite', '@id': baseUrl + '#website', url: baseUrl, name: cfg.site.name },
          about: { '@type': 'Organization', name: cfg.site.name },
          breadcrumb: { '@id': pageUrl + '#breadcrumb' },
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: absoluteUrl(baseUrl, seo.image || cfg.branding.ogImage)
          }
        },
        {
          '@type': 'BreadcrumbList',
          '@id': pageUrl + '#breadcrumb',
          itemListElement: breadcrumbItems
        },
        {
          '@type': 'LocalBusiness',
          name: cfg.site.name,
          image: cfg.branding.logo,
          description: cfg.site.tagline,
          url: baseUrl,
          telephone: cfg.contact?.platforms?.find(p => p.platform === 'email')?.handle || '+971-contact',
          email: cfg.contact?.platforms?.find(p => p.platform === 'email')?.handle || 'contact@z-craft.xyz',
          sameAs
        }
      ]
    };

    if (pageKey === 'resources' && cfg.resources?.length) {
      schema['@graph'].push({
        '@type': 'ItemList',
        name: 'ZCraft Studios resources',
        itemListElement: cfg.resources.map((resource, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'CreativeWork',
            name: resource.title,
            description: resource.summary,
            image: absoluteUrl(baseUrl, resource.image),
            url: resource.links?.[0]?.href || pageUrl,
            keywords: (resource.tags || []).join(', ')
          }
        }))
      });
    }

    let script = document.querySelector('script[data-schema="jsonld"]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.schema = 'jsonld';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }

  function initTopbarToggle() {
    const toggle = document.querySelector('.topbar-menu-toggle');
    const nav = document.querySelector('.topbar-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      nav.classList.toggle('open', !isOpen);
    });
  }

  function topbar(cfg, currentPageKey) {
    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    const seo = getPageSeo(cfg);
    const crumbLabel = pageLabel(cfg, currentPageKey, seo);
    const breadcrumb = currentPageKey !== 'home' ? `
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><a href="/">home</a></li>
            <li aria-hidden="true" class="breadcrumb-sep">/</li>
            <li><a href="${esc(seo.canonical)}" aria-current="page">${esc(crumbLabel)}</a></li>
          </ol>
        </nav>` : '';

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
        ${breadcrumb}
      </header>`;
  }

  function footer(cfg) {
    return `
      <footer>
        <div class="footer-inner">
          <div class="footer-left"><span>// </span>${esc(cfg.footer.left)} · ${cfg.site.year}</div>
          <div class="footer-links">
            ${cfg.footer.links.map(l => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}
            <a class="topbar-link" href="/ai-agents" title="AI agent site guide">AI Guide</a>
            <a class="topbar-link" href="/site-index.json" title="Site JSON index">Site JSON</a>
          </div>
        </div>
      </footer>`;
  }

  function renderMaintenanceBanner(cfg, pageKey) {
    const maintenance = cfg.maintenance || {};
    const pageConfig = (maintenance.pages && maintenance.pages[pageKey]) || {};
    const title = pageConfig.title || maintenance.title || 'Site maintenance in progress';
    const message = pageConfig.message || maintenance.message || 'The site is temporarily unavailable while we make improvements.';
    // Single-line banner: concise title + message
    return `
      <div class="maintenance-banner">
        <div class="maintenance-banner-content">
          <div class="maintenance-banner-text">${esc(title)} — ${esc(message)}</div>
          <div class="maintenance-banner-support"><a href="/contact">Contact</a> · <a href="https://discord.gg/zcraft" target="_blank">Discord</a></div>
        </div>
      </div>`;
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
    return `
      <article class="resource-card" data-resource-index="${index}">
        <img class="resource-card-image" src="${esc(r.image)}" alt="${esc(r.title)}" loading="lazy" />
        <div class="resource-card-body">
          <div class="resource-card-header">
            <span class="resource-card-brand">${esc(r.brand || r.category || '')}</span>
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

  function postDiscordRequest(webhookUrl, webhookBody) {
    if (!webhookUrl) {
      return Promise.reject(new Error('Discord webhook is not configured. Add the webhook URL to config/info.json.'));
    }

    // Try a normal JSON POST first (best-case). If it fails (CORS), fall back
    // to a form encoded `payload_json` POST with `mode: 'no-cors'` so browser
    // requests can still reach Discord in constrained environments.
    const tryJson = () => fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookBody)
    }).then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`Discord webhook failed (${response.status}): ${text || response.statusText}`);
        });
      }
      return response;
    });

    const tryNoCors = () => {
      const form = new URLSearchParams();
      form.set('payload_json', JSON.stringify(webhookBody));
      return fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        mode: 'no-cors',
        body: form.toString()
      });
    };

    return tryJson().catch(err => {
      console.warn('JSON webhook failed, falling back to no-cors form POST', err);
      return tryNoCors();
    });
  }

  function initRequestForm(cfg) {
    const form = document.getElementById('request-form');
    const statusBox = document.getElementById('request-status');
    const page = cfg.request || {};
    const fields = page.form?.fields || [];
    if (!form || !statusBox) return;

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const formData = new FormData(form);
      const values = Object.fromEntries(formData.entries());
      const requiredMissing = fields.filter(f => f.required).some(f => !String(values[f.id] || '').trim());
      if (requiredMissing) {
        statusBox.textContent = 'Please complete all required fields before sending your request.';
        statusBox.style.color = '#f87171';
        return;
      }

      statusBox.textContent = page.form?.statusSending || 'Sending request...';
      statusBox.style.color = 'var(--text)';

      // Build the embed payload using the improved structure
      const description = values['request-description'] || 'No description provided.';
      const embeds = [{
        title: 'New Project Request',
        description: 'A new custom request was submitted from the website.',
        color: 5793266,
        author: { name: cfg.site?.name || 'ZCraft Studios', url: cfg.site?.domain || undefined },
        thumbnail: { url: cfg.branding?.logo || undefined },
        fields: [
          {
            name: 'Client Details',
            value: `> **Discord**\n> ${values['request-discord'] || 'Not provided'}\n\n> **Email**\n> ${values['request-email'] || 'Not provided'}`,
            inline: false
          },
          { name: 'Service', value: `\`${values['request-service'] || 'Not provided'}\``, inline: true },
          { name: 'Platform', value: `\`${values['request-platform'] || 'Not provided'}\``, inline: true },
          { name: 'Budget', value: `\`${values['request-price'] || 'Not provided'}\``, inline: true },
          { name: 'Timeline', value: `\`${values['request-timeline'] || 'Not provided'}\``, inline: true },
          { name: 'Project Brief', value: description, inline: false },
          { name: 'Reference', value: values['request-reference'] || 'No reference link provided.', inline: false }
        ],
        footer: { text: 'Website Request Form' },
        timestamp: new Date().toISOString()
      }];

      postDiscordRequest(cfg?.webhook?.discord?.request, { content: null, embeds }).then(() => {
        statusBox.textContent = page.form?.statusSuccess || 'Request submitted. We will review it and follow up shortly.';
        statusBox.style.color = 'var(--success)';
        form.reset();
      }).catch(err => {
        console.error('Webhook error', err);
        statusBox.textContent = page.form?.statusError || 'Could not send the request right now. Please contact us directly.';
        statusBox.style.color = '#f87171';
      });
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
        <h1>Support ZCraft Studios</h1>
        <p class="page-copy">Help us keep building premium Minecraft resources, plugins, and modern web experiences.</p>
      </section>
      <div class="donate-container">
        <div class="donate-hero">
          <div class="donate-hero-content">
            <h2>Your support powers our mission</h2>
            <p>Every donation directly funds development, infrastructure, and new features. No middlemen, pure impact.</p>
            <div class="donate-stats">
              <div class="donate-stat">
                <div class="stat-value">5+</div>
                <div class="stat-label">Projects shipped</div>
              </div>
              <div class="donate-stat">
                <div class="stat-value">20+</div>
                <div class="stat-label">Happy clients</div>
              </div>
              <div class="donate-stat">
                <div class="stat-value">99%</div>
                <div class="stat-label">Satisfaction</div>
              </div>
            </div>
          </div>
          <img src="${esc(cfg.branding.favicon)}" alt="Support ZCraft" class="donate-hero-img" />
        </div>
        <div class="donate-form-section">
          <div class="donate-form-card">
            <div class="donate-form-header">
              <h3>Make a Donation</h3>
              <p>Choose your amount and complete securely through PayPal</p>
            </div>
            <div class="donation-field">
              <label for="donation-amount">Donation Amount</label>
              <div class="amount-input-wrapper">
                <input id="donation-amount" type="number" min="1" step="1" value="10" />
                <span class="amount-suffix">$</span>
              </div>
            </div>
            <div id="paypal-button-container" class="paypal-container"></div>
            <p class="donate-security">🔒 Secure • Processed by PayPal • 100% Safe</p>
          </div>
          <div class="donate-benefits">
            <h4>What Happens Next</h4>
            <div class="benefits-list">
              <div class="benefit">
                <span class="benefit-num">1</span>
                <div><strong>Enter your amount</strong><p>Select a donation that feels right for you.</p></div>
              </div>
              <div class="benefit">
                <span class="benefit-num">2</span>
                <div><strong>Complete checkout</strong><p>Pay securely through PayPal using the button below.</p></div>
              </div>
              <div class="benefit">
                <span class="benefit-num">3</span>
                <div><strong>Receive confirmation</strong><p>You will be redirected to a thank-you page after payment.</p></div>
              </div>
              <div class="benefit">
                <span class="benefit-num">4</span>
                <div><strong>Support the studio</strong><p>Your donation helps keep the site and projects running.</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderThankYou(cfg) {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const isSuccess = status === 'success';
    
    return `
      <section class="page-hero">
        <span class="page-label">// gratitude</span>
        <h1>${isSuccess ? 'Payment Confirmed' : 'Thank You'}</h1>
        <p class="page-copy">${isSuccess ? 'Your generosity keeps us building amazing things.' : 'Thank you for your interest in supporting us.'}</p>
      </section>
      <div class="thankyou-container">
        <div class="thankyou-card">
          <div class="thankyou-success-container">
            <div class="success-checkmark-wrapper">
              <svg class="success-checkmark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle class="success-circle" cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="3"/>
                <path class="success-check" d="M 30 50 L 45 65 L 70 35" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h2 class="thankyou-title">${isSuccess ? 'Payment Received!' : 'Payment Received!'}</h2>
            <p class="thankyou-subtitle">${isSuccess ? 'Thank you for your support' : 'Your request has been proccessed'}</p>
          </div>
          
          <div class="thankyou-content">
            <div class="thankyou-details">
              <div class="detail-group">
                <h4>Your Impact</h4>
                <p>Your donation directly supports our mission to deliver premium Minecraft resources and tools to the community.</p>
              </div>
              <div class="thankyou-actions">
                <a class="btn btn-primary" href="/">Explore Our Work</a>
                <a class="btn btn-ghost" href="/resources">View Resources</a>
                ${isSuccess ? '<a class="btn btn-ghost" href="/donate">Donate Again</a>' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }


  function renderFormField(field) {
    const label = esc(field.label || 'Field');
    const placeholder = esc(field.placeholder || 'Enter a value');
    const hint = field.hint ? `<span class="form-hint">${esc(field.hint)}</span>` : '';
    if (field.type === 'textarea') {
      return `
        <div class="form-group">
          <label for="${esc(field.id)}">${label}</label>
          <textarea id="${esc(field.id)}" name="${esc(field.id)}" rows="6" placeholder="${placeholder}" ${field.required ? 'required' : ''}></textarea>
          ${hint}
        </div>`;
    }
    if (field.type === 'select' && Array.isArray(field.options)) {
      // Use an input + datalist for a modern, editable select experience
      const listId = esc(field.id) + '-list';
      return `
        <div class="form-group">
          <label for="${esc(field.id)}">${label}</label>
          <input id="${esc(field.id)}" name="${esc(field.id)}" list="${listId}" placeholder="${placeholder}" ${field.required ? 'required' : ''} />
          <datalist id="${listId}">
            ${field.options.map(opt => `<option value="${esc(opt)}">`).join('')}
          </datalist>
          ${hint}
        </div>`;
    }
    return `
      <div class="form-group">
        <label for="${esc(field.id)}">${label}</label>
        <input id="${esc(field.id)}" name="${esc(field.id)}" type="${esc(field.type || 'text')}" placeholder="${placeholder}" ${field.required ? 'required' : ''} />
        ${hint}
      </div>`;
  }

  function renderRequest(cfg) {
    const page = cfg.request || {};
    const services = page.services || [];
    const nextSteps = page.nextSteps || [];

    const fieldInputs = (page.form?.fields || []).map(renderFormField).join('');
    const serviceItems = services.map(s => `
      <div class="service-item">
        <div class="service-icon">${esc(s.icon)}</div>
        <div class="service-info">
          <h5>${esc(s.title)}</h5>
          <p>${esc(s.desc)}</p>
        </div>
      </div>`).join('');

    const nextStepsHtml = nextSteps.length ? `
      <div class="request-next-steps">
        <h3>What happens next</h3>
        <ol>
          ${nextSteps.map(step => `<li>${esc(step)}</li>`).join('')}
        </ol>
      </div>` : '';

    return `
      <section class="page-hero">
        <span class="page-label">${esc(page.label || '// commission')}</span>
        <h1>${esc(page.title || 'Request a Custom Service')}</h1>
        <p class="page-copy">${esc(page.copy || "Tell us what you need. We'll respond within 24 hours with a quote and timeline.")}</p>
      </section>
      <div class="request-container">
        <div class="request-layout">
          <div class="request-form-side">
            <div class="request-form-card">
              <div class="request-form-header">
                <h3>${esc(page.form?.headerTitle || 'Submit Your Request')}</h3>
                <p>${esc(page.form?.headerCopy || "Let's build something amazing together")}</p>
              </div>
              <form id="request-form" class="request-form">
                ${fieldInputs}
                <button class="btn btn-primary" type="submit" style="width:100%">${esc(page.form?.buttonLabel || 'Send Request')}</button>
                <div id="request-status" class="request-status"></div>
              </form>
            </div>
          </div>

          <div class="request-info-side">
            <div class="request-services">
              <h3>${esc(page.servicesTitle || 'What We Build')}</h3>
              <div class="service-list">
                ${serviceItems}
              </div>
            </div>
            ${nextStepsHtml}
            <div class="request-cta">
              <h4>${esc(page.ctaTitle || 'Quick Response')}</h4>
              <p>${(page.ctaPoints || ['24-hour turnaround on quotes','Transparent pricing','Production-ready code']).map(p => `✓ ${esc(p)}`).join('<br>')}</p>
            </div>
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
    const page = cfg.resourcesPage || {};
    const resources = cfg.resources || [];
    const featured = resources.find(r => r.featured) || resources[0] || null;
    const categories = [...new Set(resources.map(r => r.category).filter(Boolean))];
    const resourceCards = resources
      .map((resource, index) => ({ resource, index }))
      .filter(item => item.resource !== featured)
      .map(item => resourceCard(item.resource, item.index))
      .join('');

    const featuredCard = featured ? `
      <article class="resource-featured-banner">
        <img class="resource-featured-image" src="${esc(featured.image)}" alt="${esc(featured.title)}" loading="lazy" />
        <div class="resource-featured-copy">
          <span class="resource-featured-badge">${esc(featured.brand)} · ${esc(featured.status)}</span>
          <h2 class="resource-featured-title">${esc(featured.title)}</h2>
          <p class="resource-featured-summary">${esc(featured.summary)}</p>
          <div class="tag-list">${(featured.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          ${featured.links?.[0] ? `<a class="btn btn-primary" href="${esc(featured.links[0].href)}" target="_blank" rel="noopener">${esc(featured.links[0].label)}</a>` : ''}
        </div>
      </article>` : '';

    const categoryList = categories.length ? `<div class="resources-categories">${categories.map(c => `<span class="category-pill">${esc(c)}</span>`).join('')}</div>` : '';
    const introCopy = esc(page.copy || 'A studio-grade toolkit for server operators and plugin teams. Every download is designed to ship fast and scale cleanly.');

    return `
      <section class="page-hero">
        <span class="page-label">${esc(page.label || '// resources')}</span>
        <h1>${esc(page.title || 'Tools, configs, and kits built for real servers.')}</h1>
        <p class="page-copy">${introCopy}</p>
      </section>
      <div class="resources-layout">
        ${featuredCard}
        <div class="resources-intro-row">
          ${categoryList}
        </div>
        <div class="resources-grid">
          ${resourceCards || '<div class="resource-empty">No resources available yet.</div>'}
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
      <div class="contact-cta-row">
        <a class="btn btn-primary" href="/request">request custom service</a>
      </div>
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

  function renderAgents(cfg) {
    const baseUrl = cleanBaseUrl(cfg.site.domain);
    const seoEntries = Object.entries(cfg.seo || {})
      .filter(([, seo]) => !seo.noindex)
      .map(([key, seo]) => ({
        key,
        title: seo.title,
        description: seo.description,
        url: absoluteUrl(baseUrl, seo.canonical)
      }));
    const productCount = cfg.projects?.length || 0;
    const resourceCount = cfg.resources?.length || 0;
    const categories = [...new Set([...(cfg.projects || []), ...(cfg.resources || [])].map(item => item.category).filter(Boolean))];
    const featured = (cfg.resources || []).filter(item => item.featured).slice(0, 4);

    return `
      <section class="page-hero">
        <span class="page-label">// ai agent guide</span>
        <h1>Structured context for crawlers, search engines, and AI agents.</h1>
        <p class="page-copy">This page summarizes ZCraft Studios and links to the canonical machine-readable files that are generated from the site's config and product data.</p>
      </section>
      <div class="agents-layout">
        <section class="agents-panel">
          <h2>Site identity</h2>
          <dl class="agents-facts">
            <div><dt>Name</dt><dd>${esc(cfg.site.name)}</dd></div>
            <div><dt>Canonical domain</dt><dd><a href="${esc(baseUrl)}">${esc(baseUrl)}</a></dd></div>
            <div><dt>Summary</dt><dd>${esc(cfg.site.tagline)}</dd></div>
            <div><dt>Primary topics</dt><dd>Minecraft plugins, server configs, Discord bots, web tools, commissioned development.</dd></div>
            <div><dt>Inventory</dt><dd>${productCount} projects and ${resourceCount} resources across ${categories.length || 0} categories.</dd></div>
          </dl>
        </section>

        <section class="agents-panel">
          <h2>Machine-readable sources</h2>
          <div class="agents-links">
            <a href="/site-index.json">Live generated site index JSON</a>
            <a href="/sitemap.xml">XML sitemap</a>
            <a href="/llms.txt">LLMS discovery file</a>
            <a href="/config/info.json">Site config JSON</a>
            <a href="/config/products.json">Products and resources JSON</a>
            <a href="/config/reviews.json">Reviews JSON</a>
          </div>
        </section>

        <section class="agents-panel">
          <h2>Canonical pages</h2>
          <div class="agents-page-list">
            ${seoEntries.map(page => `
              <article class="agents-page-item">
                <a href="${esc(page.url)}">${esc(page.title)}</a>
                <p>${esc(page.description)}</p>
              </article>
            `).join('')}
          </div>
        </section>

        <section class="agents-panel">
          <h2>Featured resources</h2>
          <div class="agents-resource-list">
            ${featured.map(resource => `
              <article class="agents-resource-item">
                <strong>${esc(resource.title)}</strong>
                <span>${esc(resource.category || resource.brand || 'resource')} · ${esc(resource.status || 'available')}</span>
                <p>${esc(resource.summary)}</p>
              </article>
            `).join('') || '<p class="page-copy">No featured resources are currently configured.</p>'}
          </div>
        </section>
      </div>`;
  }

  function renderMaintenance(cfg, pageKey) {
    const maintenance = cfg.maintenance || {};
    const pageConfig = (maintenance.pages && maintenance.pages[pageKey]) || {};
    const title = pageConfig.title || maintenance.title || 'Site maintenance in progress';
    const message = pageConfig.message || maintenance.message || 'The site is temporarily unavailable while we make improvements.';
    const promoTitle = pageConfig.promoTitle || maintenance.promoTitle;
    const promoText = pageConfig.promoText || maintenance.promoText;
    return `
      <section class="page-hero">
        <span class="page-label">// maintenance</span>
        <h1>${esc(title)}</h1>
        <p class="page-copy">${esc(message)}</p>
      </section>
      <div class="maintenance-card">
        ${promoTitle ? `<div class="maintenance-promo"><h3>${esc(promoTitle)}</h3><p>${esc(promoText)}</p></div>` : ''}
        <div class="maintenance-note">If you need urgent support, use the contact page or Discord.</div>
      </div>`;
  }

  function isMaintenanceActive(cfg, pageKey) {
    const maintenance = cfg.maintenance || {};
    if (!maintenance.enabled) return false;
    if (maintenance.global) return true;
    return maintenance.pages && maintenance.pages[pageKey] && maintenance.pages[pageKey].enabled;
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

  const PAGES = { home: renderHome, about: renderAbout, portfolio: renderPortfolio, resources: renderResources, agents: renderAgents, donate: renderDonate, thankyou: renderThankYou, request: renderRequest, contact: renderContact, team: renderTeam, notfound: renderNotFound };

  /* ---------- BOOT ---------- */

  function buildConfigPaths(basePath) {
    const path = document.location.pathname;
    const currentDir = path.endsWith('/') ? path : path.replace(/\/[^\/]*$/, '/');
    const candidates = [
      `${document.location.origin}/config/${basePath}`,
      `/config/${basePath}`,
      `config/${basePath}`,
      `./config/${basePath}`,
      `../config/${basePath}`,
      `../../config/${basePath}`,
      `../../../config/${basePath}`,
      `${currentDir}config/${basePath}`
    ];
    if (path.startsWith('/pages/') || path === '/pages') {
      candidates.push(
        `${document.location.origin}/pages/config/${basePath}`,
        `/pages/config/${basePath}`,
        `pages/config/${basePath}`,
        `../pages/config/${basePath}`
      );
    }
    return [...new Set(candidates.filter(Boolean))];
  }

  function tryFetchJson(paths) {
    const t = Date.now();
    let lastErr = null;
    const tryOne = async (p) => {
      try {
        const url = p + (p.includes('?') ? '&' : '?') + 'v=' + t;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url} ${res.status}`);
        return await res.json();
      } catch (e) {
        lastErr = e;
        return null;
      }
    };
    return (async () => {
      for (const p of paths) {
        const json = await tryOne(p);
        if (json) return json;
      }
      throw lastErr || new Error('Could not load JSON');
    })();
  }

  Promise.all([
    tryFetchJson(buildConfigPaths('info.json')),
    tryFetchJson(buildConfigPaths('products.json')),
    tryFetchJson(buildConfigPaths('reviews.json'))
  ]).then(([info, products, reviews]) => {
    const cfg = {
      ...info,
      projects: products.projects || [],
      resources: products.resources || [],
      reviews: reviews.reviews || []
    };
    applySEO(cfg);
    const app = $('#app');
    const renderer = PAGES[pageKey] || renderHome;
    document.body.insertAdjacentHTML('afterbegin', topbar(cfg, pageKey));
    initTopbarToggle();
    if (isMaintenanceActive(cfg, pageKey)) {
      const topbarEl = document.querySelector('.topbar');
      if (topbarEl) topbarEl.insertAdjacentHTML('afterend', renderMaintenanceBanner(cfg, pageKey));
    }
    app.innerHTML = renderer(cfg);
    document.body.insertAdjacentHTML('beforeend', footer(cfg));
    if (pageKey === 'resources') attachResourceDetailListeners(cfg.resources);
    if (pageKey === 'donate') initPayPalDonation();
    if (pageKey === 'request' && !isMaintenanceActive(cfg, pageKey)) initRequestForm(cfg);
    requestAnimationFrame(animateCounters);
  }).catch(err => {
    console.error('Failed to load config:', err);
    $('#app').innerHTML = '<div style="padding:48px;text-align:center;color:#ef4444">Failed to load site config.</div>';
  });
})();
