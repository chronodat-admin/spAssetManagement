/**
 * Infographic enhancements for architecture SVG diagrams:
 * decorative background, product icon badges, letter-placeholder removal.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const website = join(root, 'assets', 'website');
const iconsDir = join(website, 'icons');
const placementsPath = join(website, 'architecture-icon-placements.json');

const INFOGRAPHIC_DEFS = `
    <pattern id="dotGrid" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.6" fill="#008080" opacity="0.07"/>
    </pattern>
    <linearGradient id="infographicBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="55%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#eef6f6"/>
    </linearGradient>
    <filter id="iconShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.1"/>
    </filter>
`;

const LETTER_BOX_RE =
  /<rect x="(\d+)" y="(\d+)" width="48" height="48" rx="10" fill="#(?:008080|6264A7)"\s*\/>\s*<text x="(\d+)" y="(\d+)" text-anchor="middle" font-size="(?:20|22)" fill="#ffffff">[A-Z]<\/text>/g;

const HUB_DIAMONDS_RE =
  /<path d="M600 295 L630 330 L600 365 L570 330 Z" fill="#ffffff"\s*\/>\s*<path d="M570 350 L600 380 L630 350 L600 320 Z" fill="#ffffff" opacity="0.85"\s*\/>/;

function loadPlacements() {
  return JSON.parse(readFileSync(placementsPath, 'utf8'));
}

function iconImageTag(icon, x, y, size) {
  const href = join(iconsDir, `${icon}.svg`).replace(/\\/g, '/');
  return `<image href="${href}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
}

function iconBadge(icon, x, y, size) {
  const pad = 4;
  return `<g filter="url(#iconShadow)">
    <rect x="${x - pad}" y="${y - pad}" width="${size + pad * 2}" height="${size + pad * 2}" rx="12" fill="#ffffff" stroke="#e2e8f0"/>
    ${iconImageTag(icon, x, y, size)}
  </g>`;
}

function injectDefs(svg) {
  if (svg.includes('id="dotGrid"')) {
    return svg;
  }
  if (svg.includes('<defs>')) {
    return svg.replace('<defs>', `<defs>${INFOGRAPHIC_DEFS}`);
  }
  return svg.replace(
    /<svg([^>]*)>/,
    `<svg$1><defs>${INFOGRAPHIC_DEFS}</defs>`
  );
}

function injectBackground(svg) {
  if (svg.includes('fill="url(#dotGrid)"')) {
    return svg;
  }

  let updated = svg;
  if (updated.includes('fill="url(#bg)"')) {
    updated = updated.replace(
      /<rect width="1200" height="(?:675|680)" fill="url\(#bg\)"\/>/,
      `<rect width="1200" height="${
        updated.includes('height="680"') ? '680' : '675'
      }" fill="url(#infographicBg)"/>
  <rect width="1200" height="${updated.includes('height="680"') ? '680' : '675'}" fill="url(#dotGrid)"/>`
    );
  } else if (updated.includes('fill="#faf9f8"')) {
    updated = updated.replace(
      /<rect width="1200" height="680" fill="#faf9f8"\/>/,
      `<rect width="1200" height="680" fill="url(#infographicBg)"/>
  <rect width="1200" height="680" fill="url(#dotGrid)"/>`
    );
  }
  return updated;
}

function removeLetterPlaceholders(svg) {
  return svg.replace(LETTER_BOX_RE, '');
}

function removeHubDiamonds(svg) {
  return svg.replace(HUB_DIAMONDS_RE, '');
}

function applyIcons(svg, fileName) {
  const placements = loadPlacements()[fileName] || [];
  if (!placements.length) {
    return svg;
  }

  let updated = svg;
  if (placements.some((p) => p.removeLetter)) {
    updated = removeLetterPlaceholders(updated);
  }
  if (placements.some((p) => p.centerHub)) {
    updated = removeHubDiamonds(updated);
  }

  const iconLayer = placements
    .map((p) => {
      const x = p.x + (p.offsetX || 0);
      const y = p.y;
      const size = p.size || 40;
      if (p.centerHub) {
        return iconImageTag(p.icon, x, y, size);
      }
      return iconBadge(p.icon, x, y, size);
    })
    .join('\n  ');

  if (updated.includes('</svg>')) {
    updated = updated.replace('</svg>', `  <g aria-hidden="true">${iconLayer}</g>\n</svg>`);
  }
  return updated;
}

export function enhanceArchitectureSvg(fileName, svgContent) {
  let svg = svgContent;
  svg = injectDefs(svg);
  svg = injectBackground(svg);
  svg = applyIcons(svg, fileName);
  return svg;
}

export function iconsDirectory() {
  return iconsDir;
}
