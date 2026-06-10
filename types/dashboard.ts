export interface JobDescription {
    id: string;
    title: string;
    text: string;
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
    skills: string;
    submitted_by?: {
        name: string;
        email: string;
    }
    // New fields
    application_count: number;
    applications: {
      candidate_name: string;
      candidate_email: string;
    }[];
  }
  // types/job.ts

export interface JobUpdatePayload {
  status: string;
  total_openings: number;
  occupied_openings: number;
  title: string;
  department: string;
  employment_type: string;
  location: string;
  skills: string;
}

export interface ExtractedJobDetails {
  id: string;
  title: string;
  department: string;
  employment_type: string;
  location: string;
  experience_level: string;
  summary: string;
  skills: string;
  path: string;
  text: string;
  temp_file_path: string;
  user?:{
    name: string;
    email: string;
  }
}

export interface MatchResult {
    resume_id: string;
    name: string;
    email: string;
    similarity: number;
    resume_text: string;
    path: string;
    phone?: string;
}

export interface MatchResponse {
  jd_id: string;
  matches: MatchResult[];
}
export interface Resume {
    id: string;
    name: string;
    email: string;
    phone?: string;
    summary: string;
    years_of_experience: string;
    suitable_roles: string[];
    path: string;
}


export interface Application {
    id: string;
    candidate_name: string;
    candidate_email: string;
    candidate_phone?:string;
    total_experience?: string;
    current_ctc?: string;
    expected_ctc?: string;
    current_company?: string;
    current_location?: string;
    current_job_title?: string;
    notice_period?: string;
    suitable_roles?: string[];
    resume_url: string;
    report_url: string;
    jd_url: string;
    applied_date: string;
    job_title: string;
    similarity: number;
    status: string;
    source:string;
    resume_id?: string;
}

export type DocumentType = 'resume' | 'jd' | 'report';


export interface PanelMember {
    id: string
    name: string
    email: string
    role: string
    department: string
    avatar?: string
    initials: string
    expertise: string | string[]
    panelsJoined?: number
    interviewsCompleted?: number
    rating?: number
    created_at?: string
    invitation_status?: string
    panels: {
      id: string;
      panel_name: string;
      department: string;
      positions: number;
      interviews_completed: number;
      status: string;
      created_at: string;
      updated_at: string;
    }[];
  }