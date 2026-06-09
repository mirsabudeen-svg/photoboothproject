'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

export function UserMenu() {
  const router = useRouter();

  async function signOut() {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    router.push('/login');
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
      <LogOut className="w-4 h-4" />
      Sign out
    </Button>
  );
}
