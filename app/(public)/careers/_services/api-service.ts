import axios from "axios";
import { JobOpening, MatchedJob, type FormData, type MockInterviewMessage } from "@/types/careers-types";

/// Fetch all job openings from the API.
export const fetchJobOpenings = async (): Promise<JobOpening[]> => {
  try {
    const response = await axios.get("/api/proxy/jd/get-all");

    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data
        .filter((job) => job.status === "Open") // Only include jobs with status "open"
        .map((job) => ({
          ...job,
          skills: typeof job.skills === "string"
            ? job.skills.split(",").map((skill: string) => skill.trim())
            : Array.isArray(job.skills) ? job.skills : [],
        }));
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error fetching job openings:", error);
    throw new Error("Failed to fetch job openings. Please try again.");
  }
};


/// Upload a resume file to the API.
export const uploadResume = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post("/api/proxy/resume/upload-resume", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.status === 200 && response.data) {
      return response.data;
    }
    throw new Error("Upload failed");
  } catch (error) {
    console.error("Error uploading resume:", error);
    throw new Error("Failed to upload resume. Please try again.");
  }
};

/// Match the uploaded resume with job openings.
export const matchResumeToJobs = async (resumeId: string, jobOpenings: JobOpening[]): Promise<MatchedJob[]> => {
  try {
    const response = await axios.post("/api/proxy/match/resume-to-jds", { resume_id: resumeId }, {
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data
        .map((match) => {
          const job = jobOpenings.find((j) => j.id === match.jd_id);
          return job ? { ...job, similarity: Math.round(match.similarity * 100) } : null;
        })
        .filter((job): job is MatchedJob => job !== null)
        .sort((a, b) => b.similarity - a.similarity);
    }
    throw new Error("Matching failed");
  } catch (error) {
    console.error("Error matching jobs:", error);
    throw new Error("Failed to match resume with jobs. Please try again.");
  }
};

/// Apply for a job using the resume ID and job ID.
export const applyForJob = async (resumeId: string,jdId: string,similarity: number,formData: FormData): Promise<string> => {
  try {
    const response = await axios.post("/api/proxy/sendemail/apply-job", {
      resume_id: resumeId,
      jd_id: jdId,
      similarity: parseFloat(similarity.toFixed(2)), 
      formdata: formData,
      source :'Careers Page', 
    });

    if (response.status === 200) {
      return response.data?.message || "Application submitted successfully!";
    }
    throw new Error("Failed to submit application");
  } catch (error) {
    console.error("Error applying for job:", error);
    throw new Error("An error occurred while applying. Please try again.");
  }
};

export const chatMockInterview = async (
  resumeId: string,
  jdId: string,
  messages: MockInterviewMessage[]
): Promise<{ reply: string; should_end: boolean }> => {
  const response = await axios.post('/api/proxy/transcript/mock-interview/chat', {
    resume_id: resumeId,
    jd_id: jdId,
    messages,
  });

  return response.data;
};

export const saveMockInterview = async (
  resumeId: string,
  jdId: string,
  candidateName: string,
  candidateEmail: string,
  conversation: MockInterviewMessage[]
): Promise<string> => {
  const response = await axios.post('/api/proxy/transcript/mock-interview/save', {
    resume_id: resumeId,
    jd_id: jdId,
    candidate_name: candidateName,
    candidate_email: candidateEmail,
    conversation,
  });

  return response.data?.message || 'Mock interview saved';
};

export const fetchMockInterviews = async (): Promise<
  Array<{
    id: string;
    candidate_name: string;
    candidate_email: string;
    job_title: string;
    created_at: string;
    transcript_text: string;
    conversation: MockInterviewMessage[];
  }>
> => {
  const response = await axios.get('/api/proxy/transcript/mock-interviews');
  return response.data || [];
};

export const analyzeTranscriptText = async (transcriptText: string): Promise<{ response: unknown }> => {
  const response = await axios.post('/api/proxy/transcript/analyze-text', {
    transcript_text: transcriptText,
  });
  return response.data;
};



