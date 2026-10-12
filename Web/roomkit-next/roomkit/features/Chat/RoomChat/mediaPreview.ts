export type ChatMediaPreviewKind = 'image' | 'video' | 'audio';

export interface ChatMediaPreview {
  kind: ChatMediaPreviewKind;
  src: string;
  poster?: string;
}
