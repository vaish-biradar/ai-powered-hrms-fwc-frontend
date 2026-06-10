import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback} from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Pencil, Briefcase, MapPin, DollarSign, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Dispatch, SetStateAction } from "react";
import { Application } from "@/types/dashboard";

interface CandidateDetailsProps {
    detailsOpen: boolean;
    setDetailsOpen: Dispatch<SetStateAction<boolean>>;
    selectedApplication: Application;
    handleEditContact: (application: Application, field: "email" | "phone") => void;
    formatDate: (date: string) => string;
    renderSimilarityInfo: (application: Application) => React.ReactNode;
    renderSuitableRoles: (application: Application) => React.ReactNode;
}

const CandidateDetails: React.FC<CandidateDetailsProps> = ({ 
    detailsOpen, 
    setDetailsOpen, 
    selectedApplication, 
    handleEditContact, 
    formatDate, 
    renderSimilarityInfo, 
    renderSuitableRoles 
}) => {
    return (
        <Sheet open={detailsOpen && selectedApplication !== null} onOpenChange={setDetailsOpen}>
            <SheetContent className="sm:max-w-md w-full p-0 border-l">
                {selectedApplication && (
                    <div className="flex flex-col h-full">
                        <SheetHeader className="p-4 border-b bg-card">
                            <SheetTitle className="flex items-center">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14 border-2 border-primary/10">
                                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                                            {selectedApplication?.candidate_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold">{selectedApplication.candidate_name || "Unknown Candidate"}</h3>
                                       
                                    </div>
                                </div>
                            </SheetTitle>
                        </SheetHeader>

                        <ScrollArea className="flex-1 h-[calc(100vh-100px)]">
                            <div className="px-4 py-6 space-y-6">
                                {/* Contact Information */}
                                <div>
                                    <h4 className="text-sm font-medium mb-3 flex items-center">
                                        <span className="bg-primary/10 p-1 rounded-md mr-2">
                                            <Mail className="h-4 w-4 text-primary" />
                                        </span>
                                        Contact Information
                                    </h4>
                                    <Card className="overflow-hidden border-muted">
                                        <CardContent className="p-0">
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{selectedApplication.candidate_email || "No email provided"}</span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditContact(selectedApplication, 'email')}
                                                        className="h-8"
                                                    >
                                                        <Pencil className="h-3 w-3 mr-1" />
                                                        {selectedApplication.candidate_email ? "Edit" : "Add"}
                                                    </Button>
                                                </div>
                                                <Separator />
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{selectedApplication.candidate_phone || "No phone provided"}</span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditContact(selectedApplication, 'phone')}
                                                        className="h-8"
                                                    >
                                                        <Pencil className="h-3 w-3 mr-1" />
                                                        {selectedApplication.candidate_phone ? "Edit" : "Add"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Application Details */}
                                <div>
                                    <h4 className="text-sm font-medium mb-3 flex items-center">
                                        <span className="bg-primary/10 p-1 rounded-md mr-2">
                                            <Briefcase className="h-4 w-4 text-primary" />
                                        </span>
                                        Application Details
                                    </h4>
                                    <Card className="overflow-hidden border-muted">
                                        <CardContent className="p-4">
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 gap-2">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Applied For</span>
                                                    <span className="font-medium text-sm">{selectedApplication.job_title || "Not specified"}</span>
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">Applied Date</span>
                                                        <span className="text-sm">{selectedApplication.applied_date ? formatDate(selectedApplication.applied_date) : "Not specified"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">Match Score</span>
                                                        <div className="text-sm">{renderSimilarityInfo(selectedApplication)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Candidate Profile */}
                                <div>
                                    <h4 className="text-sm font-medium mb-3 flex items-center">
                                        <span className="bg-primary/10 p-1 rounded-md mr-2">
                                            <Star className="h-4 w-4 text-primary" />
                                        </span>
                                        Candidate Profile
                                    </h4>
                                    <Card className="overflow-hidden border-muted">
                                        <CardContent className="p-4">
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-y-4">
                                                    <div>
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">Total Experience</span>
                                                        <span className="text-sm">{selectedApplication.total_experience || "Not specified"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">Current Role</span>
                                                        <span className="text-sm break-words">{selectedApplication.current_job_title || "Not specified"}</span>
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-2 gap-y-4">
                                                    <div>
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">Current Company</span>
                                                        <span className="text-sm break-words">{selectedApplication.current_company || "Not specified"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">Location</span>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                                            {selectedApplication.current_location || "Not specified"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-2 gap-y-4">
                                                    <div>
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">Current CTC</span>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                                                            {selectedApplication.current_ctc || "Not specified"}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">Expected CTC</span>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <DollarSign className="h-3 w-3 text-success" />
                                                            {selectedApplication.expected_ctc || "Not specified"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Suitable Roles Section */}
                                <div className="pb-6">
                                    <h4 className="text-sm font-medium mb-3 flex items-center">
                                        <span className="bg-primary/10 p-1 rounded-md mr-2">
                                            <Briefcase className="h-4 w-4 text-primary" />
                                        </span>
                                        Suitable Roles
                                    </h4>
                                    <Card className="overflow-hidden border-muted">
                                        <CardContent className="p-4">
                                            {renderSuitableRoles(selectedApplication)}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default CandidateDetails;