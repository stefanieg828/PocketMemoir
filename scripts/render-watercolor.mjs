#!/usr/bin/env node
/**
 * Paint the Soft Storybook watercolor textures once, in headless Chromium, and
 * save them as small WebP files under src/styles/tex/ (bundled by Vite).
 *
 *   node scripts/render-watercolor.mjs
 *
 * Blooms: irregular pigment shapes with a darker pooled rim, granulation and a
 * lighter backrun, painted at ~60% so they stay gentle. Paper: tileable
 * cold-press tooth (alpha only).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const OUT = join(process.cwd(), "src", "styles", "tex");
mkdirSync(OUT, { recursive: true });

const PIGMENTS = {
  peach: "#eaa487",
  sage: "#93b58b",
  duck: "#8fbfba",
  apricot: "#e9b77f",
  rose: "#dd9a9c",
  cream: "#e2cfa6",
};

function bloomSvg(color, seed, { w = 380, h = 290, rim = 0.8, grain = 1.2, blobs = 5 } = {}) {
  // pseudo-random but deterministic blob layout
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const shapes = [];
  for (let i = 0; i < blobs; i++) {
    const cx = w * (0.36 + rnd() * 0.28);
    const cy = h * (0.38 + rnd() * 0.24);
    const rx = w * (0.2 + rnd() * 0.13);
    const ry = h * (0.19 + rnd() * 0.12);
    const op = (0.28 + rnd() * 0.3).toFixed(2);
    shapes.push(`<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="${color}" fill-opacity="${op}"/>`);
  }
  // lighter backrun (cauliflower bloom) near one side
  const bx = w * (0.35 + rnd() * 0.3), by = h * (0.35 + rnd() * 0.3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="f" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="4" seed="${seed}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="70" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="${seed + 3}" result="n2"/>
      <feDisplacementMap in="d" in2="n2" scale="7" xChannelSelector="R" yChannelSelector="G" result="d2"/>
      <feGaussianBlur in="d2" stdDeviation="1.1" result="soft"/>
      <feMorphology in="soft" operator="erode" radius="4" result="er"/>
      <feGaussianBlur in="er" stdDeviation="5" result="erb"/>
      <feComposite in="soft" in2="erb" operator="out" result="rimRaw"/>
      <feColorMatrix in="rimRaw" type="matrix" values="0.72 0 0 0 0  0 0.72 0 0 0  0 0 0.72 0 0  0 0 0 ${rim} 0" result="rim"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="${seed + 7}" result="low"/>
      <feColorMatrix in="low" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -0.25" result="lowA"/>
      <feComposite in="soft" in2="lowA" operator="in" result="uneven"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="${seed + 11}" result="g"/>
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -${grain} 1.35" result="gA"/>
      <feComposite in="uneven" in2="gA" operator="in" result="gran"/>
      <feMerge><feMergeNode in="soft"/><feMergeNode in="gran"/><feMergeNode in="rim"/></feMerge>
    </filter>
    <filter id="b" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" seed="${seed + 5}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="55" xChannelSelector="R" yChannelSelector="G"/>
      <feGaussianBlur stdDeviation="3"/>
    </filter>
  </defs>
  <g filter="url(#f)" opacity=".9">${shapes.join("")}</g>
  <g filter="url(#b)"><ellipse cx="${bx.toFixed(0)}" cy="${by.toFixed(0)}" rx="${(w * 0.09).toFixed(0)}" ry="${(h * 0.07).toFixed(0)}" fill="#fffaf0" fill-opacity=".28"/></g>
</svg>`;
}

function paperSvg(size = 200) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <filter id="p" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="4" stitchTiles="stitch" result="t"/>
    <feDiffuseLighting in="t" lighting-color="#fff" surfaceScale="1.3" diffuseConstant="1" result="l">
      <feDistantLight azimuth="235" elevation="62"/>
    </feDiffuseLighting>
    <feColorMatrix in="l" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.2  -0.32 0 0 0 0.3"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#p)"/>
</svg>`;
}

const jobs = [];
let seed = 3;
for (const [name, color] of Object.entries(PIGMENTS)) {
  jobs.push({ file: `wc-${name}.webp`, svg: bloomSvg(color, seed), q: 0.74, alpha: 0.6 });
  if (["peach", "sage", "duck"].includes(name)) {
    jobs.push({ file: `wc-${name}-b.webp`, svg: bloomSvg(color, seed + 40, { blobs: 3, rim: 0.95 }), q: 0.74, alpha: 0.6 });
  }
  seed += 7;
}
jobs.push({ file: "paper-tooth.webp", svg: paperSvg(), q: 0.7, alpha: 1 });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent("<html><body></body></html>");
for (const job of jobs) {
  const dataUrl = await page.evaluate(async ({ svg, q, alpha }) => {
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.globalAlpha = alpha; // paint thin: stack a layer twice where more pigment is wanted
    ctx.drawImage(img, 0, 0);
    return c.toDataURL("image/webp", q);
  }, job);
  const buf = Buffer.from(dataUrl.split(",")[1], "base64");
  writeFileSync(join(OUT, job.file), buf);
  console.log(`${job.file}  ${(buf.length / 1024).toFixed(1)} KB`);
}
await browser.close();
