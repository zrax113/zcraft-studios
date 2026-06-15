# Content Management

This site is config-driven. Edit JSON files, then run:

```bash
npm run build
```

The build regenerates detail pages, sitemap, `site-index.json`, `ai-overview.json`, and `ai.txt`.

## Blogs

Blog index file:

```text
config/blogs.json
```

Individual blog files:

```text
config/blogs/blog1.json
```

`config/blogs.json` controls the blog page metadata and the ordered list of posts:

```json
{
  "posts": [
    { "file": "blogs/blog1.json" }
  ]
}
```

To add a blog:

1. Create a new file in `config/blogs/`, for example `config/blogs/blog2.json`.
2. Add `{ "file": "blogs/blog2.json" }` to `posts` in `config/blogs.json`.
3. Run `npm run build`.

Recommended blog fields:

```json
{
  "title": "What makes a Minecraft config resource production-ready?",
  "slug": "production-ready-minecraft-configs",
  "date": "2026-06-15",
  "updated": "2026-06-15",
  "category": "Server Configuration",
  "image": "https://example.com/image.png",
  "imageAlt": "Short image description",
  "summary": "A concise article summary.",
  "audience": "Who this article is for.",
  "tags": ["Minecraft configs", "LuckPerms"],
  "keywords": ["Minecraft server configs"],
  "readingTime": "3 min read",
  "sections": [
    {
      "heading": "How should a config be documented?",
      "body": "Use normal text, **bold**, *italic*, `code`, bullets, and [links](/resources)."
    }
  ]
}
```

Supported body formatting:

- Headings with `#`, `##`, or `###`
- Bullets with `- item`
- Links like `[label](https://example.com)` or `[label](/internal-page)`
- Inline `code`
- `**bold**` and `*italic*`

## Resources

Resource index file:

```text
config/resources.json
```

Individual resource files:

```text
config/resources/*.json
```

`config/resources.json` controls the ordered resource list:

```json
{
  "resources": [
    { "file": "resources/visual-config-studio.json" }
  ]
}
```

To add a resource:

1. Create a new file in `config/resources/`.
2. Add it to `resources` in `config/resources.json`.
3. Run `npm run build`.

Recommended resource fields:

```json
{
  "title": "Visual Config Studio",
  "slug": "visual-config-studio",
  "brand": "Website",
  "category": "Website",
  "featured": true,
  "image": "https://example.com/resource.png",
  "summary": "Short card summary.",
  "what": "One-sentence resource definition.",
  "audience": "Who should use it.",
  "supportedPlatforms": ["Web browser", "Minecraft plugin configs"],
  "setupDifficulty": "Easy",
  "status": "$5.47",
  "supportMethod": "BuiltByBit resource page and ZCraft Studios contact channels.",
  "tags": ["Web", "Configs", "Visual"],
  "links": [
    {
      "label": "View",
      "href": "https://example.com/resource",
      "variant": "primary"
    }
  ],
  "paragraphs": [
    "Optional detail paragraph one.",
    "Optional detail paragraph two.",
    "Optional detail paragraph three."
  ]
}
```

Notes:

- `slug` controls the URL: `/resources/{slug}`.
- `featured: true` makes the resource eligible for featured sections.
- `status` can be a price, `Free`, `available`, or another short label.
- If `paragraphs` is omitted, the site generates simple detail copy from the other fields.

## Site-Level Customization

Main site settings live in:

```text
config/info.json
```

Common areas to edit:

- `site`: name, domain, tagline, author, service area.
- `branding`: favicon, logo, Open Graph image, theme color.
- `social`: Twitter handles and public same-as profile links.
- `nav`: top navigation links.
- `footer.links`: secondary footer links.
- `seo`: title, description, keywords, canonical path per page.
- `homePage`, `resourcesPage`, `request`, `donate`, `contact`, `teamPage`: page-specific labels and copy.

After editing any config, run:

```bash
npm run build
```
