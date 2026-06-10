"use client"
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Calendar, Users, Edit, Loader2, Trash2, FileText, Eye, MoreHorizontal, } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '../_components/app-header';
import { JobUploadDialog } from './_components/upload-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, FilterOption } from '@/components/ui/data-table';
import { ScrollArea } from '@/components/ui/scroll-area';

// Simplified JobDescription interface
import { JobDescription } from '@/types/dashboard';
import { apiService } from '../_services/api-service';

export default function JobListings() {
    const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
    const [filteredJobDescriptions, setFilteredJobDescriptions] = useState<JobDescription[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
    const [updatedStatus, setUpdatedStatus] = useState<string>('');
    const [updatedTotalOpenings, setUpdatedTotalOpenings] = useState<number>(0);
    const [updatedOccupiedOpenings, setUpdatedOccupiedOpenings] = useState<number>(0);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [fillederror, setFilledError] = useState("");
    const [updatedTitle, setUpdatedTitle] = useState<string>('');
    const [updatedDepartment, setUpdatedDepartment] = useState<string>('');
    const [updatedEmploymentType, setUpdatedEmploymentType] = useState<string>('');
    const [updatedLocation, setUpdatedLocation] = useState<string>('');
    const [updatedSkills, setUpdatedSkills] = useState<string>('');
    const router = useRouter();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [confirmDeleteMessage, setConfirmDeleteMessage] = useState<string>('');
    const [deletingPath, setDeletingPath] = useState<string>('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchJobDescriptions();
    }, []);

    const fetchJobDescriptions = async () => {
        try {
            setLoading(true);
            const fetchedJobs = await apiService.getJobDescriptions();
            setJobDescriptions(fetchedJobs);
            setFilteredJobDescriptions(fetchedJobs);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch job descriptions');
            setLoading(false);
            console.error('Error fetching job descriptions:', err);
        }
    };

    const handleUpdateClick = (job: JobDescription) => {
        setSelectedJob(job);
        setUpdatedStatus(job.status);
        setUpdatedTotalOpenings(job.total_openings);
        setUpdatedOccupiedOpenings(job.occupied_openings);
        setUpdatedTitle(job.title);
        setUpdatedDepartment(job.department);
        setUpdatedEmploymentType(job.employment_type);
        setUpdatedLocation(job.location);
        setUpdatedSkills(job.skills);
    };

    const handleUpdateJob = async () => {
        if (!selectedJob) return;

        try {
            setIsUpdating(true);
            const updatePayload = {
                status: updatedStatus,
                total_openings: updatedTotalOpenings,
                occupied_openings: updatedOccupiedOpenings,
                title: updatedTitle,
                department: updatedDepartment,
                employment_type: updatedEmploymentType,
                location: updatedLocation,
                skills: updatedSkills
            };

            await apiService.updateJob(selectedJob.id, updatePayload);

            const updatedJobs = jobDescriptions.map(job => {
                if (job.id === selectedJob.id) {
                    return { ...job, ...updatePayload };
                }
                return job;
            });

            setJobDescriptions(updatedJobs);
            setFilteredJobDescriptions(updatedJobs);

            toast.success("Job Updated", {
                description: `${updatedTitle} has been successfully updated.`,
            });

            setIsUpdating(false);
            setSelectedJob(null);
        } catch (err) {
            console.error('Error updating job:', err);
            toast.error("Update Failed", {
                description: "There was an error updating the job. Please try again.",
            });
            setIsUpdating(false);
        }
    };

    const handleViewDetails = (job: JobDescription) => {
        setSelectedJob(job);
        setIsViewDetailsDialogOpen(true);
    };

    const handleViewPdf = async (jdPath: string) => {
        try {
            setIsLoadingPdf(true);

            const response = await apiService.generateSasToken(jdPath, "jobdescriptions");


            const fileUrl = response.data.fileUrl;
            setIsLoadingPdf(false);

            if (!fileUrl) {
                toast.error("No file URL received for job description.");
                return;
            }
            const blobName = jdPath.split("/").pop();
            const fileName = decodeURIComponent(blobName || "");
            // Extract the filename and extension
            const fileExtension = fileName.split(".").pop()?.toLowerCase();



            if (fileExtension === "pdf") {
                window.open(fileUrl, "_blank");
            } else if (fileExtension === "docx") {
                const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
                window.open(officeViewerUrl, "_blank");
            } else {
                const googleViewerUrl = `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(fileUrl)}`;
                window.open(googleViewerUrl, "_blank");
            }

        } catch (error) {
            console.error("Error generating SAS token:", error);
            toast.error("Failed to load job description");
            setIsLoadingPdf(false);
        }
    };


    const viewApplications = () => {
        router.push("/dashboard/applications");
    };

    const handleDelete = async (jdId: string, jdPath: string) => {

        if (!jdId || !jdPath) {
            setDeleting(false);
            return;
        }
        setDeleting(true);
        try {

            await apiService.deleteJobDescription(jdId, jdPath);
            setJobDescriptions(jobDescriptions.filter((job) => job.id !== jdId));

            setFilteredJobDescriptions(filteredJobDescriptions.filter((job) => job.id !== jdId));

            toast.success("JD deleted successfully");
        } catch (error) {
            console.error("Error deleting JD:", error);

            toast.error("Failed to delete JD");
        } finally {
            setDeleting(false);

        }
    }

    const handleOccupiedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.valueAsNumber;

        if (value < 0 || isNaN(value)) {
            value = 0;
        }

        if (value > updatedTotalOpenings) {
            setFilledError("Filled positions cannot exceed total openings.");
        } else {
            setFilledError("");
        }

        setUpdatedOccupiedOpenings(value > updatedTotalOpenings ? updatedTotalOpenings : value);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderActionMenu = (job: JobDescription) => {
        const applicationCount = job.applications?.length || 0;

        const handleConfirmDelete = () => {

            // If there are applications, show the confirm deletion message with the warning
            if (applicationCount > 0) {
                setConfirmDeleteMessage(
                    `Deleting this job description will also delete ${applicationCount} application(s) associated with this role. Are you sure you want to proceed?`
                );
            } else {
                setConfirmDeleteMessage(`Are you sure you want to delete ${job.title}? This action cannot be undone.`);
            }
            setDeletingId(job.id);
            setDeletingPath(job.path);

            setIsDeleteDialogOpen(true);
        };

        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(job)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => viewApplications()}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Applications ({applicationCount})
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                handleUpdateClick(job);
                                setIsEditDialogOpen(true);
                            }}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={handleConfirmDelete}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>

                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                                {confirmDeleteMessage}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    if (deletingId) {
                                        handleDelete(deletingId, deletingPath);
                                    } else {
                                        console.error("Deletion aborted: deletingId is null");
                                    }
                                }}
                                className="bg-red-600 text-white hover:bg-red-700"
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </>
        );
    };


    const columns: ColumnDef<JobDescription, unknown>[] = [
        {
            accessorKey: "title",
            header: "Job Title",
            enableSorting: true,
            enableColumnFilter: true,
            cell: ({ row }) => {
                const job = row.original;
                return (
                    <div className="flex flex-col items-left gap-2 !whitespace-break-spaces">
                        <p className="font-medium text-foreground">{job.title}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                            <p>Posted By:</p>
                            <span className=" font-medium  ml-1">
                                {job.submitted_by?.name || "Anonymous"}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "department",
            header: "Department",
            enableSorting: true,
            enableColumnFilter: true,
            cell: ({ row }) => (
                <div className="hidden md:table-cell !whitespace-break-spaces">
                    <span>{row.original.department}</span>
                </div>
            ),
        },
        {
            accessorKey: "location",
            header: "Location",
            enableSorting: true,
            enableColumnFilter: true,
            cell: ({ row }) => (
                <div className="hidden sm:flex items-center gap-2 !whitespace-break-spaces">
                    <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                    {row.original.location || "Not specified"}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            enableSorting: true,
            enableColumnFilter: true,
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <Badge variant={status === "Open" ? "default" : status === "Closed" ? "secondary" : "outline"}>
                        {status}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "openings",
            header: "Openings",
            enableSorting: true,
            enableColumnFilter: true,
            cell: ({ row }) => {
                const job = row.original;
                return (
                    <div className="hidden sm:flex items-center gap-2">
                        <Users className="h-3 w-3 mr-1 text-gray-500" />
                        {job.total_openings - job.occupied_openings} of {job.total_openings}
                    </div>
                );
            },
        },
        {
            accessorKey: "applications",
            header: "Applications",
            enableSorting: true,
            enableColumnFilter: true,
            cell: ({ row }) => (
                <div className="hidden sm:flex items-center gap-2">
                    <FileText className="h-3 w-3 mr-1" />
                    {row.original.applications?.length || 0}
                </div>
            ),
        },
        {
            accessorKey: "created_at",
            header: "Posted On",
            enableSorting: true,
            enableColumnFilter: true,
            cell: ({ row }) => {
                const date = new Date(row.original.created_at);
                return (
                    <div className="hidden sm:flex items-center gap-2">
                        <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                        {date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ row }) => (
                <div className="text-right" onClick={(e) => e.stopPropagation()}>
                    {renderActionMenu(row.original)}
                </div>
            ),
        },
    ];

    const customFilters: FilterOption<JobDescription, string>[] = [
        {
            columnId: 'status',
            label: 'Status',
            options: [
                { value: 'Open', label: 'Open' },
                { value: 'Closed', label: 'Closed' },
                { value: 'On Hold', label: 'On Hold' },
            ]
        },
        {
            columnId: 'title',
            label: 'Title',
            options: Array.from(new Set(filteredJobDescriptions.map(job => job.title)))
                .map(title => ({ value: title, label: title }))
        },


    ];

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center p-6 max-w-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                    <p className="text-gray-700 mb-4">{error}</p>
                    <Button onClick={() => fetchJobDescriptions()}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Header title="Manage Job Descriptions">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <JobUploadDialog onUploadSuccess={fetchJobDescriptions} />
                </div>
            </Header>

            <div className="p-4 w-full mx-auto pt-20">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="w-full h-10" />
                        <Skeleton className="w-full h-96" />
                    </div>
                ) : (
                    <div>
                        <DataTable<JobDescription, unknown>
                            columns={columns}
                            data={filteredJobDescriptions}
                            searchKey="candidate_name"
                            searchPlaceholder="Search all columns..."
                            pageSize={10}
                            enableMultiSort={true}
                            enableGlobalFilter={true}
                            enableColumnFilters={false}
                            showTabs={false}
                            customFilters={customFilters as FilterOption<JobDescription, unknown>[]}
                        />
                    </div>
                )}

                {/* View Details Dialog */}
                <Sheet open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
                    <SheetContent className="p-0 sm:max-w-md">
                        <SheetHeader className="px-4 sm:px-6 pt-6">
                            <SheetTitle>{selectedJob?.title || "Job Details"}</SheetTitle>
                            <SheetDescription>
                                Full details for this job position
                            </SheetDescription>
                        </SheetHeader>

                        <ScrollArea className="max-h-[65vh] px-4 sm:px-6">
                            {selectedJob && (
                                <div className="space-y-6 py-4">
                                    {/* Header section with key information */}
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="space-y-1">
                                            <h3 className="font-medium text-sm text-muted-foreground">Department</h3>
                                            <p className="font-medium">{selectedJob.department}</p>
                                        </div>
                                        <Badge variant={selectedJob.status === "Open" ? "default" : selectedJob.status === "Closed" ? "secondary" : "outline"}>
                                            {selectedJob.status}
                                        </Badge>
                                    </div>

                                    {/* Key details in a responsive grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-4 w-4" />
                                                <span>Location</span>
                                            </div>
                                            <p className="text-sm">{selectedJob.location || "Not specified"}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>Posted Date</span>
                                            </div>
                                            <p className="text-sm">{formatDate(selectedJob.created_at)}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                <span>Openings</span>
                                            </div>
                                            <p className="text-sm">{selectedJob.total_openings - selectedJob.occupied_openings} of {selectedJob.total_openings} positions</p>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Briefcase className="h-4 w-4" />
                                                <span>Employment Type</span>
                                            </div>
                                            <p className="text-sm">{selectedJob.employment_type || "Not specified"}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <FileText className="h-4 w-4" />
                                                <span>Applications</span>
                                            </div>
                                            <p className="text-sm">{selectedJob.applications?.length || 0} received</p>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                <span>Experience Level</span>
                                            </div>
                                            <p className="text-sm">{selectedJob.experience_level || "Not specified"}</p>
                                        </div>
                                    </div>

                                    {/* Skills section */}
                                    <div className="space-y-3">
                                        <h3 className="font-medium">Required Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedJob.skills.split(',').map((skill, index) => (
                                                <Badge key={index} variant="secondary">{skill.trim()}</Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summary section */}
                                    <div className="space-y-3">
                                        <h3 className="font-medium">Job Summary</h3>
                                        <p className="text-muted-foreground text-sm">{selectedJob.summary}</p>
                                    </div>

                                    {/* Job description link */}
                                    <div className="rounded-md bg-muted/50 p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <FileText className="h-4 w-4" />
                                                Full Job Description
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewPdf(selectedJob.path)}
                                                disabled={isLoadingPdf}
                                                className="h-8 w-full sm:w-auto"
                                            >
                                                {isLoadingPdf ? "Loading..." : "View "}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ScrollArea>

                        <SheetFooter className="px-4 sm:px-6 py-4 border-t">
                            <div className="flex flex-col sm:flex-row gap-2 sm:justify-between w-full">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsViewDetailsDialogOpen(false)}
                                    className="w-full sm:w-auto"
                                >
                                    Close
                                </Button>
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (selectedJob) {
                                                handleUpdateClick(selectedJob);
                                                setIsViewDetailsDialogOpen(false);
                                                setIsEditDialogOpen(true);
                                            }
                                        }}
                                        className="flex items-center justify-center gap-2 w-full sm:w-auto"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => viewApplications()}
                                        className="flex items-center justify-center gap-2 w-full sm:w-auto"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Applications
                                    </Button>
                                </div>
                            </div>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                {/* Edit Job Dialog */}
                <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <SheetContent className="p-4 sm:max-w-md">
                        <SheetHeader className="pb-4">
                            <SheetTitle>Update Job Details</SheetTitle>
                            <SheetDescription>
                                Update the details for this job position
                            </SheetDescription>
                        </SheetHeader>

                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                    <Label htmlFor="title" className="text-left sm:pt-0">
                                        Job Title
                                    </Label>
                                    <Input
                                        id="title"
                                        value={updatedTitle}
                                        onChange={(e) => setUpdatedTitle(e.target.value)}
                                        className="col-span-1 sm:col-span-3"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                    <Label htmlFor="department" className="text-left sm:pt-0">
                                        Department
                                    </Label>
                                    <Input
                                        id="department"
                                        value={updatedDepartment}
                                        onChange={(e) => setUpdatedDepartment(e.target.value)}
                                        className="col-span-1 sm:col-span-3"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                    <Label htmlFor="employmentType" className="text-left sm:pt-0">
                                        Employment Type
                                    </Label>
                                    <div className="col-span-1 sm:col-span-3">
                                        <Select
                                            value={updatedEmploymentType}
                                            onValueChange={setUpdatedEmploymentType}

                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select employment type" />
                                            </SelectTrigger>
                                            <SelectContent className='w-full'>
                                                <SelectItem value="Full-time">Full-time</SelectItem>
                                                <SelectItem value="Part-time">Part-time</SelectItem>
                                                <SelectItem value="Contract">Contract</SelectItem>
                                                <SelectItem value="Temporary">Temporary</SelectItem>
                                                <SelectItem value="Internship">Internship</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                    <Label htmlFor="location" className="text-left sm:pt-0">
                                        Location
                                    </Label>
                                    <Input
                                        id="location"
                                        value={updatedLocation}
                                        onChange={(e) => setUpdatedLocation(e.target.value)}
                                        className="col-span-1 sm:col-span-3"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                                    <Label htmlFor="skills" className="text-left pt-2">
                                        Skills
                                    </Label>
                                    <div className="col-span-1 sm:col-span-3">
                                        <Input
                                            id="skills"
                                            placeholder="Comma-separated skills"
                                            value={updatedSkills}
                                            onChange={(e) => setUpdatedSkills(e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Enter skills separated by commas</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                    <Label htmlFor="status" className="text-left sm:pt-0">
                                        Status
                                    </Label>
                                    <div className="col-span-1 sm:col-span-3">
                                        <Select
                                            value={updatedStatus}
                                            onValueChange={setUpdatedStatus}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Open">Open</SelectItem>
                                                <SelectItem value="Closed">Closed</SelectItem>
                                                <SelectItem value="On Hold">On Hold</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                    <Label htmlFor="totalOpenings" className="text-left sm:pt-0">
                                        Total Openings
                                    </Label>
                                    <Input
                                        id="totalOpenings"
                                        type="number"
                                        value={updatedTotalOpenings}
                                        onChange={(e) => {
                                            const value = e.target.valueAsNumber;
                                            setUpdatedTotalOpenings(value < 0 || isNaN(value) ? 0 : value);
                                        }}
                                        className="col-span-1 sm:col-span-3"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                    <Label htmlFor="occupiedOpenings" className="text-left sm:pt-0">
                                        Filled Positions
                                    </Label>
                                    <div className="col-span-1 sm:col-span-3">
                                        <Input
                                            id="occupiedOpenings"
                                            type="number"
                                            value={updatedOccupiedOpenings}
                                            onChange={handleOccupiedChange}
                                        />
                                        {fillederror && <p className="text-red-500 text-xs mt-1">{fillederror}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t">
                            <SheetClose asChild>
                                <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                            </SheetClose>
                            <Button
                                onClick={() => {
                                    handleUpdateJob();
                                    setIsEditDialogOpen(false);
                                }}
                                disabled={isUpdating || !!fillederror}
                                className="w-full sm:w-auto"
                            >
                                {isUpdating ? 'Updating...' : 'Update Job'}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div><Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <SheetContent className="p-4 sm:max-w-md">
                    <SheetHeader className="pb-4">
                        <SheetTitle>Update Job Details</SheetTitle>
                        <SheetDescription>
                            Update the details for this job position
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="title" className="text-left sm:pt-0">
                                    Job Title
                                </Label>
                                <div className="col-span-1 sm:col-span-3 w-full">
                                    <Input
                                        id="title"
                                        value={updatedTitle}
                                        onChange={(e) => setUpdatedTitle(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="department" className="text-left sm:pt-0">
                                    Department
                                </Label>
                                <div className="col-span-1 sm:col-span-3 w-full">
                                    <Input
                                        id="department"
                                        value={updatedDepartment}
                                        onChange={(e) => setUpdatedDepartment(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="employmentType" className="text-left sm:pt-0">
                                    Employment Type
                                </Label>
                                <div className="col-span-1 sm:col-span-3 w-full">
                                    <Select
                                        value={updatedEmploymentType}
                                        onValueChange={setUpdatedEmploymentType}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select employment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Full-time">Full-time</SelectItem>
                                            <SelectItem value="Part-time">Part-time</SelectItem>
                                            <SelectItem value="Contract">Contract</SelectItem>
                                            <SelectItem value="Temporary">Temporary</SelectItem>
                                            <SelectItem value="Internship">Internship</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="location" className="text-left sm:pt-0">
                                    Location
                                </Label>
                                <div className="col-span-1 sm:col-span-3 w-full">
                                    <Input
                                        id="location"
                                        value={updatedLocation}
                                        onChange={(e) => setUpdatedLocation(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                                <Label htmlFor="skills" className="text-left pt-2">
                                    Skills
                                </Label>
                                <div className="col-span-1 sm:col-span-3 w-full">
                                    <Input
                                        id="skills"
                                        placeholder="Comma-separated skills"
                                        value={updatedSkills}
                                        onChange={(e) => setUpdatedSkills(e.target.value)}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Enter skills separated by commas</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="status" className="text-left sm:pt-0">
                                    Status
                                </Label>
                                <div className="col-span-1 sm:col-span-3 w-full">
                                    <Select
                                        value={updatedStatus}
                                        onValueChange={setUpdatedStatus}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Open">Open</SelectItem>
                                            <SelectItem value="Closed">Closed</SelectItem>
                                            <SelectItem value="On Hold">On Hold</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="totalOpenings" className="text-left sm:pt-0">
                                    Total Openings
                                </Label>
                                <div className="col-span-1 sm:col-span-3 w-full">
                                    <Input
                                        id="totalOpenings"
                                        type="number"
                                        value={updatedTotalOpenings}
                                        onChange={(e) => {
                                            const value = e.target.valueAsNumber;
                                            setUpdatedTotalOpenings(value < 0 || isNaN(value) ? 0 : value);
                                        }}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                                <Label htmlFor="occupiedOpenings" className="text-left sm:pt-0">
                                    Filled Positions
                                </Label>
                                <div className="col-span-1 sm:col-span-3 w-full">
                                    <Input
                                        id="occupiedOpenings"
                                        type="number"
                                        value={updatedOccupiedOpenings}
                                        onChange={handleOccupiedChange}
                                        className="w-full"
                                    />
                                    {fillederror && <p className="text-red-500 text-xs mt-1">{fillederror}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t">
                        <SheetClose asChild>
                            <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                        </SheetClose>
                        <Button
                            onClick={() => {
                                handleUpdateJob();
                                setIsEditDialogOpen(false);
                            }}
                            disabled={isUpdating || !!fillederror}
                            className="w-full sm:w-auto"
                        >
                            {isUpdating ? 'Updating...' : 'Update Job'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}