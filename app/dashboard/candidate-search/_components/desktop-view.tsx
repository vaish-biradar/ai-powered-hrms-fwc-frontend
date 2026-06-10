"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ChevronsUpDown, Star, Eye, Mail, Phone } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCandidateActions } from '../_utils/actions';
import { analysisLoadingAtom, bookmarkedCandidatesAtom, contactLoadingAtom, filteredResultsAtom, selectedJobDescriptionAtom, sortOrderAtom } from '@/store/candidatesearch-atom';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import ContactButton from './email-sheet';





const MatchingUsersDesktop = () => {


    const { GenerateAnalysis, toggleBookmark } = useCandidateActions();
    const analysisLoading = useAtomValue(analysisLoadingAtom);

    const filteredResults = useAtomValue(filteredResultsAtom);
    const selectedJob = useAtomValue(selectedJobDescriptionAtom);

    const bookmarkedCandidates = useAtomValue(bookmarkedCandidatesAtom);
    const contactLoading = useAtomValue(contactLoadingAtom);
    const [sortOrder, setSortOrder] = useAtom(sortOrderAtom);





    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };
    const [analysisData, setAnalysisData] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);















    const HGenerateAnalysis = (resumeId: string, jdId: string) => {
        GenerateAnalysis(resumeId, jdId, setAnalysisData, setLoading, setError);
    }




    // Auto-scroll when new data is added
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [analysisData]);


    const showResume = (path: string) => {
        window.open(`https://docs.google.com/gview?url=${encodeURIComponent(path)}&embedded=true`, "_blank");

    }



    const getSimilarityInfo = (score: number) => {
        if (score >= 80) return { color: "text-indigo-600" };
        if (score >= 60) return { color: "text-amber-600" };
        if (score >= 40) return { color: "text-red-600" };
        return { color: "text-red-600" };
    };

    return (
        <ScrollArea className="h-[30vh]">
            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Contact Info</TableHead>
                            <TableHead>
                                <div className="flex items-center">
                                    Match Score
                                    <ChevronsUpDown
                                        className="h-4 w-4 ml-1 cursor-pointer"
                                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                    />
                                </div>
                            </TableHead>
                            <TableHead>Actions</TableHead>
                            <TableHead>Bookmark</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredResults.map((match) => {
                            const similarityScore = Math.round(match.similarity * 100);
                            const { color } = getSimilarityInfo(similarityScore);

                            return (
                                <TableRow key={match.resume_id}>
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-10 w-10 bg-indigo-100">
                                                <AvatarFallback className="text-indigo-700">
                                                    {getInitials(match.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium flex items-center">
                                                    {match.name}
                                                    {bookmarkedCandidates.has(match.resume_id) && (
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Star className="h-4 w-4 text-amber-500 ml-1 fill-current" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>Bookmarked</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">ID: {match.resume_id.substring(0, 15)}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <div className="flex items-center">
                                                <Mail className="h-3 w-3 mr-2 text-gray-400" />
                                                {match.email}
                                            </div>
                                            {match.phone && match.phone !== "Not Available" && (
                                                <div className="flex items-center">
                                                    <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                                    {match.phone}
                                                </div>
                                            )}

                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className={`font-medium ${color}`}>{similarityScore}%</span>
                                            <Progress value={similarityScore} className={`h-1 ${color}`} />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-2">
                                            <Button variant="outline" size="sm" onClick={() => showResume(match.path)} >
                                                <Eye className="h-3.5 w-3.5 mr-1" /> View
                                            </Button>




                                            <Sheet >
                                                <SheetTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (selectedJob) {
                                                                HGenerateAnalysis(match.resume_id, selectedJob.id);
                                                            }
                                                        }}
                                                        disabled={analysisLoading[match.resume_id]}
                                                    >
                                                        Analyze
                                                    </Button>
                                                </SheetTrigger>
                                                <SheetContent className="w-[95vw] sm:w-[80vw] max-w-6xl p-6">
                                                    <SheetHeader className="mb-2">
                                                        <SheetTitle className="text-2xl">Analysis Report for {match.name}</SheetTitle>
                                                        <div className="text-sm text-muted-foreground">
                                                            {selectedJob?.title} Position Analysis
                                                        </div>
                                                    </SheetHeader>

                                                    <ScrollArea className="h-[75vh] w-full rounded-md pr-4" ref={scrollRef}>
                                                        {error && !analysisData ? (
                                                            <div className="text-red-500 text-center py-4">
                                                                Failed to load analysis data. Please try again.
                                                            </div>
                                                        ) : (
                                                            <div className="prose prose-slate max-w-none dark:prose-invert text-sm">
                                                                {loading && (
                                                                    <div className="flex items-center justify-center p-4">
                                                                        <div className="animate-pulse text-primary">Generating analysis...</div>
                                                                    </div>
                                                                )}
                                                                <ReactMarkdown
                                                                    remarkPlugins={[remarkGfm]}
                                                                    rehypePlugins={[rehypeRaw]}
                                                                    components={{
                                                                        h2: ({ ...props }) => (
                                                                            <h2 className="text-xl font-semibold mt-6 mb-3 border-b pb-2" {...props} />
                                                                        ),
                                                                        h3: ({ ...props }) => (
                                                                            <h3 className="text-lg font-medium mt-4 mb-2 text-indigo-600" {...props} />
                                                                        ),
                                                                        table: ({ ...props }) => (
                                                                            <div className="overflow-x-auto  border  my-4 bg-background w-full">
                                                                                <table className="min-w-full " {...props} />
                                                                            </div>
                                                                        ),
                                                                        th: ({ ...props }) => (
                                                                            <th
                                                                                className="p-1 bg-muted-foreground text-muted text-left text-sm font-semibold  uppercase tracking-wider"
                                                                                {...props}
                                                                            />
                                                                        ),
                                                                        td: ({ node, children, ...props }) => {
                                                                            const isFirstColumn = node?.position?.start?.column === 1;
                                                                            return (
                                                                                <td
                                                                                    className={`p-1 whitespace-normal text-sm text-primary border-t border-gray-100 ${isFirstColumn ? 'text-left' : 'text-center'
                                                                                        }`}
                                                                                    {...props}
                                                                                >
                                                                                    {children}
                                                                                </td>
                                                                            );
                                                                        },

                                                                        ul: ({ ...props }) => (
                                                                            <ul className="list-disc pl-6 space-y-1 my-2" {...props} />
                                                                        ),
                                                                        li: ({ ...props }) => (
                                                                            <li className="text-sm leading-relaxed" {...props} />
                                                                        ),
                                                                        code: ({ ...props }) => (
                                                                            <code
                                                                                className={`block bg-gray-50 p-4 my-2 text-sm font-mono text-primary break-words`}
                                                                                {...props}
                                                                            />
                                                                        ),
                                                                        a: ({ ...props }) => (
                                                                            <a
                                                                                className="text-indigo-600 hover:text-indigo-800 underline break-all"
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                {...props}
                                                                            />
                                                                        ),
                                                                    }}
                                                                >
                                                                    {analysisData}
                                                                </ReactMarkdown>


                                                            </div>
                                                        )}
                                                    </ScrollArea>
                                                </SheetContent>

                                            </Sheet>


                                            <ContactButton
                                                match={{
                                                    name: match.name,
                                                    email: match.email,
                                                    resume_id: match.resume_id
                                                }}
                                                selectedJob={selectedJob}
                                                contactLoading={contactLoading}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleBookmark(match.resume_id)}
                                                >
                                                    {bookmarkedCandidates.has(match.resume_id) ? (
                                                        <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                                                    ) : (
                                                        <Star className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {bookmarkedCandidates.has(match.resume_id) ? "Remove bookmark" : "Bookmark candidate"}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div >
        </ScrollArea >
    );
};

export default MatchingUsersDesktop;