'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AtelierButton } from '@/components/primitives/AtelierButton';
import { SelectionCard } from '@/components/primitives/SelectionCard';
import { ScreenShell } from '@/components/primitives/ScreenShell';
import { getEventLine } from '@/lib/event-config';
import { stepNumber, useKioskSession, type ExperienceId } from '@/lib/kiosk-session';

const OPTIONS: { id: ExperienceId; title: string; tag: string }[] = [
  { id: 'portrait', title: 'Portrait', tag: 'Classic' },
  { id: 'motion', title: 'Motion', tag: 'GIF · Boomerang' },
  { id: 'group', title: 'Group', tag: '2–8 guests' },
];

export function ExperienceScreen() {
  const { event, experience, setExperience, goNext } = useKioskSession();
  const [motionOpen, setMotionOpen] = useState(false);

  const selected = experience;

  return (
    <ScreenShell eventLine={getEventLine(event)} footLine={`Step ${stepNumber('experience')} of 6`}>
      <p className="font-body text-k-sub text-content-primary text-center">
        Choose your moment
      </p>

      <motion.div
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
        className="w-full max-w-xl flex flex-col gap-6"
      >
        {OPTIONS.filter((o) => o.id !== 'motion').map((opt) => (
          <SelectionCard
            key={opt.id}
            title={opt.title}
            tag={opt.tag}
            selected={selected === opt.id}
            onSelect={() => setExperience(opt.id)}
          />
        ))}
        <SelectionCard
          title="Motion"
          tag={motionOpen ? 'GIF · Boomerang' : 'Expand'}
          selected={selected === 'motion'}
          onSelect={() => {
            setMotionOpen(true);
            setExperience('motion');
          }}
        />
      </motion.div>

      <AtelierButton variant="primary" onClick={goNext}>
        Continue
      </AtelierButton>
    </ScreenShell>
  );
}
