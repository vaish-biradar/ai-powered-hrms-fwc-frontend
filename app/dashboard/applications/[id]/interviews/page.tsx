'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Video, ArrowLeft, Edit, FileText } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Interview {
  id: string;
  application_id: string;
  round_name: string;
  panel_name?: string;
  status: string;
  notes?: string;
  scheduled_date: string;
  meeting_location?: string;
  meeting_link?: string;
  scheduled_by_name?: string;
  created_at: string;
}

type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export default function InterviewDetail() {
  const params = useParams();
  const interviewId = params.id as string;
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<InterviewStatus>('scheduled');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchInterviewDetails() {
      try {
        setLoading(true);
        const response = await fetch(`/api/applications/${interviewId}/interviews`);
        if (!response.ok) {
          throw new Error('Failed to fetch interview details');
        }
        const data = await response.json();
        
        // Handle the case where the API returns an array instead of a single object
        const interviewData: Interview = Array.isArray(data) ? data[0] : data;
        
        console.log("Interview data:", interviewData);
        
        if (!interviewData) {
          throw new Error('No interview data found');
        }

        setInterview(interviewData);
        setNotes(interviewData.notes || '');
        setStatus((interviewData.status as InterviewStatus) || 'scheduled');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        toast.error('Failed to load interview details');
      } finally {
        setLoading(false);
      }
    }

    if (interviewId) {
      fetchInterviewDetails();
    }
  }, [interviewId]);

  const handleSaveNotes = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notes');
      }

      setInterview(prev => prev ? { ...prev, notes } : null);
      setNotesDialogOpen(false);
      toast.success('Notes updated successfully');
    } catch {
      toast.error('Failed to update notes');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/interviews/${interviewId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setInterview(prev => prev ? { ...prev, status } : null);
      setStatusDialogOpen(false);
      toast.success('Status updated successfully');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      case 'rescheduled':
        return <Badge className="bg-yellow-500">Rescheduled</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container p-6 mx-auto">
        <div className="mb-6">
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-full max-w-md" />
            <Skeleton className="h-4 w-full max-w-sm mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-full max-w-md" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-6 mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Failed to load interview details. Please try again later.</p>
            <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!interview) {
    return null;
  }

  // Parse date safely
  const scheduledDateRaw = interview.scheduled_date;
  const scheduledDate = scheduledDateRaw ? parseISO(scheduledDateRaw) : null;
  
  // Format date and time if valid
  const formattedDate = scheduledDate && isValid(scheduledDate) 
    ? format(scheduledDate, 'MMMM d, yyyy') 
    : 'Date not available';
  
  const formattedTime = scheduledDate && isValid(scheduledDate) 
    ? format(scheduledDate, 'h:mm a') 
    : 'Time not available';

  return (
    <div className="container p-6 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/applications">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Interview Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStatusDialogOpen(true)}>
            Update Status
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{interview.round_name}</CardTitle>
                  <CardDescription>
                    {interview.panel_name ? `Panel: ${interview.panel_name}` : 'No panel assigned'}
                  </CardDescription>
                </div>
                <div>{getStatusBadge(interview.status)}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span>{formattedTime}</span>
                </div>
                {interview.meeting_location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span>{interview.meeting_location}</span>
                  </div>
                )}
                {interview.meeting_link && (
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-gray-500" />
                    <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Join Meeting
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div className="flex items-center justify-between w-full">
                    <span>Interview Notes</span>
                    <Button variant="ghost" size="sm" onClick={() => setNotesDialogOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Notes
                    </Button>
                  </div>
                </div>
                {interview.notes ? (
                  <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                    {interview.notes}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-md text-gray-500 italic">
                    No notes have been added yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interview Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Application ID</p>
                  <p>{interview.application_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Scheduled By</p>
                  <p>{interview.scheduled_by_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created At</p>
                  <p>{format(new Date(interview.created_at), 'MMMM d, yyyy')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Interview Notes</DialogTitle>
            <DialogDescription>
              Record feedback, observations, or important points from the interview.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-32"
            placeholder="Enter interview notes..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={saving}>
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Interview Status</DialogTitle>
            <DialogDescription>
              Change the current status of this interview.
            </DialogDescription>
          </DialogHeader>
          <Select value={status} onValueChange={(value: InterviewStatus) => setStatus(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="rescheduled">Rescheduled</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={saving}>
              {saving ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}