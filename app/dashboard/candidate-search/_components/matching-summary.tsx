import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { bookmarkedCandidatesAtom, compareStateAtom, filteredResultsAtom, matchResultsAtom, selectedJobDescriptionAtom } from '@/store/candidatesearch-atom';
import { useAtomValue, useSetAtom } from 'jotai';
import { Download, GitCompare, Loader2, Send, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import React from 'react';
import { useCandidateActions } from '../_utils/actions';
import { toast } from 'sonner';

const MatchingSummaryCard = () => {
    const matchResults = useAtomValue(matchResultsAtom);
    const filteredResults = useAtomValue(filteredResultsAtom);
    const bookmarkedCandidates = useAtomValue(bookmarkedCandidatesAtom);
    const selectedJob = useAtomValue(selectedJobDescriptionAtom);
    const [isLoading, setIsLoading] = React.useState(false);
    const setCompareState = useSetAtom(compareStateAtom);

    const { toggleBookmark, handleInitiateContact } = useCandidateActions();

    const handleContactCandidates = () => {
        setIsLoading(true);
        if (!selectedJob) return;

        const candidatesToContact = filteredResults.filter(match =>
            bookmarkedCandidates.has(match.resume_id)
        );

        if (candidatesToContact.length === 0) {
            toast.error("No bookmarked candidates to contact.");
            setIsLoading(false);
            return;
        }

        // Initiate contact calls in parallel
        Promise.allSettled(
            candidatesToContact.map(match =>
                handleInitiateContact(
                    match.resume_id,
                    match.name,
                    match.email,
                    selectedJob.title,
                    selectedJob.summary
                )
            )
        )
            .then(results => {
                const successMessages = results
                    .filter(res => res.status === "fulfilled" && res.value.success)

                const failureMessages = results
                    .filter(res => res.status === "fulfilled" && !res.value.success)

                if (successMessages.length > 0 && failureMessages.length === 0) {
                    toast.success(`Emails sent successfully to ${successMessages.length} candidates.`);
                } else if (successMessages.length > 0 && failureMessages.length > 0) {
                    toast.warning(
                        `Emails sent to ${successMessages.length} candidates, but ${failureMessages.length} failed.`
                    );
                } else {
                    toast.error("Failed to send emails to all candidates.");
                }
            })
            .catch(error => {
                console.error("Error initiating contact:", error);
                toast.error("An error occurred while contacting candidates.");
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleCompareCandidates = () => {
        setCompareState(true); // activate compare mode
    };

    const exportToExcel = () => {
        const currentDate = format(new Date(), "yyyy-MM-dd HH:mm:ss");
        const totalCount = filteredResults.length;

        // Prepare data for Excel
        const data = filteredResults.map(({ resume_id, name, email, similarity, path }) => ({
            "Resume ID": resume_id,
            Name: name,
            Email: email,
            "Match %": `${(similarity * 100).toFixed(1)}%`, // Convert to percentage
            Path: path
        }));

        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Define the header
        const header = [
            [`Job Title: ${selectedJob?.title || "N/A"}`],
            [`Date Taken: ${currentDate}`],
            [`Total Candidates: ${totalCount}`],
            [] // Empty row for spacing
        ];

        // Create a worksheet and add the header first
        const worksheet = XLSX.utils.aoa_to_sheet(header);

        // Append the data below the header
        XLSX.utils.sheet_add_json(worksheet, data, { origin: "A5", skipHeader: false });

        // Set column widths
        worksheet["!cols"] = [
            { wch: 12 }, // Resume ID
            { wch: 20 }, // Name
            { wch: 25 }, // Email
            { wch: 10 }, // Match %
            { wch: 30 }  // Path
        ];

        // Define styles
        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } }, // White text
            fill: { fgColor: { rgb: "4527A0" }, patternType: "solid" }, // Purple background
            alignment: { horizontal: "center", vertical: "center" }
        };

        const borderStyle = {
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            }
        };

        // Apply header styling
        const headerRowIndex = 4; // Since the main heading takes the first 4 rows
        const headerColumns = ["A", "B", "C", "D", "E"];
        headerColumns.forEach((col) => {
            const cellAddress = `${col}${headerRowIndex + 1}`;
            if (worksheet[cellAddress]) {
                worksheet[cellAddress].s = headerStyle;
            }
        });

        // Apply border to all cells
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (worksheet[cellAddress]) {
                    // Merge existing styles if any
                    const existingStyle = worksheet[cellAddress].s || {};
                    worksheet[cellAddress].s = {
                        ...existingStyle,
                        ...borderStyle
                    };
                }
            }
        }

        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Match Results");

        // Write file with styles
        XLSX.writeFile(workbook, `Matching_Summary_${selectedJob?.title || "Job"}_${currentDate}.xlsx`);
    };


    return (
        <Card>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-indigo-50 rounded-lg p-4">
                        <div className="text-sm text-indigo-700">Highly Matched</div>
                        <div className="text-2xl font-bold text-indigo-900 mt-1">
                            {filteredResults.filter(m => m.similarity >= 0.8).length}
                        </div>
                        <div className="text-xs text-indigo-600 mt-1">
                            {((filteredResults.filter(m => m.similarity >= 0.8).length / filteredResults.length) * 100).toFixed(1)}% of candidates
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-4">
                        <div className="text-sm text-amber-700">Moderate Match</div>
                        <div className="text-2xl font-bold text-amber-900 mt-1">
                            {filteredResults.filter(m => m.similarity >= 0.6 && m.similarity < 0.8).length}
                        </div>
                        <div className="text-xs text-amber-600 mt-1">
                            {((filteredResults.filter(m => m.similarity >= 0.6 && m.similarity < 0.8).length / filteredResults.length) * 100).toFixed(1)}% of candidates
                        </div>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4">
                        <div className="text-sm text-red-700">Low Match</div>
                        <div className="text-2xl font-bold text-red-900 mt-1">
                            {filteredResults.filter(m => m.similarity < 0.6).length}
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                            {((filteredResults.filter(m => m.similarity < 0.6).length / filteredResults.length) * 100).toFixed(1)}% of candidates
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="text-sm font-medium mb-2">Bookmarked Candidates</div>
                    {Array.from(bookmarkedCandidates).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {filteredResults
                                .filter(match => bookmarkedCandidates.has(match.resume_id))
                                .map(match => (
                                    <Badge key={match.resume_id} variant="outline" className="flex items-center gap-1 bg-white">
                                        {match.name}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 p-0 ml-1"
                                            onClick={() => toggleBookmark(match.resume_id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))
                            }
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">
                            No candidates bookmarked yet. Use the star icon to bookmark candidates.
                        </div>
                    )}
                </div>

                <Separator className="my-6" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-500">
                        Showing {filteredResults.length} of {matchResults.length} candidates
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCompareCandidates}>
                            <GitCompare className="h-4 w-4 mr-2" />
                            Compare Candidates
                        </Button>
                        <Button variant="outline" onClick={exportToExcel}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Results
                        </Button>

                        <Button onClick={handleContactCandidates} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Contact Selected
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default MatchingSummaryCard;
