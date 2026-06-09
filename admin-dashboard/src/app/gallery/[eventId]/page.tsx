import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GalleryGrid, GalleryCaptureItem } from '@/components/gallery/GalleryGrid';
import { GalleryHeader, GalleryEventInfo } from '@/components/gallery/GalleryHeader';

interface GalleryData {
  event: GalleryEventInfo;
  captures: GalleryCaptureItem[];
}

interface Props {
  params: { eventId: string };
  searchParams: { token?: string };
}

async function fetchGallery(eventId: string, token: string): Promise<GalleryData | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
  const res = await fetch(`${base}/gallery/${eventId}?token=${encodeURIComponent(token)}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const data = await fetchGallery(params.eventId, searchParams.token ?? '').catch(() => null);
  return {
    title: data ? `${data.event.name} — Photo Gallery` : 'Photo Gallery',
    openGraph: { type: 'website' },
  };
}

export default async function GalleryPage({ params, searchParams }: Props) {
  const token = searchParams.token ?? '';
  if (!token) notFound();

  const data = await fetchGallery(params.eventId, token);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-base font-sans">
      <GalleryHeader event={data.event} totalCaptures={data.captures.length} />
      <GalleryGrid
        captures={data.captures}
        primaryColor={data.event.primaryColor}
        galleryToken={token}
        eventId={params.eventId}
      />
    </div>
  );
}
