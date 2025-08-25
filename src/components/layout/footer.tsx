export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2024 Koerner360. Todos os direitos reservados.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            Sistema de Gestão de Atendimento
          </p>
        </div>
      </div>
    </footer>
  );
}
