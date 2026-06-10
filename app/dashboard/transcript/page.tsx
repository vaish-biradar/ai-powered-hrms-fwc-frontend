// pages/index.tsx
"use client"

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Header from '../_components/app-header';
import { Upload, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { fetchMockInterviews, analyzeTranscriptText } from '@/app/(public)/careers/_services/api-service';

interface TranscriptAnalysis {
    overall_impression: string;
    technical_skills: string | string[];
    communication_skills: string;
    problem_solving: string;
    cultural_fit: string;
    areas_for_improvement: string;
    technical_skills_percentage: string;
    communication_skills_percentage: string;
    problem_solving_percentage: string;
    cultural_fit_percentage: string;
    problem_details: {
        problem_given: string;
        time_taken: string;
        solution_approach: string;
        clear_thinking: string;
        score: string;
    };
    skill_measures: {
        technical_skills: string;
        communication_skills: string;
        problem_solving: string;
        cultural_fit: string;
    };
    technical_skill_tests: Record<string, {
        tested: string;
        candidate_answer: string;
        score: string;
    }>;
}

interface MockInterviewRecord {
    id: string;
    candidate_name: string;
    candidate_email: string;
    job_title: string;
    created_at: string;
    transcript_text: string;
}

export default function TranscriptProcessor() {
    const [file, setFile] = useState<File | null>(null);
    const [analysisResult, setAnalysisResult] = useState<TranscriptAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [status, setStatus] = useState("");
    const [mockInterviews, setMockInterviews] = useState<MockInterviewRecord[]>([]);
    const [loadingMockInterviews, setLoadingMockInterviews] = useState(false);
    const [selectedTranscript, setSelectedTranscript] = useState<MockInterviewRecord | null>(null);
    const [analyzingInterviewId, setAnalyzingInterviewId] = useState<string | null>(null);
    const [selectedAnalyzedInterview, setSelectedAnalyzedInterview] = useState<MockInterviewRecord | null>(null);

    useEffect(() => {
        const loadMockInterviews = async () => {
            setLoadingMockInterviews(true);
            try {
                const records = await fetchMockInterviews();
                setMockInterviews(records || []);
            } catch (error) {
                console.error("Failed to load mock interviews:", error);
            } finally {
                setLoadingMockInterviews(false);
            }
        };

        loadMockInterviews();
    }, []);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = event.target.files?.[0];
        if (uploadedFile) {
            setFile(uploadedFile);
        }
    };

    const handleDialogOpen = (open: boolean) => {
        if (open) {
            // Clear previous analysis results when opening the dialog
            setAnalysisResult(null);
            setFile(null);
        }
        setDialogOpen(open);
    };

    // Helper function to clean and parse JSON response that might contain Markdown formatting
    const cleanAndParseJSON = (jsonString: string): Record<string, unknown> => {
        try {
            // First try direct parsing
            return JSON.parse(jsonString);
        } catch {
            // If direct parsing fails, try to clean the string
            try {
                // Remove markdown code block markers and any other non-JSON content
                let cleaned = jsonString;
                
                // Remove markdown code block syntax
                cleaned = cleaned.replace(/```json\n|\n```|```/g, '');
                
                // Trim whitespace
                cleaned = cleaned.trim();
                
                // Try parsing again
                return JSON.parse(cleaned);
            } catch (secondError) {
                console.error("Failed to parse JSON after cleaning:", secondError);
                throw new Error("Invalid JSON response format");
            }
        }
    };

    const processTranscript = async () => {
        if (!file) {
            toast.warning("Please upload a transcript file first.")
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/proxy/transcript/process', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                
                let parsedResponse;
                try {
                    // Handle the response which might be a string or already parsed
                    if (typeof data.response === 'string') {
                        parsedResponse = cleanAndParseJSON(data.response);
                    } else {
                        parsedResponse = data.response;
                    }
                    
                    setAnalysisResult(parsedResponse);
                    toast.success("Transcript processed successfully!");
                    setDialogOpen(false);
                } catch (parseError) {
                    console.error("Error parsing response:", parseError);
                    toast.error("Failed to parse the analysis results. The response format was unexpected.");
                }
            } else {
                throw new Error('Failed to process transcript');
            }
        } catch (error) {
            console.error("API error:", error);
            toast.error("An error occurred while processing the transcript.")
        } finally {
            setLoading(false);
        }
    };

    const analyzeSavedInterview = async (record: MockInterviewRecord) => {
        if (!record.transcript_text?.trim()) {
            toast.warning("Transcript content is empty.");
            return;
        }

        setAnalyzingInterviewId(record.id);
        setLoading(true);

        try {
            const data = await analyzeTranscriptText(record.transcript_text);
            const responsePayload = data?.response;
            const parsedResponse =
                typeof responsePayload === 'string'
                    ? cleanAndParseJSON(responsePayload)
                    : responsePayload;

            setAnalysisResult(parsedResponse as TranscriptAnalysis);
            setSelectedAnalyzedInterview(record);
            toast.success(`Analysis generated for ${record.candidate_name || 'candidate'}.`);
            setTimeout(() => {
                window.scrollTo({ top: 420, behavior: 'smooth' });
            }, 100);
        } catch (error) {
            console.error("Error analyzing saved transcript:", error);
            toast.error("Failed to analyze saved transcript.");
        } finally {
            setLoading(false);
            setAnalyzingInterviewId(null);
        }
    };

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedAnalyzedInterview) {
            toast.warning("Please click Analyze on a saved interview first.");
            return;
        }

        if (!feedback.trim()) {
            toast.warning("Please enter feedback before submitting.");
            return;
        }

        if (!status || status === "select") {
            toast.warning("Please select a status before submitting.");
            return;
        }

        if (!analysisResult) {
            toast.warning("Please generate analysis before sending feedback.");
            return;
        }

        setSubmittingFeedback(true);
        try {
            const response = await fetch('/api/mock-interview-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateEmail: selectedAnalyzedInterview.candidate_email,
                    candidateName: selectedAnalyzedInterview.candidate_name,
                    jobTitle: selectedAnalyzedInterview.job_title,
                    status,
                    feedback,
                    overallImpression: analysisResult.overall_impression,
                    areasForImprovement: analysisResult.areas_for_improvement,
                    technicalScore: analysisResult.technical_skills_percentage,
                    communicationScore: analysisResult.communication_skills_percentage,
                    problemSolvingScore: analysisResult.problem_solving_percentage,
                    culturalFitScore: analysisResult.cultural_fit_percentage,
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result?.error || 'Failed to send feedback email');
            }

            toast.success("Feedback email sent to candidate successfully.");
            setFeedback('');
            setStatus("select");
        } catch (error) {
            console.error("Error submitting feedback:", error);
            toast.error(error instanceof Error ? error.message : "Failed to submit feedback. Please try again.");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const AnalysisResultSkeleton = () => (
        <div className="space-y-6">
            <div>
                <div className="mb-4">
                    <Skeleton className="h-6 w-1/2" />
                </div>
                <div>
                    {[...Array(8)].map((_, index) => (
                        <div key={index} className="flex items-center space-x-4 mb-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
    
    const formatTechnicalSkills = (skills: string | string[]): string => {
        // If skills is already a string, we'll assume it needs comma formatting
        if (typeof skills === 'string') {
            return skills.replace(/([a-z])([A-Z])/g, '$1, $2');
        }

        // If skills is an array, join with commas
        if (Array.isArray(skills)) {
            return skills.join(', ');
        }

        // Return original if neither string nor array
        return String(skills);
    };

    return (
        <>
            <Header title="Interview Transcript Analysis">
                <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Upload className="h-4 w-4" /> {file ? "Upload Another" : "Upload Transcript"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload Interview Transcript</DialogTitle>
                            <DialogDescription>
                                Upload a text file containing the interview transcript for AI-powered analysis.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                type="file"
                                accept=".txt"
                                onChange={handleFileUpload}
                                className="w-full cursor-pointer"
                            />

                            {file && (
                                <div className="p-3 rounded-md">
                                    <p className="text-sm">📄 Selected File: <span className="font-semibold">{file.name}</span></p>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">
                                    {file ? "Ready to analyze" : "No file selected"}
                                </p>
                                <Button
                                    onClick={processTranscript}
                                    disabled={!file || loading}
                                    className="ml-auto"
                                >
                                    {loading ? 'Processing...' : 'Analyze Transcript'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </Header>

            <div className="w-full mx-auto p-6 pt-24">
                <div className="w-full">

                    <Card className="shadow-sm mb-8">
                        <CardHeader className="pb-2">
                            <CardTitle>Saved Mock Interviews</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingMockInterviews ? (
                                <Skeleton className="h-24 w-full" />
                            ) : mockInterviews.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No mock interviews saved yet.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Candidate</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Job</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockInterviews.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.candidate_name || '-'}</TableCell>
                                                <TableCell>{item.candidate_email || '-'}</TableCell>
                                                <TableCell>{item.job_title || '-'}</TableCell>
                                                <TableCell>{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => analyzeSavedInterview(item)}
                                                        disabled={loading || analyzingInterviewId === item.id}
                                                    >
                                                        {analyzingInterviewId === item.id ? 'Analyzing...' : 'Analyze'}
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedTranscript(item)}>
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>


                    {!analysisResult && !loading && (
                        <div className="flex flex-col items-center justify-center space-y-4 p-4">
                            <h3 className="text-xl font-semibold text-center">No Transcript Uploaded</h3>
                            <p className="text-muted-foreground max-w-md">
                                Use the <b>Upload Transcript</b> button in the header to analyze an interview transcript.
                                Our AI will provide detailed insights into the candidate{"'"}s technical skills,
                                communication, problem-solving, and cultural fit.
                            </p>
                        </div>
                    )}

                    {loading && <AnalysisResultSkeleton />}

                    {analysisResult && (
                        <div className="space-y-8">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle>Overall Assessment</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Overall Impression Card */}
                                        {analysisResult.overall_impression && (
                                            <div className="p-4 rounded-lg bg-muted/30 border border-muted">
                                                <h3 className="font-medium text-lg mb-2">Overall Impression</h3>
                                                <p className="text-sm">{analysisResult.overall_impression}</p>
                                            </div>
                                        )}

                                        {/* Areas for Improvement Card */}
                                        {analysisResult.areas_for_improvement && (
                                            <div className="p-4 rounded-lg bg-muted/30 border border-muted">
                                                <h3 className="font-medium text-lg mb-2">Areas for Improvement</h3>
                                                <p className="text-sm">{analysisResult.areas_for_improvement}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Skills Assessment Table */}
                            <Card className="shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle>Skills Assessment</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="w-full overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-1/4">Category</TableHead>
                                                    <TableHead className="w-1/2">Details</TableHead>
                                                    <TableHead className="w-1/4">Score</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {[
                                                    {
                                                        category: 'Technical Skills',
                                                        details: analysisResult.technical_skills,
                                                        score: analysisResult.technical_skills_percentage
                                                    },
                                                    {
                                                        category: 'Communication Skills',
                                                        details: analysisResult.communication_skills,
                                                        score: analysisResult.communication_skills_percentage
                                                    },
                                                    {
                                                        category: 'Problem Solving',
                                                        details: analysisResult.problem_solving,
                                                        score: analysisResult.problem_solving_percentage
                                                    },
                                                    {
                                                        category: 'Cultural Fit',
                                                        details: analysisResult.cultural_fit,
                                                        score: analysisResult.cultural_fit_percentage
                                                    },
                                                ].filter(row => row.details && row.score).map((row, index) => (
                                                    <TableRow key={index} className="break-words">
                                                        <TableCell className="font-medium whitespace-nowrap">{row.category}</TableCell>
                                                        <TableCell className="break-words whitespace-normal max-w-md">
                                                            {row.category === 'Technical Skills' ? formatTechnicalSkills(row.details) : row.details}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">{row.score}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Problem Details Section - Only show if data exists */}
                            {analysisResult.problem_details &&
                                Object.values(analysisResult.problem_details).some(val => val && val !== 'N/A') && (
                                    <Card className="shadow-sm">
                                        <CardHeader className="pb-2">
                                            <CardTitle>Problem Details</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="w-full overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-1/3">Attribute</TableHead>
                                                            <TableHead className="w-2/3">Details</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {Object.entries(analysisResult.problem_details)
                                                            .filter(([, value]) => value && value !== 'N/A')
                                                            .map(([key, value]) => (
                                                                <TableRow key={key} className="break-words">
                                                                    <TableCell className="font-medium whitespace-nowrap">
                                                                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                                    </TableCell>
                                                                    <TableCell className="break-words whitespace-normal max-w-md">{value}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                            {/* Technical Skill Tests Section - Only show if data exists */}
                            {analysisResult.technical_skill_tests &&
                                Object.keys(analysisResult.technical_skill_tests).length > 0 && (
                                    <Card className="shadow-sm">
                                        <CardHeader className="pb-2">
                                            <CardTitle>Technical Skill Tests</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="w-full overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Skill</TableHead>
                                                            <TableHead>Tested</TableHead>
                                                            <TableHead>Candidate Answer</TableHead>
                                                            <TableHead>Score</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {Object.entries(analysisResult.technical_skill_tests).map(([skill, details]) => (
                                                            <TableRow key={skill} className="break-words">
                                                                <TableCell className="font-medium whitespace-nowrap">{skill}</TableCell>
                                                                <TableCell className="break-words">{details.tested}</TableCell>
                                                                <TableCell className="break-words whitespace-normal max-w-md">{details.candidate_answer}</TableCell>
                                                                <TableCell className="whitespace-nowrap">{details.score}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                            <Card className="shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl">Provide Feedback</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Feedback target: {selectedAnalyzedInterview
                                            ? `${selectedAnalyzedInterview.candidate_name || '-'} (${selectedAnalyzedInterview.candidate_email || '-'})`
                                            : 'Analyze a saved interview to select candidate'}
                                    </p>
                                </CardHeader>

                                <form onSubmit={handleFeedbackSubmit}>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="feedback" className="text-sm font-medium">Your Feedback</Label>
                                            <Textarea
                                                id="feedback"
                                                placeholder="Share your feedback..."
                                                className="min-h-32 w-full resize-y"
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                                            <Select value={status} onValueChange={setStatus}>
                                                <SelectTrigger id="status" className="w-full">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="select">Select</SelectItem>
                                                    <SelectItem value="reject">Reject</SelectItem>
                                                    <SelectItem value="on_hold">On Hold</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="pt-2 pb-4">
                                        <Button
                                            type="submit"
                                            className="flex items-center gap-2 w-full sm:w-auto"
                                            disabled={submittingFeedback}
                                        >
                                            <Send className="h-4 w-4" />
                                            {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={!!selectedTranscript} onOpenChange={(open) => !open && setSelectedTranscript(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Mock Interview Transcript</DialogTitle>
                        <DialogDescription>
                            {selectedTranscript?.candidate_name || 'Candidate'} - {selectedTranscript?.job_title || 'Role'}
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea value={selectedTranscript?.transcript_text || ''} readOnly className="min-h-80" />
                </DialogContent>
            </Dialog>
        </>
    );
}