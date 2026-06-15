const fs = require('fs');

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function writeText(path, text) {
  fs.writeFileSync(path, text, 'utf8');
}

function ensureDir(path) {
  fs.mkdirSync(path, { recursive: true });
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
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
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

function pageShell({ seo, page, body }) {
  const pageUrl = absoluteUrl(baseUrl, seo.canonical);
  const image = absoluteUrl(baseUrl, seo.image || info.branding.ogImage);
  const robots = seo.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
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
<meta name="twitter:site" content="@zraxgaming" />
<meta name="twitter:creator" content="@zraxgaming" />
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
const products = readJson('config/products.json');
const reviews = readJson('config/reviews.json');
const blogs = readJson('config/blogs.json');
const legal = readJson('config/legal.json');
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
const projects = (products.projects || []).map(compactItem);
const resources = (products.resources || []).map(compactItem);
const blogPosts = (blogs.posts || []).map(post => ({
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
  publisherHandle: post.publisherHandle || info.contact?.primary?.handle || '@zraxgaming',
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

const categories = [...new Set([...projects, ...resources]
  .map(item => item.category)
  .filter(Boolean))]
  .sort();

const topics = [...new Set([...projects, ...resources]
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
  full_site_index_json: `${baseUrl}/site-index.json`,
  source_config: `${baseUrl}/config/info.json`,
  source_products: `${baseUrl}/config/products.json`,
  source_reviews: `${baseUrl}/config/reviews.json`,
  source_blogs: `${baseUrl}/config/blogs.json`,
  source_legal: `${baseUrl}/config/legal.json`
};

const siteIndex = {
  schemaVersion: '1.0',
  generatedAt,
  generatedFrom: ['config/info.json', 'config/products.json', 'config/reviews.json', 'config/blogs.json', 'config/legal.json'],
  site: info.site,
  branding: info.branding,
  discovery,
  crawlerGuidance: {
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
    pricingNote: 'Downloadable resource prices are listed in products.resources[].status when available. Custom commissions are quoted per project.'
  },
  pages,
  generatedDetailPages: [
    ...resources.map(resource => ({
      type: 'resource',
      title: resource.title,
      url: resource.pageUrl,
      sourceConfig: 'config/products.json'
    })),
    ...blogPosts.map(post => ({
      type: 'blog',
      title: post.title,
      url: post.url,
      sourceConfig: 'config/blogs.json'
    })),
    ...legalPages.map(page => ({
      type: 'legal',
      title: page.title,
      url: page.url,
      sourceConfig: 'config/legal.json'
    }))
  ],
  indexablePages,
  navigation: info.nav || [],
  products: {
    projects,
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
  projectCount: projects.length,
  featuredResources: resources.filter(resource => resource.featured),
  blogPostCount: blogPosts.length,
  latestBlogPosts: blogPosts.slice(0, 5),
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
    { question: `How do I get support for ${resource.title}?`, answer: resource.supportMethod || page.defaultSupportMethod || 'Use the listed product link or ZCraft Studios contact channels for support.' }
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

function renderResourceDetail(resource) {
  const page = info.resourcesPage || {};
  const headings = page.paragraphHeadings || [];
  const facts = [
    ['What it is', resource.what],
    ['Who it is for', resource.audience],
    ['Supported platforms', (resource.supportedPlatforms || []).join(', ')],
    ['Price / status', resource.status],
    ['Setup difficulty', resource.setupDifficulty],
    ['Support method', resource.supportMethod]
  ].filter(([, value]) => value);
  return `<section class="page-hero"><span class="page-label">${esc(page.detailLabel || '// resource')}</span><h1>${esc(resource.title)}</h1><p class="page-copy">${esc(resource.what || resource.summary)}</p></section>
<article class="detail-layout">
<div class="detail-media"><img src="${esc(resource.image)}" alt="${esc(resource.title)} product image" loading="eager" /></div>
<div class="detail-content">
<div class="blog-card-meta"><span>${esc(resource.category || 'Resource')}</span><span>${esc(resource.brand || 'ZCraft Studios')}</span><span>${esc(resource.status || 'Available')}</span></div>
<dl class="blog-facts">${facts.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
<div class="blog-body">${resourceParagraphs(resource).map((paragraph, index) => `<section><h2>${esc(headings[index] || headings[headings.length - 1] || 'Product details')}</h2><p>${esc(paragraph)}</p></section>`).join('')}</div>
<div class="tags">${(resource.tags || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
<div class="resource-detail-actions">${(resource.links || []).map(link => `<a class="btn btn-primary" href="${esc(link.href)}">${esc(link.labelOverride || page.externalLinkLabel || link.label)}</a>`).join('')}<a class="btn btn-ghost" href="${esc(page.backHref || '/resources')}">${esc(page.backLabel || 'all resources')}</a></div>
</div>
</article>
<section class="faq-section"><div class="section-label">// faq</div><h2>${esc(page.faqHeading || 'What do people ask about this resource?')}</h2><div class="faq-list">${resourceFaqs(resource).map(faq => `<article class="faq-item"><h3>${esc(faq.question)}</h3><p>${esc(faq.answer)}</p></article>`).join('')}</div></section>`;
}

function renderBlogDetail(post) {
  const page = blogs.page || {};
  const publisherHandle = post.publisherHandle || page.publisherHandle || info.contact?.primary?.handle || '@zraxgaming';
  return `<section class="page-hero"><span class="page-label">${esc(page.label || '// blog')}</span><h1>${esc(post.title)}</h1><p class="page-copy">${esc(post.summary)}</p></section>
<article class="blog-detail">
${post.image ? `<img class="blog-hero-image" src="${esc(post.image)}" alt="${esc(post.imageAlt || post.title)}" loading="eager" />` : ''}
<div class="blog-card-meta"><span>${esc(post.date || '2026-06-15')}</span><span>${esc(page.updatedLabel || 'Updated')} ${esc(post.updated || post.date || '2026-06-15')}</span><span>${esc(page.publisherLabel || 'Publisher')} ${esc(publisherHandle)}</span><span>${esc(post.category || page.publisherName || 'Studio')}</span><span>${esc(post.readingTime || page.defaultReadingTime || 'Quick read')}</span></div>
<dl class="blog-facts"><div><dt>${esc(page.audienceLabel || 'Who it is for')}</dt><dd>${esc(post.audience || page.defaultAudience || 'Minecraft communities and creators')}</dd></div><div><dt>${esc(page.sourceLabel || 'Source config')}</dt><dd>${esc(page.detailSourceLabel || 'config/blogs.json')}</dd></div></dl>
<div class="blog-body">${blogSections(post).map(section => `<section><h2>${renderInlineMarkdown(section.heading)}</h2>${renderMarkdownBlock(section.body)}</section>`).join('')}</div>
<div class="tags">${[...new Set([...(post.tags || []), ...(post.keywords || [])])].map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
<div class="resource-detail-actions"><a class="btn btn-ghost" href="${esc(page.backHref || '/blogs')}">${esc(page.backLabel || 'all blog posts')}</a></div>
</article>`;
}

function renderLegalDetail(pageData) {
  const page = legal.page || {};
  return `<section class="page-hero"><span class="page-label">${esc(page.label || '// legal')}</span><h1>${esc(pageData.title)}</h1><p class="page-copy">${esc(pageData.summary || pageData.description)}</p></section>
<article class="legal-detail">
<div class="blog-card-meta"><span>${esc(page.effectiveLabel || 'Effective date')} ${esc(pageData.effectiveDate || pageData.updated || '')}</span><span>${esc(page.updatedLabel || 'Last updated')} ${esc(pageData.updated || pageData.effectiveDate || '')}</span><span>${esc(page.publisherName || info.site.name)}</span><span>${esc(page.jurisdiction || info.site.location || 'Worldwide')}</span></div>
<dl class="blog-facts"><div><dt>Contact</dt><dd>${esc(page.contactEmail || 'zain@z-craft.xyz')}</dd></div><div><dt>${esc(page.sourceLabel || 'Source config')}</dt><dd>${esc(page.sourceValue || 'config/legal.json')}</dd></div><div><dt>Service area</dt><dd>${esc(page.serviceArea || info.site.serviceArea || 'Worldwide')}</dd></div></dl>
<div class="blog-body">${(pageData.sections || []).map(section => `<section><h2>${renderInlineMarkdown(section.heading)}</h2>${renderMarkdownBlock(section.body)}</section>`).join('')}</div>
<div class="tags">${(pageData.keywords || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
<div class="resource-detail-actions"><a class="btn btn-primary" href="${esc(page.contactUrl || '/contact')}">contact</a><a class="btn btn-ghost" href="${esc(page.backHref || '/contact')}">${esc(page.backLabel || 'contact ZCraft Studios')}</a></div>
</article>
${pageData.faq?.length ? `<section class="faq-section"><div class="section-label">// faq</div><h2>What do people ask about this page?</h2><div class="faq-list">${pageData.faq.map(faq => `<article class="faq-item"><h3>${esc(faq.question)}</h3><p>${esc(faq.answer)}</p></article>`).join('')}</div></section>` : ''}`;
}

ensureDir('resources');
resources.forEach(resource => {
  writeText(`resources/${resource.slug}.html`, pageShell({
    page: 'resource-detail',
    seo: {
      title: `${resource.title} — Minecraft Resource | ZCraft Studios`,
      description: resource.what || resource.summary,
      keywords: [resource.title, resource.brand, resource.category, ...(resource.tags || []), ...(resource.supportedPlatforms || [])].filter(Boolean).join(', '),
      canonical: `/resources/${resource.slug}`,
      image: resource.image,
      imageAlt: `${resource.title} product image`
    },
    body: renderResourceDetail(resource)
  }));
});

ensureDir('blogs');
blogPosts.forEach(post => {
  writeText(`blogs/${post.slug}.html`, pageShell({
    page: 'blog-detail',
    seo: {
      title: `${post.title} — ZCraft Studios Blog`,
      description: post.summary,
      keywords: [post.title, post.category, ...(post.tags || []), ...(post.keywords || [])].filter(Boolean).join(', '),
      canonical: `/blogs/${post.slug}`,
      image: post.image || info.branding.ogImage,
      imageAlt: post.imageAlt || `${post.title} image`
    },
    body: renderBlogDetail(post)
  }));
});

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

const sitemapUrls = [
  ...indexablePages.map(page => ({ loc: page.url, changefreq: page.key === 'home' ? 'weekly' : 'monthly', priority: page.key === 'home' ? '1.0' : page.key === 'resources' ? '0.9' : page.key === 'blogs' ? '0.8' : '0.7' })),
  { loc: `${baseUrl}/ai-agents`, changefreq: 'weekly', priority: '0.9' },
  ...resources.map(resource => ({ loc: resource.pageUrl, changefreq: 'weekly', priority: '0.8' })),
  ...blogPosts.map(post => ({ loc: post.url, changefreq: 'weekly', priority: '0.7' })),
  ...legalPages.map(page => ({ loc: page.url, changefreq: 'monthly', priority: '0.5' })),
  { loc: `${baseUrl}/site-index.json`, changefreq: 'daily', priority: '0.6' },
  { loc: `${baseUrl}/ai-overview.json`, changefreq: 'daily', priority: '0.6' },
  { loc: `${baseUrl}/ai.txt`, changefreq: 'daily', priority: '0.6' },
  { loc: `${baseUrl}/llms.txt`, changefreq: 'weekly', priority: '0.6' }
];
writeText('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url>
    <loc>${esc(url.loc)}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>
`);

writeText('site-index.json', `${JSON.stringify(siteIndex, null, 2)}\n`);
writeText('ai-overview.json', `${JSON.stringify(overview, null, 2)}\n`);
writeText('ai.txt', `${plainLines.join('\n')}\n`);

console.log('Generated site-index.json, ai-overview.json, ai.txt, sitemap.xml, and detail pages');
