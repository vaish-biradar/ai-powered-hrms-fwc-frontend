// api-service.ts
import axios from "axios";
import { Application, ExtractedJobDetails, JobDescription, JobUpdatePayload, MatchResponse } from '@/types/dashboard';

class ApiService {
    //Application related methods
    async updateApplicationStatus(applicationId: string, newStatus: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axios.put('/api/applications', {
                id: applicationId,
                status: newStatus
            });
            return response.data;
        } catch (error) {
            console.error("Error updating status:", error);
            throw error;
        }
    }

    async updateContactInfo(applicationId: string, field: 'candidate_email' | 'candidate_phone', value: string): Promise<{ success: boolean; message: string }> {
        try {
            const payload = {
                id: applicationId,
                [field]: value
            };

            const response = await axios.put('/api/applications', payload);
            return response.data;
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            throw error;
        }
    }


    async sendEmail(applicationId: string, emailData: { subject: string; body: string; attachments?: string[] }): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axios.post('/api/email', {
                applicationId,
                ...emailData
            });
            return response.data;
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }


    async viewDocument(application: Application, type: DocumentType): Promise<{ documentUrl: string }> {
        try {
            const response = await axios.get(`/api/documents/${application.id}`, {
                params: { type }
            });
            return response.data;
        } catch (error) {
            console.error(`Error viewing ${type}:`, error);
            throw error;
        }
    }


    async downloadDocument(application: Application, type: DocumentType): Promise<Blob> {
        try {
            const response = await axios.get(`/api/documents/${application.id}/download`, {
                params: { type },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error(`Error downloading ${type}:`, error);
            throw error;
        }
    }

    async getApplicationDetails(applicationId: string): Promise<Application> {
        try {
            const response = await axios.get(`/api/applications/${applicationId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching application details:", error);
            throw error;
        }
    }


    async getAllApplications(): Promise<Application[]> {
        try {
            const response = await axios.get('/api/applications');
            return response.data.applications;
        } catch (error) {
            console.error("Error fetching applications:", error);
            throw error;
        }
    }

    async contactCandidate(
        to: string,
        subject: string,
        text: string,
        attachments: File[] = [],
        cc: string[] = []
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Process attachments if any
            const attachmentData = attachments.length > 0
                ? await Promise.all(
                    attachments.map((file) => {
                        return new Promise<{ filename: string; content: string }>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onload = () =>
                                resolve({ filename: file.name, content: reader.result as string });
                            reader.onerror = (error) => reject(error);
                        });
                    })
                )
                : [];

            // Send POST request with Axios
            const response = await axios.post('/api/contact-candidate', {
                to,
                subject,
                text,
                attachments: attachmentData,
                ...(cc.length > 0 && { cc }), // Include cc only if not empty
            });

            return response.data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                console.error("Error sending email:", error.response.data);
                throw error.response.data.error || 'Failed to send email';
            } else {
                console.error("Error sending email:", error);
                throw (error as Error).message || 'Failed to send email';
            }
        }
    }
    //------------------------------------------------------------------------------------------------
    // Candidate Search related methods
    async getJobDescriptions(): Promise<JobDescription[]> {
        try {
            const response = await axios.get('/api/jds');
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error("Error fetching job descriptions:", error);
            throw new Error("Failed to fetch job descriptions");
        }
    }

    async compareCandidates(jd_id: string, candidates: string[]): Promise<{ markdown: string }> {
        console.log("Comparing candidates:", { jd_id, candidates });
        
        try {
            const response = await axios.post('/api/proxy/match/compare-candidates', {
                jd_id,
                candidates,
            });
            return response.data;
        } catch (error: unknown) {
            console.error("Error comparing candidates:", error);
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to fetch comparison.");
        }
    }

    async matchJdToResumes(jd_id: string, apply_filter: boolean): Promise<MatchResponse> {
        try {
            const response = await axios.post("/api/proxy/match/jd-to-resumes", {
                jd_id,
                apply_filter,
            });
            return response.data;
        } catch (error: unknown) {
            console.error("Error matching JD to resumes:", error);
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to match JD to resumes");
        }
    }
    async contactCandidateBackend(payload: {
        candidate_email: string;
        candidate_name: string;
        job_title: string;
        job_description: string;
    }): Promise<{ success: boolean; message: string }> {
        try {
            await axios.post("/api/proxy/sendemail/contact-candidate", payload);
            return { success: true, message: `Email sent successfully to ${payload.candidate_email}` };
        } catch (error) {
            console.error("Error sending email:", error);
            return { success: false, message: `Failed to send email to ${payload.candidate_email}` };
        }
    }

    async streamCandidateAnalysis(resumeId: string, jdId: string, onChunk: (chunk: string) => void): Promise<void> {
        const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
        const response = await fetch(
            `${backendUrl}/analysis/hr`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resume_id: resumeId, jd_id: jdId }),
            }
        );

        if (!response.ok) throw new Error(`API responded with status: ${response.status}`);
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let accumulated = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            accumulated += chunk;
            onChunk(accumulated);
        }
    }


    // JD Management related methods
    async updateJob(id: string, data: JobUpdatePayload) {
        return axios.put("/api/jds", { id, ...data });
    }

    async deleteJobDescription(jdId: string, jdPath: string) {
        return axios.delete("/api/jds", {
            data: { id: jdId, jdurl: jdPath },
        });
    }

    async extractJobDetails(file: File) {
        const formData = new FormData();
        formData.append("files", file);
        return axios.post("/api/proxy/jd/extract", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    }

    async saveJobDetails(payload: ExtractedJobDetails) {
        return axios.post("/api/proxy/jd/save", payload);
    }

    async cancelUpload(filePath: string) {
        return axios.delete("/api/proxy/jd/cancel", {
            data: { file_path: filePath },
        });
    }

    // SAS Token Generation
    async generateSasToken(jdPath: string, container: string) {
        return axios.post("/api/generate-sas", {
            blobName: jdPath,
            container: container,
        });
    }



}

export const apiService = new ApiService();
