export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface UserWithoutPassword {
  id: string;
  name: string;
  role: "student" | "faculty" | "external" | "admin";
  studentId: string | null;
  phone: string;
  email: string | null;
  createdAt: Date;
}

export interface DepartmentListItem {
  id: string;
  name: string;
  description: string | null;
  doctorCount: number;
}

export interface DepartmentDetail extends DepartmentListItem {
  location: string | null;
  isActive: boolean;
  doctors: DoctorListItem[];
  createdAt: Date;
}

export interface DoctorListItem {
  id: string;
  name: string;
  title: string;
  department: string;
  avatar: string | null;
}

export interface DoctorDetail extends DoctorListItem {
  userId: string;
  departmentId: string;
  specialties: string[] | null;
  bio: string | null;
  email: string | null;
  phone: string;
}

export interface ScheduleListItem {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorTitle: string;
  department: string;
  date: string;
  timeSlot: "morning" | "afternoon" | "evening";
  maxPatients: number;
  currentPatients: number;
  status: "open" | "full" | "closed";
}

export interface AppointmentListItem {
  id: string;
  doctorName: string;
  doctorTitle: string;
  department: string;
  date: string;
  timeSlot: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  symptoms: string | null;
  queueNumber: number | null;
  createdAt: Date;
}

export interface CreateAppointmentInput {
  doctorId: string;
  scheduleId: string;
  symptoms?: string;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string | null;
}

export interface MedicalRecordListItem {
  id: string;
  appointmentId: string;
  doctorName: string;
  diagnosis: string;
  prescription: Record<string, unknown> | null;
  notes: string | null;
  followUpDate: string | null;
  createdAt: Date;
  items: PrescriptionItem[];
}

export interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  completionRate: number;
}

export interface TrendData {
  date: string;
  count: number;
}

export interface DepartmentHeatData {
  department: string;
  appointments: number;
}

export interface DoctorWorkloadData {
  doctorName: string;
  total: number;
  completed: number;
  pending: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}
