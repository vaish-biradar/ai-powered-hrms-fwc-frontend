"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DatePicker from 'react-datepicker';
import { format, addHours, setHours, setMinutes, isSameDay } from "date-fns";
import { useSession } from "next-auth/react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Clock,
    Calendar as CalendarIcon,
    Users,
    VideoIcon,
    Search,

    ChevronRight,
    Clock3,
    CheckCircle2,
    AlertCircle,
    FileText,
    Loader2,
    ExternalLink,
    Info,
    Video,
    User,
    UserCircle,
    ChevronDown,
    RefreshCw,
    Plus,
    X,
    CalendarClock,
    CalendarOff
} from "lucide-react";
import { toZonedTime } from "date-fns-tz";
import { ScrollArea } from "@/components/ui/scroll-area";
import Header from "../_components/app-header";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import "react-datepicker/dist/react-datepicker.css"


interface EventForm {
    subject: string;
    start: Date;
    end: Date;
    attendees: string[];
}

interface Meeting {
    id: string;
    subject: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    onlineMeeting?: { joinUrl?: string };
    createdDateTime: string;
    attendees?: { emailAddress: { address: string } }[];
    organizer?: { emailAddress: { address: string } };
}

export default function TeamsMeetingPage() {
    const { data: session } = useSession();
    const [form, setForm] = useState<EventForm>({
        subject: "",
        start: new Date(),
        end: addHours(new Date(), 1),
        attendees: [],
    });
    const [joinUrl, setJoinUrl] = useState<string | null>(null);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // all, upcoming, past
    const [createSheetOpen, setCreateSheetOpen] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [attendees, setAttendees] = useState<string[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const handleAddEmail = () => {
        const trimmedEmail = emailInput.trim();
        if (trimmedEmail && /\S+@\S+\.\S+/.test(trimmedEmail) && !attendees.includes(trimmedEmail)) {
            const updatedAttendees = [...attendees, trimmedEmail];
            setAttendees(updatedAttendees);
            setForm((prev) => ({ ...prev, attendees: updatedAttendees }));
            setEmailInput("");
        }
    };


    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddEmail();
        }
    };

    const removeEmail = (emailToRemove: string) => {
        const updatedAttendees = attendees.filter((email) => email !== emailToRemove);
        setAttendees(updatedAttendees);
        setForm((prev) => ({ ...prev, attendees: updatedAttendees }));
    };

    // Generate time options (30 min intervals)
    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = (i % 2) * 30;
        return {
            value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
            label: format(setMinutes(setHours(new Date(), hour), minute), "h:mm a"),
        };
    });

    const handleChange = (field: keyof EventForm, value: string | Date) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleTimeChange = (type: "start" | "end", timeString: string) => {
        const [hours, minutes] = timeString.split(":").map(Number);
        const dateToUpdate = type === "start" ? new Date(form.start) : new Date(form.end);

        const newDate = setMinutes(setHours(dateToUpdate, hours), minutes);

    

        setForm((prev) => ({
            ...prev,
            [type]: newDate,
            // If start time changes, adjust end time if it's earlier than start
            ...(type === "start" && newDate >= prev.end ? { end: addHours(newDate, 1) } : {}),
        }));
    };

    const handleDateChange = (type: "start" | "end", date: Date | null) => {
        if (!date) return;

        const currentTime = type === "start" ? form.start : form.end;
        const newDate = new Date(date);

        // Safely preserve time from current value if it exists, otherwise default to 0:00
        const hours = currentTime ? currentTime.getHours() : 0;
        const minutes = currentTime ? currentTime.getMinutes() : 0;
        newDate.setHours(hours, minutes);

        setForm((prev) => ({
            ...prev,
            [type]: newDate,
            ...(type === "start" && (!prev.end || newDate >= prev.end)
                ? { end: addHours(newDate, 1) }
                : {}),
        }));
    };


    const createMeeting = async () => {
        if (!form.subject.trim()) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/create-meetings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                throw new Error("Failed to create meeting");
            }

            const data = await res.json();
            setJoinUrl(data.joinUrl);
            fetchMeetings();

            // Reset form for next meeting
            setForm({
                subject: "",
                start: new Date(),
                end: addHours(new Date(), 1),
                attendees: [],
            });
            setAttendees([]);
        } catch (err) {
            console.error("Failed to create meeting", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMeetings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/get-meetings");

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Fetch failed:", errorText);
                return;
            }

            const data = await res.json();
            const sortedMeetings = (data.value || []).sort(
                (a: Meeting, b: Meeting) =>
                    new Date(b.start.dateTime).getTime() - new Date(a.start.dateTime).getTime() // <-- latest first
            );
            setMeetings(sortedMeetings);
        } catch (err) {
            console.error("Failed to fetch meetings", err);
        } finally {
            setLoading(false);
        }
    }, []);




    useEffect(() => {
        if (session) {
            fetchMeetings();
        }
    }, [session, fetchMeetings]);



    const getCurrentTimeString = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = Math.floor(date.getMinutes() / 30) * 30; // Round to nearest 30 min
        return `${hours}:${minutes.toString().padStart(2, "0")}`;
    };



    const formatDateLocal = (utcDateString: string): string => {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // gets browser's local time zone
        const zonedDate = toZonedTime(new Date(utcDateString), userTimeZone);
        return format(zonedDate, "PPpp"); // Example: Apr 8, 2025 at 12:56 PM
    };

    const formatDateIST = (utcDateString: string): string => {
        const utcDate = new Date(utcDateString);
        const istOffsetMinutes = 5.5 * 60;
        const istDate = new Date(utcDate.getTime() + istOffsetMinutes * 60000);

        return format(istDate, "hh:mm a"); // e.g. 08/04/2025 14:30
    };

    const formatDateHeader = (dateString: string): string => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        if (isSameDay(date, today)) {
            return "Today";
        } else if (isSameDay(date, tomorrow)) {
            return "Tomorrow";
        } else {
            return format(date, "EEEE, MMMM d");
        }
    };

    const getMeetingStatusClass = (meeting: Meeting) => {
        const now = new Date();
        const startTime = new Date(meeting.start.dateTime);
        const endTime = new Date(meeting.end.dateTime);

        if (now < startTime) {
            return "border-l-blue-500"; // Upcoming
        } else if (now >= startTime && now <= endTime) {
            return "border-l-green-500"; // In progress
        } else {
            return "border-l-gray-400"; // Past
        }
    };

    const getMeetingStatus = (meeting: Meeting) => {
        const now = new Date();

        // Apply +5:30 (330 minutes) offset to meeting times
        const istOffsetMs = 5.5 * 60 * 60 * 1000;

        const startTime = new Date(new Date(meeting.start.dateTime).getTime() + istOffsetMs);
        const endTime = new Date(new Date(meeting.end.dateTime).getTime() + istOffsetMs);

        if (now < startTime) {
            return "upcoming";
        } else if (now >= startTime && now <= endTime) {
            return "active";
        } else {
            return "past";
        }
    };


    const getFilteredMeetings = () => {
        // First filter by search query
        let filtered = meetings;
        if (searchQuery) {
            filtered = filtered.filter(m =>
                m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.attendees?.some(a => a.emailAddress.address.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Then filter by status
        if (filterStatus !== "all") {
            filtered = filtered.filter(m => getMeetingStatus(m) === filterStatus);
        }

        // Group the filtered meetings
        const grouped = filtered.reduce<{ [key: string]: Meeting[] }>((acc, meeting) => {
            const dateKey = format(new Date(meeting.start.dateTime), 'yyyy-MM-dd');
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(meeting);
            return acc;
        }, {});

        return grouped;
    };

    const handleOpenMeetingDetails = (meeting: Meeting) => {
        setSelectedMeeting(meeting);
        setSheetOpen(true);
    };
    useEffect(() => {
        if (joinUrl) {
            setShowSuccess(true);
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 5000);
            return () => clearTimeout(timer); // cleanup
        }
    }, [joinUrl]);

    return (
        <>  <Header title="Interview" >
            <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9 w-60"
                        placeholder="Search meetings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Meetings</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="active">In Progress</SelectItem>
                        <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                </Select>


            </div>
            <Button onClick={() => { setCreateSheetOpen(true) }}> Create New</Button>
            <Button variant="outline" onClick={fetchMeetings} size="icon">
                <RefreshCw className="h-4 w-4" />
            </Button></Header>
            <div className="w-full mx-auto p-6 pt-24">





                <ScrollArea className="h-[80vh] md:h-[60vh] lg:h-[70vh] xl:h-[80vh] overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8 flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p>Loading your meetings...</p>
                        </div>
                    ) : Object.keys(getFilteredMeetings()).length === 0 ? (
                        <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
                            <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                            <p className="text-xl font-medium text-muted-foreground mb-2">No meetings found</p>
                            <p className="text-muted-foreground max-w-md mx-auto mb-6">
                                {searchQuery || filterStatus !== "all"
                                    ? "Try changing your search or filter criteria"
                                    : "Create a new meeting to get started"}
                            </p>
                            {!searchQuery && filterStatus === "all" && (
                                <Button onClick={() => setCreateSheetOpen(true)}>
                                    Create Your First Meeting
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.keys(getFilteredMeetings())

                                .map((dateKey) => (
                                    <div key={dateKey} className="space-y-4">
                                        <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                                            <CalendarIcon className="h-5 w-5" />
                                            {formatDateHeader(dateKey)}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-2">
                                            {getFilteredMeetings()[dateKey].map((meeting) => (
                                                <div
                                                    key={meeting.id}
                                                    className={` rounded-lg overflow-hidden shadow-md cursor-pointer transition-all hover:shadow-md  ${getMeetingStatusClass(meeting)}`}
                                                    onClick={() => handleOpenMeetingDetails(meeting)}
                                                >
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="font-semibold text-lg line-clamp-1" title={meeting.subject}>
                                                                {meeting.subject}
                                                            </h3>
                                                            <Badge variant={getMeetingStatus(meeting) === "active" ? "default" : "outline"}>
                                                                {getMeetingStatus(meeting) === "upcoming" ? "Upcoming" :
                                                                    getMeetingStatus(meeting) === "active" ? "In Progress" : "Completed"}
                                                            </Badge>
                                                        </div>
                                                        <div className="space-y-1 text-sm mb-3">

                                                            <div className="flex items-start gap-3">
                                                                <CalendarIcon className="h-5 w-5 mt-0.5" />
                                                                <div>
                                                                    <h3 className="font-medium">Date & Time</h3>
                                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                                        <p className="text-muted-foreground">
                                                                            {format(new Date(meeting.start.dateTime), "EEEE, MMMM d, yyyy")}
                                                                        </p>
                                                                        <p className="text-muted-foreground flex items-center gap-2">

                                                                            {formatDateIST(meeting.start.dateTime)} - {formatDateIST(meeting.end.dateTime)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>



                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            {meeting.onlineMeeting?.joinUrl && (
                                                                <a
                                                                    href={meeting.onlineMeeting.joinUrl}
                                                                    className="text-primary text-sm font-medium flex items-center gap-1"
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Video className="h-4 w-4" />
                                                                    Join Meeting
                                                                </a>
                                                            )}
                                                            <Button variant="ghost" size="sm" className="ml-auto">
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </ScrollArea>


                {/* Meeting Details Sheet */}
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetContent className="sm:max-w-md w-full p-0">
                        <SheetHeader className="">
                            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                                <Video className="h-6 w-6" />
                                Meeting Details
                            </SheetTitle>
                            <SheetDescription>
                                View complete information about this meeting
                            </SheetDescription>
                        </SheetHeader>
                        <ScrollArea className="h-[70vh] md:h-[50vh] lg:h-[60vh] xl:h-[70vh] px-4">


                            {selectedMeeting && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-2xl font-bold leading-tight">{selectedMeeting.subject}</h2>
                                        <Badge
                                            variant={getMeetingStatus(selectedMeeting) === "active" ? "default" : "outline"}
                                            className="ml-2"
                                        >
                                            {getMeetingStatus(selectedMeeting) === "upcoming" ? "Upcoming" :
                                                getMeetingStatus(selectedMeeting) === "active" ? "In Progress" : "Completed"}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 border rounded-lg p-4 bg-muted/40">
                                        <div className="flex items-start gap-3">
                                            <CalendarIcon className="h-5 w-5 mt-0.5" />
                                            <div>
                                                <h3 className="font-medium">Date & Time</h3>
                                                <p className="text-muted-foreground">
                                                    {format(new Date(selectedMeeting.start.dateTime), "EEEE, MMMM d, yyyy")}
                                                </p>
                                                <p className="text-muted-foreground flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    {formatDateIST(selectedMeeting.start.dateTime)} - {formatDateIST(selectedMeeting.end.dateTime)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-medium text-lg flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Participants
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3 p-3 border rounded-lg bg-secondary/30">
                                                <UserCircle className="h-5 w-5 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium">Organizer</p>
                                                    <p>{selectedMeeting.organizer?.emailAddress.address}</p>
                                                </div>
                                            </div>

                                            {selectedMeeting.attendees && selectedMeeting.attendees.length > 0 && (
                                                <Collapsible className="border rounded-lg">
                                                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4" />
                                                            <span className="font-medium">Attendees ({selectedMeeting.attendees.length})</span>
                                                        </div>
                                                        <ChevronDown className="h-4 w-4" />
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <div className="divide-y">
                                                            {selectedMeeting.attendees.map((attendee, index) => (
                                                                <div key={index} className="p-3 flex items-center">
                                                                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                                                    <span>{attendee.emailAddress.address}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border rounded-lg p-3">
                                        <h3 className="font-medium flex items-center gap-2">
                                            <Clock className="h-5 w-5" /> Created
                                        </h3>
                                        <p className="text-muted-foreground mt-1">
                                            {formatDateLocal(selectedMeeting.createdDateTime)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </ScrollArea>

                        {/* Sheet Footer */}
                        {selectedMeeting && (
                            <div className="border-t p-4 flex justify-end gap-3 bg-background sticky bottom-0">

                                {selectedMeeting.onlineMeeting?.joinUrl && (
                                    <Button
                                        onClick={() => window.open(selectedMeeting.onlineMeeting?.joinUrl, "_blank")}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        <Video className="h-4 w-4 mr-2" />
                                        Join Meeting
                                    </Button>
                                )}
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
                <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
  <SheetContent side="right" className="w-full max-w-3xl overflow-y-auto">
    <SheetHeader className="mb-4">
      <SheetTitle className="text-xl">Create Teams Meeting</SheetTitle>
      <SheetDescription>
        Schedule a new meeting and share the link with your team
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
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <CalendarClock className="h-5 w-5" /> Start Date & Time
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.start ? format(form.start, 'PPP') : <span>Select a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto !p-0 ">
                  <DatePicker
                    selected={form.start}
                    onChange={(date) => handleDateChange('start', date)}
                    inline
                    calendarClassName="rounded-md"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Start Time - Using Select instead of Command */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative w-full">
                  <Select
                    value={getCurrentTimeString(form.start)}
                    onValueChange={(value) => handleTimeChange('start', value)}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center">
                        <Clock3 className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Select time" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectGroup>
                        {timeOptions.map((option) => (
                          <SelectItem key={`start-${option.value}`} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
          
            </div>
          </div>
        </div>

        {/* End Date & Time */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <CalendarOff className="h-5 w-5" /> End Date & Time
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* End Date */}
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.end ? format(form.end, 'PPP') : <span>Select a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <DatePicker
                    selected={form.end}
                    onChange={(date) => handleDateChange('end', date)}
                    inline
                    calendarClassName="rounded-md"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Time - Using Select instead of Command */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative w-full">
                  <Select
                    value={getCurrentTimeString(form.end)}
                    onValueChange={(value) => handleTimeChange('end', value)}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center">
                        <Clock3 className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Select time" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectGroup>
                        {timeOptions.map((option) => (
                          <SelectItem key={`end-${option.value}`} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
        
            </div>
          </div>
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
            {attendees.map((email) => (
              <Badge
                key={email}
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
            <Info className="h-3 w-3" /> Example: john@fwc.com, jane@fwc.com
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
            
            // Handle validation failures
            if (!isSubjectValid || !areAttendeesValid) {
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
            }
            
            // If validation passes, proceed with creating the meeting
            createMeeting();
          }}
          className="w-full py-6 text-lg font-semibold"
          disabled={loading || attendees.length === 0 || form.subject.replace(/^Interview\s*-\s*/i, "").trim() === ""}
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
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4" /> Join Meeting Link
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            The meeting has been added to your calendar and invitations have been sent
          </p>
        </div>
      )}
    </SheetFooter>
  </SheetContent>
</Sheet>

            </div></>
    );
}