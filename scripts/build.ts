#!/usr/bin/env -S deno run --allow-read --allow-write

import presets from "../data/presets.ts";

const root = new URL("..", import.meta.url).pathname;

const slug = (day: string) => day.replace(/\s+/g, "-");
const today = new Date().toISOString().slice(0, 10);

const sitemapEntries = [
  `  <url><loc>https://isthatday.today/</loc><lastmod>${today}</lastmod></url>`,
  ...presets.map(
    (p) =>
      `  <url><loc>https://isthatday.today/${slug(p.day)}</loc><lastmod>${today}</lastmod></url>`,
  ),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join("\n")}
</urlset>
`;
await Deno.writeTextFile(`${root}/public/sitemap.xml`, sitemap);

const rows = presets.map((p) => `      ${JSON.stringify(p)},`).join("\n");
const block = `// <presets>\n    const rawPresets = [\n${rows}\n    ];\n    // </presets>`;

const indexPath = `${root}/public/index.html`;
const html = await Deno.readTextFile(indexPath);
const re = /\/\/ <presets>[\s\S]*?\/\/ <\/presets>/;
if (!re.test(html)) {
  throw new Error("preset markers not found in public/index.html");
}
const updated = html.replace(re, block);
await Deno.writeTextFile(indexPath, updated);

console.log(
  `built ${sitemapEntries.length} sitemap urls, spliced ${presets.length} presets into index.html`,
);
