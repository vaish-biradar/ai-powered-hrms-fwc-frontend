export interface JobOpening {
    id: string;
    title: string;
    text: string; // Full job description
    summary: string;
    path: string;
    created_at: string;
    total_openings: number;
    occupied_openings: number;
    status: string;
    department: string;
    employment_type: string;
    location: string;
    experience_level: string;
    skills: string[];
  }
  
  export interface MatchedJob extends JobOpening {
    similarity: number;
    jd_title: string;
    jd_text: string;
    jd_id: string;
  }


  
  export interface FormData {
  name: string;
  email: string;
  mobile: string;
  totalExperience: string;
  currentCtc: string;
  expectedCtc: string;
  currentCompany: string;
  currentLocation: string;
  currentJobTitle: string;
  noticePeriod: string;
}


export interface ApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  onSubmit: (formData: FormData) => void;
  isSubmitting: boolean;
}


export interface JobCardProps {
  job: JobOpening | MatchedJob;
  isMatched?: boolean;
  onApply?: (jdId: string, similarity: number, applicantData: FormData) => void;
  onGenerateAnalysis?: (job: MatchedJob) => void;
  onMockInterview?: (job: MatchedJob) => void;
}

export interface JobListingsSectionProps {
  onApply: (jdId: string, similarity: number,formData:FormData ) => void;
  onGenerateAnalysis: (job: MatchedJob) => void;
  onMockInterview: (job: MatchedJob) => void;
}
export interface ResumeUploadSectionProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetUpload: () => void;
}

export interface MockInterviewMessage {
  role: 'user' | 'assistant';
  content: string;
}