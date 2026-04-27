
export interface RpmFormData {
    schoolName: string;
    principalName: string;
    principalId: string;
    teacherName: string;
    teacherId: string;
    subject: string;
    mainMaterial: string;
    grade: string;
    fase: string;
    academicYear: string;
    timeAllocation: string;
    signaturePlaceDate: string;
}

export interface QuestionCardFormData {
    schoolName: string;
    questionCardType: string;
    semester: string;
    academicYear: string;
    subject: string;
    gradeAndFase: string;
    curriculum: string;
    teacherName: string;
    numQuestions: string;
    questionType: string;
    mainMaterial: string;
}

export interface RpsFormData {
    universityName: string;
    faculty: string;
    studyProgram: string;
    documentCode: string;
    courseName: string;
    courseCode: string;
    courseGroup: string;
    courseCredits: string;
    semester: string;
    dateOfPreparation: string;
    rpsDeveloper: string;
    rmkCoordinator: string;
    headOfProgram: string;
    learningModel: string;
    logoUrl?: string; // Menambahkan field opsional untuk URL logo
}

export interface RpdFormData {
    schoolName: string;
    teacherName: string;
    subject: string;
    gradeAndSemester: string;
    timeAllocation: string;
    mainTopic: string;
    principalName: string;
    curriculumVicePrincipalName: string;
    signaturePlaceDate: string;
}

export interface AtpFormData {
    penyusun: string;
    sekolah: string;
    mataPelajaran: string;
    fase: string;
    kelas: string;
    kepalaSekolah: string;
    guruPengampu: string;
    kotaTanggalTtd: string;
}

export interface JournalFormData {
    schoolName: string;
    teacherName: string;
    subject: string;
    grade: string;
    date: string;
    material: string;
    classSituation: string;
    studentProgress: string;
    reflection: string;
}

export interface CkFormData {
    studentName: string;
    studentId: string;
    schoolName: string;
    subject: string;
    grade: string;
    semester: string;
    academicYear: string;
    competencyElement: string;
    achievementLevel: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
    teacherName: string;
    signaturePlaceDate: string;
}


export interface TestimonialData {
    id: number;
    created_at: string;
    name: string;
    school: string;
    message: string;
    is_approved: boolean;
}

export interface UsageLogData {
    id: number;
    created_at: string;
    type: string;
    school_name: string;
    teacher_name: string;
    subject: string;
}

export interface GeneratedDocumentData {
  id: string; // UUID
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  feature_type: string;
  document_content_html: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'expired';
  payment_order_id: string | null;
  payment_url: string | null;
  payment_gateway_response: any;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  credit_balance: number;
  created_at: string;
}


export enum AppView {
    MainMenu,
    RpmGenerator,
    QuestionCardGenerator,
    Testimonials,
    RpsGenerator,
    RpdGenerator,
    AtpGenerator,
    JournalGenerator,
    CkGenerator,
    CreatorBio,
    CreditStore,
    AdminDashboard,
}
