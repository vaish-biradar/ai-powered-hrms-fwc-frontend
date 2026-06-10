import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter,
  SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText, Users, X, Plus, Info, AlertCircle,
  Loader2, VideoIcon, CheckCircle2, ExternalLink,
  CalendarClock, CalendarOff, Clock
} from 'lucide-react';
import {  Member ,MeetingDetails} from './page';

interface InterviewDetails {
  date: Date | undefined,
  time: string,
  location?: string;
}

type Application = {
  id?: string;
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
  status?: string;
};


interface FormState {
  subject: string;
  start: Date;
  end: Date;
  attendees: string[];
  location: string;
  meetingLink: string;
}

interface OutlookMeetingSchedulerProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  application: Application | null;
  interviewDetails?: InterviewDetails;
  panelMembers?: Member[];
  onMeetingCreated?: (data: MeetingDetails) => void;
}

export function OutlookMeetingScheduler({
  isOpen,
  setIsOpen,
  application,
  interviewDetails,
  panelMembers,
  onMeetingCreated
}: OutlookMeetingSchedulerProps) {
  // Helper function for default form state
  const getDefaultFormState = (): FormState => {
    // Set default start time to next half hour
    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() + 30 - (startDate.getMinutes() % 30), 0, 0);

    // Set default end time to 1 hour after start
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    return {
      subject: `Interview - ${application?.candidate_name || ''} for ${application?.job_title || 'Position'}`,
      start: startDate,
      end: endDate,
      attendees: panelMembers?.map(member => member.email) || [],
      location: '',
      meetingLink: ''
    };
  };

  // Initialize form with interview details if available
  const initializeForm = (): FormState => {
    if (interviewDetails) {
      try {
        const startDate = new Date();

        // Pre-populate attendees with panel members if available
        const initialAttendees = panelMembers?.map(member => member.email) || [];
        if (application?.candidate_email) {
          initialAttendees.push(application.candidate_email);
        }

        return {
          subject: `Interview - ${application?.candidate_name || ''} for ${application?.job_title || 'Position'}`,
          start: startDate,
          end: new Date(startDate.getTime() + 60 * 60 * 1000), // Add 1 hour
          attendees: initialAttendees,
          location: interviewDetails.location || '',
          meetingLink: '',
        };
      } catch (error) {
        console.error("Error initializing form:", error);
        // Fallback to default if initialization fails
        return getDefaultFormState();
      }
    }

    // Default form state
    return getDefaultFormState();
  };

  const [form, setForm] = useState<FormState>(initializeForm);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Initialize attendees from form
  useEffect(() => {
    if (form.attendees && form.attendees.length > 0) {
      setAttendees(form.attendees);
    }
  }, [form.attendees]);

  const handleChange = (field: keyof FormState, value: string | Date | string[]) => {
    setForm({ ...form, [field]: value });
  };

  // Handle date and time change using react-datepicker
  const handleDateTimeChange = (field: 'start' | 'end', date: Date | null) => {
    if (!date) return;

    setForm({ ...form, [field]: date });

    // If changing start time, adjust end time to be 1 hour later
    if (field === 'start') {
      const newEndDate = new Date(date);
      newEndDate.setHours(newEndDate.getHours() + 1);
      setForm(prev => ({ ...prev, end: newEndDate }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && emailInput) {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleAddEmail = () => {
    if (!emailInput || !emailInput.trim()) return;

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      // You could add error handling here
      return;
    }

    if (!attendees.includes(emailInput.trim())) {
      setAttendees([...attendees, emailInput.trim()]);
    }
    setEmailInput('');
  };

  const removeEmail = (email: string) => {
    setAttendees(attendees.filter((e) => e !== email));
  };

  const createMeeting = async () => {
    if (!form.subject.trim() || attendees.length === 0) {
      return;
    }

    setLoading(true);
    try {
      // Create meeting request payload
      const meetingPayload = {
        subject: form.subject,
        start: form.start.toISOString(),
        end: form.end.toISOString(),
        attendees: attendees,
        location: form.location || 'Online Google/Teams Meeting',
        meetingLink: form.meetingLink || undefined,
        isOnlineMeeting: true, // This tells Outlook to create a Teams meeting link
        body: {
          contentType: "HTML",
          content: `<p>Interview for ${application?.job_title || 'Position'}</p>
                    <p>Candidate: ${application?.candidate_name || ''}</p>
                    <p>This is an automatically scheduled interview. Please ensure you review the candidate's application before the meeting.</p>`
        }
      };

      const res = await fetch("/api/create-meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meetingPayload),
      });

      if (!res.ok) {
        throw new Error("Failed to create meeting");
      }

      const data = await res.json();
      // Set join URL for the meeting
      setJoinUrl(data.joinUrl || '');

      setShowSuccess(true);

      console.log("Meeting created successfully:", data);
      console.log("Meeting link:", data.joinUrl);

      // Notify parent component that meeting was created
      if (onMeetingCreated) {
        onMeetingCreated({
          meetingLink: data.joinUrl || '',
          start: data.startDateTime,
        });
      }

      // Wait a moment before closing
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to create meeting", err);
      // You could add error handling UI here
    } finally {
      setLoading(false);
    }
  };

  // Configure time interval options for datepicker
  const timeIntervalOptions = {
    intervalMinutes: 15,
    timeCaption: "Time",
    dateFormat: "h:mm aa"
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-full max-w-3xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl">Schedule Interview in Outlook</SheetTitle>
          <SheetDescription>
            Create a Teams meeting and send invites to all participants
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[80vh] md:h-[50vh] lg:h-[60vh] xl:h-[70vh] overflow-y-auto">
          <div className="space-y-8 p-6">
            <div className="space-y-3">
              <Label htmlFor="subject" className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" /> Meeting Subject <span className="text-destructive">*</span>
              </Label>
              <div className={`flex items-center border rounded px-2 py-2 bg-background ${form.subject.replace(/^Interview\s*-\s*/i, "").trim() === "" ? "ring-1 ring-destructive" : ""}`}>
                <span className="text-sm text-muted-foreground mr-1 select-none whitespace-nowrap">Interview -</span>
                <input
                  type="text"
                  id="subject"
                  placeholder="Enter meeting subject"
                  value={form.subject.replace(/^Interview\s*-\s*/i, "")}
                  onChange={(e) => {
                    const userInput = e.target.value.replace(/^Interview\s*-\s*/i, "");
                    handleChange("subject", `Interview - ${userInput}`);
                  }}
                  className="w-full text-sm bg-transparent focus:outline-none"
                  required
                />
              </div>
              {form.subject.replace(/^Interview\s*-\s*/i, "").trim() === "" && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Meeting subject is required
                </p>
              )}
            </div>

            {/* Start Date & Time with react-datepicker */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <CalendarClock className="h-5 w-5" /> Start Date & Time <span className="text-destructive">*</span>
              </h3>
              <div className="relative">
                <div className="flex items-center border rounded-md overflow-hidden">
                  <div className="p-2 bg-muted">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <DatePicker
                    selected={form.start}
                    onChange={(date) => handleDateTimeChange('start', date)}
                    showTimeSelect
                    timeIntervals={timeIntervalOptions.intervalMinutes}
                    timeCaption={timeIntervalOptions.timeCaption}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    timeFormat="h:mm aa"
                    className="w-full p-2 focus:outline-none bg-transparent"
                    wrapperClassName="w-full"
                    popperClassName="react-datepicker-left"
                  />
                </div>
              </div>
            </div>

            {/* End Date & Time with react-datepicker */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <CalendarOff className="h-5 w-5" /> End Date & Time <span className="text-destructive">*</span>
              </h3>
              <div className="relative">
                <div className="flex items-center border rounded-md overflow-hidden">
                  <div className="p-2 bg-muted">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <DatePicker
                    selected={form.end}
                    onChange={(date) => handleDateTimeChange('end', date)}
                    showTimeSelect
                    timeIntervals={timeIntervalOptions.intervalMinutes}
                    timeCaption={timeIntervalOptions.timeCaption}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    timeFormat="h:mm aa"
                    className="w-full p-2 focus:outline-none bg-transparent"
                    wrapperClassName="w-full"
                    popperClassName="react-datepicker-left"
                    minDate={form.start}
                  />
                </div>
              </div>
              {form.end <= form.start && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> End time must be after start time
                </p>
              )}
            </div>

            {/* Duration Display - Optional but useful */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Info className="h-4 w-4" />
                Meeting Duration: {Math.round((form.end.getTime() - form.start.getTime()) / (1000 * 60))} minutes
              </p>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" /> Location (Optional)
              </Label>
              <Input
                id="location"
                placeholder="Conference Room 3 (or leave empty for online only)"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Leave empty for online meeting only, or specify physical location
              </p>
            </div>

            {/* Meeting Link */}
            <div className="space-y-3">
              <Label htmlFor="meeting-link" className="text-sm font-medium flex items-center gap-2">
                <ExternalLink className="h-4 w-4" /> Meeting Link (Optional)
              </Label>
              <Input
                id="meeting-link"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                value={form.meetingLink}
                onChange={(e) => handleChange("meetingLink", e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Paste a Google Meet link here to include it in invite emails.
              </p>
            </div>

            {/* Attendees */}
            <div className="space-y-3">
              <Label
                htmlFor="attendees"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Users className="h-5 w-5" /> Meeting Attendees <span className="text-destructive">*</span>
              </Label>

              <div className="flex items-center gap-2">
                <Input
                  id="attendees"
                  placeholder="Enter email and press Enter"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={attendees.length === 0 ? "ring-1 ring-destructive" : ""}
                />
                <Button type="button" variant="outline" onClick={handleAddEmail}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {attendees.length === 0 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> At least one attendee is required
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {[...new Set(attendees)].map((email, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-sm flex items-center gap-1"
                  >
                    {email}
                    <button onClick={() => removeEmail(email)} type="button">
                      <X className="h-3 w-3 ml-1 hover:text-destructive" />
                    </button>
                  </Badge>
                ))}
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Add emails of all panel members and the candidate
              </p>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter>
          <div className="pt-4">
            <Button
              onClick={() => {
                // Check for required fields
                const subjectValue = form.subject.replace(/^Interview\s*-\s*/i, "").trim();
                const isSubjectValid = subjectValue !== "";
                const areAttendeesValid = attendees.length > 0;
                const isTimeValid = form.end > form.start;

                // Handle validation failures
                if (!isSubjectValid || !areAttendeesValid || !isTimeValid) {
                  // Focus on the first invalid field
                  if (!isSubjectValid) {
                    const subjectInput = document.getElementById('subject');
                    if (subjectInput) {
                      subjectInput.focus();
                    }
                    return;
                  }

                  if (!areAttendeesValid) {
                    const attendeesInput = document.getElementById('attendees');
                    if (attendeesInput) {
                      attendeesInput.focus();
                    }
                    return;
                  }

                  return;
                }

                // If validation passes, proceed with creating the meeting
                createMeeting();
              }}
              className="w-full py-6 text-lg font-semibold"
              disabled={loading || attendees.length === 0 || form.subject.replace(/^Interview\s*-\s*/i, "").trim() === "" || form.end <= form.start}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Scheduling...
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  <VideoIcon className="h-5 w-5" /> Schedule Interview
                </div>
              )}
            </Button>
          </div>

          {showSuccess && joinUrl && (
            <div className="bg-muted p-5 rounded-lg border shadow-sm mt-4">
              <p className="text-primary font-medium flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5" /> Interview Scheduled Successfully
              </p>
              <div className="bg-background p-3 rounded border mt-2">
                <a
                  href={joinUrl}
                  className="text-primary underline font-medium flex items-center gap-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" /> Join Meeting Link
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                The meeting has been added to your Outlook calendar and invitations have been sent
              </p>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}