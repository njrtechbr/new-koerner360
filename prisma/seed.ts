import {
  PrismaClient,
  TipoUsuario,
  StatusAtendente,
} from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário administrador
  const senhaHasheada = await bcrypt.hash('admin123', 12);

  const usuarioAdmin = await prisma.usuario.upsert({
    where: { email: 'admin@koerner360.com' },
    update: {},
    create: {
      email: 'admin@koerner360.com',
      nome: 'Administrador',
      senha: senhaHasheada,
      userType: TipoUsuario.ADMIN,
      ativo: true,
    },
  });

  console.log('✅ Usuário administrador criado:', usuarioAdmin.email);

  // Criar usuário gestor
  const senhaGestorHasheada = await bcrypt.hash('gestor123', 12);

  const usuarioGestor = await prisma.usuario.upsert({
    where: { email: 'gestor@koerner360.com' },
    update: {},
    create: {
      email: 'gestor@koerner360.com',
      nome: 'Gestor Principal',
      senha: senhaGestorHasheada,
      userType: TipoUsuario.GESTOR,
      ativo: true,
    },
  });

  console.log('✅ Usuário gestor criado:', usuarioGestor.email);

  // Criar usuário atendente
  const senhaAtendenteHasheada = await bcrypt.hash('atendente123', 12);

  const usuarioAtendente = await prisma.usuario.upsert({
    where: { email: 'atendente@koerner360.com' },
    update: {},
    create: {
      email: 'atendente@koerner360.com',
      nome: 'João Silva',
      senha: senhaAtendenteHasheada,
      userType: TipoUsuario.ATENDENTE,
      ativo: true,
      atendente: {
        create: {
          cpf: '12345678901',
          telefone: '(11) 99999-9999',
          endereco: 'Rua das Flores, 123 - São Paulo/SP',
          dataAdmissao: new Date('2024-01-15'),
          cargo: 'Atendente Sênior',
          setor: 'Atendimento ao Cliente',
          salario: 3500.0,
          status: StatusAtendente.ATIVO,
          observacoes:
            'Atendente experiente com foco em excelência no atendimento',
          gamificacao: {
            create: {
              pontos: 150,
              nivel: 2,
              experiencia: 1500,
            },
          },
        },
      },
    },
    include: {
      atendente: {
        include: {
          gamificacao: true,
        },
      },
    },
  });

  console.log('✅ Usuário atendente criado:', usuarioAtendente.email);

  // Criar conquistas padrão
  const conquistas = [
    {
      nome: 'Primeiro Passo',
      descricao: 'Complete seu primeiro atendimento',
      requisitos: 'Realizar 1 atendimento',
      pontos: 10,
      icone: '🎯',
    },
    {
      nome: 'Atendente Dedicado',
      descricao: 'Complete 10 atendimentos',
      requisitos: 'Realizar 10 atendimentos',
      pontos: 50,
      icone: '⭐',
    },
    {
      nome: 'Especialista',
      descricao: 'Complete 50 atendimentos',
      requisitos: 'Realizar 50 atendimentos',
      pontos: 200,
      icone: '🏆',
    },
    {
      nome: 'Mestre do Atendimento',
      descricao: 'Complete 100 atendimentos',
      requisitos: 'Realizar 100 atendimentos',
      pontos: 500,
      icone: '👑',
    },
    {
      nome: 'Feedback Positivo',
      descricao: 'Receba 5 feedbacks positivos',
      requisitos: 'Receber 5 avaliações com nota 4 ou 5',
      pontos: 100,
      icone: '💝',
    },
  ];

  for (const conquista of conquistas) {
    await prisma.conquista.upsert({
      where: { nome: conquista.nome },
      update: {},
      create: conquista,
    });
  }

  console.log('✅ Conquistas padrão criadas');

  // Criar alguns feedbacks de exemplo
  const feedbacks = [
    {
      tipo: 'ELOGIO',
      status: 'RESOLVIDO',
      prioridade: 'BAIXA',
      titulo: 'Excelente atendimento',
      conteudo:
        'O atendente foi muito prestativo e resolveu meu problema rapidamente.',
      resolucao: 'Feedback positivo registrado no sistema de gamificação.',
      dataResolucao: new Date(),
    },
    {
      tipo: 'SUGESTAO',
      status: 'PENDENTE',
      prioridade: 'MEDIA',
      titulo: 'Melhorar tempo de resposta',
      conteudo:
        'Seria interessante ter um sistema de chat mais rápido para dúvidas simples.',
    },
    {
      tipo: 'RECLAMACAO',
      status: 'EM_ANALISE',
      prioridade: 'ALTA',
      titulo: 'Demora no atendimento',
      conteudo: 'Aguardei mais de 30 minutos para ser atendido.',
    },
  ];

  for (const feedback of feedbacks) {
    await prisma.feedback.create({
      data: feedback as any,
    });
  }

  console.log('✅ Feedbacks de exemplo criados');

  console.log('🎉 Seed concluído com sucesso!');
  console.log('\n📋 Usuários criados:');
  console.log('👤 Admin: admin@koerner360.com / admin123');
  console.log('👤 Gestor: gestor@koerner360.com / gestor123');
  console.log('👤 Atendente: atendente@koerner360.com / atendente123');
}

main()
  .catch(e => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
