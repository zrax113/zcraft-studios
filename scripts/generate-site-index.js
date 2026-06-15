const fs = require('fs');
const path = require('path');

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function configFileRef(baseDir, filePath) {
  return path.normalize(path.join(baseDir, filePath.replace(/^file:/, '')));
}

function discoverConfigFiles(configPath, dirName) {
  const dir = path.join(path.dirname(configPath), dirName);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(entry => entry.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b))
    .map(entry => path.join(dir, entry));
}

function resolveConfigList(configPath, items = [], autoDir = '') {
  const baseDir = path.dirname(configPath);
  const listed = (items || []).map(item => {
    if (!item || typeof item !== 'object' || !item.file) return item;
    return configFileRef(baseDir, item.file);
  });
  const discovered = autoDir ? discoverConfigFiles(configPath, autoDir) : [];
  const seen = new Set();
  return [...listed, ...discovered]
    .filter(item => {
      if (typeof item !== 'string') return true;
      const key = path.normalize(item).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(item => typeof item === 'string' ? readJson(item) : item);
}

function writeText(path, text) {
  fs.writeFileSync(path, text, 'utf8');
}

function ensureDir(path) {
  fs.mkdirSync(path, { recursive: true });
}

function cleanGeneratedHtml(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    if (entry.endsWith('.html')) fs.rmSync(path.join(dir, entry));
  }
}

function cleanGeneratedPrefix(prefix) {
  for (const entry of fs.readdirSync('.')) {
    if (entry.startsWith(prefix) && entry.endsWith('.html')) fs.rmSync(entry);
  }
}

function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInlineMarkdown(value = '') {
  return esc(value)
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
}

function renderMarkdownBlock(value = '') {
  const html = [];
  let list = [];
  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map(item => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`);
    list = [];
  };
  String(value || '').split(/\r?\n/).forEach(line => {
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
}

function absoluteUrl(baseUrl, value = '/') {
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${baseUrl}${path}`;
}

function baseSchemas(seo) {
  const pageUrl = absoluteUrl(baseUrl, seo.canonical);
  const image = absoluteUrl(baseUrl, seo.image || info.branding.ogImage);
  const sameAs = info.social?.sameAs || (info.contact?.platforms || [])
    .filter(platform => /^https?:\/\//i.test(platform.href))
    .map(platform => platform.href);
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${baseUrl}/`
    }
  ];
  if (seo.canonical !== '/') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: seo.title.replace(/\s+[—-]\s+.*$/, ''),
      item: pageUrl
    });
  }
  return [
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${baseUrl}/#organization`,
          name: info.site.name,
          url: baseUrl,
          logo: absoluteUrl(baseUrl, info.branding.logo),
          image,
          description: info.site.tagline,
          areaServed: info.site.serviceArea || 'Worldwide',
          sameAs
        },
        {
          '@type': 'WebSite',
          '@id': `${baseUrl}/#website`,
          url: baseUrl,
          name: info.site.name,
          description: info.site.tagline,
          publisher: { '@id': `${baseUrl}/#organization` }
        },
        {
          '@type': 'WebPage',
          '@id': `${pageUrl}#webpage`,
          url: pageUrl,
          name: seo.title,
          description: seo.description,
          isPartOf: { '@id': `${baseUrl}/#website` },
          publisher: { '@id': `${baseUrl}/#organization` },
          breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: image
          }
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${pageUrl}#breadcrumb`,
          itemListElement: breadcrumbItems
        }
      ]
    }
  ];
}

function resourceSchema(resource) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Bot', 'Plugin', 'Website'].includes(resource.category) ? 'SoftwareApplication' : 'Product',
    name: resource.title,
    description: resource.what || resource.summary,
    image: absoluteUrl(baseUrl, resource.image),
    url: resource.pageUrl,
    brand: { '@type': 'Brand', name: resource.brand || info.site.name },
    category: resource.category || 'Minecraft resource',
    applicationCategory: resource.category,
    operatingSystem: (resource.supportedPlatforms || []).join(', ') || 'Minecraft server environments',
    offers: resource.status ? {
      '@type': 'Offer',
      price: /^free$/i.test(resource.status) ? '0' : String(resource.status).replace(/[^0-9.]/g, '') || resource.status,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    } : undefined
  };
}

function blogPostingSchema(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    image: absoluteUrl(baseUrl, post.image || info.branding.ogImage),
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { '@type': 'Organization', name: info.site.name, url: baseUrl },
    publisher: { '@type': 'Organization', name: info.site.name, url: baseUrl },
    mainEntityOfPage: post.url,
    articleSection: post.category,
    keywords: [...new Set([...(post.tags || []), ...(post.keywords || [])])].join(', ')
  };
}

function donateSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'DonateAction',
    '@id': `${baseUrl}/donate#donate-action`,
    name: `Donate to ${info.site.name}`,
    description: info.seo.donate.description,
    target: `${baseUrl}/donate`,
    recipient: {
      '@type': 'Organization',
      name: info.site.name,
      url: baseUrl
    },
    instrument: {
      '@type': 'PaymentMethod',
      name: 'PayPal'
    }
  };
}

