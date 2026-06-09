export interface GalleryEventInfo {
  name: string;
  theme: string;
  primaryColor: string;
}

export interface GalleryCaptureItem {
  id: string;
  type: string;
  thumbnailUrl: string;
  fullUrl: string;
  capturedAt: Date;
}

export interface GalleryResponse {
  event: GalleryEventInfo;
  captures: GalleryCaptureItem[];
  nextCursor: string | null;
}
