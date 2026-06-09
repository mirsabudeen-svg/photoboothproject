import { Card } from '@/components/ui/Card';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-4xl font-light text-text-primary">Settings</h1>
        <p className="text-text-muted font-sans mt-1">Platform configuration</p>
      </div>
      <Card className="space-y-4">
        <div>
          <h2 className="font-sans text-sm font-medium text-text-muted">API Backend</h2>
          <p className="text-text-primary font-sans mt-1">
            {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'}
          </p>
        </div>
        <div>
          <h2 className="font-sans text-sm font-medium text-text-muted">Supabase</h2>
          <p className="text-text-primary font-sans mt-1">
            {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Connected' : 'Not configured'}
          </p>
        </div>
      </Card>
    </div>
  );
}
