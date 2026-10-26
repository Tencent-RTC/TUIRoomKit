import { svgFromHtml } from '../createIcon';

/** Toolbar captions control: rounded frame with three caption strokes. */
export const IconAISubtitles = svgFromHtml(
  'IconAISubtitles',
  '0 0 24 24',
  '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 12h4M6 16h8M14 12h4"/>',
  { stroke: 'currentColor', 'stroke-width': '2' },
);

/** Closed-caption mark used by the captions menu row. */
export const IconAISubtitleCC = svgFromHtml(
  'IconAISubtitleCC',
  '0 0 16 16',
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M1.33331 1.33325H14.6666V14.6666H1.33331V1.33325ZM2.66665 2.66659V13.3333H13.3333V2.66659H2.66665ZM3.99998 6.66659C3.99998 5.93021 4.59693 5.33325 5.33331 5.33325H7.33331V6.66659H5.33331V9.33325H7.33331V10.6666H5.33331C4.59693 10.6666 3.99998 10.0697 3.99998 9.33325V6.66659ZM8.66665 6.66659C8.66665 5.93021 9.26358 5.33325 9.99998 5.33325H12V6.66659H9.99998V9.33325H12V10.6666H9.99998C9.26358 10.6666 8.66665 10.0697 8.66665 9.33325V6.66659Z" fill="currentColor"/>',
);
