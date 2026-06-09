'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/forms/FormField';
import { Input } from '@/components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [shake, setShake] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginForm) {
    setAuthError(null);

    if (!isSupabaseConfigured() || !supabase) {
      router.push('/');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setAuthError(error.message);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-base">
      <motion.div
        animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-gold rounded-xl items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-base" />
          </div>
          <h1 className="font-display text-4xl font-light text-text-primary">Welcome back</h1>
          <p className="text-text-muted font-sans mt-2 text-sm">Sign in to manage your events</p>
        </div>

        <Card className="border-gold/20 shadow-glow">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Email" error={errors.email?.message}>
              <Input type="email" autoComplete="email" data-testid="email" {...register('email')} placeholder="you@venue.com" />
            </FormField>
            <FormField label="Password" error={errors.password?.message}>
              <Input type="password" autoComplete="current-password" data-testid="password" {...register('password')} />
            </FormField>
            {authError && <p className="text-sm text-red-400 font-sans" data-testid="login-error">{authError}</p>}
            {!isSupabaseConfigured() && (
              <p className="text-xs text-text-muted font-sans">
                Supabase not configured — sign in will redirect to dashboard in dev mode.
              </p>
            )}
            <Button type="submit" size="lg" loading={isSubmitting} className="w-full" data-testid="login-submit">
              Sign in
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
