-- CreateEnum
CREATE TYPE "public"."TipoDocumento" AS ENUM ('RG', 'CPF', 'CNH', 'CARTEIRA_TRABALHO', 'TITULO_ELEITOR', 'COMPROVANTE_RESIDENCIA', 'DIPLOMA', 'CERTIFICADO', 'CONTRATO', 'OUTROS');

-- CreateEnum
CREATE TYPE "public"."TipoAlteracao" AS ENUM ('CRIACAO', 'ATUALIZACAO', 'EXCLUSAO', 'ATIVACAO', 'DESATIVACAO', 'MUDANCA_STATUS', 'UPLOAD_DOCUMENTO', 'REMOCAO_DOCUMENTO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."StatusAtendente" ADD VALUE 'FERIAS';
ALTER TYPE "public"."StatusAtendente" ADD VALUE 'AFASTADO';
ALTER TYPE "public"."StatusAtendente" ADD VALUE 'LICENCA_MEDICA';
ALTER TYPE "public"."StatusAtendente" ADD VALUE 'LICENCA_MATERNIDADE';

-- AlterTable
ALTER TABLE "public"."atendentes" ADD COLUMN     "celular" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "departamento" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "foto" TEXT,
ADD COLUMN     "rg" TEXT;

-- AlterTable
ALTER TABLE "public"."usuarios" ADD COLUMN     "expiracaoTokenRecuperacao" TIMESTAMP(3),
ADD COLUMN     "tokenRecuperacao" TEXT;

-- CreateTable
CREATE TABLE "public"."documentos_atendentes" (
    "id" TEXT NOT NULL,
    "atendenteId" TEXT NOT NULL,
    "tipo" "public"."TipoDocumento" NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "arquivo" TEXT NOT NULL,
    "tamanho" INTEGER,
    "mimeType" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "criadoPorId" TEXT,

    CONSTRAINT "documentos_atendentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."historico_alteracoes_atendentes" (
    "id" TEXT NOT NULL,
    "atendenteId" TEXT NOT NULL,
    "tipo" "public"."TipoAlteracao" NOT NULL,
    "campo" TEXT,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "descricao" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPorId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "historico_alteracoes_atendentes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documentos_atendentes_atendenteId_idx" ON "public"."documentos_atendentes"("atendenteId");

-- CreateIndex
CREATE INDEX "documentos_atendentes_tipo_idx" ON "public"."documentos_atendentes"("tipo");

-- CreateIndex
CREATE INDEX "documentos_atendentes_ativo_idx" ON "public"."documentos_atendentes"("ativo");

-- CreateIndex
CREATE INDEX "documentos_atendentes_criadoEm_idx" ON "public"."documentos_atendentes"("criadoEm");

-- CreateIndex
CREATE INDEX "historico_alteracoes_atendentes_atendenteId_idx" ON "public"."historico_alteracoes_atendentes"("atendenteId");

-- CreateIndex
CREATE INDEX "historico_alteracoes_atendentes_tipo_idx" ON "public"."historico_alteracoes_atendentes"("tipo");

-- CreateIndex
CREATE INDEX "historico_alteracoes_atendentes_campo_idx" ON "public"."historico_alteracoes_atendentes"("campo");

-- CreateIndex
CREATE INDEX "historico_alteracoes_atendentes_criadoEm_idx" ON "public"."historico_alteracoes_atendentes"("criadoEm");

-- CreateIndex
CREATE INDEX "historico_alteracoes_atendentes_criadoPorId_idx" ON "public"."historico_alteracoes_atendentes"("criadoPorId");

-- CreateIndex
CREATE INDEX "atendentes_departamento_idx" ON "public"."atendentes"("departamento");

-- CreateIndex
CREATE INDEX "atendentes_cpf_idx" ON "public"."atendentes"("cpf");

-- AddForeignKey
ALTER TABLE "public"."documentos_atendentes" ADD CONSTRAINT "documentos_atendentes_atendenteId_fkey" FOREIGN KEY ("atendenteId") REFERENCES "public"."atendentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historico_alteracoes_atendentes" ADD CONSTRAINT "historico_alteracoes_atendentes_atendenteId_fkey" FOREIGN KEY ("atendenteId") REFERENCES "public"."atendentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
