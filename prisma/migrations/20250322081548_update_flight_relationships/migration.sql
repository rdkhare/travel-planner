/*
  Warnings:

  - You are about to drop the column `pairedFlightId` on the `Flight` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pairedWithId]` on the table `Flight` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Flight" DROP CONSTRAINT "Flight_pairedFlightId_fkey";

-- DropIndex
DROP INDEX "Flight_pairedFlightId_key";

-- AlterTable
ALTER TABLE "Flight" DROP COLUMN "pairedFlightId",
ADD COLUMN     "pairedWithId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Flight_pairedWithId_key" ON "Flight"("pairedWithId");

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_pairedWithId_fkey" FOREIGN KEY ("pairedWithId") REFERENCES "Flight"("id") ON DELETE SET NULL ON UPDATE CASCADE;
