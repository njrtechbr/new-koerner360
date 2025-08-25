const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Verificando usuários no PostgreSQL...');

    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
        tipo: true,
        ativo: true,
        createdAt: true,
      },
    });

    console.log(`\n📊 Total de usuários encontrados: ${usuarios.length}`);

    if (usuarios.length > 0) {
      console.log('\n👥 Usuários cadastrados:');
      usuarios.forEach(user => {
        console.log(
          `- ${user.nome} (${user.email}) - Tipo: ${user.tipo} - Ativo: ${user.ativo}`
        );
      });
    } else {
      console.log('❌ Nenhum usuário encontrado no banco PostgreSQL');
    }

    // Verificar configuração do banco
    const dbUrl = process.env.DATABASE_URL;
    console.log(
      `\n🔗 DATABASE_URL: ${dbUrl ? dbUrl.replace(/\/\/.*@/, '//***:***@') : 'Não definida'}`
    );
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
