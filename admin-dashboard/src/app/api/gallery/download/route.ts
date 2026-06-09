import { NextRequest, NextResponse } from 'next/server';

const TOKEN_RE = /^[a-f0-9]{12}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const key = searchParams.get('key');
  const token = searchParams.get('token');
  const eventId = searchParams.get('eventId');

  if (!key || !token || !eventId || !TOKEN_RE.test(token)) {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
  const galleryRes = await fetch(
    `${base}/gallery/${eventId}?token=${encodeURIComponent(token)}&limit=1`,
    { cache: 'no-store' },
  );
  if (!galleryRes.ok) {
    return NextResponse.json({ message: 'Invalid gallery token' }, { status: 401 });
  }

  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!publicBase) {
    return NextResponse.json({ message: 'Download not configured' }, { status: 503 });
  }

  const objectUrl = `${publicBase.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  const objectRes = await fetch(objectUrl);
  if (!objectRes.ok) {
    return NextResponse.json({ message: 'Object not found' }, { status: 404 });
  }

  const filename = key.split('/').pop() ?? 'photo.jpg';
  return new NextResponse(objectRes.body, {
    headers: {
      'Content-Type': objectRes.headers.get('Content-Type') ?? 'image/jpeg',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
