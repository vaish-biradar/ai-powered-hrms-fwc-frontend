import React, { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import {
    Input
} from '@/components/ui/input';
import {
    Textarea
} from '@/components/ui/textarea';
import {
    Button
} from '@/components/ui/button';
import {
    Loader2,
    Mail,
    Paperclip,
    Send,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiService } from '@/app/dashboard/_services/api-service';

interface EmailCandidateSheetProps {
    application: {
        candidate_name: string;
        candidate_email: string;
        job_title: string;
    };
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const EmailCandidateSheet: React.FC<EmailCandidateSheetProps> = ({
    application,
    isOpen,
    onOpenChange
}) => {
    const [subject, setSubject] = useState(`Application Update - ${application.job_title}`);
    const [body, setBody] = useState(`Dear ${application.candidate_name},

We hope this email finds you well.

Best regards,
HR Team - FWC`);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [cc, setCc] = useState<string[]>([]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const newFiles: File[] = Array.from(event.target.files || []);
        setAttachments((prev: File[]) => [...prev, ...newFiles]);
    };

    const removeAttachment = (indexToRemove: number): void => {
        setAttachments((prev: File[]) => prev.filter((_, index: number) => index !== indexToRemove));
    };

    const handleSendEmail = async () => {
        try {
            setIsSending(true)
            await apiService.contactCandidate(
                application.candidate_email,
                subject,
                body,
                attachments,
                cc.length > 0 ? cc : []
            );

            toast.success(`Email sent to ${application.candidate_email}`);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent
                className="
                    w-full 
                    max-w-[600px] 
                    sm:w-[95%] 
                    md:w-[90%] 
                    lg:w-[600px] 
                    p-4 
                    sm:p-6 
                    overflow-y-auto 
                    space-y-4
                "
            >
                <SheetHeader>
                    <SheetTitle className="flex items-center text-lg sm:text-xl">
                        <Mail className="inline-block mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Email Candidate
                    </SheetTitle>
                    <SheetDescription className="text-sm sm:text-base">
                        Send an email to {application.candidate_name}
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="max-h-[80vh] sm:max-h-[85vh] md:max-h-[90vh] overflow-auto">

                    <div className="space-y-4">
                        {/* From */}
                        <div>
                            <label className="text-xs sm:text-sm font-medium">From</label>
                            <Input
                                value="HR FWC <hr@fwc.com>"
                                readOnly
                                className="mt-1 text-xs sm:text-sm"
                            />
                        </div>

                        {/* To */}
                        <div>
                            <label className="text-xs sm:text-sm font-medium">To</label>

                            <Input
                                value={application.candidate_email}
                                onChange={(e) => {
                                    if (!application.candidate_email) {
                                        application.candidate_email = e.target.value;
                                    }
                                }}
                                readOnly={!!application.candidate_email}
                                placeholder="Enter recipient email"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">CC</label>
                            <Input
                                value={cc}
                                onChange={(e) => setCc(e.target.value.split(',').map(email => email.trim()))}

                                placeholder="Enter CC emails (comma separated)"
                                className="w-full"
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="text-xs sm:text-sm font-medium">Subject</label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="mt-1 text-xs sm:text-sm"
                            />
                        </div>

                        {/* Body */}
                        <div>
                            <label className="text-xs sm:text-sm font-medium">Body</label>
                            <Textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={8}
                                className="mt-1 text-xs sm:text-sm"
                            />
                        </div>

                        {/* Attachments */}
                        <div>
                            <label className="text-xs sm:text-sm font-medium flex items-center">
                                <Paperclip className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Attachments
                            </label>
                            <Input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="mt-1 text-xs sm:text-sm"
                            />
                            {attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {attachments.map((file, index) => (
                                        <div
                                            key={index}
                                            className="
                                            flex 
                                            items-center 
                                            justify-between 
                                            bg-gray-100 
                                            p-2 
                                            rounded 
                                            text-xs 
                                            sm:text-sm
                                        "
                                        >
                                            <span className="truncate max-w-[calc(100%-40px)]">{file.name}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeAttachment(index)}
                                                className="p-1"
                                            >
                                                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
                <SheetFooter className="!py-0">

                    <Button
                        onClick={handleSendEmail}
                        className="w-full sm:w-auto"
                    >
                        {isSending ? <> <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> Sending </> : <> <Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Send Email</>}

                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default EmailCandidateSheet;