-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('waiting', 'called', 'completed', 'missed');

-- AlterTable
ALTER TABLE "prescription_items" ADD COLUMN     "medicineId" TEXT;

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "spec" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_numbers" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'waiting',
    "calledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queue_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_appointmentId_key" ON "reviews"("appointmentId");

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_numbers" ADD CONSTRAINT "queue_numbers_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
