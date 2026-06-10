import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, RefreshCw } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { resumeIDAtom } from '@/store/career-atom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { FormData, ApplicationDialogProps } from '@/types/careers-types';

// Moved API function outside component
const fetchResumeData = async (id: string) => {
    try {
        const response = await fetch(`/api/resumes/${id}`);
        if (!response.ok) throw new Error("Failed to fetch resume data");
        return await response.json();
    } catch (error) {
        console.error("Error fetching resume data:", error);
        return null;
    }
};

export const ApplicationDialog: React.FC<ApplicationDialogProps> = ({
    open,
    onOpenChange,
    jobTitle,
    onSubmit,
    isSubmitting
}) => {
    const resumeID = useAtomValue(resumeIDAtom);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        mobile: '',
        totalExperience: '',
        currentCtc: '',
        expectedCtc: '',
        currentCompany: '',
        currentLocation: '',
        currentJobTitle: '',
        noticePeriod: ''
    });
    const [isLoadingResume, setIsLoadingResume] = useState(false);
    const [resumeLoaded, setResumeLoaded] = useState(false);

    // Memoized function to load resume data
    const loadResumeData = useCallback(async () => {
        if (!resumeID) return;

        setIsLoadingResume(true);
        try {
            const resumeData = await fetchResumeData(resumeID);
            if (resumeData) {
                setFormData(prev => ({
                    ...prev,
                    name: resumeData.name || prev.name,
                    email: resumeData.email || prev.email,
                    mobile: resumeData.phone || prev.mobile,
                    totalExperience: resumeData.years_of_experience || prev.totalExperience,
                }));
                setResumeLoaded(true);
            }
        } catch (error) {
            console.error("Error loading resume data:", error);
        } finally {
            setIsLoadingResume(false);
        }
    }, [resumeID]);

    // Load resume data when dialog opens
    useEffect(() => {
        if (open && resumeID) {
            loadResumeData();
        }
    }, [open, resumeID, loadResumeData]);

    // Event handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (value: string) => {
        setFormData(prev => ({ ...prev, mobile: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(formData);
    };











    const ResumeButton = () => (
        <div className="flex items-center justify-between py-2">
            <div className="text-sm text-muted-foreground">
                {resumeLoaded ? "Resume data loaded" : "Fill form with resume data"}
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadResumeData}
                disabled={isLoadingResume}
            >
                {isLoadingResume ? (
                    <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Loading...
                    </>
                ) : (
                    <>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Load from Resume
                    </>
                )}
            </Button>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl md:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Apply for {jobTitle}</DialogTitle>
                    <DialogDescription>
                        Please provide your details to proceed with your application.
                    </DialogDescription>
                </DialogHeader>

                {resumeID && <ResumeButton />}

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="mobile">Mobile Number</Label>
                                <PhoneInput
                                    country={'ind'}
                                    value={formData.mobile}
                                    onChange={handlePhoneChange}
                                    containerClass="w-full"
                                    inputClass="!w-full !h-10 !text-primary !bg-accent focus:!ring-2 focus:!ring-accent focus:!outline-none"
                                    buttonClass="!bg-transparent !text-primary border-r !border-gray-300 !hover:bg-transparent !focus:bg-background !focus:ring-0 !outline-none"
                                    dropdownClass="!bg-background !text-primary !border-gray-300 !shadow-lg !rounded-lg !hover:bg-background !hover:text-black !focus:bg-background !focus:ring-0 !outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="totalExperience">Total Years of Experience</Label>
                                <Input
                                    id="totalExperience"
                                    name="totalExperience"
                                    type="text"
                                    value={formData.totalExperience}
                                    onChange={handleChange}
                                    placeholder="e.g. 3.5 years"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentCtc">Current CTC</Label>
                                <Input
                                    id="currentCtc"
                                    name="currentCtc"
                                    value={formData.currentCtc}
                                    onChange={handleChange}
                                    placeholder="Annual compensation"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expectedCtc">Expected CTC</Label>
                                <Input
                                    id="expectedCtc"
                                    name="expectedCtc"
                                    value={formData.expectedCtc}
                                    onChange={handleChange}
                                    placeholder="Enter expected annual CTC"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentJobTitle">Current Job Title</Label>
                                <Input
                                    id="currentJobTitle"
                                    name="currentJobTitle"
                                    value={formData.currentJobTitle}
                                    onChange={handleChange}
                                    placeholder="Enter your current job title"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currentCompany">Current Company</Label>
                                <Input
                                    id="currentCompany"
                                    name="currentCompany"
                                    value={formData.currentCompany}
                                    onChange={handleChange}
                                    placeholder="Enter your current company name"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentLocation">Current Location</Label>
                                <Input
                                    id="currentLocation"
                                    name="currentLocation"
                                    value={formData.currentLocation}
                                    onChange={handleChange}
                                    placeholder="City, Country"
                                    required
                                />
                            </div>
                            <div className="space-y-2 w-full">
                                <Label htmlFor="noticePeriod">Notice Period</Label>
                                <Select
                                    onValueChange={(value) => handleSelectChange('noticePeriod', value)}
                                    value={formData.noticePeriod}
                                >
                                    <SelectTrigger id="noticePeriod" className="w-full">
                                        <SelectValue placeholder="Select notice period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="immediate">Immediate</SelectItem>
                                        <SelectItem value="15days">15 Days</SelectItem>
                                        <SelectItem value="30days">30 Days</SelectItem>
                                        <SelectItem value="60days">60 Days</SelectItem>
                                        <SelectItem value="90days">90 Days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Submit Application
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};