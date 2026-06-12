import { credentials } from '../credentials';
import { refreshToken } from '../api/device';
import { dbPromise, type CaptureJob } from './db';

const MAX_ATTEMPTS = 8;

const backoff = (n: number) =>
  Math.min(60_000, 1_000 * 2 ** n) + Math.random() * 500;

export class HttpError extends Error {
  constructor(
    public status: number,
    stage: string,
  ) {
    super(`${stage} failed: HTTP ${status}`);
  }
}

class QueueDrainer {
  private running = false;
  private waiters: Array<() => void> = [];
  private listeners = new Map<string, Set<(j: CaptureJob) => void>>();

  start() {
    if (this.running) return;
    this.running = true;
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.poke());
    }
    void this.loop();
  }

  poke() {
    this.waiters.splice(0).forEach((w) => w());
  }

  onJob(id: string, cb: (j: CaptureJob) => void) {
    if (!this.listeners.has(id)) this.listeners.set(id, new Set());
    this.listeners.get(id)!.add(cb);
    return () => {
      this.listeners.get(id)?.delete(cb);
    };
  }

  async getQueueStats(): Promise<Record<string, number>> {
    const db = await dbPromise();
    const all = await db.getAll('captureQueue');
    const stats: Record<string, number> = {};
    for (const job of all) {
      stats[job.status] = (stats[job.status] ?? 0) + 1;
    }
    return stats;
  }

  async retryFailed(id: string) {
    const job = await this.get(id);
    if (!job || job.status !== 'failed') return;
    await this.save({
      ...job,
      status: 'captured',
      attempts: 0,
      nextAttemptAt: 0,
      lastError: undefined,
    });
    this.poke();
  }

  private emit(job: CaptureJob) {
    this.listeners.get(job.id)?.forEach((cb) => cb(job));
  }

  private async loop(): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const job = await this.nextActionable();
      if (!job || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        await this.sleep(
          job ? Math.max(250, job.nextAttemptAt - Date.now()) : 5_000,
        );
        continue;
      }
      try {
        await this.advance(job);
      } catch (e) {
        await this.recordFailure(job, e);
      }
    }
  }

  private async nextActionable(): Promise<CaptureJob | null> {
    const db = await dbPromise();
    const all = await db.getAllFromIndex('captureQueue', 'byCreated');
    return (
      all.find(
        (j) =>
          j.status !== 'done' &&
          j.status !== 'failed' &&
          j.nextAttemptAt <= Date.now(),
      ) ?? null
    );
  }

  private async advance(job: CaptureJob) {
    const c = credentials.load();
    if (!c) return;

    switch (job.status) {
      case 'captured':
      case 'creating': {
        await this.save({ ...job, status: 'creating' });
        const res = await fetch(`${c.apiBaseUrl}/captures`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${c.accessToken}`,
          },
          body: JSON.stringify({
            eventId: job.eventId,
            captureType: 'PHOTO',
            contentType: job.contentType,
            idempotencyKey: job.id,
            deviceId: c.deviceId,
          }),
        });
        if (res.status === 401) {
          await this.handleAuthFailure();
          return;
        }
        if (!res.ok) throw new HttpError(res.status, 'create');
        const body = await res.json();
        await this.save({
          ...job,
          status: 'created',
          captureId: body.captureId,
          objectKey: body.objectKey,
          uploadUrl: body.uploadUrl,
          uploadUrlExpiresAt: Date.now() + 14 * 60_000,
          attempts: 0,
        });
        break;
      }

      case 'created':
      case 'uploading': {
        if (!job.uploadUrl || Date.now() > (job.uploadUrlExpiresAt ?? 0)) {
          await this.save({
            ...job,
            status: 'captured',
            uploadUrl: undefined,
            uploadUrlExpiresAt: undefined,
          });
          break;
        }
        await this.save({ ...job, status: 'uploading' });
        const put = await fetch(job.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': job.contentType },
          body: job.blob,
        });
        if (!put.ok) throw new HttpError(put.status, 'upload');
        await this.save({ ...job, status: 'uploaded', attempts: 0 });
        break;
      }

      case 'uploaded':
      case 'completing': {
        await this.save({ ...job, status: 'completing' });
        const res = await fetch(
          `${c.apiBaseUrl}/captures/${job.captureId}/complete`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${c.accessToken}`,
            },
            body: JSON.stringify({
              idempotencyKey: job.id,
              objectKey: job.objectKey,
            }),
          },
        );
        if (res.status === 401) {
          await this.handleAuthFailure();
          return;
        }
        if (!res.ok) throw new HttpError(res.status, 'complete');
        const body = await res.json();
        const doneJob: CaptureJob = {
          ...job,
          status: 'done',
          galleryUrl: body.galleryUrl,
          blob: new Blob(),
        };
        await this.save(doneJob);
        break;
      }
    }
  }

  private async handleAuthFailure() {
    const c = credentials.load();
    if (!c) return;
    const refreshed = await refreshToken(c);
    if (refreshed) {
      credentials.save({
        ...c,
        accessToken: refreshed.accessToken,
        tokenExpiresAt: refreshed.tokenExpiresAt,
      });
      this.poke();
    } else {
      credentials.clear();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wpb:auth-lost'));
      }
    }
  }

  private async recordFailure(job: CaptureJob, e: unknown) {
    const attempts = job.attempts + 1;
    const permanent =
      e instanceof HttpError &&
      e.status >= 400 &&
      e.status < 500 &&
      e.status !== 429;
    await this.save({
      ...job,
      attempts,
      lastError: String(e),
      status: permanent || attempts >= MAX_ATTEMPTS ? 'failed' : job.status,
      nextAttemptAt: Date.now() + backoff(attempts),
    });
  }

  private async save(job: CaptureJob) {
    (await dbPromise()).put('captureQueue', job);
    this.emit(job);
  }

  private async get(id: string) {
    return (await dbPromise()).get('captureQueue', id);
  }

  private sleep(ms: number) {
    return new Promise<void>((resolve) => {
      this.waiters.push(resolve);
      setTimeout(resolve, ms);
    });
  }
}

export const drainer = new QueueDrainer();
