'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Loader2, Video } from 'lucide-react';

import Header from '../_components/app-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { OutlookMeetingScheduler } from './interview-sheet';
import { Separator } from '@/components/ui/separator';

export type Application = {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  status: string;
};

export interface MeetingDetails {
  meetingLink: string;
  start: Date;
  location?: string;
}

export type Member = {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
};

export type Panel = {
  id: string;
  name: string;
  department: string;
  positions: string;
  active: boolean;
  members: Member[];
};

export type InterviewRound = {
  id: string;
  round_name: string;
  round_order: number;
  department: string;
};

type ScheduleData = {
  applicationId: string | null;
  application: Application | null;
  panelId: string | null;
  panel: Panel | null;
  interviewDate: Date | undefined;
  interviewTime: string;
  meetingLink: string;
  meetingLocation: string;
  roundId: string;
  step: string;
  panelMembers: Member[];
};

export type InterviewHistory = {
  id: string;
  round_name: string;
  panel_name: string;
  scheduled_by_name: string;
  scheduled_by_email: string;
  status: string;
};

type AllInterview = {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  round_name: string;
  panel_name: string;
  scheduled_date: string;
  meeting_link: string | null;
  meeting_location: string | null;
  scheduled_by_name: string;
  application_status: string;
};

const InterviewProcess = () => {
  const [activeStep, setActiveStep] = useState('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  const [application, setApplication] = useState<Application | null>(null);


  const [interviewDate, setInterviewDate] = useState<Date | undefined>(undefined);
  const [interviewTime, setInterviewTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [interviewRounds, setInterviewRounds] = useState<InterviewRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [panelMembers, setPanelMembers] = useState<Member[]>([]);
  const [interviewHistory, setInterviewHistory] = useState<InterviewHistory[]>([]);
  const [allInterviews, setAllInterviews] = useState<AllInterview[]>([]);
  const [allInterviewsLoading, setAllInterviewsLoading] = useState(false);

  const fetchAllInterviews = useCallback(async () => {
    try {
      setAllInterviewsLoading(true);
      const res = await fetch('/api/interviews');
      if (!res.ok) return;
      const data = await res.json();
      setAllInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch all interviews', err);
    } finally {
      setAllInterviewsLoading(false);
    }
  }, []);


  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch('/api/applications/all');
      const data = await res.json();
      if (!data.error) setApplications(data);
    } catch (err) {
      console.error('Failed to fetch applications', err);
      toast.error('Failed to fetch applications');
    }
  }, []);

  // Fetch interview rounds
  const fetchInterviewRounds = useCallback(async () => {
    try {
      const res = await fetch('/api/applications/interview-rounds');
      const data = await res.json();
      if (!data.error) setInterviewRounds(data);
    } catch (err) {
      console.error('Failed to fetch interview rounds', err);
      toast.error('Failed to fetch interview rounds');
    }
  }, []);

  // Fetch initial data using both API calls
  const fetchInitialData = useCallback(async () => {
    await Promise.all([
      fetchApplications(),
      fetchInterviewRounds(),
      fetchAllInterviews(),
    ]);
  }, [fetchApplications, fetchInterviewRounds, fetchAllInterviews]);
  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('interviewScheduleData');
    if (savedData) {
      try {
        const parsedData: ScheduleData = JSON.parse(savedData);

        // Restore saved state
        setSelectedApplicationId(parsedData.applicationId);
        setApplication(parsedData.application);
        setSelectedPanel(parsedData.panel);

        // Handle date conversion back from string
        if (parsedData.interviewDate) {
          setInterviewDate(new Date(parsedData.interviewDate));
        }

        setInterviewTime(parsedData.interviewTime);
        setMeetingLink(parsedData.meetingLink);
        setMeetingLocation(parsedData.meetingLocation);
        setSelectedRound(parsedData.roundId);
        setPanelMembers(parsedData.panelMembers);
        setActiveStep(parsedData.step);
      } catch (err) {
        console.error('Error parsing saved schedule data', err);
        // If parsing fails, just continue with default state
      }
    }

    fetchInitialData();
  }, [fetchInitialData]);

  // Save current state to localStorage when relevant state changes
  useEffect(() => {
    // Only save if we're in the middle of a scheduling process
    if (activeStep !== 'applications') {
      const dataToSave: ScheduleData = {
        applicationId: selectedApplicationId,
        application,
        panelId: selectedPanel?.id || null,
        panel: selectedPanel,
        interviewDate,
        interviewTime,
        meetingLink,
        meetingLocation,
        roundId: selectedRound,
        step: activeStep,
        panelMembers
      };

      localStorage.setItem('interviewScheduleData', JSON.stringify(dataToSave));
    }
  }, [
    activeStep,
    selectedApplicationId,
    application,
    selectedPanel,
    interviewDate,
    interviewTime,
    meetingLink,
    meetingLocation,
    selectedRound,
    panelMembers
  ]);




  const fetchInterviewHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/applications/${selectedApplicationId}/interview-history`);
      const data = await res.json();
      if (!data.error) setInterviewHistory(data);
    } catch (err) {
      console.error('Failed to fetch interview rounds', err);
      toast.error('Failed to fetch interview rounds');
    }
  }, [selectedApplicationId]);

  useEffect(() => {
    if (selectedApplicationId) {
      fetchInterviewHistory();
    }
  }, [selectedApplicationId, fetchInterviewHistory]);

  const handleSendToPanel = async (appId: string) => {
    try {
      const res = await fetch('/api/panels');
      const data = await res.json();
      setPanels(data);
      console.log(data)
      setSelectedApplicationId(appId);

      // Set the current application for reference
      const currentApp = applications.find(app => app.id === appId);
      if (currentApp) {
        setApplication(currentApp);
        setActiveStep('panels');
      }
    } catch {
      toast.error('Failed to load panels');
    }
  };

  const selectPanel = (panel: Panel) => {
    setSelectedPanel(panel);

    // Fetch panel members
    fetchPanelMembers(panel.id);

    toast.success(`Panel "${panel.name}" selected`);
    setActiveStep('schedule');
  };

  const fetchPanelMembers = (panelId: string) => {
    try {
      const panel = panels.find(p => p.id === panelId);
      if (!panel) throw new Error('Panel not found');

      const members = panel.members;
      setPanelMembers(members);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch panel members');
    }
  };

  const scheduleInterview = async () => {
    if (!selectedPanel || !interviewDate || !selectedRound || !selectedApplicationId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsScheduling(true);






      // Schedule the interview
      const scheduleRes = await fetch(`/api/applications/${selectedApplicationId}/schedule-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panelId: selectedPanel.id,
          roundId: selectedRound,
          scheduledDate: interviewDate,
          meetingLink,
          meetingLocation
        })
      });

      if (!scheduleRes.ok) throw new Error('Failed to save interview schedule');

      // Update application status
      const statusRes = await fetch(`/api/applications/${selectedApplicationId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'interview_scheduled',
          feedback: `Interview scheduled with panel "${selectedPanel.name}" for ${format(interviewDate, 'dd-mm-yyyy')}`,
          panelId: selectedPanel.id,
          roundId: selectedRound
        })
      });

      if (!statusRes.ok) throw new Error('Failed to update application status');

      // Update local application state
      setApplication((prev) => prev ? { ...prev, status: 'interview_scheduled' } : null);

      setApplications(applications.map(app =>
        app.id === selectedApplicationId
          ? { ...app, status: 'interview_scheduled' }
          : app
      ));

      toast.success('Interview saved successfully');

      localStorage.removeItem('interviewScheduleData');

      resetToApplications();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save interview');
    } finally {
      setIsScheduling(false);
    }
  };

  const resetToApplications = () => {
    setSelectedApplicationId(null);
    setSelectedPanel(null);
    setInterviewDate(undefined);
    setInterviewTime('');
    setMeetingLink('');
    setMeetingLocation('');
    setActiveStep('applications');
    setPanelMembers([]);

    // Clear localStorage
    localStorage.removeItem('interviewScheduleData');
  };

  const applicationColumns: ColumnDef<Application>[] = [
    { accessorKey: 'candidate_name', header: 'Name' },
    { accessorKey: 'candidate_email', header: 'Email' },
    { accessorKey: 'job_title', header: 'Applied For' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = (row.getValue('status') as string) ?? '';
        return (
          <Badge variant={status === 'screening_completed' ? 'default' : 'secondary'}>
            {status.replaceAll('_', ' ')}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const app = row.original;
        return (
          <Button variant="outline" size="sm" onClick={() => handleSendToPanel(app.id)}>
            Send to Panel
          </Button>
        );
      },
    },
  ];

  const panelColumns: ColumnDef<Panel>[] = [
    { accessorKey: 'name', header: 'Panel Name' },
    { accessorKey: 'department', header: 'Department' },
    { accessorKey: 'positions', header: 'Positions' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.active  ? 'default' : 'secondary'}>
{row.original.active  ? 'Active' : 'Inactive'}        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => selectPanel(row.original)}>
          Select
        </Button>
      ),
    },
  ];

  const InterviewHistoryColumns: ColumnDef<InterviewHistory>[] = [
    { accessorKey: 'id', header: 'Interview ID' },
    { accessorKey: 'round_name', header: 'Round Name' },
    { accessorKey: 'panel_name', header: 'Panel Name' },
    {
      accessorKey: 'scheduled_by_name', header: 'Scheduled By',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ">
              <AvatarFallback className="text-xs">
                {String(row.original.scheduled_by_name).substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.original.scheduled_by_name}</p>
              <p className="text-muted-foreground text-xs">{row.original.scheduled_by_email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = (row.getValue('status') as string) ?? '';
        return (
          <Badge>
            {status.replaceAll('_', ' ')}
          </Badge>
        );
      },
    },
  ];

  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);



  const handleMeetingCreated = (meetingDetails: MeetingDetails) => {
    console.log('Meeting created:', meetingDetails);

    setMeetingLink(meetingDetails.meetingLink);
    setInterviewDate(meetingDetails.start);

    // If location wasn't set in the form but was passed from the scheduler
    if (meetingDetails.location && !meetingLocation) {
      setMeetingLocation(meetingDetails.location);
    }
  };

  return (
    <div className="p-4 space-y-6 py-20">
      <Header title="Interview Process" />
      {/* ─── All Scheduled Interviews ─────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Scheduled Interviews</CardTitle>
            <CardDescription>Complete history of every interview scheduled across all applications</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAllInterviews} disabled={allInterviewsLoading}>
            {allInterviewsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          {allInterviewsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : allInterviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No interviews scheduled yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-3 font-medium">Candidate</th>
                    <th className="py-2 px-3 font-medium">Position</th>
                    <th className="py-2 px-3 font-medium">Round</th>
                    <th className="py-2 px-3 font-medium">Panel</th>
                    <th className="py-2 px-3 font-medium">Scheduled Date</th>
                    <th className="py-2 px-3 font-medium">Scheduled By</th>
                    <th className="py-2 px-3 font-medium">Meeting</th>
                    <th className="py-2 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allInterviews.map((iv) => (
                    <tr key={iv.id} className="border-b hover:bg-muted/40 transition-colors">
                      <td className="py-2 px-3">
                        <p className="font-medium">{iv.candidate_name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{iv.candidate_email ?? ''}</p>
                      </td>
                      <td className="py-2 px-3">{iv.job_title ?? '—'}</td>
                      <td className="py-2 px-3">{iv.round_name ?? '—'}</td>
                      <td className="py-2 px-3">{iv.panel_name ?? '—'}</td>
                      <td className="py-2 px-3">
                        {iv.scheduled_date ? format(new Date(iv.scheduled_date), 'PPP p') : '—'}
                      </td>
                      <td className="py-2 px-3">{iv.scheduled_by_name ?? '—'}</td>
                      <td className="py-2 px-3">
                        {iv.meeting_link ? (
                          <a href={iv.meeting_link} target="_blank" rel="noreferrer"
                            className="text-primary underline text-xs">
                            Join
                          </a>
                        ) : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="secondary">
                          {(iv.application_status ?? '').replaceAll('_', ' ') || 'scheduled'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Separator />

      {/* Progress indicators */}
      <div className="w-full flex justify-center mb-4">
        <div className="flex items-center max-w-4xl w-full">
          <div className={`flex flex-col items-center flex-1 ${activeStep === 'applications' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center  ${activeStep === 'applications' ? 'bg-primary text-muted' : 'bg-muted text-primary'}`}>
              1
            </div>
            <span className="text-sm mt-1">Applications</span>
          </div>
          <div className={`h-1 flex-1 ${activeStep !== 'applications' ? 'bg-primary text-muted' : 'bg-muted text-primary'}`}></div>
          <div className={`flex flex-col items-center flex-1 ${activeStep === 'panels' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center  ${activeStep === 'panels' ? 'bg-primary text-muted' : 'bg-muted text-primary'}`}>
              2
            </div>
            <span className="text-sm mt-1">Select Panel</span>
          </div>
          <div className={`h-1 flex-1 ${activeStep === 'schedule' ? 'bg-primary text-muted' : 'bg-muted text-primary'}`}></div>
          <div className={`flex flex-col items-center flex-1 ${activeStep === 'schedule' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center  ${activeStep === 'schedule' ? 'bg-primary text-muted' : 'bg-muted text-primary'}`}>
              3
            </div>
            <span className="text-sm mt-1">Schedule</span>
          </div>
        </div>
      </div>
      <Separator />
      {/* Applications View */}
      {activeStep === 'applications' && (
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>Select an application to schedule an interview</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={applicationColumns} data={applications} />
          </CardContent>
        </Card>

      )}

      {/* Panel Selection View */}
      {activeStep === 'panels' && (
        <Tabs defaultValue="panels" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="panels">Available Panels</TabsTrigger>
          <TabsTrigger value="history">Interview History</TabsTrigger>
        </TabsList>
         <TabsContent value="panels" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-2" onClick={resetToApplications}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <CardTitle>Select Interview Panel</CardTitle>
                <CardDescription>
                  Choose a panel for{' '}
                  <strong>{application?.candidate_name}</strong> ({application?.job_title})
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable columns={panelColumns} data={panels} />
            </CardContent>
          </Card>
          </TabsContent>
          <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Interview History</CardTitle>
              <CardDescription>View the interview history for the selected application</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={InterviewHistoryColumns} data={interviewHistory} />
            </CardContent>
          </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Schedule Interview View */}
      {activeStep === 'schedule' && (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setActiveStep('panels')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle>Schedule Interview</CardTitle>
                <CardDescription>
                  Set up interview for <span className="font-medium">{application?.candidate_name}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 text-sm">
            {/* Schedule Form Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="panel-final">Panel</Label>
                <Input
                  id="panel-final"
                  value={selectedPanel?.name || ''}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="round-final">Interview Round</Label>
                <Select value={selectedRound} onValueChange={setSelectedRound}>
                  <SelectTrigger id="round-final">
                    <SelectValue placeholder="Select Interview Round" />
                  </SelectTrigger>
                  <SelectContent>
                    {interviewRounds.map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.round_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-1 md:col-span-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsSchedulerOpen(true)}
                  className="mt-2"
                >
                  Create Meeting
                </Button>
              </div>
            </div>

            {/* Summary Section */}
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Candidate</h4>
                <p>{application?.candidate_name}</p>
                <p className="text-muted-foreground">{application?.candidate_email}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Position</h4>
                <p>{application?.job_title}</p>
              </div>

              {interviewDate && (
                <div className="space-y-2">
                  <h4 className="font-medium">Schedule</h4>
                  <p>{format(interviewDate, 'PPP')}</p>
                  {meetingLink && (
                    <div>
                      <p className="font-medium">Meeting:</p>
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                      >
                        {meetingLink.length > 60 ? `${meetingLink.substring(0, 60)}...` : meetingLink}
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <h4 className="font-medium">Panel Members</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {panelMembers.map(member => (
                    <div key={member.id} className="bg-muted/40 p-2 rounded-md">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Outlook Calendar Modal */}
            <OutlookMeetingScheduler
              isOpen={isSchedulerOpen}
              setIsOpen={setIsSchedulerOpen}
              application={application}
              interviewDetails={{
                date: interviewDate,
                time: interviewTime,
                location: meetingLocation
              }}
              panelMembers={panelMembers}
              onMeetingCreated={handleMeetingCreated}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveStep('panels')}>
              Back
            </Button>
            <Button
              onClick={scheduleInterview}
              disabled={isScheduling || !selectedRound || !interviewDate || !meetingLink}
              className="gap-2"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}


    </div>
  );
};

export default InterviewProcess;