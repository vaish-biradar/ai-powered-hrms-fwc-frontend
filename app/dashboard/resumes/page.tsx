"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import Header from "../_components/app-header";
import { ResumeUploadDialog } from "./_components/upload-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Resume } from "@/types/dashboard"
import { FileText, MoreHorizontal, Search, Trash2, Mail, Phone, Briefcase, User, Tag, } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";

const ResumesPage: React.FC = () => {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

    const fetchResumes = async () => {
        setLoading(true);
        try {
            const response = await axios.get<Resume[]>("/api/resumes");
            setResumes(response.data);
        } catch (error) {
            console.error("Error fetching resumes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResumes(); // Fetch resumes when component mounts
    }, []);

    const handleDelete = async () => {
        if (!selectedResumeId) return;

        try {
            setDeletingId(selectedResumeId);
            await axios.delete(`/api/resumes`, { data: { id: selectedResumeId } });
            setResumes(resumes.filter((resume) => resume.id !== selectedResumeId));
            toast.success("Resume deleted successfully");
        } catch (error) {
            console.error("Error deleting resume:", error);
            toast.error("Failed to delete resume");
        } finally {
            setDeletingId(null); // Reset loading state
            setIsDeleteDialogOpen(false);
        }
    };

    const handleViewResume = async (resumePath: string) => {
        try {
            const response = await axios.post("/api/generate-sas", { blobName: resumePath, container: 'resumes' });
            const fileUrl = response.data.fileUrl;
            window.open(`https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(fileUrl)}`, "_blank");
        } catch (error) {
            console.error("Error generating SAS token:", error);
            toast.error("Failed to load resume preview");
        }
    };

    const handleViewDetails = (resume: Resume) => {
        setSelectedResume(resume);
        setIsSheetOpen(true);
    };

    const renderActionMenu = (resume: Resume) => (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Documents</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleViewResume(resume.path)}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Resume
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleViewDetails(resume)}>
                        <User className="mr-2 h-4 w-4" />
                        View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => {
                            setSelectedResumeId(resume.id);
                            setIsDeleteDialogOpen(true);
                        }}
                        className="text-red-500 focus:text-red-500"
                        disabled={deletingId === resume.id}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingId === resume.id ? "Deleting..." : "Delete Resume"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteDialogOpen && selectedResumeId === resume.id} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                            {`Are you sure you want to delete ${resume.name}'s resume? This action cannot be undone.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedResumeId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );

    const columns: ColumnDef<Resume, unknown>[] = [
        {
            accessorKey: "name",
            header: "Name",
            enableSorting: true,
            enableColumnFilter: true,
            cell: ({ row }) => {
                const resume = row.original;
                return (
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                    >
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>
                                {resume.name
                                    ?.split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{resume.name}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "email",
            header: "Email",
            enableSorting: true,
            enableColumnFilter: true,
            cell: ({ row }) => (
                <div
                    className="hidden md:table-cell !whitespace-break-spaces cursor-pointer"
                >
                    <span>{row.original.email}</span>
                </div>
            ),
        },
        {
            accessorKey: "phone",
            header: "Phone",
            enableSorting: true,
            enableColumnFilter: true,
            cell: ({ row }) => (
                <div
                    className="hidden sm:flex items-center gap-2 cursor-pointer"
                >
                    {row.original.phone || "Not specified"}
                </div>
            ),
        },
        {
            accessorKey: "experience",
            header: "Experience",
            enableSorting: true,
            enableColumnFilter: true,
            cell: ({ row }) => {
                return (
                    <div
                        className="hidden sm:flex items-center gap-2 cursor-pointer"
                    >
                        {row.original.years_of_experience || "Not specified"}
                    </div>
                );
            },
        },
        {
            accessorKey: "suitable_roles",
            header: "Suitable Roles",
            enableSorting: true,
            enableColumnFilter: true,
            cell: ({ row }) => {
                const resume = row.original;
                const roles = resume.suitable_roles || [];

                const visibleRoles = roles.slice(0, 2);
                const hiddenRoles = roles.slice(2);

                return (
                    <div
                        className="hidden sm:flex flex-wrap gap-2 cursor-pointer"
                    >
                        {visibleRoles.map((role, index) => (
                            <Badge key={index} variant="secondary">
                                {role}
                            </Badge>
                        ))}

                        {hiddenRoles.length > 0 && (
                            <Badge
                                variant="outline"
                                title={hiddenRoles.join(", ")}
                                className="hover:bg-muted"
                            >
                                +{hiddenRoles.length} more
                            </Badge>
                        )}

                        {roles.length === 0 && "None specified"}
                    </div>
                );
            },
        }
        ,
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



    const renderResumeDetails = () => {
        if (!selectedResume) return null;

        return (
            <div className="w-full max-w-4xl mx-auto p-6 space-y-8 ">


                {selectedResume.summary && (
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Summary
                        </h3>
                        <p className="text-muted-foreground leading-relaxed text-justify line-clamp-8">
                            {selectedResume.summary}
                        </p>
                    </div>
                )}

                {selectedResume.suitable_roles && selectedResume.suitable_roles.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Suitable Roles
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedResume.suitable_roles.map((role, i) => (
                                <Badge key={i} variant="secondary" className="px-3 py-1">{role}</Badge>
                            ))}
                        </div>
                    </div>
                )}

                {selectedResume.years_of_experience && (
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            Experience
                        </h3>
                        <p className="text-muted-foreground">{selectedResume.years_of_experience}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="">
            <Header title="Manage Resumes">
                <div className="flex items-center justify-between space-x-2">
                    {/* Search Input */}
                    <div className="relative flex-grow mr-2">
                        {/* Desktop Search Input */}
                        <div className="hidden md:block relative w-full">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                            <Input
                                type="text"
                                placeholder="Search by name, email, or role"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-full text-primary h-10"
                            />
                        </div>

                        {/* Mobile Search Input */}
                        <div className="md:hidden relative w-full">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                            <Input
                                type="text"
                                placeholder="Search resumes"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-full text-primary h-10"
                            />
                        </div>
                    </div>

                    {/* Upload Button with Tooltip */}
                    <ResumeUploadDialog onUploadSuccess={fetchResumes} />
                </div>
            </Header>
            <div className="p-4 w-full mx-auto pt-20">

                <DataTable<Resume, unknown>
                    columns={columns}
                    data={resumes}
                    searchKey="candidate_name"
                    searchPlaceholder="Search all columns..."
                    pageSize={10}
                    enableMultiSort={true}
                    enableGlobalFilter={true}
                    enableColumnFilters={false}
                    showTabs={false}
                    isLoading={loading}
                />
            </div>

            {/* Resume Details Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full max-w-md overflow-y-auto">
                    <SheetHeader className="">
                        <SheetTitle></SheetTitle>

                        <SheetDescription>
                            {selectedResume &&
                            <div className="flex flex-col md:flex-row md:items-start gap-6">
                                
                                <div className="space-y-1 flex-1">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight">{selectedResume.name}</h2>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span>{selectedResume.email}</span>
                                        </div>
                                        {selectedResume.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{selectedResume.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>}

                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="h-[62vh] pr-4">
                        {renderResumeDetails()}
                    </ScrollArea>
                    <SheetFooter className="mt-4">
                        <div className="flex justify-between w-full">
                            <Button
                                variant="outline"
                                onClick={() => setIsSheetOpen(false)}
                            >
                                Close
                            </Button>
                            {selectedResume && (
                                <Button
                                    onClick={() => handleViewResume(selectedResume.path)}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Resume
                                </Button>
                            )}
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default ResumesPage;