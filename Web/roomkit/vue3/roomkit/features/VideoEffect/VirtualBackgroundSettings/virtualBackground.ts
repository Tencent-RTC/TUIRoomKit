/** Default wasm/assets path used by the TRTC virtual-background plugin. */
export const VIRTUAL_BACKGROUND_ASSETS_PATH = 'https://web.sdk.qcloud.com/hybrid/trtc-sdk-v5/assets';

/** Plugin error when the current TRTC package does not include virtual background. */
export const ERR_VIRTUAL_BACKGROUND_PACKAGE_REQUIRED = 5401;

export type BackgroundKind = 'none' | 'blur' | 'image';

export interface BackgroundPhoto {
  id: string;
  imagePath: string;
}

export interface BackgroundOption {
  id: string;
  kind: BackgroundKind;
  /** CSS background-image value for the thumbnail face. */
  thumbnail?: string;
  /** Image URL passed to AtomicX when kind is image. */
  imagePath?: string;
}

export interface VirtualBackgroundParams {
  enable: boolean;
  type?: 'blur' | 'image';
  imagePath?: string;
}

function photoThumbnail(imagePath: string): string {
  return `url("${imagePath}")`;
}

/** Built-in thumbnails: close, blur, then the design-mock photo set. */
export function createDefaultBackgroundOptions(photos: BackgroundPhoto[]): BackgroundOption[] {
  return [
    { id: 'none', kind: 'none' },
    { id: 'blur', kind: 'blur' },
    ...photos.map(photo => ({
      id: photo.id,
      kind: 'image' as const,
      imagePath: photo.imagePath,
      thumbnail: photoThumbnail(photo.imagePath),
    })),
  ];
}

export function toVirtualBackgroundParams(option: BackgroundOption): VirtualBackgroundParams {
  if (option.kind === 'none') {
    return { enable: false };
  }
  if (option.kind === 'blur') {
    return { enable: true, type: 'blur' };
  }
  return {
    enable: true,
    type: 'image',
    imagePath: option.imagePath,
  };
}

export function resolveSelectedBackgroundId(
  config: VirtualBackgroundParams | undefined,
  options: BackgroundOption[],
): string {
  if (!config?.enable) {
    return 'none';
  }
  if (config.type === 'blur') {
    return 'blur';
  }
  if (config.type === 'image' && config.imagePath) {
    const match = options.find(item => item.kind === 'image' && item.imagePath === config.imagePath);
    if (match) {
      return match.id;
    }
  }
  return 'none';
}

const imageCache = new Map<string, string>();
const idByImage = new Map<string, string>();

export function rememberBackgroundImage(id: string, imagePath: string) {
  imageCache.set(id, imagePath);
  idByImage.set(imagePath, id);
}

export function recalledBackgroundId(imagePath: string | undefined): string | undefined {
  if (!imagePath) {
    return undefined;
  }
  return idByImage.get(imagePath);
}

export function cachedBackgroundImage(id: string): string | undefined {
  return imageCache.get(id);
}

export async function resolveBackgroundImagePath(option: BackgroundOption): Promise<string | undefined> {
  if (option.kind !== 'image') {
    return undefined;
  }
  if (option.imagePath) {
    rememberBackgroundImage(option.id, option.imagePath);
    return option.imagePath;
  }
  return cachedBackgroundImage(option.id);
}
