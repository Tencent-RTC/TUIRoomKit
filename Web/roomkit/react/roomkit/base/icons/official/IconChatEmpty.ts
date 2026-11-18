import { svgFromHtml } from '../createIcon';

/** Two speech bubbles. The front ring follows --rk-brand (edu green, conference blue). */
export const IconChatEmpty = svgFromHtml(
  'IconChatEmpty',
  '0 0 120 96',
  '<ellipse fill="var(--rk-text-primary)" fill-opacity="0.05" cx="60" cy="88" rx="38" ry="5"/>'
  + '<g transform="rotate(-6 42 36)">'
  + '<path fill="var(--rk-bg-raised)" stroke="var(--rk-border)" d="M26 16h32a10 10 0 0 1 10 10v14a10 10 0 0 1-10 10H36l-8 7v-7h-2a10 10 0 0 1-10-10V26a10 10 0 0 1 10-10z"/>'
  + '<rect fill="var(--rk-text-primary)" fill-opacity="0.1" x="25" y="26" width="30" height="4" rx="2"/>'
  + '<rect fill="var(--rk-text-primary)" fill-opacity="0.1" x="25" y="35" width="19" height="4" rx="2"/>'
  + '</g>'
  + '<path fill="color-mix(in srgb, var(--rk-text-primary) 4%, var(--rk-bg-surface))" stroke="color-mix(in srgb, var(--rk-brand) 45%, transparent)" stroke-width="1.4" d="M54 36h36a12 12 0 0 1 12 12v16a12 12 0 0 1-12 12l4 8-12-8H54a12 12 0 0 1-12-12V48a12 12 0 0 1 12-12z"/>'
  + '<rect fill="var(--rk-text-primary)" fill-opacity="0.1" x="54" y="50" width="34" height="4" rx="2"/>'
  + '<rect fill="var(--rk-text-primary)" fill-opacity="0.1" x="54" y="59" width="22" height="4" rx="2"/>',
);
