import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';

type CaptureEvent = Parameters<PostHog['capture']>[0];

@Injectable()
export class PosthogService implements OnModuleDestroy {
  private readonly client: PostHog | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('POSTHOG_API_KEY');
    this.client = apiKey
      ? new PostHog(apiKey, {
          host: config.get('POSTHOG_HOST') ?? 'https://app.posthog.com',
          flushAt: 20,
          flushInterval: 5000,
        })
      : null;
  }

  capture(event: CaptureEvent): void {
    if (!this.client) return;
    const props = { ...event.properties };
    delete props.email;
    delete props.phone;
    delete props.destination;
    delete props.name;
    this.client.capture({ ...event, properties: props });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.shutdown();
  }
}
