import { svgFromHtml } from '../createIcon';

/**
 * Error badge stamped on a device button: a filled disc with a cross. The disc takes
 * currentColor so the caller picks the severity; the cross stays white on top of it.
 */
export const IconUnSupport = svgFromHtml(
  'IconUnSupport',
  '0 0 14 14',
  "<circle cx=\"7\" cy=\"7\" r=\"7\" fill=\"currentColor\"/><path d=\"M10 4 4 10M4 4l6 6\" stroke=\"#fff\" stroke-width=\"1.5\"/>",
);
