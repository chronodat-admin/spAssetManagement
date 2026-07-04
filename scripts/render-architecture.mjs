/**
 * Renders architecture SVG diagrams to PNG for website and docs.
 * Run: npm run assets:architecture
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { enhanceArchitectureSvg } from './architecture-diagram-enhance.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const website = join(root, 'assets', 'website');
const flatRaw = join(website, '_flat');
const docsArch = join(root, 'docs', 'architecture');

const diagrams = [
  'architecture-overview.svg',
  'architecture-data-flow.svg',
  'architecture-components.svg',
  'architecture-surfaces.svg',
  'architecture-deployment.svg',
  'architecture-modules.svg',
  'architecture-notifications.svg',
  'architecture-security.svg',
  'architecture-compliance.svg',
  'architecture-platform.svg'
];

function render(inputSvg, outputPng, width) {
  mkdirSync(dirname(outputPng), { recursive: true });
  const raw = readFileSync(inputSvg, 'utf8');
  const svg = enhanceArchitectureSvg(inputSvg.replace(/^.*[\\/]/, ''), raw);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Segoe UI'
    }
  });
  writeFileSync(outputPng, resvg.render().asPng());
  console.log(`  ${outputPng.replace(root + '\\', '').replace(root + '/', '')} (${width}px)`);
}

mkdirSync(docsArch, { recursive: true });
mkdirSync(flatRaw, { recursive: true });

console.log('Architecture PNG exports (infographic style, product icons):');
for (const name of diagrams) {
  const svgPath = join(website, name);
  render(svgPath, join(flatRaw, name.replace('.svg', '.png')), 1600);
  try {
    writeFileSync(join(docsArch, name), readFileSync(svgPath));
  } catch (err) {
    console.warn(`  (skip SVG copy to docs: ${name} � ${err.code || err.message})`);
  }
}

console.log('Done.');
