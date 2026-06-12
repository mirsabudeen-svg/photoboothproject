'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { EventConfig } from './event-config';

export type KioskStep =
  | 'welcome'
  | 'experience'
  | 'prep'
  | 'countdown'
  | 'capture'
  | 'review'
  | 'enhancement'
  | 'layout'
  | 'personalization'
  | 'delivery'
  | 'print-queue'
  | 'success';

export type ExperienceId = 'portrait' | 'motion' | 'group';
export type ReadinessPreset = 'single' | 'couple' | 'group';

const STEP_ORDER: KioskStep[] = [
  'welcome',
  'experience',
  'prep',
  'countdown',
  'capture',
  'review',
  'enhancement',
  'layout',
  'personalization',
  'delivery',
  'print-queue',
  'success',
];

export function stepNumber(step: KioskStep): number {
  const idx = STEP_ORDER.indexOf(step);
  return idx <= 0 ? 1 : Math.min(idx + 1, 6);
}

function experienceToPreset(id: ExperienceId): ReadinessPreset {
  if (id === 'group') return 'group';
  if (id === 'motion') return 'single';
  return 'single';
}

interface KioskSession {
  step: KioskStep;
  event: EventConfig;
  experience: ExperienceId;
  readinessPreset: ReadinessPreset;
  capturedUrl: string | null;
  captureJobId: string | null;
  retakesRemaining: number;
  staffCode: string | null;
  printRequested: boolean;
  setStep: (step: KioskStep) => void;
  goNext: () => void;
  goWelcome: () => void;
  setExperience: (id: ExperienceId) => void;
  setCapturedUrl: (url: string | null) => void;
  setCaptureJobId: (id: string | null) => void;
  consumeRetake: () => boolean;
  setStaffCode: (code: string | null) => void;
  setPrintRequested: (v: boolean) => void;
}

const KioskContext = createContext<KioskSession | null>(null);

export function KioskSessionProvider({
  event,
  children,
}: {
  event: EventConfig;
  children: ReactNode;
}) {
  const [step, setStep] = useState<KioskStep>('welcome');
  const [experience, setExperienceState] = useState<ExperienceId>('portrait');
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [captureJobId, setCaptureJobId] = useState<string | null>(null);
  const [retakesRemaining, setRetakesRemaining] = useState(2);
  const [staffCode, setStaffCode] = useState<string | null>(null);
  const [printRequested, setPrintRequested] = useState(true);

  const setExperience = useCallback((id: ExperienceId) => {
    setExperienceState(id);
  }, []);

  const goNext = useCallback(() => {
    setStep((current) => {
      const idx = STEP_ORDER.indexOf(current);
      return STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
    });
  }, []);

  const goWelcome = useCallback(() => {
    setCapturedUrl(null);
    setCaptureJobId(null);
    setRetakesRemaining(2);
    setStaffCode(null);
    setStep('welcome');
  }, []);

  const consumeRetake = useCallback(() => {
    if (retakesRemaining <= 0) return false;
    setRetakesRemaining((n) => n - 1);
    setCapturedUrl(null);
    setCaptureJobId(null);
    setStep('prep');
    return true;
  }, [retakesRemaining]);

  const value = useMemo<KioskSession>(
    () => ({
      step,
      event,
      experience,
      readinessPreset: experienceToPreset(experience),
      capturedUrl,
      captureJobId,
      retakesRemaining,
      staffCode,
      printRequested,
      setStep,
      goNext,
      goWelcome,
      setExperience,
      setCapturedUrl,
      setCaptureJobId,
      consumeRetake,
      setStaffCode,
      setPrintRequested,
    }),
    [
      step,
      event,
      experience,
      capturedUrl,
      captureJobId,
      retakesRemaining,
      staffCode,
      printRequested,
      goNext,
      goWelcome,
      setExperience,
      consumeRetake,
    ],
  );

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>;
}

export function useKioskSession(): KioskSession {
  const ctx = useContext(KioskContext);
  if (!ctx) throw new Error('useKioskSession requires KioskSessionProvider');
  return ctx;
}