function pageShell({ seo, page, body, structuredData = [] }) {
  const pageUrl = absoluteUrl(baseUrl, seo.canonical);
  const image = absoluteUrl(baseUrl, seo.image || info.branding.ogImage);
  const robots = seo.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const schemas = [...baseSchemas(seo), ...structuredData].filter(Boolean);
  const twitterSite = info.social?.twitterSite || info.contact?.primary?.handle || '';
  const twitterCreator = info.social?.twitterCreator || twitterSite;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
<meta name="robots" content="${robots}" />
<meta name="googlebot" content="${robots}" />
<meta name="description" content="${esc(seo.description)}" />
<meta name="keywords" content="${esc(seo.keywords || '')}" />
<meta name="author" content="${esc(info.site.author)}" />
<meta name="application-name" content="${esc(info.site.name)}" />
<meta name="referrer" content="strict-origin-when-cross-origin" />
<meta name="color-scheme" content="dark" />
<meta name="theme-color" content="${esc(info.branding.themeColor)}" />
<link rel="canonical" href="${esc(pageUrl)}" />
<link rel="alternate" hreflang="en" href="${esc(pageUrl)}" />
<link rel="alternate" hreflang="x-default" href="${esc(pageUrl)}" />
<link rel="alternate" type="application/json" href="${baseUrl}/site-index.json" title="Full generated site index JSON" />
<link rel="alternate" type="application/json" href="${baseUrl}/ai-overview.json" title="Compact AI overview JSON" />
<link rel="alternate" type="text/plain" href="${baseUrl}/ai.txt" title="Plain-text AI overview" />
<link rel="icon" href="${esc(info.branding.favicon)}" />
<link rel="apple-touch-icon" href="${esc(info.branding.favicon)}" />
<title>${esc(seo.title)}</title>
<link rel="preload" href="/src/styles.css" as="style">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&amp;family=Sora:wght@400;600;700;800&amp;display=swap">
<link rel="stylesheet" href="/src/styles.css">
<meta property="og:title" content="${esc(seo.title)}" />
<meta property="og:description" content="${esc(seo.description)}" />
<meta property="og:type" content="website" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:secure_url" content="${esc(image)}" />
<meta property="og:image:alt" content="${esc(seo.imageAlt || `${info.site.name} artwork`)}" />
<meta property="og:url" content="${esc(pageUrl)}" />
<meta property="og:site_name" content="${esc(info.site.name)}" />
<meta property="og:locale" content="en_US" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(seo.title)}" />
<meta name="twitter:description" content="${esc(seo.description)}" />
<meta name="twitter:image" content="${esc(image)}" />
<meta name="twitter:image:alt" content="${esc(seo.imageAlt || `${info.site.name} artwork`)}" />
<meta name="twitter:site" content="${esc(twitterSite)}" />
<meta name="twitter:creator" content="${esc(twitterCreator)}" />
${schemas.map(schema => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`).join('\n')}
</head>
<body data-page="${esc(page)}">
<main class="wrapper" id="app" style="padding-top:32px;padding-bottom:32px">
${body}
</main>
<script src="/src/app.js" defer></script>
</body>
</html>
`;
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sentence(value = '') {
  return String(value).trim().replace(/[.]+$/, '');
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

function compactItem(item) {
  const firstLink = (item.links || [])[0];
  const slug = item.slug || slugify(item.title);
  return {
    slug,
    title: item.title,
    brand: item.brand,
    category: item.category,
    summary: item.summary,
    what: item.what,
    audience: item.audience,
    supportedPlatforms: item.supportedPlatforms || [],
    setupDifficulty: item.setupDifficulty,
    supportMethod: item.supportMethod,
    tags: item.tags || [],
    status: item.status,
    featured: Boolean(item.featured),
    image: item.image,
    pageUrl: `${baseUrl}/resources/${slug}`,
    links: item.links || [],
    schema: {
      '@type': ['Bot', 'Plugin', 'Website'].includes(item.category) ? 'SoftwareApplication' : 'Product',
      name: item.title,
      description: item.what || item.summary,
      image: item.image,
      url: `${baseUrl}/resources/${slug}`,
      applicationCategory: item.category,
      operatingSystem: (item.supportedPlatforms || []).join(', '),
      audience: item.audience,
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'Supported platforms', value: (item.supportedPlatforms || []).join(', ') },
        { '@type': 'PropertyValue', name: 'Setup difficulty', value: item.setupDifficulty || '' },
        { '@type': 'PropertyValue', name: 'Support method', value: item.supportMethod || '' },
        { '@type': 'PropertyValue', name: 'Price or status', value: item.status || '' }
      ].filter(property => property.value),
      offers: item.status ? {
        '@type': 'Offer',
        price: item.status,
        availability: 'https://schema.org/InStock'
      } : undefined
    }
  };
}

const info = readJson('config/info.json');
const resourceIndex = readJson('config/resources.json');
const reviews = readJson('config/reviews.json');
const blogs = readJson('config/blogs.json');
const legal = readJson('config/legal.json');
const comparisons = readJson('config/comparisons.json');
const baseUrl = info.site.domain.replace(/\/+$/, '');

const pages = Object.entries(info.seo || {})
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, seo]) => ({
    key,
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    canonical: seo.canonical,
    url: absoluteUrl(baseUrl, seo.canonical),
    indexable: !seo.noindex
  }));

