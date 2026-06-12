import 'server-only';
import { MemorySaver } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint';

let checkpointer: BaseCheckpointSaver | null = null;
let setupPromise: Promise<void> | null = null;

export async function getCheckpointer(): Promise<BaseCheckpointSaver> {
  if (checkpointer) return checkpointer;

  const url =
    process.env.ASSISTANT_DATABASE_URL ??
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DB_URL;

  if (url) {
    checkpointer = PostgresSaver.fromConnString(url);
    setupPromise ??= (checkpointer as PostgresSaver).setup().catch((e) => {
      console.error('[assistant] Postgres checkpointer setup failed', e);
      throw e;
    });
    await setupPromise;
  } else {
    checkpointer = new MemorySaver();
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[assistant] No ASSISTANT_DATABASE_URL — using in-memory checkpointer (not durable across instances)',
      );
    }
  }

  return checkpointer;
}
