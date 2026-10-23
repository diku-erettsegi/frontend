export type Role = 'ADMIN' | 'STUDENT';
export interface User { id: number; name: string; email: string; role: Role; enabled?: boolean }
export interface LessonFile { id: number; originalName: string; size: number; contentType: string }
export interface Lesson { id: number; title: string; description: string; startsAt: string | null; meetingUrl: string | null; published: boolean; files: LessonFile[] }
export type ApplicationStatus = 'NEW' | 'CONTACTED' | 'ACCEPTED' | 'REJECTED';
export interface CoursePrice { baseTotal: number; periodDiscountPercent: number; friendDiscountPercent: number; discountPercent: number; discountLabel: string; total: number; perLesson: number; validUntil: string | null }
export interface Course { id: number; slug: string; name: string; startDate: string; startTime: string; endTime: string; sessions: number; lessonsPerSession: number; capacity: number; acceptedCount: number; availableSeats: number; registrationOpen: boolean; price: CoursePrice }
export interface Application { id: number; studentName: string; email: string; phone: string; parentName: string; message: string; status: ApplicationStatus; notes: string; createdAt: string; courseId: number | null; courseName: string | null; friendCount: number; referredByFriend: boolean; referralNote: string | null; laptopRentalRequested: boolean; baseTotal: number | null; periodDiscountPercent: number | null; friendDiscountPercent: number | null; discountPercent: number | null; discountLabel: string | null; quotedTotal: number | null; quotedPerLesson: number | null; friendDiscountStatus: 'PENDING_ADMIN' | 'NOT_REQUESTED' }
export interface ApplicationReceipt { id: number; message: string; courseName?: string; quotedTotal?: number; quotedPerLesson?: number; discountLabel?: string; discountPercent?: number; periodDiscountPercent?: number; friendDiscountPercent?: number }
export type InterestStatus = 'NEW' | 'CONTACTED' | 'COMPLETED';
export interface ProgrammingInterest { id: number; name: string; email: string; createdAt: string; status: InterestStatus; notes: string | null; updatedAt: string }
export interface ProgrammingInterestReceipt { id: number; message: string }
export interface Audit { id: number; actor: string; action: string; target: string; createdAt: string }