const indexablePages = pages.filter(page => page.indexable);
const resourceConfigItems = resolveConfigList('config/resources.json', resourceIndex.resources || [], 'resources');
const blogConfigPosts = resolveConfigList('config/blogs.json', blogs.posts || [], 'blogs');
const resources = resourceConfigItems.map(compactItem);
const defaultPublisherHandle = info.social?.twitterCreator || info.social?.twitterSite || info.contact?.primary?.handle || info.site.name;
const blogPosts = blogConfigPosts.map(post => ({
  title: post.title,
  slug: post.slug || slugify(post.title),
  date: post.date,
  updated: post.updated || post.date,
  category: post.category,
  summary: post.summary,
  audience: post.audience,
  tags: post.tags || [],
  keywords: post.keywords || [],
  image: post.image || info.branding?.ogImage,
  imageAlt: post.imageAlt || `${post.title} image`,
  readingTime: post.readingTime,
  publisherHandle: post.publisherHandle || defaultPublisherHandle,
  url: `${baseUrl}/blogs/${post.slug || slugify(post.title)}`,
  sections: post.sections || post.body || []
}));
const legalPages = (legal.pages || []).map(page => ({
  ...page,
  slug: page.slug || slugify(page.title),
  url: `${baseUrl}/legal/${page.slug || slugify(page.title)}`,
  keywords: page.keywords || [],
  sections: page.sections || [],
  faq: page.faq || []
}));
const comparisonPage = {
  page: comparisons.page || {},
  summaryItems: comparisons.summaryItems || [],
  competitors: comparisons.competitors || [],
  sections: comparisons.sections || [],
  faq: comparisons.faq || [],
  url: `${baseUrl}/comparisons`
};

const categories = [...new Set(resources
  .map(item => item.category)
  .filter(Boolean))]
  .sort();

const topics = [...new Set(resources
  .flatMap(item => item.tags || [])
  .filter(Boolean))]
  .sort();

const generatedAt = new Date().toISOString();
const discovery = {
  sitemap: `${baseUrl}/sitemap.xml`,
  llms: `${baseUrl}/llms.txt`,
  ai_json_endpoint: `${baseUrl}/ai-agents`,
  ai_text: `${baseUrl}/ai.txt`,
  ai_overview_json: `${baseUrl}/ai-overview.json`,
  full_site_index_json: `${baseUrl}/site-index.json`
};

const siteIndex = {
  schemaVersion: '1.0',
  generatedAt,
  site: info.site,
  branding: info.branding,
  discovery,
  siteGuidance: {
    preferredSummary: `${info.site.name} is ${info.site.tagline}`,
    lastGenerated: generatedAt,
    primaryAudience: 'Minecraft server owners, community operators, creators, and teams needing plugins, configs, Discord bots, or web tools.',
    primaryServices: [
      'Minecraft plugin development',
      'Minecraft server setup and configuration',
      'Discord bot development',
      'Modern web tools and websites',
      'Premium downloadable resources'
    ],
    recommendedCitationUrl: `${baseUrl}/`,
    contactUrl: `${baseUrl}/contact`,
    requestUrl: `${baseUrl}/request`,
    pricingNote: 'Downloadable resource prices are listed in resources[].status when available. Custom commissions are quoted per project.'
  },
  pages,
  generatedDetailPages: [
    ...resources.map(resource => ({
      type: 'resource',
      title: resource.title,
      url: resource.pageUrl
    })),
    ...blogPosts.map(post => ({
      type: 'blog',
      title: post.title,
      url: post.url
    })),
    ...legalPages.map(page => ({
      type: 'legal',
      title: page.title,
      url: page.url
    }))
  ],
  indexablePages,
  navigation: info.nav || [],
  resources: {
    resources,
    categories,
    topics
  },
  blogs: {
    page: blogs.page || {},
    posts: blogPosts,
    faq: blogs.faq || []
  },
  legal: {
    page: legal.page || {},
    pages: legalPages
  },
  comparisons: comparisonPage,
  seoSupport: info.seoSupport || {},
  reviews: reviews.reviews || [],
  contact: info.contact || {},
  maintenance: info.maintenance || {}
};

const overview = {
  schemaVersion: '1.0',
  generatedAt,
  name: info.site.name,
  url: baseUrl,
  summary: info.site.tagline,
  description: info.seo.home.description,
  topics,
  categories,
  canonicalPages: indexablePages,
  resourceCount: resources.length,
  featuredResources: resources.filter(resource => resource.featured),
  blogPostCount: blogPosts.length,
  latestBlogPosts: blogPosts.slice(0, 5),
  competitorComparisonCount: comparisonPage.competitors.length,
  generatedDetailPages: [
    ...resources.map(resource => resource.pageUrl),
    ...blogPosts.map(post => post.url),
    ...legalPages.map(page => page.url)
  ],
  discovery
};

const plainLines = [
  info.site.name,
  baseUrl,
  '',
  `Summary: ${info.site.tagline}`,
  `Description: ${info.seo.home.description}`,
  '',
  'Primary services: Minecraft plugins; Minecraft server configs; Discord bots; web tools; commissioned development; premium downloadable resources.',
  `AI JSON endpoint: ${baseUrl}/ai-agents`,
  `Full JSON site index: ${baseUrl}/site-index.json`,
  `Compact AI overview JSON: ${baseUrl}/ai-overview.json`,
  `Sitemap: ${baseUrl}/sitemap.xml`,
  `LLMS file: ${baseUrl}/llms.txt`,
  `Contact: ${baseUrl}/contact`,
  `Request custom work: ${baseUrl}/request`,
  `Blog: ${baseUrl}/blogs`,
  `Comparisons: ${baseUrl}/comparisons`,
  '',
  'Indexable pages:',
  ...indexablePages.map(page => `- ${page.title}: ${page.url} - ${page.description}`),
  '',
  'Resource detail pages:',
  ...resources.map(resource => `- ${resource.title}: ${resource.pageUrl} - ${resource.what || resource.summary}`),
  '',
  'Blog posts:',
  ...blogPosts.map(post => `- ${post.title} (${post.date}, ${post.publisherHandle}): ${post.summary} ${post.url}`),
  '',
  'Legal pages:',
  ...legalPages.map(page => `- ${page.title}: ${page.url} - ${page.summary || page.description}`),
  '',
  'Competitor comparisons:',
  ...comparisonPage.competitors.map(item => `- ${item.name}: best for ${item.bestFor} ZCraft advantage: ${item.zcraftAdvantage}`),
  '',
  'Featured resources:',
  ...resources
    .filter(resource => resource.featured)
    .map(resource => `- ${resource.title} (${resource.category}, ${resource.status}): ${resource.summary}`)
];

