'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  Monitor,
  BarChart3,
  Settings,
  Zap,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/devices', label: 'Devices', icon: Monitor },
  { href: '/devices/pair', label: 'Pair Device', icon: Link2 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface border-r border-border flex flex-col z-50">
      <div className="px-6 py-7 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gold rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-base" />
          </div>
          <span className="font-display text-xl font-semibold text-text-primary tracking-wide">
            Photobooth
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} data-testid={`nav-${href === '/' ? 'dashboard' : href.replace(/^\//, '').replace(/\//g, '-')}`}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative',
                  active
                    ? 'text-gold bg-gold-muted'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5',
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gold rounded-r"
                  />
                )}
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <UserMenu />
      </div>
    </aside>
  );
}
