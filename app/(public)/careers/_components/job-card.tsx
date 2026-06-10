import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, CheckCircle, Clock, Download, FileText, Loader2, MapPin, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { JobCardProps, MatchedJob, FormData } from '@/types/careers-types';
import { applyingStatesAtom, isAnalysisLoadingAtom } from '@/store/career-atom';
import { useAtomValue, useSetAtom } from 'jotai';
import { ApplicationDialog } from './input-dialog';

export const JobCard = ({ job, isMatched = false, onApply, onGenerateAnalysis, onMockInterview }: JobCardProps) => {
    const isAnalysisLoading = useAtomValue(isAnalysisLoadingAtom);
    const applyingStates = useAtomValue(applyingStatesAtom);
    const setApplyingStates = useSetAtom(applyingStatesAtom);

    // Dialog open state
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleApplicationSubmit = (formData: FormData): void => {
        const sanitizedFormData: FormData = {
            name: '',
            email: '',
            mobile: '',
            totalExperience: '',
            currentCtc: '',
            expectedCtc: '',
            currentCompany: '',
            currentLocation: '',
            currentJobTitle: '',
            noticePeriod: ''
        };
        for (const [key, value] of Object.entries(formData)) {
            sanitizedFormData[key as keyof FormData] = typeof value === 'string' ? value : '';
        }
        // Set this job's applying state to true
        setApplyingStates(prev => ({
            ...prev,
            [job.id]: true
        }));

        for (const [key, value] of Object.entries(formData)) {
            formData[key as keyof FormData] = value?.toString();
        }
        onApply?.(job.id, isMatched ? (job as MatchedJob).similarity / 100 : 0, formData);
        setDialogOpen(false);
    };

    return (
        <>
            <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <CardHeader className="">
                    <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-xl font-semibold line-clamp-1" title={job.title}>
                                {job.title}
                            </CardTitle>
                            {isMatched && (
                                <Badge className="px-3 py-1 text-xs font-semibold bg-purple-600 text-white rounded-md flex-shrink-0">
                                    {(job as MatchedJob).similarity}%
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="line-clamp-2">
                            {job.department}
                        </CardDescription>

                    </div>
                </CardHeader>

                <CardContent className="flex-grow pb-2">
                    <div className="flex flex-wrap gap-2  pb-2 max-w-full truncate" >
                        <Badge
                            variant="outline"
                            className="text-xs flex items-center gap-1 "
                            title="Job Location"
                        >
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                        </Badge>

                        <Badge
                            variant="outline"
                            className="text-xs flex items-center gap-1 "
                            title="Experience Required"
                        >
                            <Briefcase className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{job.experience_level}</span>
                        </Badge>

                        <Badge
                            variant="outline"
                            className="text-xs flex items-center gap-1 "
                            title="Employment Type"
                        >
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{job.employment_type}</span>
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4 text-justify">{job.summary}</p>
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Key Skills:</h4>
                        <div className="max-w-full overflow-hidden" title={job.skills.join(', ')}>
                            <div className="flex flex-wrap gap-1.5">
                                {Array.isArray(job.skills) && job.skills.slice(0, 3).map(skill => (
                                    <Badge key={skill} variant="secondary" className="text-xs max-w-[30%]">
                                        <span className="truncate">{skill}</span>
                                    </Badge>
                                ))}
                                {Array.isArray(job.skills) && job.skills.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{job.skills.length - 3} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="pt-4 pb-4 border-t">
                    <div className="flex w-full flex-wrap gap-3 items-center">
                        {isMatched && (
                            <>
                                <Button
                                    variant="outline"
                                    className="text-sm flex items-center justify-center gap-2"
                                    onClick={() => onGenerateAnalysis?.(job as MatchedJob)}
                                    title="Generate match analysis"
                                    disabled={isAnalysisLoading[job.id]}
                                >
                                    {isAnalysisLoading[job.id] ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="truncate">Wait...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-4 h-4" />
                                            <span className="truncate">Analysis</span>
                                        </>
                                    )}
                                </Button>
                                <Button
                                    className="text-sm flex items-center justify-center gap-2"
                                    onClick={() => setDialogOpen(true)}
                                    disabled={applyingStates[job.id]}
                                >
                                    {applyingStates[job.id] ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="truncate">Applying...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="truncate">Apply</span>
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="text-sm flex items-center justify-center gap-2"
                                    onClick={() => onMockInterview?.(job as MatchedJob)}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="truncate">Mock Interview</span>
                                </Button>
                            </>
                        )}
                        <div className="sm:ml-auto">
                            <Link href={job.path} download>
                                <Button
                                    variant="secondary"
                                    className="text-sm flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="truncate">Download</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardFooter>
            </Card>

            {/* Application Dialog */}
            <ApplicationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                jobTitle={job.title}
                onSubmit={handleApplicationSubmit}
                isSubmitting={applyingStates[job.id]}
            />
        </>
    );
};