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

  const bodyPageKey = document.body.getAttribute('data-page') || 'home';
  const routePath = window.location.pathname.replace(/\/+$/, '');
  const pageKey = (() => {
    if (bodyPageKey === 'resources' && /^\/resources\/[^/]+/i.test(routePath)) return 'resource-detail';
    if (bodyPageKey === 'blogs' && /^\/blogs\/[^/]+/i.test(routePath)) return 'blog-detail';
    return bodyPageKey;
  })();
  const currentSlug = () => decodeURIComponent((window.location.pathname.replace(/\/+$/, '').split('/').pop() || '').trim().replace(/\.html$/i, ''));
  const slugify = (value) => String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const resourceSlug = (resource) => resource.slug || slugify(resource.title);
  const blogSlug = (post) => post.slug || slugify(post.title);
  const legalSlug = (page) => page.slug || slugify(page.title);
  const cleanBaseUrl = (url) => String(url || '').replace(/\/+$/, '');
  const absoluteUrl = (baseUrl, value) => {
    if (!value) return baseUrl + '/';
    if (/^https?:\/\//i.test(value)) return value;
    const path = String(value).startsWith('/') ? value : `/${value}`;
    return baseUrl + path;
  };
  const pageLabel = (cfg, key, seo) => {
    if (key === 'resource-detail') return findResourceBySlug(cfg)?.title || 'resource';
    if (key === 'blog-detail') return findBlogPostBySlug(cfg)?.title || 'blog';
    if (key === 'legal-detail') return findLegalPageBySlug(cfg)?.title || 'legal';
    const navItem = (cfg.nav || []).find(n => (n.href || '/').replace(/\/+$/, '') === (seo.canonical || '/').replace(/\/+$/, ''));
    return navItem?.label || (key === 'notfound' ? '404' : key);
  };
  const titleCase = (value) => String(value || '').replace(/\b\w/g, c => c.toUpperCase());
  const findResourceBySlug = (cfg, slug = currentSlug()) => (cfg.resources || []).find(resource => resourceSlug(resource) === slug);
  const findBlogPostBySlug = (cfg, slug = currentSlug()) => (cfg.blogPosts || []).find(post => blogSlug(post) === slug);
  const findLegalPageBySlug = (cfg, slug = currentSlug()) => (cfg.legalPages || []).find(page => legalSlug(page) === slug);
  const getPageSeo = (cfg) => {
    if (pageKey === 'resource-detail') {
      const resource = findResourceBySlug(cfg);
      if (resource) {
        return {
          title: `${resource.title} \u2014 Minecraft Resource | ZCraft Studios`,
          description: resource.what || resource.summary,
          keywords: [resource.title, resource.brand, resource.category, ...(resource.tags || []), ...(resource.supportedPlatforms || [])].filter(Boolean).join(', '),
          canonical: `/resources/${resourceSlug(resource)}`,
          image: resource.image,
          imageAlt: `${resource.title} resource image`
        };
      }
    }
    if (pageKey === 'blog-detail') {
      const post = findBlogPostBySlug(cfg);
      if (post) {
        return {
          title: `${post.title} \u2014 ZCraft Studios Blog`,
          description: post.summary,
          keywords: [post.title, post.category, ...(post.tags || []), ...(post.keywords || [])].filter(Boolean).join(', '),
          canonical: `/blogs/${blogSlug(post)}`,
          image: post.image || cfg.branding.ogImage,
          imageAlt: post.imageAlt || `${cfg.site.name} blog artwork`
        };
      }
    }
    if (pageKey === 'legal-detail') {
      const legalPage = findLegalPageBySlug(cfg);
      if (legalPage) {
        return {
          title: legalPage.seoTitle || `${legalPage.title} \u2014 ${cfg.site.name}`,
          description: legalPage.description || legalPage.summary,
          keywords: [legalPage.title, ...(legalPage.keywords || [])].filter(Boolean).join(', '),
          canonical: `/legal/${legalSlug(legalPage)}`,
          image: cfg.branding.ogImage,
          imageAlt: `${cfg.site.name} legal policy artwork`
        };
      }
    }
    if (pageKey === 'legal-overview') {
      return {
        title: `Legal Policies \u2014 ${cfg.site.name}`,
        description: `Legal policies for ${cfg.site.name}, including terms and conditions, privacy, support, and digital resource information.`,
        keywords: (cfg.legalPages || []).flatMap(page => [page.title, ...(page.keywords || [])]).filter(Boolean).join(', '),
        canonical: '/legal',
        image: cfg.branding.ogImage,
        imageAlt: `${cfg.site.name} legal policy artwork`
      };
    }
    const seo = cfg.seo[pageKey] || cfg.seo.home;
    const supportKeywords = cfg.seoSupport?.keywords || [];
    return {
      ...seo,
      keywords: [...new Set([...(String(seo.keywords || '').split(',').map(k => k.trim()).filter(Boolean)), ...supportKeywords])].join(', ')
    };
  };
  const serviceTypes = [
    {
      name: 'Minecraft plugin development',
      description: 'Custom Paper, Spigot, Velocity, and proxy plugin development for Minecraft servers and networks.',
      serviceType: 'Software development',
      areaServed: 'Worldwide'
    },
    {
      name: 'Discord bot development',
      description: 'Custom Discord bots for moderation, evidence handling, automation, and community operations.',
      serviceType: 'Bot development',
      areaServed: 'Worldwide'
    },
    {
      name: 'Minecraft server configuration services',
      description: 'Server setup, configuration tuning, message packs, permission tools, tab layouts, and moderation templates.',
      serviceType: 'Server configuration',
      areaServed: 'Worldwide'
    }
  ];
  const parsePrice = (status) => {
    const text = String(status || '').trim();
    if (!text) return null;
    if (/free/i.test(text)) return { price: '0', priceCurrency: 'USD' };
    const match = text.match(/\$?\s*([0-9]+(?:\.[0-9]+)?)/);
    return match ? { price: match[1], priceCurrency: 'USD' } : null;
  };
  const productSchema = (item, baseUrl, fallbackUrl) => {
    const offer = parsePrice(item.status);
    const schema = {
      '@type': item.category === 'Bot' || item.category === 'Plugin' || item.category === 'Website' ? 'SoftwareApplication' : 'Product',
      name: item.title,
      description: item.what || item.summary,
      image: absoluteUrl(baseUrl, item.image),
      url: item.links?.[0]?.href || fallbackUrl,
      brand: { '@type': 'Brand', name: item.brand || 'ZCraft Studios' },
      category: item.category || item.brand || 'Minecraft resource',
      audience: item.audience,
      applicationCategory: item.category,
      operatingSystem: (item.supportedPlatforms || []).join(', ') || 'Minecraft server environments',
      keywords: (item.tags || []).join(', '),
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'Supported platforms', value: (item.supportedPlatforms || []).join(', ') },
        { '@type': 'PropertyValue', name: 'Setup difficulty', value: item.setupDifficulty || 'Varies by resource' },
        { '@type': 'PropertyValue', name: 'Support method', value: item.supportMethod || 'ZCraft Studios contact channels' },
        { '@type': 'PropertyValue', name: 'Price or status', value: item.status || 'Available' }
      ].filter(prop => prop.value)
    };
    if (offer) {
      schema.offers = {
        '@type': 'Offer',
        price: offer.price,
        priceCurrency: offer.priceCurrency,
        availability: 'https://schema.org/InStock',
        url: item.links?.[0]?.href || fallbackUrl
      };
    }
    return schema;
  };
  const pageSummaries = {
    resources: [
      'ZCraft Studios publishes Minecraft plugins, server configs, Discord bots, and web tools for server owners who need polished, production-ready resources.',
      'Each resource summary lists what the resource is, who it is for, supported platforms, setup difficulty, status or price, and support method.',
      'The resources page uses the same resource data as the generated discovery files, keeping resource details consistent.'
    ],
    about: [
      'ZCraft Studios is a Minecraft-focused development studio building plugins, server configurations, Discord bots, and modern web tools.',
      'The studio focuses on clean delivery, transparent scope, practical support, and production-ready releases for server operators and creators.',
      'Core services include Paper and Spigot plugin work, Velocity network tools, Discord automation, configuration packs, and web interfaces.'
    ],
    team: [
      'The ZCraft Studios team handles development, configuration, support, and resource delivery for Minecraft communities and creator tools.',
      'Team members are organized around practical roles such as plugin development, web tooling, server configuration, and community support.',
      'The team page helps clients understand who builds, reviews, and supports ZCraft Studios work.'
    ],
    request: [
      'The request page is the best starting point for custom Minecraft plugin development, Discord bot builds, server setup, and web tool commissions.',
      'A strong request includes platform, budget, timeline, target features, reference links, and contact details for follow-up.',
      'ZCraft Studios uses request details to quote scope, explain limits, confirm support expectations, and plan a production-ready delivery.'
    ],
    contact: [
      'The contact page lists the fastest ways to reach ZCraft Studios for Minecraft plugin commissions, server configuration help, Discord bot support, and web projects.',
      'Discord is the fastest contact option, while email is available for business inquiries, quotes, project records, and longer support details.',
      'Clear contact details help clients confirm scope, share logs or references, and choose the right channel before opening a custom request.'
    ],
    donate: [
      'The donate page lets supporters fund ZCraft Studios resources, plugins, configs, Discord bots, web tools, hosting, and ongoing support.',
      'Donations are optional, processed through PayPal, and help keep free or low-cost Minecraft tooling available to the community.',
      'Supporters can return to resources, contact the studio, or request custom work after completing a donation.'
    ]
  };
  const pageFaqs = {
    resources: [
      {
        question: 'What Minecraft resources does ZCraft Studios offer?',
        answer: 'ZCraft Studios offers Minecraft plugins, server configuration packs, Discord bot tools, web-based configuration editors, permission tools, message templates, and scoreboard or tab resources.'
      },
      {
        question: 'Who are the resources built for?',
        answer: 'The resources are built for Minecraft server owners, network operators, staff teams, Discord communities, and creators who need clean setup, clear support, and production-ready behavior.'
      },
      {
        question: 'Where is resource pricing and support listed?',
        answer: 'Pricing or free status is listed on each resource card and in config/resources.json. Support methods are included in the resource details and usually point to BuiltByBit, GitHub, or ZCraft Studios contact channels.'
      }
    ],
    about: [
      {
        question: 'What does ZCraft Studios do?',
        answer: 'ZCraft Studios builds Minecraft plugins, server configs, Discord bots, web tools, and downloadable resources for server owners, creators, and community teams.'
      },
      {
        question: 'What platforms does ZCraft Studios work with?',
        answer: 'The studio works with Paper, Spigot, Velocity, Minecraft server plugins, Discord, Node.js, Java, web browsers, and common server administration tools.'
      },
      {
        question: 'How does ZCraft Studios approach quality?',
        answer: 'The studio prioritizes clear scope, production-ready behavior, performance, readable setup instructions, and support details that make each release easier to operate.'
      }
    ],
    team: [
      {
        question: 'Who builds ZCraft Studios resources?',
        answer: 'ZCraft Studios resources are built and supported by a small development team focused on Minecraft plugins, server configuration, Discord bots, web tools, and creator resources.'
      },
      {
        question: 'What does the team support?',
        answer: 'The team supports custom commissions, downloadable resources, configuration help, Discord bot workflows, and product updates through public contact channels.'
      },
      {
        question: 'Can clients contact the team for custom work?',
        answer: 'Yes. Clients should use the request or contact page to describe the project, platform, budget, timeline, and support needs.'
      }
    ],
    request: [
      {
        question: 'What custom services can I request?',
        answer: 'You can request Minecraft plugin development, server setup, configuration packs, Discord bot development, custom web tools, and related technical support.'
      },
      {
        question: 'What details should a request include?',
        answer: 'Include your Discord username, email, service type, platform, budget, timeline, project brief, and any reference links or existing resources.'
      },
      {
        question: 'How quickly does ZCraft Studios respond?',
        answer: 'The request page is designed for quick quote follow-up. Response timing can vary by workload, but the form asks for enough detail to review the project efficiently.'
      }
    ],
    contact: [
      {
        question: 'What is the fastest way to contact ZCraft Studios?',
        answer: 'Discord is the fastest way to contact ZCraft Studios for project questions, support checks, and quick commission discussions.'
      },
      {
        question: 'When should I use email instead of Discord?',
        answer: 'Use email for business inquiries, longer project briefs, payment or quote records, and messages that need a clear written trail.'
      },
      {
        question: 'What details should I include when contacting the studio?',
        answer: 'Include your service type, platform, budget, timeline, references, logs if relevant, and the best way to follow up.'
      }
    ],
    donate: [
      {
        question: 'What do donations support?',
        answer: 'Donations support ZCraft Studios development time, hosting, resource maintenance, free resources, documentation, and ongoing community support.'
      },
      {
        question: 'Is donating required to use ZCraft Studios resources?',
        answer: 'No. Donations are optional. Resource access, free status, and pricing are listed separately on the resources page and in resource data.'
      },
      {
        question: 'How are donations processed?',
        answer: 'Donations are processed through PayPal from the donate page, and successful payments redirect to a thank-you page.'
      }
    ]
  };
  const resourceFaqs = (resource, cfg = {}) => resource.faq || [
    {
      question: `What is ${resource.title}?`,
      answer: resource.what || resource.summary
    },
    {
      question: `Who is ${resource.title} for?`,
      answer: resource.audience || cfg.resourcesPage?.defaultAudience || 'Minecraft server owners, community operators, and staff teams.'
    },
    {
      question: `How do I get support for ${resource.title}?`,
      answer: resource.supportMethod || cfg.resourcesPage?.defaultSupportMethod || 'Use the listed resource link or ZCraft Studios contact channels for support.'
    }
  ];
  const sentence = (value) => String(value || '').trim().replace(/[.]+$/, '');
  const resourceParagraphs = (resource, cfg = {}) => resource.paragraphs || [
    resource.summary,
    resource.what ? `${resource.title} is built for ${sentence(resource.audience) || cfg.resourcesPage?.defaultAudience || 'Minecraft communities that need reliable tooling'}. It supports ${(resource.supportedPlatforms || [cfg.resourcesPage?.defaultPlatform || 'Minecraft server environments']).join(', ')} and is designed for ${resource.setupDifficulty || cfg.resourcesPage?.defaultSetupDifficulty || 'practical'} setup.` : '',
    `Status or price: ${resource.status || 'available'}. Support method: ${sentence(resource.supportMethod) || cfg.resourcesPage?.defaultSupportMethod || 'ZCraft Studios contact channels'}.`
  ].filter(Boolean);
  const postKeywords = (post) => [...new Set([...(post.tags || []), ...(post.keywords || [])].filter(Boolean))];
  const postSections = (post) => post.sections || post.body || post.paragraphs?.map((paragraph, index) => ({
    heading: index === 0 ? 'What is the main point?' : 'What else should readers know?',
    body: paragraph
  })) || [];
  const renderInlineMarkdown = (value) => esc(value)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, href) => {
      if (/^javascript:/i.test(href)) return label;
      const external = /^https?:\/\//i.test(href);
      return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    })
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');
  const renderMarkdownBlock = (value) => {
    const lines = String(value || '').split(/\r?\n/);
    const html = [];
    let list = [];
    const flushList = () => {
      if (!list.length) return;
      html.push(`<ul>${list.map(item => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`);
      list = [];
    };
    lines.forEach(line => {
      const text = line.trim();
      if (!text) {
        flushList();
        return;
      }
      const bullet = text.match(/^[-*]\s+(.+)/);
      if (bullet) {
        list.push(bullet[1]);
        return;
      }
      flushList();
      if (/^###\s+/.test(text)) html.push(`<h3>${renderInlineMarkdown(text.replace(/^###\s+/, ''))}</h3>`);
      else if (/^##\s+/.test(text)) html.push(`<h2>${renderInlineMarkdown(text.replace(/^##\s+/, ''))}</h2>`);
      else if (/^#\s+/.test(text)) html.push(`<h1>${renderInlineMarkdown(text.replace(/^#\s+/, ''))}</h1>`);
      else html.push(`<p>${renderInlineMarkdown(text)}</p>`);
    });
    flushList();
    return html.join('');
  };
  const breadcrumbItemsForPage = (cfg, seo) => {
    const baseUrl = cleanBaseUrl(cfg.site.domain);
    const items = [{
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl + '/'
    }];

    if (pageKey === 'resource-detail') {
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: 'Resources',
        item: baseUrl + '/resources'
      });
      items.push({
        '@type': 'ListItem',
        position: 3,
        name: pageLabel(cfg, pageKey, seo),
        item: absoluteUrl(baseUrl, seo.canonical)
      });
    } else if (pageKey === 'blog-detail') {
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: 'Blogs',
        item: baseUrl + '/blogs'
      });
      items.push({
        '@type': 'ListItem',
        position: 3,
        name: pageLabel(cfg, pageKey, seo),
        item: absoluteUrl(baseUrl, seo.canonical)
      });
    } else if (pageKey === 'legal-detail') {
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: 'Legal',
        item: baseUrl + '/legal'
      });
      items.push({
        '@type': 'ListItem',
        position: 3,
        name: pageLabel(cfg, pageKey, seo),
        item: absoluteUrl(baseUrl, seo.canonical)
      });
    } else if (pageKey !== 'home') {
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
    meta('twitter:site', cfg.social?.twitterSite || cfg.contact?.primary?.handle || '');
    meta('twitter:creator', cfg.social?.twitterCreator || cfg.social?.twitterSite || cfg.contact?.primary?.handle || '');
    
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

    const sameAs = cfg.social?.sameAs || (cfg.contact?.platforms || [])
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
          areaServed: cfg.site.serviceArea || 'Worldwide',
          sameAs,
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            email: cfg.contact?.platforms?.find(p => p.platform === 'email')?.handle || 'contact@z-craft.xyz',
            url: cfg.contact?.primary?.href || baseUrl + '/contact'
          },
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'AE',
            addressLocality: cfg.site.location || 'United Arab Emirates'
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
          areaServed: cfg.site.serviceArea || 'Worldwide',
          telephone: cfg.contact?.platforms?.find(p => p.platform === 'email')?.handle || '+971-contact',
          email: cfg.contact?.platforms?.find(p => p.platform === 'email')?.handle || 'contact@z-craft.xyz',
          sameAs
        }
      ]
    };

    schema['@graph'].push(...serviceTypes.map(service => ({
      '@type': 'Service',
      name: service.name,
      description: service.description,
      serviceType: service.serviceType,
      areaServed: service.areaServed,
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: baseUrl + '/request',
        availableLanguage: 'English'
      },
      provider: {
        '@type': 'Organization',
        name: cfg.site.name,
        url: baseUrl
      },
      url: baseUrl + '/request'
    })));

    if (cfg.seoSupport?.eeat?.length) {
      schema['@graph'].push({
        '@type': 'AboutPage',
        '@id': baseUrl + '/about#eeat',
        name: cfg.seoSupport.title,
        description: cfg.seoSupport.copy,
        about: cfg.seoSupport.eeat.map(item => ({
          '@type': 'Thing',
          name: item.title,
          description: item.copy
        }))
      });
    }

    if (pageKey === 'resources' && cfg.resources?.length) {
      schema['@graph'].push({
        '@type': 'ItemList',
        name: 'ZCraft Studios resources',
        itemListElement: cfg.resources.map((resource, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: productSchema(resource, baseUrl, pageUrl)
        }))
      });
      schema['@graph'].push(...cfg.resources.map(resource => productSchema(resource, baseUrl, pageUrl)));
    }

    if (pageKey === 'blogs' && cfg.blogPosts?.length) {
      schema['@graph'].push({
        '@type': 'Blog',
        '@id': pageUrl + '#blog',
        name: cfg.blogPage?.title || 'ZCraft Studios Blog',
        description: cfg.blogPage?.copy || seo.description,
        url: pageUrl,
        publisher: { '@type': 'Organization', name: cfg.site.name, url: baseUrl },
        blogPost: cfg.blogPosts.map(post => ({ '@id': `${pageUrl}#${post.slug}` }))
      });
      schema['@graph'].push(...cfg.blogPosts.map(post => ({
        '@type': 'BlogPosting',
        '@id': `${pageUrl}#${post.slug}`,
        headline: post.title,
        description: post.summary,
        image: post.image ? absoluteUrl(baseUrl, post.image) : absoluteUrl(baseUrl, cfg.branding.ogImage),
        datePublished: post.date,
        dateModified: post.updated || post.date,
        author: { '@type': 'Organization', name: cfg.site.name },
        publisher: { '@type': 'Organization', name: cfg.site.name, url: baseUrl },
        mainEntityOfPage: pageUrl,
        articleSection: post.category,
        keywords: postKeywords(post).join(', '),
        audience: post.audience
      })));
    }

    if (pageKey === 'comparisons' && cfg.comparisons?.competitors?.length) {
      schema['@graph'].push({
        '@type': 'ItemList',
        '@id': pageUrl + '#competitor-comparisons',
        name: cfg.comparisons.page?.title || 'Minecraft development competitor comparisons',
        description: cfg.comparisons.page?.copy || seo.description,
        itemListElement: cfg.comparisons.competitors.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Thing',
            name: item.name,
            description: item.zcraftAdvantage || item.bestFor,
            keywords: (item.keywords || []).join(', ')
          }
        }))
      });
    }

    if (pageKey === 'donate') {
      schema['@graph'].push({
        '@type': 'DonateAction',
        '@id': `${pageUrl}#donate-action`,
        name: `Donate to ${cfg.site.name}`,
        description: seo.description,
        target: pageUrl,
        recipient: {
          '@type': 'Organization',
          name: cfg.site.name,
          url: baseUrl
        },
        instrument: {
          '@type': 'PaymentMethod',
          name: 'PayPal'
        }
      });
    }

    if (pageKey === 'resource-detail') {
      const resource = findResourceBySlug(cfg);
      if (resource) schema['@graph'].push(productSchema(resource, baseUrl, pageUrl));
    }

    if (pageKey === 'blog-detail') {
      const post = findBlogPostBySlug(cfg);
      if (post) {
        schema['@graph'].push({
          '@type': 'BlogPosting',
          '@id': `${pageUrl}#article`,
          headline: post.title,
          description: post.summary,
          image: post.image ? absoluteUrl(baseUrl, post.image) : absoluteUrl(baseUrl, cfg.branding.ogImage),
          datePublished: post.date,
          dateModified: post.updated || post.date,
          author: { '@type': 'Organization', name: cfg.site.name },
          publisher: { '@type': 'Organization', name: cfg.site.name, url: baseUrl },
          mainEntityOfPage: pageUrl,
          articleSection: post.category,
          keywords: postKeywords(post).join(', '),
          audience: post.audience
        });
      }
    }

    if (pageKey === 'legal-detail') {
      const legalPage = findLegalPageBySlug(cfg);
      if (legalPage) {
        schema['@graph'].push({
          '@type': 'WebPage',
          '@id': `${pageUrl}#policy`,
          name: legalPage.title,
          description: legalPage.summary || legalPage.description,
          url: pageUrl,
          datePublished: legalPage.effectiveDate,
          dateModified: legalPage.updated || legalPage.effectiveDate,
          publisher: { '@type': 'Organization', name: cfg.site.name, url: baseUrl },
          about: {
            '@type': 'Thing',
            name: `${cfg.site.name} ${legalPage.title}`
          }
        });
      }
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
              const isActive = targetPath === currentPath || (targetPath !== '/' && currentPath.startsWith(`${targetPath}/`));
              return `<a href="${esc(n.href)}" class="${isActive ? 'active' : ''}">${esc(n.label)}</a>`;
            }).join('')}
          </nav>
        </div>
        ${breadcrumb}
      </header>`;
  }

  function footer(cfg) {
    const legalLinks = cfg.legalPage?.footerLinks || [];
    const links = [...(cfg.footer.links || []), ...legalLinks];
    return `
      <footer>
        <div class="footer-inner">
          <div class="footer-left"><span>// </span>${esc(cfg.footer.left)} · ${cfg.site.year}</div>
          <div class="footer-links">
            ${links.map(l => {
              const external = /^https?:|^mailto:/.test(l.href);
              return `<a href="${esc(l.href)}" ${external ? 'target="_blank" rel="noopener"' : ''}>${esc(l.label)}</a>`;
            }).join('')}
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

  function renderSummaryBlock(pageKey, extraItems = []) {
    return '';
  }

  function renderFaqBlock(pageKey, faqs = pageFaqs[pageKey] || []) {
    return '';
  }

  function renderTrustBlock(cfg) {
    return '';
  }

  const sectionId = (heading, index) => `${slugify(heading || 'section') || 'section'}-${index + 1}`;

  function renderToc(sections = []) {
    const items = sections.filter(section => section.heading);
    if (!items.length) return '';
    return `
      <nav class="detail-toc" aria-label="Page sections">
        <div class="detail-toc-title">On this page</div>
        ${items.map((section, index) => `<a href="#${esc(sectionId(section.heading, index))}">${renderInlineMarkdown(section.heading)}</a>`).join('')}
      </nav>`;
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

  function resourceCard(r, index, cfg = {}) {
    const platforms = (r.supportedPlatforms || []).slice(0, 3).join(', ');
    const detailHref = `/resources/${resourceSlug(r)}`;
    const detailsLabel = cfg.resourcesPage?.detailsLinkLabel || 'details';
    return `
      <article class="resource-card" data-resource-index="${index}">
        <img class="resource-card-image" src="${esc(r.image)}" alt="${esc(r.title)}" loading="lazy" />
        <div class="resource-card-body">
          <div class="resource-card-header">
            <span class="resource-card-brand">${esc(r.brand || r.category || '')}</span>
            <div class="resource-card-status">${esc(r.status)}</div>
          </div>
          <div class="resource-card-content">
            <h3 class="resource-card-title"><a href="${esc(detailHref)}">${esc(r.title)}</a></h3>
            <p class="resource-card-summary">${esc(r.summary)}</p>
            ${r.what ? `<p class="resource-card-summary">${esc(r.what)}</p>` : ''}
            <div class="resource-card-facts">
              ${platforms ? `<span>${esc(platforms)}</span>` : ''}
              ${r.setupDifficulty ? `<span>${esc(r.setupDifficulty)} setup</span>` : ''}
              ${r.status ? `<span>${esc(r.status)}</span>` : ''}
            </div>
            <div class="tags">${(r.tags||[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            <div class="resource-card-actions">
              <a class="btn btn-ghost" href="${esc(detailHref)}">${esc(detailsLabel)}</a>
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

  function loadPayPalSDK(cfg) {
    return new Promise((resolve, reject) => {
      if (window.paypal) return resolve(window.paypal);
      const existing = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.paypal));
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      const clientId = cfg.donate?.paypalClientId || 'sb';
      const currency = cfg.donate?.form?.currency || 'USD';
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&components=buttons&disable-funding=card,paylater,venmo`;
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

  function initPayPalDonation(cfg) {
    const container = document.getElementById('paypal-button-container');
    const amountInput = document.getElementById('donation-amount');
    if (!container || !amountInput) return;
    loadPayPalSDK(cfg).then(paypal => {
      container.innerHTML = '';
      paypal.Buttons({
        fundingSource: paypal.FUNDING.PAYPAL,
        style: {
          layout: 'horizontal',
          color: 'gold',
          shape: 'rect',
          label: 'donate',
          tagline: false,
          height: 48
        },
        createOrder(data, actions) {
          const amount = Math.max(1, parseFloat(amountInput.value) || parseFloat(cfg.donate?.form?.defaultAmount) || 10);
          return actions.order.create({
            purchase_units: [{
              amount: { value: amount.toFixed(2) },
              description: cfg.donate?.paypalDescription || `${cfg.site.name} donation`
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
    const page = cfg.donate || {};
    const form = page.form || {};
    const stats = page.stats || [];
    const benefits = page.benefits || [];
    return `
      <section class="page-hero">
        <span class="page-label">${esc(page.label || '// support')}</span>
        <h1>${esc(page.title || 'Support ZCraft Studios')}</h1>
        <p class="page-copy">${esc(page.copy || 'Help us keep building premium Minecraft resources, plugins, and modern web experiences.')}</p>
      </section>
      ${renderSummaryBlock('donate')}
      <div class="donate-container">
        <div class="donate-hero">
          <div class="donate-hero-content">
            <h2>${esc(page.heroTitle || 'Your support powers our mission')}</h2>
            <p>${esc(page.heroCopy || 'Every donation directly funds development, infrastructure, and new features.')}</p>
            <div class="donate-stats">
              ${stats.map(stat => `<div class="donate-stat"><div class="stat-value">${esc(stat.value)}</div><div class="stat-label">${esc(stat.label)}</div></div>`).join('')}
            </div>
          </div>
          <img src="${esc(page.heroImage || cfg.branding.favicon)}" alt="${esc(page.heroImageAlt || 'Support ZCraft')}" class="donate-hero-img" />
        </div>
        <div class="donate-form-section">
          <div class="donate-form-card">
            <div class="donate-form-header">
              <h3>${esc(form.title || 'Make a Donation')}</h3>
              <p>${esc(form.copy || 'Choose your amount and complete securely through PayPal')}</p>
            </div>
            <div class="donation-field">
              <label for="donation-amount">${esc(form.amountLabel || 'Donation Amount')}</label>
              <div class="amount-input-wrapper">
                <input id="donation-amount" type="number" min="1" step="1" value="${esc(form.defaultAmount || '10')}" />
                <span class="amount-suffix">${esc(form.amountPrefix || '$')}</span>
              </div>
            </div>
            <div id="paypal-button-container" class="paypal-container"></div>
            <p class="donate-security">${esc(form.securityText || 'Secure checkout by PayPal')}</p>
          </div>
          <div class="donate-benefits">
            <h4>${esc(page.benefitsTitle || 'What Happens Next')}</h4>
            <div class="benefits-list">
              ${benefits.map((benefit, index) => `<div class="benefit"><span class="benefit-num">${index + 1}</span><div><strong>${esc(benefit.title)}</strong><p>${esc(benefit.copy)}</p></div></div>`).join('')}
            </div>
          </div>
        </div>
      </div>
      ${renderTrustBlock(cfg)}
      ${renderFaqBlock('donate')}`;
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
      ${renderSummaryBlock('request')}
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
      </div>
      ${renderTrustBlock(cfg)}
      ${renderFaqBlock('request')}`;
  }

  function closeResourceDetail() {
    const overlay = document.getElementById('resource-detail-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  }

  function openResourceDetail(resource) {
    closeResourceDetail();
    const productFacts = [
      ['What it is', resource.what],
      ['Who it is for', resource.audience],
      ['Supported platforms', (resource.supportedPlatforms || []).join(', ')],
      ['Price / status', resource.status],
      ['Setup difficulty', resource.setupDifficulty],
      ['Support method', resource.supportMethod]
    ].filter(([, value]) => value);
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
          <dl class="resource-detail-facts">
            ${productFacts.map(([label, value]) => `
              <div>
                <dt>${esc(label)}</dt>
                <dd>${esc(value)}</dd>
              </div>
            `).join('')}
          </dl>
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
        if (resource) window.location.href = `/resources/${resourceSlug(resource)}`;
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

    const featured = (cfg.resources || []).filter(p => p.featured).slice(0, 3);
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

    return heroHTML + servicesHTML + statsHTML + featuredHTML + ctaHTML + renderTrustBlock(cfg) + reviewsHTML;
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
        <h1>Studio-first craft for modern Minecraft resources.</h1>
        <p class="page-copy">ZCraft Studios builds server systems, plugins, and web experiences for teams, communities, and creators. We combine design, performance, and polished delivery for commercial-grade releases.</p>
      </section>
      ${renderSummaryBlock('about')}
      <div class="about-cards-grid">
        ${bioCard}
        ${skillsCard}
      </div>
      ${renderTrustBlock(cfg)}
      ${renderFaqBlock('about')}`;
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

    const projectsBox = windowBox(`<span>~/</span>resources.all`, `
      <div class="section-label">// all resources</div>
      <div class="projects-grid">${(cfg.resources || []).map(projectCard).join('')}</div>
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
      .map(item => resourceCard(item.resource, item.index, cfg))
      .join('');

    const featuredCard = featured ? `
      <article class="resource-featured-banner">
        <img class="resource-featured-image" src="${esc(featured.image)}" alt="${esc(featured.title)}" loading="lazy" />
        <div class="resource-featured-copy">
          <span class="resource-featured-badge">${esc(featured.brand)} · ${esc(featured.status)}</span>
          <h2 class="resource-featured-title">${esc(featured.title)}</h2>
          <p class="resource-featured-summary">${esc(featured.summary)}</p>
          <div class="tag-list">${(featured.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <a class="btn btn-ghost" href="/resources/${esc(resourceSlug(featured))}">${esc(page.featuredDetailsLabel || 'read resource details')}</a>
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
      ${renderSummaryBlock('resources')}
      <div class="resources-layout">
        ${featuredCard}
        <div class="resources-intro-row">
          ${categoryList}
        </div>
        <div class="resources-grid">
          ${resourceCards || '<div class="resource-empty">No resources available yet.</div>'}
        </div>
      </div>
      ${renderTrustBlock(cfg)}
      ${renderFaqBlock('resources')}`;
  }

  function renderResourceDetail(cfg) {
    const resource = findResourceBySlug(cfg);
    if (!resource) return renderNotFound(cfg);
    const page = cfg.resourcesPage || {};
    const headings = page.paragraphHeadings || [];
    const facts = [
      ['What it is', resource.what],
      ['Who it is for', resource.audience],
      ['Supported platforms', (resource.supportedPlatforms || []).join(', ')],
      ['Price / status', resource.status],
      ['Setup difficulty', resource.setupDifficulty],
      ['Support method', resource.supportMethod]
    ].filter(([, value]) => value);
    const paragraphs = resourceParagraphs(resource, cfg);
    const detailSections = paragraphs.map((paragraph, index) => ({
      heading: headings[index] || headings[headings.length - 1] || 'Product details',
      body: paragraph
    }));
    return `
      <section class="page-hero">
        <span class="page-label">${esc(page.detailLabel || '// resource')}</span>
        <h1>${esc(resource.title)}</h1>
        <p class="page-copy">${esc(resource.what || resource.summary)}</p>
      </section>
      <article class="detail-shell product-detail-shell">
        <aside class="detail-sidebar">
          ${renderToc(detailSections)}
          <div class="detail-cta-card">
            <strong>${esc(resource.status || 'Available')}</strong>
            <span>${esc(resource.setupDifficulty || 'Setup varies')}</span>
            ${(resource.links || []).map(link => `<a class="btn btn-primary" href="${esc(link.href)}" ${/^https?:/.test(link.href)?'target="_blank" rel="noopener"':''}>${esc(link.labelOverride || page.externalLinkLabel || link.label)}</a>`).join('')}
            <a class="btn btn-ghost" href="${esc(page.backHref || '/resources')}">${esc(page.backLabel || 'all resources')}</a>
          </div>
        </aside>
        <div class="detail-main">
        <div class="detail-media">
          <img src="${esc(resource.image)}" alt="${esc(resource.title)} resource image" loading="eager" />
        </div>
        <div class="detail-content">
          <div class="blog-card-meta">
            <span>${esc(resource.category || 'Resource')}</span>
            <span>${esc(resource.brand || 'ZCraft Studios')}</span>
            <span>${esc(resource.status || 'Available')}</span>
          </div>
          <dl class="blog-facts">
            ${facts.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}
          </dl>
          <div class="blog-body">
            ${detailSections.map((section, index) => `
              <section id="${esc(sectionId(section.heading, index))}">
                <h2>${esc(section.heading)}</h2>
                <p>${esc(section.body)}</p>
              </section>
            `).join('')}
          </div>
          <div class="tags">${(resource.tags || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
        </div>
        </div>
      </article>
      ${renderFaqBlock('resource-detail', resourceFaqs(resource, cfg))}`;
  }

  function renderBlogCard(post, cfg, open = false) {
    const page = cfg.blogPage || {};
    const publisherHandle = post.publisherHandle || page.publisherHandle || cfg.social?.twitterCreator || cfg.social?.twitterSite || cfg.contact?.primary?.handle || cfg.site.name;
    return `
      <article class="blog-index-card" id="${esc(post.slug)}">
        ${post.image ? `<a href="/blogs/${esc(blogSlug(post))}" class="blog-index-media"><img src="${esc(post.image)}" alt="${esc(post.imageAlt || post.title)}" loading="lazy" /></a>` : ''}
        <div class="blog-index-content">
          <div class="blog-card-meta">
            <span>${esc(post.category || page.publisherName || 'Studio')}</span>
            <span>${esc(post.readingTime || page.defaultReadingTime || 'Quick read')}</span>
            <span>${esc(post.date || '2026-06-15')}</span>
          </div>
          <a class="blog-list-title" href="/blogs/${esc(blogSlug(post))}">${esc(post.title)}</a>
          <p class="blog-list-summary">${esc(post.summary)}</p>
          <div class="tags">${postKeywords(post).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
        </div>
      </article>`;
  }

  function renderBlogs(cfg) {
    const page = cfg.blogPage || {};
    const posts = cfg.blogPosts || [];
    const categories = [...new Set(posts.map(post => post.category).filter(Boolean))];
    const summaryItems = (page.summaryItems || []).map(item => item.replace('{categories}', categories.join(', ')));

    return `
      <section class="page-hero">
        <span class="page-label">${esc(page.label || '// blog')}</span>
        <h1>${esc(page.title || 'Minecraft development notes and studio updates.')}</h1>
        <p class="page-copy">${esc(page.copy || 'Guides about Minecraft plugins, server configs, Discord bots, and ZCraft Studios resources.')}</p>
      </section>
      ${renderSummaryBlock('blogs', summaryItems)}
      <div class="blogs-list" aria-label="Blog posts">
        <div class="section-label">${esc(page.listLabel || '// posts')}</div>
        <div class="blog-list">
          ${posts.map((post, index) => renderBlogCard(post, cfg, index === 0)).join('') || `<div class="resource-empty">${esc(page.emptyText || 'No blog posts available yet.')}</div>`}
        </div>
      </div>
      ${renderTrustBlock(cfg)}
      ${renderFaqBlock('blogs', cfg.blogFaq || [])}`;
  }

  function renderComparisons(cfg) {
    const data = cfg.comparisons || {};
    const page = data.page || {};
    const competitors = data.competitors || [];
    const updated = page.updated || '2026-06-15';
    return `
      <section class="page-hero">
        <span class="page-label">${esc(page.label || '// comparisons')}</span>
        <h1>${esc(page.title || 'ZCraft Studios vs Minecraft Development Competitors')}</h1>
        <p class="page-copy">${esc(page.copy || 'Compare ZCraft Studios with other Minecraft development options before choosing who should build your plugin, config, Discord bot, or web tool.')}</p>
      </section>
      ${renderSummaryBlock('comparisons', data.summaryItems || [])}
      <article class="detail-shell comparison-detail-shell">
        <aside class="detail-sidebar">
          ${renderToc(data.sections || [])}
          <div class="detail-cta-card">
            <strong>${esc(competitors.length)} comparison types</strong>
            <span>${esc(cfg.site.serviceArea || 'Worldwide')}</span>
            <a class="btn btn-primary" href="${esc(page.backHref || '/request')}">${esc(page.backLabel || 'request custom service')}</a>
            <a class="btn btn-ghost" href="/contact">contact</a>
          </div>
        </aside>
        <div class="detail-main">
        <div class="blog-card-meta">
          <span>${esc(page.publisherName || cfg.site.name)}</span>
          <span>Updated ${esc(updated)}</span>
          <span>${esc(competitors.length)} competitor types</span>
        </div>
        <dl class="blog-facts">
          <div><dt>Best fit</dt><dd>Custom Minecraft plugins, server configs, Discord bots, web tools, anti-cheat planning, and backend consulting.</dd></div>
          <div><dt>Service area</dt><dd>${esc(cfg.site.serviceArea || 'Worldwide')}</dd></div>
        </dl>
        <div class="blog-body">
          ${(data.sections || []).map((section, index) => `
            <section id="${esc(sectionId(section.heading, index))}">
              <h2>${renderInlineMarkdown(section.heading)}</h2>
              ${renderMarkdownBlock(section.body)}
            </section>
          `).join('')}
        </div>
        </div>
      </article>
      <section class="comparison-board" aria-label="Competitor comparisons">
        <div class="comparison-board-head">
          <span class="section-label">// decision matrix</span>
          <h2>Choose by fit, not by category.</h2>
          <p>Each option has a place. This view shows when it works, where ZCraft is stronger, and what tradeoff to expect.</p>
        </div>
        <div class="comparison-grid">
          ${competitors.map(item => `
            <article class="comparison-card">
              <div class="comparison-card-top">
                <span>${esc(item.name)}</span>
              </div>
              <div class="comparison-card-body">
                <div><strong>Best for</strong><p>${esc(item.bestFor)}</p></div>
                <div><strong>ZCraft fit</strong><p>${esc(item.zcraftAdvantage)}</p></div>
                <div><strong>Tradeoff</strong><p>${esc(item.tradeoffs)}</p></div>
                <div class="tags">${(item.keywords || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
              </div>
            </article>
          `).join('')}
        </div>
      </section>
      ${renderFaqBlock('comparisons', data.faq || [])}`;
  }

  function renderBlogDetail(cfg) {
    const post = findBlogPostBySlug(cfg);
    if (!post) return renderNotFound(cfg);
    const page = cfg.blogPage || {};
    const publisherHandle = post.publisherHandle || page.publisherHandle || cfg.social?.twitterCreator || cfg.social?.twitterSite || cfg.contact?.primary?.handle || cfg.site.name;
    const sections = postSections(post);
    return `
      <section class="page-hero">
        <span class="page-label">${esc(page.label || '// blog')}</span>
        <h1>${esc(post.title)}</h1>
        <p class="page-copy">${esc(post.summary)}</p>
      </section>
      <article class="detail-shell blog-detail-shell">
        <aside class="detail-sidebar">
          ${renderToc(sections)}
          <div class="detail-cta-card">
            <strong>${esc(post.category || 'Studio')}</strong>
            <span>${esc(post.readingTime || page.defaultReadingTime || 'Quick read')}</span>
            <a class="btn btn-ghost" href="${esc(page.backHref || '/blogs')}">${esc(page.backLabel || 'all blog posts')}</a>
          </div>
        </aside>
        <div class="detail-main">
        ${post.image ? `<img class="blog-hero-image" src="${esc(post.image)}" alt="${esc(post.imageAlt || post.title)}" loading="eager" />` : ''}
        <div class="blog-card-meta">
          <span>${esc(post.date || '2026-06-15')}</span>
          <span>${esc(page.updatedLabel || 'Updated')} ${esc(post.updated || post.date || '2026-06-15')}</span>
          <span>${esc(page.publisherLabel || 'Publisher')} ${esc(publisherHandle)}</span>
          <span>${esc(post.category || page.publisherName || 'Studio')}</span>
          <span>${esc(post.readingTime || page.defaultReadingTime || 'Quick read')}</span>
        </div>
        <dl class="blog-facts">
          <div><dt>${esc(page.audienceLabel || 'Who it is for')}</dt><dd>${esc(post.audience || page.defaultAudience || 'Minecraft communities and creators')}</dd></div>
        </dl>
        <div class="blog-body">
          ${sections.map((section, index) => `
            <section id="${esc(sectionId(section.heading, index))}">
              <h2>${renderInlineMarkdown(section.heading)}</h2>
              ${renderMarkdownBlock(section.body)}
            </section>
          `).join('')}
        </div>
        <div class="tags">${postKeywords(post).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
        </div>
      </article>`;
  }

  function renderLegalDetail(cfg) {
    const legalPage = findLegalPageBySlug(cfg);
    if (!legalPage) return renderNotFound(cfg);
    const page = cfg.legalPage || {};
    return `
      <section class="page-hero">
        <span class="page-label">${esc(page.label || '// legal')}</span>
        <h1>${esc(legalPage.title)}</h1>
        <p class="page-copy">${esc(legalPage.summary || legalPage.description)}</p>
      </section>
      <article class="detail-shell legal-detail-shell">
        <aside class="detail-sidebar">
          ${renderToc(legalPage.sections || [])}
          <div class="detail-cta-card">
            <strong>${esc(page.publisherName || cfg.site.name)}</strong>
            <span>${esc(page.jurisdiction || cfg.site.location || 'Worldwide')}</span>
            <a class="btn btn-primary" href="${esc(page.contactUrl || '/contact')}">contact</a>
          </div>
        </aside>
        <div class="detail-main">
        <div class="blog-card-meta">
          <span>${esc(page.effectiveLabel || 'Effective date')} ${esc(legalPage.effectiveDate || legalPage.updated || '')}</span>
          <span>${esc(page.updatedLabel || 'Last updated')} ${esc(legalPage.updated || legalPage.effectiveDate || '')}</span>
          <span>${esc(page.publisherName || cfg.site.name)}</span>
          <span>${esc(page.jurisdiction || cfg.site.location || 'Worldwide')}</span>
        </div>
        <dl class="blog-facts">
          <div><dt>Contact</dt><dd>${esc(page.contactEmail || cfg.contact?.platforms?.find(p => p.platform === 'email')?.handle || 'zain@z-craft.xyz')}</dd></div>
          <div><dt>Service area</dt><dd>${esc(page.serviceArea || cfg.site.serviceArea || 'Worldwide')}</dd></div>
        </dl>
        <div class="blog-body">
          ${(legalPage.sections || []).map((section, index) => `
            <section id="${esc(sectionId(section.heading, index))}">
              <h2>${renderInlineMarkdown(section.heading)}</h2>
              ${renderMarkdownBlock(section.body)}
            </section>
          `).join('')}
        </div>
        <div class="tags">${(legalPage.keywords || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
        </div>
      </article>
      ${renderFaqBlock('legal-detail', legalPage.faq || [])}`;
  }

  function renderLegalOverview(cfg) {
    const page = cfg.legalPage || {};
    const pages = cfg.legalPages || [];
    return `
      <section class="page-hero">
        <span class="page-label">${esc(page.label || '// legal')}</span>
        <h1>Legal Policies</h1>
        <p class="page-copy">Terms and conditions, privacy, support, and digital resource policies for ${esc(cfg.site.name)}.</p>
      </section>
      <div class="blogs-list" aria-label="Legal policies">
        <div class="section-label">${esc(page.label || '// legal')}</div>
        <div class="blog-list">
          ${pages.map(item => `
            <article class="blog-list-item legal-list-card">
              <div class="blog-list-copy">
                <a class="blog-list-title" href="/legal/${esc(legalSlug(item))}">${esc(item.title)}</a>
                <span class="blog-list-summary">${esc(item.summary || item.description)}</span>
              </div>
              <div class="blog-list-meta">
                <span>${esc(page.updatedLabel || 'Last updated')} ${esc(item.updated || item.effectiveDate || '')}</span>
                <span>${esc(page.publisherName || cfg.site.name)}</span>
              </div>
            </article>
          `).join('')}
        </div>
      </div>`;
  }

  function renderContact(cfg) {
    const c = cfg.contact;

    const contactCards = `
      <div class="contact-page-shell">
        <a class="contact-primary-card contact-hero-card" href="${esc(c.primary.href)}" target="_blank" rel="noopener">
          <div class="contact-primary-header">
            <span class="contact-primary-badge">${esc(c.primary.badge)}</span>
          </div>
          <div class="contact-primary-content">
            <span class="contact-primary-platform">${esc(c.primary.platform)}</span>
            <span class="contact-primary-handle">${esc(c.primary.handle)}</span>
            <span class="contact-primary-cta">${esc(c.primary.cta)}</span>
          </div>
        </a>
        <div class="contact-info-card">
          <div class="contact-info-header">
            <h3 class="contact-info-title">Response window</h3>
          </div>
          <div class="contact-info-content">
            ${c.notes.map(n => `
              <div class="contact-note-item">
                <span class="contact-note-label">${esc(n.label)}</span>
                <strong class="contact-note-value">${esc(n.value)}</strong>
              </div>`).join('')}
          </div>
        </div>
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
        <div>
          <h2>Start with the right channel.</h2>
          <p>Use Discord for fast questions, the request form for scoped commissions, and email for longer business records.</p>
        </div>
        <a class="btn btn-primary" href="/request">request custom service</a>
      </div>
      <div class="contact-platforms-section">
        <h3 class="contact-platforms-title">All contact channels</h3>
        <div class="contact-platforms-grid">
          ${platformCards}
        </div>
      </div>
      ${renderTrustBlock(cfg)}
      ${renderSummaryBlock('contact')}
      ${renderFaqBlock('contact')}`;
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
      ${renderSummaryBlock('team')}
      <div class="team-pyramid">
        ${pyramidRows}
      </div>
      ${renderTrustBlock(cfg)}
      ${renderFaqBlock('team')}`;
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

  const PAGES = { home: renderHome, about: renderAbout, portfolio: renderPortfolio, resources: renderResources, 'resource-detail': renderResourceDetail, blogs: renderBlogs, comparisons: renderComparisons, 'blog-detail': renderBlogDetail, 'legal-overview': renderLegalOverview, 'legal-detail': renderLegalDetail, donate: renderDonate, thankyou: renderThankYou, request: renderRequest, contact: renderContact, team: renderTeam, notfound: renderNotFound };

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

  async function resolveConfigItems(items = []) {
    return Promise.all((items || []).map(async item => {
      if (!item || typeof item !== 'object' || !item.file) return item;
      const filePath = String(item.file).replace(/^file:/, '').replace(/^\/+/, '');
      return tryFetchJson(buildConfigPaths(filePath));
    }));
  }

  Promise.all([
    tryFetchJson(buildConfigPaths('info.json')),
    tryFetchJson(buildConfigPaths('resources.json')),
    tryFetchJson(buildConfigPaths('reviews.json')),
    tryFetchJson(buildConfigPaths('blogs.json')),
    tryFetchJson(buildConfigPaths('legal.json')),
    tryFetchJson(buildConfigPaths('comparisons.json'))
  ]).then(async ([info, resourceIndex, reviews, blogs, legal, comparisons]) => {
    const [resources, blogPosts] = await Promise.all([
      resolveConfigItems(resourceIndex.resources || []),
      resolveConfigItems(blogs.posts || [])
    ]);
    const cfg = {
      ...info,
      resources,
      reviews: reviews.reviews || [],
      blogPage: blogs.page || {},
      blogPosts,
      blogFaq: blogs.faq || [],
      legalPage: legal.page || {},
      legalPages: legal.pages || [],
      comparisons
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
    if (pageKey === 'donate') initPayPalDonation(cfg);
    if (pageKey === 'request' && !isMaintenanceActive(cfg, pageKey)) initRequestForm(cfg);
    requestAnimationFrame(animateCounters);
  }).catch(err => {
    console.error('Failed to load config:', err);
    $('#app').innerHTML = '<div style="padding:48px;text-align:center;color:#ef4444">Failed to load site config.</div>';
  });
})();
