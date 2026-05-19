-- AlterTable
ALTER TABLE "queue_numbers" ADD COLUMN     "appointmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "queue_numbers_appointmentId_key" ON "queue_numbers"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "queue_numbers_scheduleId_number_key" ON "queue_numbers"("scheduleId", "number");

-- AddForeignKey
ALTER TABLE "queue_numbers" ADD CONSTRAINT "queue_numbers_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
