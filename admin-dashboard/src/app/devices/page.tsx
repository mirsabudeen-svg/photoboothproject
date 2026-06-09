import { API, adminHeaders } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

async function getDevices() {
  const res = await fetch(`${API}/devices`, { cache: 'no-store', headers: adminHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export default async function DevicesPage() {
  const devices = await getDevices();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl font-light text-text-primary">Devices</h1>
          <p className="text-text-muted font-sans mt-1">Paired kiosk hardware</p>
        </div>
        <Link
          href="/devices/pair"
          className="px-5 py-2.5 rounded-xl bg-gold text-base text-sm font-sans font-medium"
        >
          Pair Device
        </Link>
      </div>

      <div className="grid gap-4">
        {(devices as Array<{
          id: string;
          name: string;
          model: string;
          createdAt: string;
          lastSeenAt?: string | null;
        }>).map((device) => (
          <Card key={device.id} className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-text-primary">{device.name}</h2>
              <p className="text-sm text-text-muted font-sans mt-1">
                {device.model} · paired {new Date(device.createdAt).toLocaleString()}
              </p>
            </div>
            <Badge variant={device.lastSeenAt ? 'live' : 'offline'}>
              {device.lastSeenAt ? 'Online' : 'Offline'}
            </Badge>
          </Card>
        ))}
        {devices.length === 0 && (
          <Card>
            <p className="text-text-muted font-sans">No paired devices yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
