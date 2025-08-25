'use client';

import { Header } from './header';
import { Footer } from './footer';
import { Sidebar } from './sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {!isMobile && (
          <aside className="hidden w-64 border-r bg-background md:block">
            <Sidebar />
          </aside>
        )}
        <main className="flex-1">
          <div className="container mx-auto px-4 py-6 md:px-6">{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
