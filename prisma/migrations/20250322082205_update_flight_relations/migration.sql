/*
  Warnings:

  - You are about to drop the column `pairedWithId` on the `Flight` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[outboundFlightId]` on the table `Flight` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Flight" DROP CONSTRAINT "Flight_pairedWithId_fkey";

-- DropIndex
DROP INDEX "Flight_pairedWithId_key";

-- AlterTable
ALTER TABLE "Flight" DROP COLUMN "pairedWithId",
ADD COLUMN     "outboundFlightId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Flight_outboundFlightId_key" ON "Flight"("outboundFlightId");

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_outboundFlightId_fkey" FOREIGN KEY ("outboundFlightId") REFERENCES "Flight"("id") ON DELETE SET NULL ON UPDATE CASCADE;
