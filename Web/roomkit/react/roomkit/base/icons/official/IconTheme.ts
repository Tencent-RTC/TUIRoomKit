import { svgFromHtml } from '../createIcon';

/** Contrast circle: the filled half reads as "switch between light and dark". */
export const IconTheme = svgFromHtml(
  'IconTheme',
  '0 0 24 24',
  '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12 4.8a7.2 7.2 0 0 0 0 14.4V4.8Z" fill="currentColor"/>',
);
