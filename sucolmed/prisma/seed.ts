import dotenv from "dotenv";
import { PrismaClient, UserRole, TimeSlot } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.prescriptionItem.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      name: "管理员",
      phone: "13800000000",
      passwordHash: await bcrypt.hash("admin123", 12),
      role: UserRole.admin,
    },
  });

  await prisma.user.create({
    data: {
      name: "张三",
      phone: "13800000001",
      passwordHash: await bcrypt.hash("123456", 12),
      role: UserRole.student,
      studentId: "2024001",
    },
  });

  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: "内科",
        description: "诊治心血管、呼吸、消化等系统疾病",
        location: "门诊楼 2F",
      },
    }),
    prisma.department.create({
      data: {
        name: "外科",
        description: "诊治骨科、普外、泌尿等外科疾病",
        location: "门诊楼 3F",
      },
    }),
    prisma.department.create({
      data: {
        name: "口腔科",
        description: "口腔检查、龋齿治疗、洗牙等",
        location: "门诊楼 1F",
      },
    }),
    prisma.department.create({
      data: {
        name: "眼科",
        description: "视力检查、眼部疾病诊治",
        location: "门诊楼 2F",
      },
    }),
    prisma.department.create({
      data: {
        name: "中医科",
        description: "中医诊疗、针灸推拿",
        location: "中医楼 1F",
      },
    }),
  ]);

  const doctorHash = await bcrypt.hash("123456", 12);
  
  const doctorUsers = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      prisma.user.create({
        data: {
          name: `医生${String.fromCharCode(65 + i)}`,
          phone: `1380000${String(i + 10).padStart(4, "0")}`,
          passwordHash: doctorHash,
          role: UserRole.faculty,
        },
      })
    )
  );

  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        userId: doctorUsers[0].id,
        departmentId: departments[0].id,
        title: "主任医师",
        specialties: ["心血管", "高血压"],
        bio: "从事内科临床工作20余年",
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[1].id,
        departmentId: departments[0].id,
        title: "副主任医师",
        specialties: ["呼吸系统", "感冒发热"],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[2].id,
        departmentId: departments[1].id,
        title: "主治医师",
        specialties: ["骨科", "运动损伤"],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[3].id,
        departmentId: departments[2].id,
        title: "主治医师",
        specialties: ["龋齿", "洗牙"],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[4].id,
        departmentId: departments[3].id,
        title: "副主任医师",
        specialties: ["近视", "干眼症"],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[5].id,
        departmentId: departments[4].id,
        title: "主任医师",
        specialties: ["针灸", "推拿", "中药调理"],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[6].id,
        departmentId: departments[0].id,
        title: "住院医师",
        specialties: ["消化系统"],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[7].id,
        departmentId: departments[1].id,
        title: "主任医师",
        specialties: ["普外", "微创手术"],
      },
    }),
  ]);

  const now = new Date();
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const date = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    for (const doctor of doctors) {
      for (const timeSlot of [TimeSlot.morning, TimeSlot.afternoon]) {
        await prisma.schedule.create({
          data: {
            doctorId: doctor.id,
            date,
            timeSlot,
            maxPatients: 20,
            currentPatients: Math.floor(Math.random() * 15),
          },
        });
      }
    }
  }

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