function resourceFaqs(resource) {
  const page = info.resourcesPage || {};
  return resource.faq || [
    { question: `What is ${resource.title}?`, answer: resource.what || resource.summary },
    { question: `Who is ${resource.title} for?`, answer: resource.audience || page.defaultAudience || 'Minecraft server owners, community operators, and staff teams.' },
    { question: `How do I get support for ${resource.title}?`, answer: resource.supportMethod || page.defaultSupportMethod || 'Use the listed resource link or ZCraft Studios contact channels for support.' }
  ];
}

function resourceParagraphs(resource) {
  const page = info.resourcesPage || {};
  return resource.paragraphs || [
    resource.summary,
    resource.what ? `${resource.title} is built for ${sentence(resource.audience) || page.defaultAudience || 'Minecraft communities that need reliable tooling'}. It supports ${(resource.supportedPlatforms || [page.defaultPlatform || 'Minecraft server environments']).join(', ')} and is designed for ${resource.setupDifficulty || page.defaultSetupDifficulty || 'practical'} setup.` : '',
    `Status or price: ${resource.status || 'available'}. Support method: ${sentence(resource.supportMethod) || page.defaultSupportMethod || 'ZCraft Studios contact channels'}.`
  ].filter(Boolean);
}

function blogSections(post) {
  return post.sections || post.body || post.paragraphs?.map((paragraph, index) => ({
    heading: index === 0 ? 'What is the main point?' : 'What else should readers know?',
    body: paragraph
  })) || [];
}

