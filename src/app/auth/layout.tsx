import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticação - Koerner360',
  description: 'Sistema de autenticação do Koerner360',
};

interface LayoutAutenticacaoProps {
  children: React.ReactNode;
}

export default function LayoutAutenticacao({
  children,
}: LayoutAutenticacaoProps) {
  return <div className="min-h-screen">{children}</div>;
}
