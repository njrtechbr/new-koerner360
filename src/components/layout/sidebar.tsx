'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Home,
  MessageSquare,
  Settings,
  Trophy,
  Users,
  UserCheck,
} from 'lucide-react';

const sidebarNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Atendentes',
    href: '/dashboard/atendentes',
    icon: UserCheck,
  },
  {
    title: 'Usuários',
    href: '/dashboard/usuarios',
    icon: Users,
  },
  {
    title: 'Feedbacks',
    href: '/dashboard/feedbacks',
    icon: MessageSquare,
  },
  {
    title: 'Relatórios',
    href: '/dashboard/relatorios',
    icon: BarChart3,
  },
  {
    title: 'Gamificação',
    href: '/dashboard/gamificacao',
    icon: Trophy,
  },
  {
    title: 'Configurações',
    href: '/dashboard/configuracoes',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="">Koerner360</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {sidebarNavItems.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  pathname === item.href
                    ? 'bg-muted text-primary'
                    : 'transparent'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