const pageSummaries = {
  about: [
    'ZCraft Studios is a Minecraft-focused development studio building plugins, server configurations, Discord bots, and web tools.',
    'The studio focuses on clear scope, production-ready delivery, performance, readable setup details, and practical support.',
    'Clients can request custom Paper, Spigot, Velocity, Discord, Node.js, Java, and browser-based development work.'
  ],
  team: [
    'The ZCraft Studios team handles development, configuration, support, and resource delivery for Minecraft communities.',
    'Team work covers plugin development, web tooling, server configuration, Discord automation, resource updates, and support.',
    'Clients can use the request or contact page to describe custom work, platform details, budget, timeline, and support needs.'
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
  resources: [
    'ZCraft Studios publishes Minecraft plugins, server configs, Discord bots, and web tools for server owners who need polished, production-ready resources.',
    'Each resource summary lists what the resource is, who it is for, supported platforms, setup difficulty, status or price, and support method.',
    'The resources page uses the same resource data as the generated discovery files, keeping resource details consistent.'
  ]
};

const pageFaqs = {
  about: [
    { question: 'What does ZCraft Studios do?', answer: 'ZCraft Studios builds Minecraft plugins, server configs, Discord bots, web tools, and downloadable resources for server owners, creators, and community teams.' },
    { question: 'What platforms does ZCraft Studios work with?', answer: 'The studio works with Paper, Spigot, Velocity, Minecraft server plugins, Discord, Node.js, Java, and web browsers.' },
    { question: 'How does ZCraft Studios approach quality?', answer: 'The studio prioritizes clear scope, production-ready behavior, performance, readable setup instructions, and support details.' }
  ],
  team: [
    { question: 'Who builds ZCraft Studios resources?', answer: 'ZCraft Studios resources are built and supported by a small development team focused on Minecraft plugins, server configuration, Discord bots, web tools, and creator resources.' },
    { question: 'What does the team support?', answer: 'The team supports custom commissions, downloadable resources, configuration help, Discord bot workflows, and resource updates through public contact channels.' },
    { question: 'Can clients contact the team for custom work?', answer: 'Yes. Clients should use the request or contact page to describe the project, platform, budget, timeline, and support needs.' }
  ],
  request: [
    { question: 'What custom services can I request?', answer: 'You can request Minecraft plugin development, server setup, configuration packs, Discord bot development, custom web tools, and related technical support.' },
    { question: 'What details should a request include?', answer: 'Include your Discord username, email, service type, platform, budget, timeline, project brief, and any reference links or existing resources.' },
    { question: 'How quickly does ZCraft Studios respond?', answer: 'The request page is designed for quick quote follow-up. Response timing can vary by workload, but the form asks for enough detail to review the project efficiently.' }
  ],
  contact: [
    { question: 'What is the fastest way to contact ZCraft Studios?', answer: 'Discord is the fastest way to contact ZCraft Studios for project questions, support checks, and quick commission discussions.' },
    { question: 'When should I use email instead of Discord?', answer: 'Use email for business inquiries, longer project briefs, payment or quote records, and messages that need a clear written trail.' },
    { question: 'What details should I include when contacting the studio?', answer: 'Include your service type, platform, budget, timeline, references, logs if relevant, and the best way to follow up.' }
  ]
};

function rootPageBody(key, title, copy, sections = []) {
  const footerLinks = [
    ...(info.footer?.links || []),
    ...(legal.page?.footerLinks || [])
  ];
  return `<section class="page-hero"><span class="page-label">// ${esc(key)}</span><h1>${esc(title)}</h1><p class="page-copy">${esc(copy)}</p></section>
${sections.map(section => `<section class="trust-section"><div class="section-label">${esc(section.label || '// details')}</div><h2>${esc(section.heading)}</h2><p>${esc(section.body)}</p></section>`).join('')}
<nav class="footer-links" aria-label="Important links">${footerLinks.map(link => `<a href="${esc(link.href)}">${esc(link.label)}</a>`).join('')}</nav>`;
}

function renderResourceDetail(resource) {
  const page = info.resourcesPage || {};
  const detailConfig = page.detailLayout || {};
  const layout = detailConfig.layout || 'side-by-side'; // 'side-by-side', 'stacked', 'hero-top'
  const showImage = detailConfig.showImage !== false;
  const imagePlacement = detailConfig.imagePlacement || 'left'; // 'left', 'right', 'top'
  const headings = page.paragraphHeadings || [];
  const facts = [
    ['What it is', resource.what],
    ['Who it is for', resource.audience],
    ['Supported platforms', (resource.supportedPlatforms || []).join(', ')],
    ['Price / status', resource.status],
    ['Setup difficulty', resource.setupDifficulty],
    ['Support method', resource.supportMethod]
  ].filter(([, value]) => value);
  
  const imageHtml = showImage ? `<img src="${esc(resource.image)}" alt="${esc(resource.title)} resource image" loading="eager" class="detail-hero-image" />` : '';
  const mediaSection = `<div class="detail-media">${imageHtml}</div>`;
  const contentSection = `<div class="detail-content">
<div class="detail-meta"><span class="meta-badge category-badge">${esc(resource.category || 'Resource')}</span><span class="meta-badge brand-badge">${esc(resource.brand || 'ZCraft Studios')}</span><span class="meta-badge status-badge">${esc(resource.status || 'Available')}</span></div>
<dl class="detail-facts">${facts.map(([label, value]) => `<div class="fact-item"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
<div class="detail-body">${resourceParagraphs(resource).map((paragraph, index) => `<section class="detail-section"><h2>${esc(headings[index] || headings[headings.length - 1] || 'Product details')}</h2><p>${esc(paragraph)}</p></section>`).join('')}</div>
<div class="tags">${(resource.tags || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
<div class="detail-actions">${(resource.links || []).map(link => `<a class="btn btn-primary" href="${esc(link.href)}" target="_blank" rel="noopener">${esc(link.labelOverride || page.externalLinkLabel || link.label)}</a>`).join('')}<a class="btn btn-secondary" href="${esc(page.backHref || '/resources')}">${esc(page.backLabel || '← all resources')}</a></div>
</div>`;
  
  let layoutHtml = '';
  if (layout === 'hero-top') {
    layoutHtml = `<section class="page-hero"><span class="page-label">${esc(page.detailLabel || '// resource')}</span><h1>${esc(resource.title)}</h1><p class="page-copy">${esc(resource.what || resource.summary)}</p></section>
${imageHtml ? `<div class="detail-hero-section">${imageHtml}</div>` : ''}
<article class="detail-layout detail-stacked">${contentSection}</article>`;
  } else if (layout === 'stacked') {
    layoutHtml = `<section class="page-hero"><span class="page-label">${esc(page.detailLabel || '// resource')}</span><h1>${esc(resource.title)}</h1><p class="page-copy">${esc(resource.what || resource.summary)}</p></section>
<article class="detail-layout detail-stacked">${imageHtml ? mediaSection : ''}${contentSection}</article>`;
  } else {
    const leftFirst = imagePlacement === 'left';
    layoutHtml = `<section class="page-hero"><span class="page-label">${esc(page.detailLabel || '// resource')}</span><h1>${esc(resource.title)}</h1><p class="page-copy">${esc(resource.what || resource.summary)}</p></section>
<article class="detail-layout detail-side-by-side ${leftFirst ? 'media-left' : 'media-right'}">${leftFirst ? (imageHtml ? mediaSection : '') + contentSection : contentSection + (imageHtml ? mediaSection : '')}</article>`;
  }
  
  return layoutHtml;
}

function renderResourceIndex() {
  const page = info.resourcesPage || {};
  return `<section class="page-hero"><span class="page-label">${esc(page.label || '// resources')}</span><h1>${esc(page.title || 'Tools, configs, and kits built for real servers.')}</h1><p class="page-copy">${esc(page.copy || info.seo.resources.description)}</p></section>
<div class="projects-grid">${resources.map(resource => `<article class="project-card"><img class="project-img" src="${esc(resource.image)}" alt="${esc(resource.title)}" loading="lazy" /><div class="project-content"><div class="project-head"><h2 class="project-name">${esc(resource.title)}</h2><span class="project-brand">${esc(resource.category || resource.brand || '')}</span></div><p class="project-summary">${esc(resource.summary)}</p><div class="tags">${(resource.tags || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div><div class="project-status">// ${esc(resource.status || 'available')}</div><div class="project-actions"><a class="btn btn-primary" href="/resources/${esc(resource.slug)}">details</a></div></div></article>`).join('')}</div>`;
}

function renderBlogIndex() {
  const page = blogs.page || {};
  return `<section class="page-hero"><span class="page-label">${esc(page.label || '// blog')}</span><h1>${esc(page.title || 'Minecraft development notes and studio updates.')}</h1><p class="page-copy">${esc(page.copy || info.seo.blogs.description)}</p></section>
<div class="blog-list">${blogPosts.map(post => `<article class="blog-index-card">${post.image ? `<a href="/blogs/${esc(post.slug)}" class="blog-index-media"><img src="${esc(post.image)}" alt="${esc(post.imageAlt || post.title)}" loading="lazy" /></a>` : ''}<div class="blog-index-content"><div class="blog-card-meta"><span>${esc(post.category || 'Studio')}</span><span>${esc(post.readingTime || page.defaultReadingTime || 'Quick read')}</span><span>${esc(post.date || '2026-06-15')}</span></div><a class="blog-list-title" href="/blogs/${esc(post.slug)}">${esc(post.title)}</a><p class="blog-list-summary">${esc(post.summary)}</p><div class="tags">${[...new Set([...(post.tags || []), ...(post.keywords || [])])].map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div></div></article>`).join('')}</div>`;
}

function renderBlogDetail(post) {
  const page = blogs.page || {};
  const detailConfig = page.detailLayout || {};
  const showImage = detailConfig.showImage !== false;
  const publisherHandle = post.publisherHandle || page.publisherHandle || defaultPublisherHandle;
  
  return `<article class="blog-detail">
<section class="blog-hero">
<div class="blog-hero-content">
<span class="page-label">${esc(page.label || '// blog')}</span>
<h1 class="blog-title">${esc(post.title)}</h1>
<p class="blog-summary">${esc(post.summary)}</p>
</div>
${showImage && post.image ? `<img class="blog-hero-image" src="${esc(post.image)}" alt="${esc(post.imageAlt || post.title)}" loading="eager" />` : ''}
</section>

<div class="blog-meta-section">
<div class="blog-meta">
<span class="meta-item" title="Published"><time datetime="${esc(post.date)}">${esc(formatDate(post.date))}</time></span>
<span class="meta-item" title="Last updated"><time datetime="${esc(post.updated || post.date)}">${esc(formatDate(post.updated || post.date))}</time></span>
<span class="meta-item category">${esc(post.category || page.publisherName || 'Studio')}</span>
<span class="meta-item reading-time">${esc(post.readingTime || page.defaultReadingTime || '5 min read')}</span>
<span class="meta-item publisher">by <strong>${esc(publisherHandle)}</strong></span>
</div>
<div class="blog-audience-section">
<strong>${esc(page.audienceLabel || 'For:')}</strong>
<p>${esc(post.audience || page.defaultAudience || 'Minecraft communities and creators')}</p>
</div>
</div>

<div class="blog-content">
${blogSections(post).map(section => `<section class="blog-section"><h2>${renderInlineMarkdown(section.heading)}</h2>${renderMarkdownBlock(section.body)}</section>`).join('')}
</div>

<div class="blog-footer">
<div class="blog-tags">${[...new Set([...(post.tags || []), ...(post.keywords || [])])].map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
<div class="blog-actions">
<a class="btn btn-secondary" href="${esc(page.backHref || '/blogs')}">${esc(page.backLabel || '← Back to blog')}</a>
</div>
</div>
</article>`;
}

function renderLegalDetail(pageData) {
  const page = legal.page || {};
  return `<section class="page-hero"><span class="page-label">${esc(page.label || '// legal')}</span><h1>${esc(pageData.title)}</h1><p class="page-copy">${esc(pageData.summary || pageData.description)}</p></section>
<article class="legal-detail">
<div class="blog-card-meta"><span>${esc(page.effectiveLabel || 'Effective date')} ${esc(pageData.effectiveDate || pageData.updated || '')}</span><span>${esc(page.updatedLabel || 'Last updated')} ${esc(pageData.updated || pageData.effectiveDate || '')}</span><span>${esc(page.publisherName || info.site.name)}</span><span>${esc(page.jurisdiction || info.site.location || 'Worldwide')}</span></div>
<dl class="blog-facts"><div><dt>Contact</dt><dd>${esc(page.contactEmail || 'zain@z-craft.xyz')}</dd></div><div><dt>Service area</dt><dd>${esc(page.serviceArea || info.site.serviceArea || 'Worldwide')}</dd></div></dl>
<div class="blog-body">${(pageData.sections || []).map(section => `<section><h2>${renderInlineMarkdown(section.heading)}</h2>${renderMarkdownBlock(section.body)}</section>`).join('')}</div>
<div class="tags">${(pageData.keywords || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
<div class="resource-detail-actions"><a class="btn btn-primary" href="${esc(page.contactUrl || '/contact')}">contact</a><a class="btn btn-ghost" href="${esc(page.backHref || '/contact')}">${esc(page.backLabel || 'contact ZCraft Studios')}</a></div>
</article>
`;
}

function renderLegalOverview() {
  const page = legal.page || {};
  return `<section class="page-hero"><span class="page-label">${esc(page.label || '// legal')}</span><h1>Legal Policies</h1><p class="page-copy">Terms and conditions, privacy, support, and digital resource policies for ${esc(info.site.name)}.</p></section>
<div class="blogs-list" aria-label="Legal policies"><div class="section-label">${esc(page.label || '// legal')}</div><div class="blog-list">${legalPages.map(item => `<article class="blog-list-item legal-list-card"><div class="blog-list-copy"><a class="blog-list-title" href="/legal/${esc(item.slug)}">${esc(item.title)}</a><span class="blog-list-summary">${esc(item.summary || item.description)}</span></div><div class="blog-list-meta"><span>${esc(page.updatedLabel || 'Last updated')} ${esc(item.updated || item.effectiveDate || '')}</span><span>${esc(page.publisherName || info.site.name)}</span></div></article>`).join('')}</div></div>`;
}

function renderComparisons() {
  const page = comparisons.page || {};
  return `<section class="page-hero"><span class="page-label">${esc(page.label || '// comparisons')}</span><h1>${esc(page.title || 'ZCraft Studios vs Minecraft Development Competitors')}</h1><p class="page-copy">${esc(page.copy || 'Compare ZCraft Studios with other Minecraft development options.')}</p></section>
<article class="legal-detail">
<div class="blog-card-meta"><span>${esc(page.publisherName || info.site.name)}</span><span>Updated ${esc(page.updated || '2026-06-15')}</span><span>${esc((comparisons.competitors || []).length)} competitor types</span></div>
<dl class="blog-facts"><div><dt>Best fit</dt><dd>Custom Minecraft plugins, server configs, Discord bots, web tools, anti-cheat planning, and backend consulting.</dd></div><div><dt>Service area</dt><dd>${esc(info.site.serviceArea || 'Worldwide')}</dd></div></dl>
<div class="blog-body">${(comparisons.sections || []).map(section => `<section><h2>${renderInlineMarkdown(section.heading)}</h2>${renderMarkdownBlock(section.body)}</section>`).join('')}</div>
<div class="resource-detail-actions"><a class="btn btn-primary" href="${esc(page.backHref || '/request')}">${esc(page.backLabel || 'request custom service')}</a><a class="btn btn-ghost" href="/contact">contact</a></div>
</article>
<section class="comparison-board" aria-label="Competitor comparisons"><div class="comparison-board-head"><span class="section-label">// decision matrix</span><h2>Choose by fit, not by category.</h2><p>Each option has a place. This view shows when it works, where ZCraft is stronger, and what tradeoff to expect.</p></div><div class="comparison-grid">${(comparisons.competitors || []).map(item => `<article class="comparison-card"><div class="comparison-card-top"><span>${esc(item.name)}</span></div><div class="comparison-card-body"><div><strong>Best for</strong><p>${esc(item.bestFor)}</p></div><div><strong>ZCraft fit</strong><p>${esc(item.zcraftAdvantage)}</p></div><div><strong>Tradeoff</strong><p>${esc(item.tradeoffs)}</p></div><div class="tags">${(item.keywords || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div></div></article>`).join('')}</div></section>`;
}

[
  {
    file: 'index.html',
    key: 'home',
    title: `${info.hero?.name || info.site.name} ${info.hero?.nameAccent || ''}`.trim(),
    copy: info.hero?.description || info.seo.home.description,
    sections: []
  },
  {
    file: 'about.html',
    key: 'about',
    title: info.aboutPage?.title || 'Studio-first craft for modern Minecraft resources.',
    copy: info.aboutPage?.copy || info.seo.about.description,
    sections: [
      { label: '// definition', heading: 'What is ZCraft Studios?', body: 'ZCraft Studios is a development studio for Minecraft communities that need custom plugins, server configurations, Discord automation, and web tools.' },
      { label: '// services', heading: 'How does the studio help server owners?', body: 'The studio helps server owners plan, build, configure, test, and support production-ready systems for real Minecraft communities.' }
    ]
  },
  {
    file: 'team.html',
    key: 'team',
    title: info.teamPage?.title || 'Built by a small but experienced studio crew.',
    copy: info.teamPage?.copy || info.seo.team.description,
    sections: [
      { label: '// definition', heading: 'Who is the ZCraft Studios team?', body: 'The ZCraft Studios team is a small development crew focused on Minecraft plugins, server configuration, Discord bots, web tools, and creator resources.' },
      { label: '// roles', heading: 'How does the team support clients?', body: 'The team supports clients through project scoping, development, setup guidance, product updates, bug checks, and practical contact channels.' }
    ]
  },
  {
    file: 'donate.html',
    key: 'donate',
    title: info.donate?.title || 'Support ZCraft Studios',
    copy: info.donate?.copy || info.seo.donate.description,
    sections: [
      { label: '// support', heading: info.donate?.heroTitle || 'Your support powers the studio', body: info.donate?.heroCopy || 'Donations help fund resources, maintenance, and continued development.' }
    ]
  },
  {
    file: 'request.html',
    key: 'request',
    title: info.request?.title || 'Request a Custom Service',
    copy: info.request?.copy || info.seo.request.description,
    sections: [
      { label: '// definition', heading: 'What is a custom service request?', body: 'A custom service request is a project brief for Minecraft plugin development, server setup, Discord bot work, web tools, or related technical support.' },
      { label: '// process', heading: 'How does ZCraft Studios quote requests?', body: 'ZCraft Studios reviews the platform, budget, timeline, feature list, references, and support needs before confirming scope and delivery expectations.' }
    ]
  },
  {
    file: 'contact.html',
    key: 'contact',
    title: info.contact?.title || "let's build something premium.",
    copy: info.contact?.copy || info.seo.contact.description,
    sections: [
      { label: '// definition', heading: 'What is the contact page for?', body: 'The contact page is the central place to reach ZCraft Studios for Minecraft plugin commissions, server config help, Discord bot support, and web development.' },
      { label: '// channels', heading: 'How should clients choose a channel?', body: 'Clients should use Discord for fast discussion, email for business records, and the request page for structured project briefs.' }
    ]
  }
].forEach(page => {
  const seo = info.seo[page.key];
  writeText(page.file, pageShell({
    page: page.key,
    seo,
    body: rootPageBody(page.key, page.title, page.copy, page.sections),
    structuredData: page.key === 'donate' ? [donateSchema()] : []
  }));
});

cleanGeneratedPrefix('resource-');
resources.forEach(resource => {
  writeText(`resource-${resource.slug}.html`, pageShell({
    page: 'resource-detail',
    seo: {
      title: `${resource.title} — Minecraft Resource | ZCraft Studios`,
      description: resource.what || resource.summary,
      keywords: [resource.title, resource.brand, resource.category, ...(resource.tags || []), ...(resource.supportedPlatforms || [])].filter(Boolean).join(', '),
      canonical: `/resources/${resource.slug}`,
      image: resource.image,
      imageAlt: `${resource.title} resource image`
    },
    body: renderResourceDetail(resource),
    structuredData: [resourceSchema(resource)]
  }));
});

writeText('resources.html', pageShell({
  page: 'resources',
  seo: info.seo.resources,
  body: renderResourceIndex(),
  structuredData: [{
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${info.site.name} resources`,
    itemListElement: resources.map((resource, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: resource.pageUrl,
      name: resource.title
    }))
  }]
}));

cleanGeneratedPrefix('blog-');
blogPosts.forEach(post => {
  writeText(`blog-${post.slug}.html`, pageShell({
    page: 'blog-detail',
    seo: {
      title: `${post.title} — ZCraft Studios Blog`,
      description: post.summary,
      keywords: [post.title, post.category, ...(post.tags || []), ...(post.keywords || [])].filter(Boolean).join(', '),
      canonical: `/blogs/${post.slug}`,
      image: post.image || info.branding.ogImage,
      imageAlt: post.imageAlt || `${post.title} image`
    },
    body: renderBlogDetail(post),
    structuredData: [blogPostingSchema(post)]
  }));
});

writeText('blogs.html', pageShell({
  page: 'blogs',
  seo: info.seo.blogs,
  body: renderBlogIndex(),
  structuredData: [{
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: blogs.page?.title || `${info.site.name} Blog`,
    url: `${baseUrl}/blogs`,
    blogPost: blogPosts.map(post => ({ '@type': 'BlogPosting', url: post.url, headline: post.title }))
  }]
}));

ensureDir('legal');
legalPages.forEach(pageData => {
  writeText(`legal/${pageData.slug}.html`, pageShell({
    page: 'legal-detail',
    seo: {
      title: pageData.seoTitle || `${pageData.title} — ${info.site.name}`,
      description: pageData.description || pageData.summary,
      keywords: [pageData.title, ...(pageData.keywords || [])].filter(Boolean).join(', '),
      canonical: `/legal/${pageData.slug}`,
      image: info.branding.ogImage,
      imageAlt: `${info.site.name} legal policy artwork`
    },
    body: renderLegalDetail(pageData)
  }));
});

writeText('legal.html', pageShell({
  page: 'legal-overview',
  seo: {
    title: `Legal Policies - ${info.site.name}`,
    description: `Legal policies for ${info.site.name}, including terms and conditions, privacy, support, and digital resources.`,
    keywords: legalPages.flatMap(page => [page.title, ...(page.keywords || [])]).filter(Boolean).join(', '),
    canonical: '/legal',
    image: info.branding.ogImage,
    imageAlt: `${info.site.name} legal policy artwork`
  },
  body: renderLegalOverview()
}));

writeText('comparisons.html', pageShell({
  page: 'comparisons',
  seo: {
    title: info.seo.comparisons?.title || comparisons.page?.title || 'ZCraft Studios vs Minecraft Development Competitors',
    description: info.seo.comparisons?.description || comparisons.page?.copy,
    keywords: info.seo.comparisons?.keywords || [comparisons.page?.title, ...(comparisons.page?.keywords || [])].filter(Boolean).join(', '),
    canonical: '/comparisons',
    image: info.branding.ogImage,
    imageAlt: `${info.site.name} comparison artwork`
  },
  body: renderComparisons()
}));

const today = generatedAt.slice(0, 10);
const sitemapUrls = [
  ...indexablePages.map(page => ({ loc: page.url, changefreq: page.key === 'home' ? 'weekly' : 'monthly', priority: page.key === 'home' ? '1.0' : page.key === 'resources' ? '0.9' : page.key === 'blogs' ? '0.8' : '0.7', lastmod: today })),
  { loc: `${baseUrl}/ai-agents`, changefreq: 'weekly', priority: '0.9', lastmod: today },
  ...resources.map(resource => ({ loc: resource.pageUrl, changefreq: 'weekly', priority: '0.8', lastmod: today })),
  ...blogPosts.map(post => ({ loc: post.url, changefreq: 'weekly', priority: '0.7', lastmod: post.updated || post.date || today })),
  ...legalPages.map(page => ({ loc: page.url, changefreq: 'monthly', priority: '0.5', lastmod: page.updated || page.effectiveDate || today })),
  { loc: `${baseUrl}/site-index.json`, changefreq: 'daily', priority: '0.6', lastmod: today },
  { loc: `${baseUrl}/ai-overview.json`, changefreq: 'daily', priority: '0.6', lastmod: today },
  { loc: `${baseUrl}/ai.txt`, changefreq: 'daily', priority: '0.6', lastmod: today },
  { loc: `${baseUrl}/llms.txt`, changefreq: 'weekly', priority: '0.6', lastmod: today }
];
writeText('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url>
    <loc>${esc(url.loc)}</loc>
    <lastmod>${esc(url.lastmod)}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>
`);

writeText('site-index.json', `${JSON.stringify(siteIndex, null, 2)}\n`);
writeText('ai-overview.json', `${JSON.stringify(overview, null, 2)}\n`);
writeText('config/content.generated.json', `${JSON.stringify({ resources: resourceConfigItems, blogPosts: blogConfigPosts }, null, 2)}\n`);
// Also provide a products.json derived from config/resources.json so client-side code
// that expects products can fall back to the same resource list.
try {
  const resourcesList = (resourceIndex.resources || []).map(item => typeof item === 'string' ? item : item.file || item);
  writeText('config/products.json', `${JSON.stringify({ products: resourcesList }, null, 2)}\n`);
} catch (e) {
  // ignore write errors
}
writeText('ai.txt', `${plainLines.join('\n')}\n`);

console.log('Generated site-index.json, ai-overview.json, ai.txt, sitemap.xml, config/content.generated.json, and flat detail pages');
