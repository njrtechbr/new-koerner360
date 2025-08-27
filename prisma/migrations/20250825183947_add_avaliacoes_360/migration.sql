/*
  Warnings:

  - You are about to drop the column `atendenteId` on the `avaliacoes` table. All the data in the column will be lost.
  - You are about to drop the column `periodo` on the `avaliacoes` table. All the data in the column will be lost.
  - You are about to alter the column `nota` on the `avaliacoes` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - A unique constraint covering the columns `[avaliadorId,avaliadoId,periodoId]` on the table `avaliacoes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `avaliadoId` to the `avaliacoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodoId` to the `avaliacoes` table without a default value. This is not possible if the table is not empty.
  - Made the column `avaliadorId` on table `avaliacoes` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."StatusAvaliacao" AS ENUM ('PENDENTE', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."StatusPeriodo" AS ENUM ('PLANEJADO', 'ATIVO', 'FINALIZADO', 'CANCELADO');

-- DropForeignKey
ALTER TABLE "public"."avaliacoes" DROP CONSTRAINT "avaliacoes_atendenteId_fkey";

-- DropIndex
DROP INDEX "public"."avaliacoes_atendenteId_idx";

-- DropIndex
DROP INDEX "public"."avaliacoes_atendenteId_periodo_key";

-- DropIndex
DROP INDEX "public"."avaliacoes_periodo_idx";

-- AlterTable
ALTER TABLE "public"."avaliacoes" DROP COLUMN "atendenteId",
DROP COLUMN "periodo",
ADD COLUMN     "avaliadoId" TEXT NOT NULL,
ADD COLUMN     "periodoId" TEXT NOT NULL,
ADD COLUMN     "status" "public"."StatusAvaliacao" NOT NULL DEFAULT 'PENDENTE',
ALTER COLUMN "nota" SET DATA TYPE SMALLINT,
ALTER COLUMN "avaliadorId" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."periodos_avaliacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "status" "public"."StatusPeriodo" NOT NULL DEFAULT 'PLANEJADO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "criadoPorId" TEXT,

    CONSTRAINT "periodos_avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "periodos_avaliacao_status_idx" ON "public"."periodos_avaliacao"("status");

-- CreateIndex
CREATE INDEX "periodos_avaliacao_dataInicio_idx" ON "public"."periodos_avaliacao"("dataInicio");

-- CreateIndex
CREATE INDEX "periodos_avaliacao_dataFim_idx" ON "public"."periodos_avaliacao"("dataFim");

-- CreateIndex
CREATE INDEX "periodos_avaliacao_criadoPorId_idx" ON "public"."periodos_avaliacao"("criadoPorId");

-- CreateIndex
CREATE INDEX "avaliacoes_avaliadorId_idx" ON "public"."avaliacoes"("avaliadorId");

-- CreateIndex
CREATE INDEX "avaliacoes_avaliadoId_idx" ON "public"."avaliacoes"("avaliadoId");

-- CreateIndex
CREATE INDEX "avaliacoes_periodoId_idx" ON "public"."avaliacoes"("periodoId");

-- CreateIndex
CREATE INDEX "avaliacoes_status_idx" ON "public"."avaliacoes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_avaliadorId_avaliadoId_periodoId_key" ON "public"."avaliacoes"("avaliadorId", "avaliadoId", "periodoId");

-- AddForeignKey
ALTER TABLE "public"."avaliacoes" ADD CONSTRAINT "avaliacoes_avaliadorId_fkey" FOREIGN KEY ("avaliadorId") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."avaliacoes" ADD CONSTRAINT "avaliacoes_avaliadoId_fkey" FOREIGN KEY ("avaliadoId") REFERENCES "public"."atendentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."avaliacoes" ADD CONSTRAINT "avaliacoes_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "public"."periodos_avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."periodos_avaliacao" ADD CONSTRAINT "periodos_avaliacao_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
