import { svgFromHtml } from '../createIcon';

/** Corner radius is uniform across the three panels so they read as one set. */
export const IconLayout = svgFromHtml(
  'IconLayout',
  '0 0 20 20',
  '<rect x="2.5" y="3.333" width="7.5" height="13.333" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="12.5" y="3.333" width="5" height="3.333" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="12.5" y="9.167" width="5" height="7.5" rx="1.5" stroke="currentColor" stroke-width="1.7"/>',
);
