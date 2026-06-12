import { dbPromise } from './db';
import { drainer } from './drainer';

export async function enqueueCapture(blob: Blob, eventId: string): Promise<string> {
  const id = crypto.randomUUID();
  const db = await dbPromise();
  await db.put('captureQueue', {
    id,
    eventId,
    blob,
    contentType: 'image/jpeg',
    status: 'captured',
    createdAt: Date.now(),
    attempts: 0,
    nextAttemptAt: 0,
  });
  drainer.poke();
  return id;
}
