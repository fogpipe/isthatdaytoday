#!/usr/bin/env -S deno run --allow-read --allow-write

import presets from "../data/presets.ts";
import {
  isConditional,
  mergeConditional,
  readConditional,
  resolveAnswer,
  todayMMDD,
} from "../data/answer.ts";

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
const presetBlock = `// <presets>\n    const rawPresets = [\n${rows}\n    ];\n    // </presets>`;

const answerBlock = [
  "// <answer>",
  `    const todayMMDD = ${todayMMDD.toString()};`,
  `    const mergeConditional = ${mergeConditional.toString()};`,
  `    const readConditional = ${readConditional.toString()};`,
  `    const isConditional = ${isConditional.toString()};`,
  `    const resolveAnswer = ${resolveAnswer.toString()};`,
  "    // </answer>",
].join("\n");

const indexPath = `${root}/public/index.html`;
const html = await Deno.readTextFile(indexPath);
const presetRe = /\/\/ <presets>[\s\S]*?\/\/ <\/presets>/;
const answerRe = /\/\/ <answer>[\s\S]*?\/\/ <\/answer>/;
if (!presetRe.test(html)) {
  throw new Error("preset markers not found in public/index.html");
}
if (!answerRe.test(html)) {
  throw new Error("answer markers not found in public/index.html");
}
const updated = html.replace(presetRe, presetBlock).replace(answerRe, answerBlock);
await Deno.writeTextFile(indexPath, updated);

console.log(
  `built ${sitemapEntries.length} sitemap urls, spliced ${presets.length} presets + resolver into index.html`,
);
