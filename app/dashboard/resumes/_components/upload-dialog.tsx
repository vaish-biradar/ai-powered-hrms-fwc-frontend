"use client"

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileUp, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResumeUploadDialogProps {
    onUploadSuccess: () => void;
}

export function ResumeUploadDialog({ onUploadSuccess }: ResumeUploadDialogProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const dialogCloseRef = useRef<HTMLButtonElement>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Filter for only PDF, DOCX, and TXT files
        const validFiles = acceptedFiles.filter(file =>
            ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
                .includes(file.type)
        );

        setFiles(prevFiles => [...prevFiles, ...validFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt']
        },
        multiple: true
    });

    const removeFile = (fileToRemove: File) => {
        setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            toast.error('No files selected', {
                description: 'Please select at least one resume file to upload.'
            });
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            await axios.post('/api/proxy/resume/upload-resumes', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Upload Successful', {
                description: `${files.length} Resume(s) uploaded successfully.`
            });

            // Programmatically close the dialog
            if (dialogCloseRef.current) {
                dialogCloseRef.current.click();
            }

            // Reset files and trigger parent component to refresh
            setFiles([]);
            onUploadSuccess();
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Upload Failed', {
                description: 'There was an error uploading the resumes.'
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="flex items-center">
                    <Button
                        variant="outline"
                        className="hidden md:flex items-center gap-2 text-primary bg-transparent"
                    >
                        <Upload className="h-4 w-4" /> Upload New
                    </Button>

                    {/* Mobile Icon Button with Tooltip */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="md:hidden"
                                >
                                    <Upload className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Upload New</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Upload Candidate Resume(s)</DialogTitle>
                    <DialogDescription>
                        Upload resumes of candidates (PDF, DOCX, or TXT files) for the recruitment process.
                    </DialogDescription>
                </DialogHeader>

                <div
                    {...getRootProps()}
                    className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer 
                        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                        transition-colors duration-200
                    `}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center">
                        <FileUp className="h-12 w-12 text-gray-400 mb-4" />
                        {isDragActive ? (
                            <p className="text-blue-500">Drop resumes here</p>
                        ) : (
                            <>
                                <p className="text-gray-600">
                                    Drag and drop candidate resumes here, or click to select
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Supported formats: PDF, DOCX, TXT
                                </p>
                            </>
                        )}
                    </div>
                </div>
<ScrollArea className="h-40 mt-4">
   
                {files.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Selected Resumes:</h4>
                        <div className="space-y-2">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-2 rounded"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        <span className="text-sm">{file.name}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFile(file)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
 </ScrollArea>
                <DialogFooter>
                    <DialogClose ref={dialogCloseRef} asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleUpload}
                        disabled={isUploading || files.length === 0}
                    >
                        {isUploading ? 'Uploading...' : 'Upload Resumes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
