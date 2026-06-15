const fs = require('fs');

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function writeText(path, text) {
  fs.writeFileSync(path, text, 'utf8');
}

function absoluteUrl(baseUrl, value = '/') {
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${baseUrl}${path}`;
}

function compactItem(item) {
  const firstLink = (item.links || [])[0];
  return {
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
    links: item.links || [],
    schema: {
      '@type': ['Bot', 'Plugin', 'Website'].includes(item.category) ? 'SoftwareApplication' : 'Product',
      name: item.title,
      description: item.what || item.summary,
      image: item.image,
      url: firstLink?.href || '',
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
  source_reviews: `${baseUrl}/config/reviews.json`
};

const siteIndex = {
  schemaVersion: '1.0',
  generatedAt,
  generatedFrom: ['config/info.json', 'config/products.json', 'config/reviews.json'],
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
  indexablePages,
  navigation: info.nav || [],
  products: {
    projects,
    resources,
    categories,
    topics
  },
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
  '',
  'Indexable pages:',
  ...indexablePages.map(page => `- ${page.title}: ${page.url} - ${page.description}`),
  '',
  'Featured resources:',
  ...resources
    .filter(resource => resource.featured)
    .map(resource => `- ${resource.title} (${resource.category}, ${resource.status}): ${resource.summary}`)
];

writeText('site-index.json', `${JSON.stringify(siteIndex, null, 2)}\n`);
writeText('ai-overview.json', `${JSON.stringify(overview, null, 2)}\n`);
writeText('ai.txt', `${plainLines.join('\n')}\n`);

console.log('Generated site-index.json, ai-overview.json, and ai.txt');
