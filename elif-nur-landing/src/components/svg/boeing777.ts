/** Top-down Boeing 777 silhouette for globe flight markers & HUD accents. */
export const BOEING_777_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="b777Wing" x1="0" y1="48" x2="96" y2="48">
      <stop offset="0%" stop-color="#2a2620"/>
      <stop offset="50%" stop-color="#3d3830"/>
      <stop offset="100%" stop-color="#2a2620"/>
    </linearGradient>
    <linearGradient id="b777Fus" x1="48" y1="8" x2="48" y2="88">
      <stop offset="0%" stop-color="#F5EDE4"/>
      <stop offset="35%" stop-color="#D4A017"/>
      <stop offset="100%" stop-color="#C25B3F"/>
    </linearGradient>
    <filter id="b777Glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#b777Glow)">
    <path d="M10 46 L86 46 L82 50 L14 50 Z" fill="url(#b777Wing)" stroke="#D4A017" stroke-width="0.7" opacity="0.95"/>
    <path d="M38 10 L58 10 L54 22 L42 22 Z" fill="#C25B3F" stroke="#D4A017" stroke-width="0.6"/>
    <ellipse cx="48" cy="48" rx="7.5" ry="30" fill="#1a1814" stroke="url(#b777Fus)" stroke-width="1.2"/>
    <ellipse cx="48" cy="68" rx="4" ry="3" fill="#85B8CB" opacity="0.85"/>
    <ellipse cx="26" cy="48" rx="4.2" ry="6.5" fill="#1a1814" stroke="#D4A017" stroke-width="0.8"/>
    <ellipse cx="70" cy="48" rx="4.2" ry="6.5" fill="#1a1814" stroke="#D4A017" stroke-width="0.8"/>
    <circle cx="26" cy="48" r="2" fill="#D4A017" opacity="0.9"/>
    <circle cx="70" cy="48" r="2" fill="#D4A017" opacity="0.9"/>
    <path d="M44 76 L52 76 L50 84 L46 84 Z" fill="#C25B3F" stroke="#F5EDE4" stroke-width="0.5"/>
  </g>
</svg>`;

export const BOEING_777_COMPACT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true">
  <path d="M24 4 L26 16 L44 20 L26 24 L28 40 L24 36 L20 40 L22 24 L4 20 L22 16 Z" fill="#D4A017" stroke="#F5EDE4" stroke-width="1"/>
  <ellipse cx="14" cy="20" rx="2" ry="3" fill="#1a1814" stroke="#D4A017" stroke-width="0.6"/>
  <ellipse cx="34" cy="20" rx="2" ry="3" fill="#1a1814" stroke="#D4A017" stroke-width="0.6"/>
</svg>`;
