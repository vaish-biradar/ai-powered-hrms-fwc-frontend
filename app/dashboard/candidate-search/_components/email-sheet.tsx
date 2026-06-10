import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Send, Paperclip, X, Loader2, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { apiService } from '../../_services/api-service';

export const ContactButton = ({
    match,
    selectedJob,
    contactLoading
}: {
    match: { email: string; name: string; resume_id: string };
    selectedJob: { title: string; summary: string } | null;
    contactLoading: Record<string, boolean>;
}) => {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [emailContent, setEmailContent] = useState(
        `Dear ${match.name},\n\nWe are impressed with your profile and would like to discuss the ${selectedJob?.title || 'open'
        } position at our company.\n\nWe look forward to potentially speaking with you soon.\n\nBest regards,\nHR Team\nFWC`
    );
    const [subject, setSubject] = useState(`Opportunity for ${selectedJob?.title || 'a Role'}`);
    const [loading, setLoading] = useState(false);
    const [cc, setCc] = useState<string[]>([]);

    const handleSendEmail = async () => {
        if (!selectedJob) return;

        try {
            setLoading(true)
         
            await apiService.contactCandidate(
                match.email,
                subject,
                emailContent,
                attachments,
                cc.length > 0 ? cc : []
            );

            toast.success(`Email sent to ${match.email}`);

        } catch (error) {
            console.error('Failed to send email:', error);
            toast.error('An error occurred while sending the email.');
        }
        finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (!event.target.files) return;
        const newFiles: File[] = Array.from(event.target.files);
        setAttachments((prev: File[]) => [...prev, ...newFiles]);
    };

    const removeAttachment = (indexToRemove: number) => {
        setAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
    };



    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSheetOpen(true)}
                disabled={contactLoading[match.resume_id]}
                className="flex items-center"
            >
                <Send className="h-3.5 w-3.5 mr-1" />
                {contactLoading[match.resume_id] ? "..." : "Contact"}
            </Button>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent
                    side="right"
                    className="w-full sm:w-[500px] md:w-[600px] max-w-full overflow-y-auto p-4"
                >
                    <SheetHeader>
                        <SheetTitle>
                            <Mail className="inline-block mr-2" /> Email Candidate
                        </SheetTitle>
                        <SheetDescription>
                            Send an email to {match.name} for the {selectedJob?.title || 'open'} position
                        </SheetDescription>
                    </SheetHeader>


                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">From</label>
                            <Input
                                value="HR FWC <hr@fwc.com>"
                                readOnly
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">To</label>
                            <Input
                                value={match.email}
                                onChange={(e) => {
                                    if (!match.email) {
                                        match.email = e.target.value;
                                    }
                                }}
                                readOnly={!!match.email}
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

                        <div>
                            <label className="block text-sm font-medium mb-1">Subject</label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Message</label>
                            <Textarea
                                value={emailContent}
                                onChange={(e) => setEmailContent(e.target.value)}
                                placeholder={`Draft your message to ${match.name}`}
                                className="w-full min-h-[150px]"
                            />
                        </div>

                        {/* Attachments */}
                        <div>
                            <label className="text-sm font-medium flex items-center">
                                <Paperclip className="mr-2" /> Attachments
                            </label>
                            <Input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="mt-1"
                            />
                            {attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {attachments.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between bg-gray-100 p-2 rounded"
                                        >
                                            <span>{file.name}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeAttachment(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <SheetFooter className="mt-6 w-full flex !flex-row justify-end  ">

                        <Button
                            type="submit"
                            onClick={handleSendEmail}
                            disabled={contactLoading[match.resume_id]}
                            className="w-1/2 flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Email
                                </>
                            )}
                        </Button>
                    </SheetFooter>

                </SheetContent>
            </Sheet>
        </>
    );
};

export default ContactButton;