import { useAtom, useSetAtom } from "jotai";
import { useCallback, useState, useMemo } from "react";
import { filteredApplicationsAtom, applicationsAtom } from "@/store/application-atom";
import { Application } from "@/types/dashboard";
import { getStatusColor, getSimilarityInfo, formatDate } from "@/app/dashboard/_components/helper-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MoreHorizontal, Mail, FileText, Briefcase, FileCheck, Calendar,
 Phone, Eye,

  AlertCircle,
  Info,
  Clock,
  CheckCircle,
  Send,
  History,
} from "lucide-react";
import { toast } from "sonner";
import EmailCandidateSheet from "./email-sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import CandidateDetails from "./details-sheet";
import { createSelectionColumn, DataTable, FilterOption } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { apiService } from "@/app/dashboard/_services/api-service";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const ApplicationsTableView = ({
  onViewDocument,
  loading,
  onRefresh,
}: {
  onViewDocument: (application: Application, type: 'resume' | 'jd' | 'report') => void;
  loading: boolean;
  onRefresh: () => void;
}) => {
  const [filteredApplications] = useAtom(filteredApplicationsAtom);
  const setApplications = useSetAtom(applicationsAtom);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isEmailSheetOpen, setIsEmailSheetOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editType, setEditType] = useState<'email' | 'phone'>('email');
  const [editValue, setEditValue] = useState('');
  const [applicationToEdit, setApplicationToEdit] = useState<Application | null>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string | undefined>(undefined);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);


  const handleUpdateStatus = (id: string) => {
    router.push(`/dashboard/applications/${id}`);
  };



  const handleStatusChange = async (id: string, status: string, feedback: string) => {
    if (!status) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/applications/${id}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, feedback })
      });

      if (!res.ok) throw new Error('Update failed');

      await res.json();
      toast.success('Application status updated successfully');

      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: status } : app
        )
      );
    } catch (err) {
      console.error(err);
      toast.error('Status update failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailClick = (application: Application) => {
    setSelectedApplication(application);
    setIsEmailSheetOpen(true);
  };

  const handleEditContact = (application: Application, type: 'email' | 'phone') => {
    setApplicationToEdit(application);
    setEditType(type);
    setEditValue(type === 'email' ? application.candidate_email || '' : application.candidate_phone || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveContactInfo = async () => {
    if (!applicationToEdit) return;

    try {
      // Determine which field to update
      const field = editType === 'email' ? 'candidate_email' : 'candidate_phone';

      // Call the API service
      const response = await apiService.updateContactInfo(applicationToEdit.id, field, editValue);

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationToEdit.id
            ? {
              ...app,
              ...(editType === 'email'
                ? { candidate_email: editValue }
                : { candidate_phone: editValue })
            }
            : app
        )
      );

      toast.success(response.message || `${editType === 'email' ? 'Email' : 'Phone'} updated successfully`);
      setIsEditDialogOpen(false);
    } catch {
      toast.error(`Failed to update ${editType}`);
    }
  };

  const showApplicationDetails = (application: Application) => {
    setSelectedApplication(application);
    setDetailsOpen(true);
  };

  const renderActionMenu = (application: Application) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Documents</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onViewDocument(application, 'resume')}>
          <FileText className="mr-2 h-4 w-4" />
          View Resume
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewDocument(application, 'jd')}>
          <Briefcase className="mr-2 h-4 w-4" />
          View Job Description
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewDocument(application, 'report')}>
          <FileCheck className="mr-2 h-4 w-4" />
          View Match Report
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleEmailClick(application)}>
          <Mail className="mr-2 h-4 w-4" />
          Email Candidate
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => showApplicationDetails(application)}>
          <Eye className="mr-2 h-4 w-4" />
          View Full Details
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleUpdateStatus(application.id)}>
          <History className="mr-2 h-4 w-4" />
          Track Application
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const statuses = [
    "applied",
    "screening_in_progress",
    "screening_rejected",
    "screening_completed",
    "interview_scheduled",
    "interview_in_progress",
    "interview_completed",
    "offer_pending",
    "offer_sent",
    "offer_accepted",
    "offer_rejected",
    "hired",
    "rejected",
    "on_hold",
    "withdrawn"
  ];


  // Status icon map
  const statusIcon = {
    applied: <Info className="h-4 w-4" />,
    screening_in_progress: <Clock className="h-4 w-4" />,
    screening_completed: <CheckCircle className="h-4 w-4" />,
    screening_rejected: <AlertCircle className="h-4 w-4" />,
    interview_scheduled: <Calendar className="h-4 w-4" />,
    interview_in_progress: <Clock className="h-4 w-4" />,
    interview_completed: <CheckCircle className="h-4 w-4" />,
    offer_pending: <Clock className="h-4 w-4" />,
    offer_sent: <Send className="h-4 w-4" />,
    offer_accepted: <CheckCircle className="h-4 w-4" />,
    offer_rejected: <AlertCircle className="h-4 w-4" />,
    hired: <CheckCircle className="h-4 w-4" />,
    rejected: <AlertCircle className="h-4 w-4" />,
    on_hold: <Clock className="h-4 w-4" />,
    withdrawn: <AlertCircle className="h-4 w-4" />
  };
  const StatusBadge = ({ application }: { application: Application }) => {
    const [open, setOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(application.status);
    const [feedback, setFeedback] = useState("");

    const handleSave = async () => {
      await handleStatusChange(application.id, selectedStatus, feedback);
    };
    const isTerminalStatus = (status: string) => {
      return ['hired', 'rejected', 'offer_rejected', 'withdrawn'].includes(status);
    };
    function formatStatus(status: string): string {
      return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return (
      <Sheet open={open} onOpenChange={setOpen}>

        <SheetTrigger asChild>
          <Badge
            className={cn("cursor-pointer px-3 py-1 rounded-md", getStatusColor(application.status))}
          >
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Badge>
        </SheetTrigger>

        <SheetContent className="w-full sm:w-[400px] p-4">
          <SheetHeader>
            <SheetTitle>Update Status</SheetTitle>
            <SheetDescription>
              Change the application status and add feedback.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Select Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (

                    <SelectItem key={status} value={status} className="capitalize">
                      <div className="flex items-center gap-2">
                        {statusIcon[status as keyof typeof statusIcon]}
                        {formatStatus(status)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               {isTerminalStatus(application.status) && (
                                            <Alert className="my-4" variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    This application is currently in a terminal state ({formatStatus(application.status)}).
                                                    Changing its status will reopen the application process.
                                                </AlertDescription>
                                            </Alert>
                                        )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Status Change Feedback</label>
              <Textarea
                placeholder="Provide feedback or notes about this status change "
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button onClick={handleSave} disabled={!selectedStatus}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  };


  const renderSimilarityInfo = (application: Application) => {
    const similarityInfo = getSimilarityInfo(application.similarity * 100);
    return (
      <div className="flex flex-col gap-1">
        <span className={`font-medium ${similarityInfo.color}`}>
          {Math.round(application.similarity * 100)}%
        </span>
        <Progress value={application.similarity * 100} className={`h-1 ${similarityInfo.color}`} />
      </div>
    );
  };

  const renderContactInfo = (application: Application, type: 'email' | 'phone') => {
    const value = type === 'email' ? application.candidate_email : application.candidate_phone;
    const icon = type === 'email' ? <Mail className="h-3 w-3 text-gray-400" /> : <Phone className="h-3 w-3 text-gray-400" />;

    return (
      <div className="flex items-center group">
        {icon}
        <span className="ml-2">
          {value ? (
            <span className="group-hover:relative">
              {value}
            </span>
          ) : (
            <Button
              variant="ghost"
              className="text-orange-500 p-0 h-auto hover:text-orange-600 hover:bg-transparent underline text-xs font-medium"
              onClick={() => handleEditContact(application, type)}
            >
              Add {type === 'email' ? 'email' : 'phone'}
            </Button>
          )}
        </span>
      </div>
    );
  };

  const renderSuitableRoles = (application: Application) => {
    if (!application.suitable_roles || application.suitable_roles.length === 0) {
      return <span className="text-muted-foreground text-sm">No suitable roles found</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {application.suitable_roles.map((role, index) => (
          <Badge key={index} variant="outline" >
            {role}
          </Badge>
        ))}
      </div>
    );
  };

  // Function to create base columns (without selection)
  const createBaseColumns = useCallback((): ColumnDef<Application, unknown>[] => [
    {
      accessorKey: "candidate_name",
      header: "Candidate",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const application = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>
                {application.candidate_name
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{application.candidate_name}</p>
              <div className="flex flex-col gap-1 mt-1">
                {renderContactInfo(application, 'email')}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "job_title",
      header: "Applied For",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const application = row.original;
        return (
          <div className="hidden md:table-cell !whitespace-break-spaces">
            <span className="">{application.job_title}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "source",
      header: "Source",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const application = row.original;
        return (
          <div className="hidden sm:table-cell">
            {application.source ? application.source : "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "applied_date",
      header: "Applied Date",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const application = row.original;
        return (
          <div className="hidden sm:flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            {formatDate(application.applied_date)}
          </div>
        );
      },
    },
    {
      accessorKey: "suitable_roles",
      header: "Suitable Roles",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const application = row.original;
        return <div className="hidden md:block">{renderSuitableRoles(application)}</div>;
      },
    },
    {
      accessorKey: "similarity",
      header: "Match",
      enableSorting: true,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const application = row.original;
        return (
          <div className="hidden sm:block">
            {renderSimilarityInfo(application)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      enableColumnFilter: true,
      cell: ({ row }) => <StatusBadge application={row.original} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const application = row.original;

        return (
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            {renderActionMenu(application)}
          </div>
        );
      },
    },
  ], [renderContactInfo, renderSimilarityInfo, renderActionMenu, StatusBadge]);

  // Update columns when selectedJobTitle changes
  const columns = useMemo<ColumnDef<Application, unknown>[]>(() => {
    if (selectedJobTitle && selectedJobTitle !== "_all") {
      return [
        createSelectionColumn<Application>(),
        ...createBaseColumns(),
      ];
    }
    return createBaseColumns();
  }, [selectedJobTitle, createBaseColumns]);


  // Handle filter changes
  const handleFilterChange = async (columnId: string, value: string) => {
    if (columnId === 'job_title') {
      setSelectedJobTitle(value);

      try {
        const response = await axios.get(`/api/jds/${encodeURIComponent(value)}`);
        const jobId = response.data;
        setSelectedJobId(jobId);
      } catch (error) {
        console.error('Error fetching job ID:', error);
        setSelectedJobId(null);
      }
    }
  };


  const uniqueSource = Array.from(new Set(filteredApplications.map(application => application.source)));
  const sourceOptions = uniqueSource.map(source => ({
    value: source,
    label: source
  }));

  const uniqueTitles = Array.from(new Set(filteredApplications.map(application => application.job_title)));
  const titleOptions = uniqueTitles.map(job_title => ({
    value: job_title,
    label: job_title
  }));

  const customFilters: FilterOption<Application, string>[] = [
    {
      columnId: 'job_title',
      label: 'Job Title',
      options: titleOptions,
    },
    {
      columnId: 'status',
      label: 'Status',
      options: [
        { value: 'applied', label: 'Applied' },
        { value: 'screening_in_progress', label: 'Screening In Progress' },
        { value: 'screening_completed', label: 'Screening Completed' },
        { value: 'interview_scheduled', label: 'Interview Scheduled' },
        { value: 'interview_in_progress', label: 'Interview In Progress' },
        { value: 'interview_completed', label: 'Interview Completed' },
        { value: 'offer_pending', label: 'Offer Pending' },
        { value: 'offer_sent', label: 'Offer Sent' },
        { value: 'offer_accepted', label: 'Offer Accepted' },
        { value: 'offer_rejected', label: 'Offer Rejected' },
        { value: 'hired', label: 'Hired' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'on_hold', label: 'On Hold' },
        { value: 'withdrawn', label: 'Withdrawn' }
      ]
    },
    {
      columnId: 'source',
      label: 'Source',
      options: sourceOptions,
    },
  ];







  const handleCompare = (selectedRows: { original: Application }[]) => {
    const selectedIds = selectedRows.map(row => row.original.resume_id);

    // Navigate to custom diff page with jobId and selected IDs
    router.push(`/dashboard/applications/${selectedJobId}/compare?ids=${selectedIds.join(',')}`);
  };
  // Function to render DataTable for each tab
  const renderDataTable = (data: Application[]) => (
    <DataTable<Application, unknown>
      columns={columns}
      data={data}
      searchKey="candidate_name"
      searchPlaceholder="Search all columns..."
      // onRowClick={(row) => showApplicationDetails(row.original)}
      pageSize={10}
      enableMultiSort={true}
      enableGlobalFilter={true}
      enableColumnFilters={false}
      showTabs={false}
      customFilters={customFilters as FilterOption<Application, unknown>[]}
      isLoading={loading}
      showRefreshButton={true}
      onRefresh={onRefresh}
      onFilterChange={handleFilterChange} // Add this prop to handle filter changes
      onCompare={handleCompare} // Add this prop to handle compare action
    />
  );

  return (
    <>
      {renderDataTable(filteredApplications)}

      {selectedApplication && (
        <EmailCandidateSheet
          application={selectedApplication}
          isOpen={isEmailSheetOpen}
          onOpenChange={setIsEmailSheetOpen}
        />
      )}

      {/* Edit Contact Info Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editType === 'email'
                ? (applicationToEdit?.candidate_email ? 'Edit Email' : 'Add Email')
                : (applicationToEdit?.candidate_phone ? 'Edit Phone' : 'Add Phone')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact-value" className="text-right">
                {editType === 'email' ? 'Email' : 'Phone'}
              </Label>
              <Input
                id="contact-value"
                type={editType === 'email' ? 'email' : 'tel'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="col-span-3"
                placeholder={editType === 'email' ? 'Enter email address' : 'Enter phone number'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveContactInfo}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedApplication && (
        <CandidateDetails
          detailsOpen={detailsOpen}
          setDetailsOpen={setDetailsOpen}
          selectedApplication={selectedApplication}
          handleEditContact={handleEditContact}
          formatDate={formatDate}
          renderSimilarityInfo={renderSimilarityInfo}
          renderSuitableRoles={renderSuitableRoles}
        />
      )}
    </>
  );
};