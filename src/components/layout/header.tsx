'use client';

import { Menu, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'next-auth/react';
import { Sidebar } from './sidebar';

export function Header() {
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="hidden font-bold sm:inline-block">Koerner360</span>
          </a>
        </div>

        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Alternar Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        )}

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <a className="mr-6 flex items-center space-x-2 md:hidden" href="/">
              <span className="font-bold">Koerner360</span>
            </a>
          </div>
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            <MenuUsuario />
          </nav>
        </div>
      </div>
    </header>
  );
}

/**
 * Componente do menu do usuário com informações e opção de logout
 */
function MenuUsuario() {
  const { usuario, estaAutenticado } = useAuth();

  if (!estaAutenticado || !usuario) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({
      callbackUrl: '/auth/login',
      redirect: true,
    });
  };

  const obterIniciais = (nome: string) => {
    return nome
      .split(' ')
      .map(palavra => palavra.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {usuario.name ? (
              obterIniciais(usuario.name)
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {usuario.name || 'Usuário'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {usuario.email}
            </p>
            {usuario.role && (
              <p className="text-xs leading-none text-muted-foreground">
                {usuario.role}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
