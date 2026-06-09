import Link from 'next/link';
import { fetchEvents } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default async function EventsPage() {
  const events = await fetchEvents();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl font-light text-text-primary">Events</h1>
          <p className="text-text-muted font-sans mt-1">Manage wedding and activation events</p>
        </div>
        <Link href="/events/new">
          <Button>Create Event</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {(events as Array<{ id: string; name: string; eventType: string; isActive?: boolean }>).map(
          (event) => (
            <Card key={event.id} className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl text-text-primary">{event.name}</h2>
                <p className="text-sm text-text-muted font-sans mt-1">
                  {event.eventType} · {event.id}
                </p>
              </div>
              <Badge variant={event.isActive !== false ? 'live' : 'draft'}>
                {event.isActive !== false ? 'Active' : 'Draft'}
              </Badge>
            </Card>
          ),
        )}
        {events.length === 0 && (
          <Card>
            <p className="text-text-muted font-sans">No events yet. Create your first event.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
