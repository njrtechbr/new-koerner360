-- CreateEnum
CREATE TYPE "public"."TipoUsuario" AS ENUM ('ADMIN', 'GESTOR', 'ATENDENTE');

-- CreateEnum
CREATE TYPE "public"."StatusAtendente" AS ENUM ('ATIVO', 'INATIVO', 'SUSPENSO', 'TREINAMENTO');

-- CreateEnum
CREATE TYPE "public"."TipoFeedback" AS ENUM ('SUGESTAO', 'RECLAMACAO', 'ELOGIO', 'MELHORIA');

-- CreateEnum
CREATE TYPE "public"."StatusFeedback" AS ENUM ('PENDENTE', 'EM_ANALISE', 'RESOLVIDO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "public"."PrioridadeFeedback" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "userType" "public"."TipoUsuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."atendentes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT,
    "dataAdmissao" TIMESTAMP(3) NOT NULL,
    "cargo" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "salario" DECIMAL(10,2),
    "status" "public"."StatusAtendente" NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atendentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."avaliacoes" (
    "id" TEXT NOT NULL,
    "atendenteId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "periodo" TEXT NOT NULL,
    "dataAvaliacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avaliadorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feedbacks" (
    "id" TEXT NOT NULL,
    "tipo" "public"."TipoFeedback" NOT NULL,
    "status" "public"."StatusFeedback" NOT NULL DEFAULT 'PENDENTE',
    "prioridade" "public"."PrioridadeFeedback" NOT NULL DEFAULT 'MEDIA',
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "autorId" TEXT,
    "responsavelId" TEXT,
    "resolucao" TEXT,
    "dataResolucao" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gamificacao_atendentes" (
    "id" TEXT NOT NULL,
    "atendenteId" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "experiencia" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gamificacao_atendentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conquistas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "requisitos" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL,
    "icone" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conquistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conquistas_atendentes" (
    "id" TEXT NOT NULL,
    "conquistaId" TEXT NOT NULL,
    "atendenteId" TEXT NOT NULL,
    "dataObtencao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conquistas_atendentes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_userType_idx" ON "public"."usuarios"("userType");

-- CreateIndex
CREATE INDEX "usuarios_ativo_idx" ON "public"."usuarios"("ativo");

-- CreateIndex
CREATE INDEX "usuarios_criadoEm_idx" ON "public"."usuarios"("criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "atendentes_usuarioId_key" ON "public"."atendentes"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "atendentes_cpf_key" ON "public"."atendentes"("cpf");

-- CreateIndex
CREATE INDEX "atendentes_status_idx" ON "public"."atendentes"("status");

-- CreateIndex
CREATE INDEX "atendentes_setor_idx" ON "public"."atendentes"("setor");

-- CreateIndex
CREATE INDEX "atendentes_cargo_idx" ON "public"."atendentes"("cargo");

-- CreateIndex
CREATE INDEX "atendentes_dataAdmissao_idx" ON "public"."atendentes"("dataAdmissao");

-- CreateIndex
CREATE INDEX "avaliacoes_atendenteId_idx" ON "public"."avaliacoes"("atendenteId");

-- CreateIndex
CREATE INDEX "avaliacoes_periodo_idx" ON "public"."avaliacoes"("periodo");

-- CreateIndex
CREATE INDEX "avaliacoes_dataAvaliacao_idx" ON "public"."avaliacoes"("dataAvaliacao");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_atendenteId_periodo_key" ON "public"."avaliacoes"("atendenteId", "periodo");

-- CreateIndex
CREATE INDEX "feedbacks_status_idx" ON "public"."feedbacks"("status");

-- CreateIndex
CREATE INDEX "feedbacks_tipo_idx" ON "public"."feedbacks"("tipo");

-- CreateIndex
CREATE INDEX "feedbacks_prioridade_idx" ON "public"."feedbacks"("prioridade");

-- CreateIndex
CREATE INDEX "feedbacks_autorId_idx" ON "public"."feedbacks"("autorId");

-- CreateIndex
CREATE INDEX "feedbacks_responsavelId_idx" ON "public"."feedbacks"("responsavelId");

-- CreateIndex
CREATE INDEX "feedbacks_criadoEm_idx" ON "public"."feedbacks"("criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "gamificacao_atendentes_atendenteId_key" ON "public"."gamificacao_atendentes"("atendenteId");

-- CreateIndex
CREATE UNIQUE INDEX "conquistas_nome_key" ON "public"."conquistas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "conquistas_atendentes_conquistaId_atendenteId_key" ON "public"."conquistas_atendentes"("conquistaId", "atendenteId");

-- AddForeignKey
ALTER TABLE "public"."atendentes" ADD CONSTRAINT "atendentes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."avaliacoes" ADD CONSTRAINT "avaliacoes_atendenteId_fkey" FOREIGN KEY ("atendenteId") REFERENCES "public"."atendentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gamificacao_atendentes" ADD CONSTRAINT "gamificacao_atendentes_atendenteId_fkey" FOREIGN KEY ("atendenteId") REFERENCES "public"."atendentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conquistas_atendentes" ADD CONSTRAINT "conquistas_atendentes_conquistaId_fkey" FOREIGN KEY ("conquistaId") REFERENCES "public"."conquistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conquistas_atendentes" ADD CONSTRAINT "conquistas_atendentes_atendenteId_fkey" FOREIGN KEY ("atendenteId") REFERENCES "public"."atendentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
