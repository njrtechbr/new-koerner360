'use client';

import React from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ModalNotificacoes } from './modal-notificacoes';
import { useNotificacoes } from '@/contexts/notificacoes-context';

interface IndicadorNotificacoesProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function IndicadorNotificacoes({
  variant = 'ghost',
  size = 'default',
  showLabel = false,
  className,
}: IndicadorNotificacoesProps) {
  const { notificacoesPendentes, carregandoNotificacoes } = useNotificacoes();
  const [modalAberto, setModalAberto] = React.useState(false);

  const totalNotificacoes = notificacoesPendentes.length;
  const notificacoesAlta = notificacoesPendentes.filter(n => n.urgencia === 'alta').length;
  const hasNotificacoes = totalNotificacoes > 0;
  const hasNotificacoesAlta = notificacoesAlta > 0;

  const getTooltipText = () => {
    if (carregandoNotificacoes) {
      return 'Carregando notificações...';
    }
    
    if (!hasNotificacoes) {
      return 'Nenhuma notificação pendente';
    }

    const textoBase = `${totalNotificacoes} notificação${totalNotificacoes !== 1 ? 'ões' : ''} pendente${totalNotificacoes !== 1 ? 's' : ''}`;
    
    if (hasNotificacoesAlta) {
      return `${textoBase} (${notificacoesAlta} de alta urgência)`;
    }
    
    return textoBase;
  };

  const getBellIcon = () => {
    if (hasNotificacoesAlta) {
      return <BellRing className={`${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} ${hasNotificacoesAlta ? 'text-red-500 animate-pulse' : ''}`} />;
    }
    
    return <Bell className={`${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} ${hasNotificacoes ? 'text-orange-500' : ''}`} />;
  };

  const trigger = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={`relative ${className || ''}`}
            onClick={() => setModalAberto(true)}
          >
            {getBellIcon()}
            {showLabel && (
              <span className="ml-2">
                Notificações
              </span>
            )}
            
            {/* Badge de contagem */}
            {hasNotificacoes && (
              <Badge
                variant={hasNotificacoesAlta ? 'destructive' : 'secondary'}
                className={`absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold ${
                  hasNotificacoesAlta ? 'animate-pulse' : ''
                }`}
              >
                {totalNotificacoes > 99 ? '99+' : totalNotificacoes}
              </Badge>
            )}
            
            {/* Indicador de carregamento */}
            {carregandoNotificacoes && (
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <ModalNotificacoes
      trigger={trigger}
      open={modalAberto}
      onOpenChange={setModalAberto}
    />
  );
}

// Componente simplificado para uso em layouts
export function NotificationBell() {
  return (
    <IndicadorNotificacoes
      variant="ghost"
      size="default"
      showLabel={false}
    />
  );
}

// Componente para sidebar com label
export function NotificationMenuItem() {
  return (
    <IndicadorNotificacoes
      variant="ghost"
      size="default"
      showLabel={true}
      className="w-full justify-start"
    />
  );
}