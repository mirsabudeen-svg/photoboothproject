'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import { ThemeSelector } from '@/components/forms/ThemeSelector';
import { AIGenerateButton } from '@/components/forms/AIGenerateButton';
import { CameraPreview } from '@/components/CameraPreview';

const eventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  theme: z.enum(['luxury_gold', 'kerala_traditional', 'royal_purple']),
  captureMode: z.enum(['photo', 'gif', 'boomerang', 'all']),
  consentText: z.string().min(20, 'Consent text must be at least 20 characters'),
  hashtag: z.string().optional(),
  shareChannels: z
    .array(z.enum(['qr', 'sms', 'email', 'whatsapp']))
    .min(1, 'Select at least one share channel'),
  retentionDays: z.number().min(1).max(365),
});

type EventFormData = z.infer<typeof eventSchema>;

const shareOptions = ['qr', 'sms', 'email', 'whatsapp'] as const;

export default function NewEventPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const [showCamera, setShowCamera] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      theme: 'luxury_gold',
      captureMode: 'photo',
      shareChannels: ['qr'],
      retentionDays: 30,
      consentText:
        'I consent to having my photo taken at this event and understand images may be shared with other guests and used for event promotion. Photos are retained for 30 days.',
    },
  });

  const name = watch('name');
  const theme = watch('theme');
  const shareChannels = watch('shareChannels');

  function toggleChannel(channel: (typeof shareOptions)[number]) {
    const next = shareChannels.includes(channel)
      ? shareChannels.filter((c) => c !== channel)
      : [...shareChannels, channel];
    setValue('shareChannels', next.length ? next : ['qr'], { shouldValidate: true });
  }

  async function onSubmit(data: EventFormData) {
    setSubmitError(null);
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        eventType: 'WEDDING',
        config: {
          theme: data.theme,
          captureMode: data.captureMode,
          consentText: data.consentText,
          hashtag: data.hashtag,
          shareChannels: data.shareChannels,
          retentionDays: data.retentionDays,
        },
      }),
    });
    if (!res.ok) {
      setSubmitError('Failed to create event');
      return;
    }
    posthog?.capture('event_created', {
      theme: data.theme,
      captureMode: data.captureMode,
    });
    router.push('/events');
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-4xl font-light text-text-primary">Create Event</h1>
        <p className="text-text-muted font-sans mt-1">Configure a new photobooth activation</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField label="Event Name" error={errors.name?.message}>
          <Input data-testid="event-name" {...register('name')} placeholder="Summer Wedding â€” Sarah & James" />
          {errors.name && <span data-testid="error-name" className="sr-only">{errors.name.message}</span>}
        </FormField>

        <FormField label="Theme" error={errors.theme?.message}>
          <div data-testid="event-theme">
            <ThemeSelector value={theme} onChange={(v) => setValue('theme', v)} />
          </div>
        </FormField>

        <FormField label="Capture Mode" error={errors.captureMode?.message}>
          <Select {...register('captureMode')}>
            <option value="photo">Photo only</option>
            <option value="gif">GIF only</option>
            <option value="boomerang">Boomerang only</option>
            <option value="all">All modes</option>
          </Select>
        </FormField>

        <FormField label="Consent Text" error={errors.consentText?.message}>
          <Textarea data-testid="consent-text" {...register('consentText')} rows={4} />
          <AIGenerateButton
            field="consentText"
            eventName={name}
            onGenerated={(v) => setValue('consentText', v, { shouldValidate: true })}
          />
        </FormField>

        <FormField label="Hashtag" error={errors.hashtag?.message}>
          <Input {...register('hashtag')} placeholder="#SarahAndJames" />
          <AIGenerateButton
            field="hashtag"
            eventName={name}
            onGenerated={(v) => setValue('hashtag', v, { shouldValidate: true })}
          />
        </FormField>

        <FormField label="Share Channels" error={errors.shareChannels?.message}>
          <div className="flex flex-wrap gap-2">
            {shareOptions.map((channel) => (
              <button
                key={channel}
                type="button"
                data-testid={`channel-${channel}`}
                onClick={() => toggleChannel(channel)}
                className={`px-3 py-1.5 rounded-lg text-sm font-sans border capitalize ${
                  shareChannels.includes(channel)
                    ? 'border-gold bg-gold-muted text-gold'
                    : 'border-border text-text-muted hover:border-gold/30'
                }`}
              >
                {channel}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Retention (days)" error={errors.retentionDays?.message}>
          <Input
            type="number"
            {...register('retentionDays', { valueAsNumber: true })}
            min={1}
            max={365}
          />
        </FormField>

        <div>
          <button
            type="button"
            onClick={() => setShowCamera((v) => !v)}
            className="text-sm font-sans text-gold hover:text-gold/80"
          >
            {showCamera ? 'Hide camera test' : 'Test your camera'}
          </button>
          {showCamera && (
            <div className="mt-4">
              <CameraPreview />
            </div>
          )}
        </div>

        {submitError && <p className="text-sm text-red-400 font-sans">{submitError}</p>}

        <Button type="submit" loading={isSubmitting} size="lg" data-testid="create-event-submit">
          Create Event
        </Button>
      </form>
    </div>
  );
}

