"use client";

import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { analysisLoadingAtom, bookmarkedCandidatesAtom, contactLoadingAtom } from "@/store/candidatesearch-atom";
import { apiService } from "../../_services/api-service";

export const useCandidateActions = () => {
    const router = useRouter();
    const  setAnalysisLoading = useSetAtom(analysisLoadingAtom);
    const  setContactLoading = useSetAtom(contactLoadingAtom);
    const setBookmarkedCandidates = useSetAtom(bookmarkedCandidatesAtom);

    // Function to generate analysis for a candidate
    const handleGenerateAnalysis = async (resumeId: string, jdId: string, jdTitle: string, name: string) => {
        setAnalysisLoading(prev => ({ ...prev, [resumeId]: true }));

        router.push(`/dashboard/candidate-search/${resumeId}?jdId=${jdId}&jdTitle=${encodeURIComponent(jdTitle)}&name=${encodeURIComponent(name)}`);
        setAnalysisLoading(prev => ({ ...prev, [resumeId]: false }));

    };

    // Function to bookmark a candidate
    const toggleBookmark = (resumeId: string) => {
        setBookmarkedCandidates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(resumeId)) {
                newSet.delete(resumeId);
            } else {
                newSet.add(resumeId);
            }
            return newSet;
        });
    };

    // Function to initiate contact with a candidate
    const handleInitiateContact = async (
        resumeId: string,
        name: string,
        email: string,
        jdtitle: string,
        jddesc: string
    ) => {
        setContactLoading(prev => ({ ...prev, [resumeId]: true }));
    
        try {
            return await apiService.contactCandidateBackend({
                candidate_email: email,
                candidate_name: name,
                job_title: jdtitle,
                job_description: jddesc
              });
        } catch (error) {
            console.error("Error sending email:", error);
            return { success: false, message: `Failed to send email to ${email}` };
        } finally {
            // Ensure the state update happens without blocking return
            setTimeout(() => {
                setContactLoading(prev => ({ ...prev, [resumeId]: false }));
            }, 0);
        }
    };
const formatAnalysisData = (data: string) => {
    return data
        .replace(/^(\d+\.\s.*:)$/gm, "## $1. $2") // Convert section numbers to headers
        .replace(/^\*\s\*\*(.*)\*\*:$/gm, "### $1") // Convert bullet titles to subheadings
        .replace(/^\*\s(.*)$/gm, "- **$1**") // Bold bullet points
        .replace(/^\s{3}\*\s(.*)$/gm, "  - $1") // Fix nested bullets
        .replace(/^(Skill Matches Table:)$/gm, "### $1") // Highlight Skill Table
        .replace(/^(SkillRequired in JD\s*Mentioned in Resume\s*Match \(✔|❌\))$/gm, "| Skill | Required | Mentioned | Match |")
        .replace(/^(\w+(?:\s\w+)?)\s*(✅|❌)\s*(✅|❌)\s*(✔|❌)$/gm, "| $1 | $2 | $3 | $4 |")
        .replace(/(^\| Skill \| Required \| Mentioned \| Match \|$\n)/gm, "$1| --- | --- | --- | --- |\n") // Table separator
        .replace(/^(Additional Skills:)$/gm, "### $1"); // Additional Skills Formatting
};

    const GenerateAnalysis = async (
        resumeId: string,
        jdId: string,
        setAnalysisData: (data: string) => void,
        setLoading: (loading: boolean) => void,
        setError: (error: string | null) => void
    ) => {
        if (!resumeId || !jdId) {
            setLoading(false);
            return;
        }

        const abortController = new AbortController();

        try {
            setAnalysisData("");


            await apiService.streamCandidateAnalysis(resumeId, jdId, (chunk) => {
                const formatted = formatAnalysisData(chunk);
                setAnalysisData(formatted);
              });
        } catch (error) {
            if ((error as Error).name !== "AbortError") {
                setError(`Error: ${(error as Error).message}`);
            }
        } finally {
            setLoading(false);
        }

        return () => abortController.abort(); // Cleanup function
    };
    

    return { 
        handleGenerateAnalysis, 
        toggleBookmark, 
        handleInitiateContact, 
        GenerateAnalysis

    };
};
