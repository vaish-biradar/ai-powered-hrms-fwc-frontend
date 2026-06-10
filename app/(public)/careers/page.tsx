"use client"

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { ResumeUploadSection } from '@/app/(public)/careers/_components/upload-resume';
import { JobListingsSection } from '@/app/(public)/careers/_components/jobs-container';
import { WhyJoinSection } from '@/app/(public)/careers/_components/why-join';
import { MatchedJob } from '@/types/careers-types';
import { Progress } from '@/components/ui/progress';
import { useAtom, useSetAtom } from 'jotai';
import {
  resumeUploadedAtom, processingResumeAtom, matchingJobsAtom, jobOpeningsAtom, resumeIDAtom, fileNameAtom,
  applyingStatesAtom, jobIdAtom, similarityAtom, jdTitleAtom, isAnalysisLoadingAtom
} from '@/store/career-atom';
import { fetchJobOpenings, uploadResume, matchResumeToJobs, applyForJob } from "@/app/(public)/careers/_services/api-service";
import { FormData } from '@/types/careers-types';
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import { AnalysisContent } from '@/app/(public)/careers/_components/analysis-page';
import { ScrollArea } from '@/components/ui/scroll-area';
import Footer from '../../../components/public/end-footer';
import axios from 'axios';
import { MockInterviewDialog } from '@/app/(public)/careers/_components/mock-interview-dialog';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function CareersPage() {
  const setFileName = useSetAtom(fileNameAtom);
  const setResumeUploaded = useSetAtom(resumeUploadedAtom);
  const [processingResume, setProcessingResume] = useAtom(processingResumeAtom);
  const [resumeID, setResumeID] = useAtom(resumeIDAtom);
  const [jobOpenings, setJobOpenings] = useAtom(jobOpeningsAtom);
  const setMatchingJobs = useSetAtom(matchingJobsAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [applyingStates, setApplyingStates] = useAtom(applyingStatesAtom);
  const setJobId = useSetAtom(jobIdAtom);
  const setSimilarity = useSetAtom(similarityAtom);
  const setJdTitle = useSetAtom(jdTitleAtom);
  const [isAnalysisLoading, setAnalysisLoading] = useAtom(isAnalysisLoadingAtom);

  const [isAnalysisSheetOpen, setIsAnalysisSheetOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<MatchedJob | null>(null);
  const [isMockInterviewOpen, setIsMockInterviewOpen] = useState(false);
  const [mockInterviewJob, setMockInterviewJob] = useState<MatchedJob | null>(null);
  const [mounted, setMounted] = useState(false);
  const [processStage, setProcessStage] = useState<'idle' | 'checking' | 'uploading' | 'matching'>('idle');
  useEffect(() => {
    setMounted(true);
    const loadJobs = async () => {
      setLoading(true);
      try {
        const jobs = await fetchJobOpenings();
        setJobOpenings(jobs);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, [setJobOpenings]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      toast.error("File size exceeds the 5MB limit.");
      return;
    }

    const allowedExtensions = [ 'docx', 'pdf', 'txt'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    toast.error("Only  .docx and .pdf,  files are allowed.");
    return;
  }
    
    setFileName(file.name);
    setProcessingResume(true);
    
    // Start with checking document
    setProcessStage('checking');
    updateProgress(10);
    
    // Simulate document checking (in a real app, this would be an actual validation step)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Move to uploading stage
    
      const response = await uploadResume(file);

      if (typeof response === 'string') {
        throw new Error(response);
      }
  
      const { id, message, warning }: { id: string; message?: string; warning?: string } = response;
      setProcessStage('uploading');
      updateProgress(30);
      
      if (warning) {
        toast.warning("Upload only a proper resume document.", {
          description: warning,
          duration: 5000,
        });
        setResumeUploaded(false);
        setProgress(0);
        updateProgress(0);
        setProcessingResume(false);
        setFileName('');
        setMatchingJobs([]);
        setProcessStage('idle');
      
        return; // 🔁 THIS is the missing piece!
      }
      
  
      if (!id) {
        if (warning) {
          return;
        }
        throw new Error("Invalid response format");
      }
      
      setResumeID(id);
      updateProgress(60);
      toast.success(message || "Resume uploaded successfully!");
      
      // Move to matching stage
      setProcessStage('matching');
      updateProgress(70);
      
      const matchedJobs = await matchResumeToJobs(id, jobOpenings);
      setResumeUploaded(true);
      setMatchingJobs(matchedJobs);
    
      toast.success("Job matching completed!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const serverMessage = error.response?.data?.error;
        if (serverMessage) {
          throw new Error(serverMessage);
        }
      }
      throw new Error("Failed to upload resume. Please try again.");
    } finally {
      updateProgress(100);
      setTimeout(() => {
        setProcessingResume(false);
        setProcessStage('idle');
      }, 500);
    }
  };

  const updateProgress = (targetValue: number) => {
    setProgress((prev) => (prev < targetValue ? targetValue : prev));
  };



  const handleApply = async (jdId: string, similarity: number, formData: FormData) => {
    
    if (applyingStates[jdId]) return;

    setApplyingStates((prev) => ({ ...prev, [jdId]: true }));

    if (resumeID && similarity) {
      try {
        const message = await applyForJob(resumeID, jdId, similarity, formData );

        if (message.toLowerCase().includes("already applied")) {
          toast.warning(message); 
        } else {
          toast.success(message, {
            description: "Check your status later using our chatbot by providing your email address",
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("An unknown error occurred");
        }
      } finally {
        setApplyingStates((prev) => ({ ...prev, [jdId]: false }));
      }
    } else {
      toast.error("Resume ID or Similarity is null");
      setApplyingStates((prev) => ({ ...prev, [jdId]: false }));
    }
  };

  const resetUpload = () => {
    setResumeUploaded(false);
    setProgress(0);
    setProcessingResume(false);
    setFileName('');
    setMatchingJobs([]);
    setProcessStage('idle');
  };

  const handleGenerateAnalysis = (job: MatchedJob) => {
    setAnalysisLoading((prev) => ({ ...prev, [job.jd_id]: true }));
    setJobId(job.id);
    setSimilarity(job.similarity);
    setJdTitle(job.title);
    setSelectedJob(job);
    setIsAnalysisSheetOpen(true);
    setTimeout(() => {
      setAnalysisLoading((prev) => ({ ...prev, [job.jd_id]: false }));
    }, 500);
  };

  const handleMockInterview = (job: MatchedJob) => {
    if (!resumeID) {
      toast.warning('Please upload a resume first.');
      return;
    }
    setMockInterviewJob(job);
    setIsMockInterviewOpen(true);
  };

  const getProcessStageText = () => {
    switch (processStage) {
      case 'checking':
        return "Checking document...";
      case 'uploading':
        return "Uploading resume...";
      case 'matching':
        return "Matching with jobs...";
      default:
        return "Processing...";
    }
  };

  if (error) return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex items-center justify-center min-h-screen p-4"
    >
      <div className="bg-destructive/10 p-6 rounded-lg text-destructive">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen pt-16 sm:pt-20 md:pt-24">
      <div className="container px-4 md:px-6 mx-auto">
        {/* Header Section */}
        <motion.div 
          initial="hidden"
          animate={mounted ? "visible" : "hidden"}
          variants={fadeInUp}
          className="flex flex-col items-start justify-center space-y-4 text-center mb-8 md:mb-12"
        >
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Join Our Team</h1>
          <p className="max-w-[900px] text-muted-foreground text-lg md:text-xl">
            Build your career with a company that values innovation, growth, and excellence
          </p>
        </motion.div>

        {/* Why Join Section */}
        <motion.div
          initial="hidden"
          animate={mounted ? "visible" : "hidden"}
          variants={fadeInUp}
          transition={{ delay: 0.2 }}
        >
          <WhyJoinSection />
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-4"
          >
            {/* Full-width Skeleton */}
            <Skeleton className="h-64 sm:h-72 md:h-80 w-full rounded-lg" />

            {/* Job Opportunities Section */}
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 mt-6 sm:mb-6">Job Opportunities</h2>

            {/* Grid with 6 Skeleton Cards (responsive grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className="h-32 sm:h-36 md:h-40 w-full rounded-lg" />
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            {/* Resume Upload Section */}
            <motion.div
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              variants={fadeInUp}
              transition={{ delay: 0.3 }}
            >
              <ResumeUploadSection onFileUpload={handleFileUpload} onResetUpload={resetUpload} />
            </motion.div>

            {/* Resume Processing Progress */}
            {processingResume && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-8 space-y-3 sm:space-y-4"
              >
                <div className="flex flex-col items-center space-y-2">
                  <p className="text-center font-medium">{getProcessStageText()}</p>
                  <div className="flex justify-center items-center w-full max-w-md space-x-2 text-xs text-muted-foreground">
                    <span className={`${processStage === 'checking' || processStage === 'uploading' || processStage === 'matching' ? 'text-primary font-medium' : ''}`}>
                      Check
                    </span>
                    <span>→</span>
                    <span className={`${processStage === 'uploading' || processStage === 'matching' ? 'text-primary font-medium' : ''}`}>
                      Upload
                    </span>
                    <span>→</span>
                    <span className={`${processStage === 'matching' ? 'text-primary font-medium' : ''}`}>
                      Match
                    </span>
                  </div>
                </div>
                <Progress value={progress} className="w-full" />
              </motion.div>
            )}


            {/* Job Listings Section */}
            <motion.div
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              variants={staggerContainer}
              transition={{ delay: 0.4 }}
            >
              <JobListingsSection
                onApply={handleApply}
                onGenerateAnalysis={handleGenerateAnalysis}
                onMockInterview={handleMockInterview}
              />
            </motion.div>
          </>
        )}
      </div>

      {/* Analysis Sheet */}
      <Sheet open={isAnalysisSheetOpen} onOpenChange={setIsAnalysisSheetOpen}>
        <SheetContent className="w-full max-w-[95%] sm:max-w-[600px] p-3 sm:p-6 overflow-y-auto" side="right">
          <SheetHeader>
            <SheetTitle>Resume Analysis for {selectedJob?.title}</SheetTitle>
            <SheetDescription>
              Match score: {selectedJob?.similarity.toFixed(1)}%
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="max-h-[65vh] sm:max-h-[70vh] md:max-h-[80vh] overflow-auto mt-2 sm:mt-4">
            {selectedJob?.id && isAnalysisLoading[selectedJob.id] ? (
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-3 sm:space-y-4 mt-4 sm:mt-6"
              >
                <motion.div variants={fadeInUp}><Skeleton className="h-6 sm:h-8 w-3/4" /></motion.div>
                <motion.div variants={fadeInUp}><Skeleton className="h-24 sm:h-32 w-full" /></motion.div>
                <motion.div variants={fadeInUp}><Skeleton className="h-6 sm:h-8 w-1/2" /></motion.div>
                <motion.div variants={fadeInUp}><Skeleton className="h-24 sm:h-32 w-full" /></motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {selectedJob && (
                  <AnalysisContent jobId={selectedJob.id} />
                )}
              </motion.div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <MockInterviewDialog
        open={isMockInterviewOpen}
        onOpenChange={setIsMockInterviewOpen}
        selectedJob={mockInterviewJob}
        resumeId={resumeID || ''}
      />
      
      <motion.div
        initial="hidden"
        animate={mounted ? "visible" : "hidden"}
        variants={fadeInUp}
        transition={{ delay: 0.6 }}
      >
        <Footer />
      </motion.div>
    </div>
  );
}