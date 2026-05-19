-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'faculty', 'external', 'admin');

-- CreateEnum
CREATE TYPE "TimeSlot" AS ENUM ('morning', 'afternoon', 'evening');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('open', 'full', 'closed');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "studentId" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "specialties" JSONB,
    "avatar" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "timeSlot" "TimeSlot" NOT NULL,
    "maxPatients" INTEGER NOT NULL DEFAULT 20,
    "currentPatients" INTEGER NOT NULL DEFAULT 0,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'pending',
    "symptoms" TEXT,
    "queueNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "prescription" JSONB,
    "notes" TEXT,
    "followUpDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_studentId_key" ON "users"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_userId_key" ON "doctors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_doctorId_date_timeSlot_key" ON "schedules"("doctorId", "date", "timeSlot");

-- CreateIndex
CREATE UNIQUE INDEX "medical_records_appointmentId_key" ON "medical_records"("appointmentId");

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "medical_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
