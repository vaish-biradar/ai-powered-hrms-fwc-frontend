"use client"

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Upload, FileUp, FileText, X, Loader2, CheckCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from 'next-auth/react';

interface JobUploadDialogProps {
    onUploadSuccess: () => void;
}

import {ExtractedJobDetails} from "@/types/dashboard";
import { apiService } from '../../_services/api-service';

export function JobUploadDialog({ onUploadSuccess }: JobUploadDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1); // Step 1: Upload, Step 2: Review
    const [extractedDetails, setExtractedDetails] = useState<ExtractedJobDetails | null>(null);
    const dialogCloseRef = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);

    const session = useSession();

    const user = session.data?.user;
    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Only use the first file
        if (acceptedFiles.length > 0) {
            const fileType = acceptedFiles[0].type;
            if (['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(fileType)) {
                setFile(acceptedFiles[0]);
            } else {
                toast.error('Invalid file format', {
                    description: 'Please upload a PDF, DOCX, or TXT file.'
                });
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt']
        },
        multiple: false
    });

    const removeFile = () => {
        setFile(null);
    };

    const handleExtract = async () => {
        if (!file) {
            toast.error('No file selected', {
                description: 'Please select a job description file to upload.'
            });
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('files', file);

            const response = await apiService.extractJobDetails(file);
           

            const details = response.data;
            setExtractedDetails(details);
            setCurrentStep(2);

            toast.success('Details Extracted', {
                description: 'Job details extracted successfully. Please review before saving.'
            });
        } catch (error) {
            console.error('Extraction failed:', error);
            toast.error('Extraction Failed', {
                description: 'There was an error extracting job details from the file.'
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!extractedDetails) return;

        setIsSaving(true);

        try {
            // Add the username field here
            const payload = {
                ...extractedDetails,
                user: {
                    name: user?.name || "FWC User",
                    email: user?.email || "fwcuser@fwc.com"
                }
            };

            await apiService.saveJobDetails(payload);

            toast.success('Job Description Saved', {
                description: 'The job description has been saved successfully.'
            });

            // Close the dialog
            setOpen(false);

            // Reset state
            setFile(null);
            setExtractedDetails(null);
            setCurrentStep(1);
            onUploadSuccess();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Save Failed', {
                description: 'There was an error saving the job description.'
            });
        } finally {
            setIsSaving(false);
        }
    };


    const handleCancel = async () => {
        if (!extractedDetails || !extractedDetails.temp_file_path) {
            setCurrentStep(1);
            setExtractedDetails(null);
            return;
        }

        try {
            await apiService.cancelUpload(extractedDetails.temp_file_path);

            toast.info('Upload Cancelled', {
                description: 'The uploaded file has been removed.'
            });
        } catch (error) {
            console.error('Cancel failed:', error);
        } finally {
            setCurrentStep(1);
            setExtractedDetails(null);
        }
    };

    const handleFieldChange = (field: keyof ExtractedJobDetails, value: string) => {
        if (!extractedDetails) return;

        setExtractedDetails({
            ...extractedDetails,
            [field]: value
        });
    };

    const StepIndicator = () => (
        <div className="flex items-center justify-center w-full my-3">
            <div className="flex items-center justify-between w-full max-w-xs">
                <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center  text-sm font-medium ${currentStep === 1 ? 'bg-secondary text-muted-foreground' : 'bg-green-500 text-primary'}`}>
                        {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
                    </div>
                    <span className="text-xs mt-1">Upload</span>
                </div>
                <div className={`h-1 flex-1 justify-center items-center mb-3 mx-2 ${currentStep > 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 2 ? 'bg-secondary text-primary' : 'bg-secondary text-muted-foreground'}`}>
                        2
                    </div>
                    <span className="text-xs mt-1">Review</span>
                </div>
            </div>
        </div>
    );

    const renderUploadStep = () => (
        <>
            <SheetHeader>
                <SheetTitle className="text-left">Upload Job Description</SheetTitle>
                <SheetDescription className="text-left">
                    Upload a PDF, DOCX, or TXT file containing a job description
                </SheetDescription>
            </SheetHeader>

            <StepIndicator />
            <ScrollArea className="h-[35vh] pr-4 mt-4">
                <div
                    {...getRootProps()}
                    className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer 
                    ${isDragActive ? 'border-blue-500 bg-accent' : 'border-gray-300'}
                    ${file ? 'bg-accent border-blue-300' : ''}
                    transition-colors duration-200 mt-4
                `}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center">
                        {!file ? (
                            <>
                                <FileUp className="h-12 w-12 text-gray-400 mb-4" />
                                {isDragActive ? (
                                    <p className="text-blue-500 font-medium">Drop file here</p>
                                ) : (
                                    <>
                                        <p className="text-muted-foreground font-medium">
                                            Drag and drop a job description file here
                                        </p>
                                        <p className="text-sm text-muted-foreground  mt-1">
                                            or click to select a file
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-4">
                                            Supported formats: PDF, DOCX, TXT
                                        </p>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center">
                                <FileText className="h-12 w-12 text-blue-500 mb-4" />
                                <p className="text-blue-600 font-medium mb-1">File selected</p>
                                <p className="text-sm text-muted-foreground">{file.name}</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile();
                                    }}
                                    className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                    <X className="h-4 w-4 mr-1" /> Remove
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
            <SheetFooter className="mt-6 flex justify-between">
                <SheetClose ref={dialogCloseRef} asChild>
                    <Button variant="outline">Cancel</Button>
                </SheetClose>
                <Button
                    onClick={handleExtract}
                    disabled={isUploading || !file}
                    className="min-w-[120px]"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        'Next'
                    )}
                </Button>
            </SheetFooter>
        </>
    );

    const renderReviewStep = () => (
        <>
            <SheetHeader>
                <SheetTitle className="text-center">Review Job Details</SheetTitle>
                <SheetDescription className="text-center">
                    Review and edit the extracted job details before saving
                </SheetDescription>
            </SheetHeader>

            <StepIndicator />

            <ScrollArea className="h-[40vh] pr-4 mt-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Job Title</Label>
                        <Input
                            id="title"
                            value={extractedDetails?.title || ''}
                            onChange={(e) => handleFieldChange('title', e.target.value)}
                            className="bg-background"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                            id="department"
                            value={extractedDetails?.department || ''}
                            onChange={(e) => handleFieldChange('department', e.target.value)}
                            className="bg-background"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="employment_type">Employment Type</Label>
                            <Input
                                id="employment_type"
                                value={extractedDetails?.employment_type || ''}
                                onChange={(e) => handleFieldChange('employment_type', e.target.value)}
                                className="bg-background"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={extractedDetails?.location || ''}
                                onChange={(e) => handleFieldChange('location', e.target.value)}
                                className="bg-background"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="experience_level">Experience Level</Label>
                        <Input
                            id="experience_level"
                            value={extractedDetails?.experience_level || ''}
                            onChange={(e) => handleFieldChange('experience_level', e.target.value)}
                            className="bg-background"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="summary">Job Summary</Label>
                        <Textarea
                            id="summary"
                            rows={3}
                            value={extractedDetails?.summary || ''}
                            onChange={(e) => handleFieldChange('summary', e.target.value)}
                            className="bg-background resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="skills">Required Skills</Label>
                        <Textarea
                            id="skills"
                            rows={3}
                            value={extractedDetails?.skills || ''}
                            onChange={(e) => handleFieldChange('skills', e.target.value)}
                            className="bg-background resize-none"
                        />
                    </div>
                </div>
            </ScrollArea>

            <SheetFooter className="mt-6 flex justify-between">
                <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                >
                    Back
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isSaving || !extractedDetails}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Job Description'
                    )}
                </Button>
            </SheetFooter>
        </>
    );

    return (
        <Sheet
            open={open}
            onOpenChange={(newOpen) => {
                // If dialog is closing and we have extracted details, call handleCancel
                if (!newOpen && extractedDetails) {
                    handleCancel();
                }

                // Always update the open state
                setOpen(newOpen);

                // Reset state when dialog is closed
                if (!newOpen) {
                    setFile(null);
                    setExtractedDetails(null);
                    setCurrentStep(1);
                }
            }}
        >
            <SheetTrigger asChild>
                <div className="flex items-center">
                    <Button
                        variant="outline"
                        className="hidden md:flex items-center gap-3 text-primary bg-transparent  "
                    >
                        <Plus className="h-4 w-4" /> Add JD
                    </Button>

                    {/* Mobile Icon Button with Tooltip */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="md:hidden "
                                >
                                    <Upload className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Add JD</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md px-3" side="right">
                {currentStep === 1 ? renderUploadStep() : renderReviewStep()}
            </SheetContent>
        </Sheet>
    );
}