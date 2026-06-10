
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    jobDescriptionsAtom,
    selectedJdAtom,
    applyFilterAtom,
    matchResultsAtom,
    selectedJobDescriptionAtom,
    matchLoadingAtom,
    errorAtom,
    loadingAtom,
    filteredResultsAtom,
} from '@/store/candidatesearch-atom';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, BriefcaseBusiness, MapPin, Clock, Award, BookOpen, Sparkles, Search } from 'lucide-react';
import { apiService } from '../../_services/api-service';

export const JobDescriptionSidebar = () => {
    const [jobDescriptions] = useAtom(jobDescriptionsAtom);
    const [selectedJd, setSelectedJd] = useAtom(selectedJdAtom);
    const [applyFilter, setApplyFilter] = useAtom(applyFilterAtom);
    const [, setMatchResults] = useAtom(matchResultsAtom) || [];
    const loading = useAtomValue(loadingAtom);
    const setFilteredResults = useSetAtom(filteredResultsAtom);

    const handleSelectJd = (jdId: string) => {
        setSelectedJd(jdId);
        setMatchResults([]);
        setFilteredResults([]);
    };

    const [matchLoading, setMatchLoading] = useAtom(matchLoadingAtom);
    const setError = useSetAtom(errorAtom);
    const selectedJob = useAtomValue(selectedJobDescriptionAtom);

    const getBadgeColor = (status: string) => {
        switch (status) {
            case "Active": return "bg-green-500";
            case "Closed": return "bg-red-500";
            case "Draft": return "bg-gray-500";
            default: return "bg-blue-500";
        }
    };
    const handleMatchJdToResumes = async () => {
        if (!selectedJd) return;

        setMatchLoading(true);
        setError(null);

        try {
            const data = await apiService.matchJdToResumes(selectedJd, applyFilter);
            setMatchResults(Array.isArray(data) ? data : data.matches || []);
            
            setMatchLoading(false);
        } catch (error) {
            console.error(error);
            setError('Failed to match job description to resumes. Please try again.');
            setMatchLoading(false);
        }
    };

    return (
        <Card className="sticky top-18 h-full">
            <CardHeader className="pb-1">
                <CardTitle className="flex items-center text-lg">
                    <ClipboardList className="mr-2 h-5 w-5 text-indigo-500" />
                    Job Descriptions
                </CardTitle>
                <CardDescription>
                    Select a position to find candidates
                </CardDescription>
                <div className="flex items-center space-x-2  py-2">
                    <Switch
                        id="apply-filter"
                        checked={applyFilter}
                        onCheckedChange={setApplyFilter}
                    />
                    <Label htmlFor="apply-filter" className="text-sm">Advanced Matching (Role Only)</Label>
                </div>
            </CardHeader>
            <Separator />
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Job Position
                        </label>
                        <Select onValueChange={handleSelectJd} value={selectedJd || undefined}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a job position" />
                            </SelectTrigger>
                            <SelectContent>
                                {jobDescriptions.map((jd) => (
                                    <SelectItem key={jd.id} value={jd.id}>
                                        {jd.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                )}

                {selectedJd && selectedJob && (
                    <div className="mt-6 space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1.5">Position Details</h3>
                            <h2 className="text-lg font-semibold">{selectedJob?.title}</h2>

                            <div className="mt-1 flex items-center">
                                <Badge
                                    className={`${getBadgeColor(selectedJob?.status || "Active")} text-white`}
                                >
                                    {selectedJob?.status || "Active"}
                                </Badge>
                                <span className="text-sm text-gray-500 ml-2">
                                    Posted: {new Date(selectedJob?.created_at || "").toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center">
                                <BriefcaseBusiness className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm">{selectedJob?.department || "N/A"}</span>
                            </div>
                            <div className="flex items-center">
                                <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm">{selectedJob?.location || "N/A"}</span>
                            </div>
                            <div className="flex items-center">
                                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm">{selectedJob?.employment_type || "N/A"}</span>
                            </div>
                            <div className="flex items-center">
                                <Award className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm">{selectedJob?.experience_level || "N/A"}</span>
                            </div>
                            <div className="flex items-center">
                                <BookOpen className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm">{selectedJob?.total_openings || 0} Openings</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Required Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {(selectedJob?.skills || "").split(',').map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="">
                                        {skill.trim()}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </CardContent>
            <Separator />

            <CardFooter className='flex flex-col gap-2'>


                <Button
                    className="w-full"
                    onClick={handleMatchJdToResumes}
                    disabled={matchLoading}
                >
                    {matchLoading ? (
                        <>
                            <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                            Finding candidates...
                        </>
                    ) : (
                        <>
                            <Search className="h-4 w-4 mr-2" />
                            Find Matching Candidates
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
};
