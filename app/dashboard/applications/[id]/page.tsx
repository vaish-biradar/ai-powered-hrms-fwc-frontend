'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Clock, ArrowLeft, User, Briefcase, Info, Calendar, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Header from '../../_components/app-header';
// import InterviewDetail from './interviews/page';

type InterviewHistory = {
    id: string;
    round_name: string;
    panel_name: string;
    scheduled_by_name: string;
    scheduled_by_email: string;
    status: string;
};
type StatusHistory = {
    id: string;
    status: string;
    feedback: string | null;
    changed_by_name: string;
    changed_by_email: string;
    created_at: string;
};

type Application = {
    id: string;
    status: string;
    candidate_name: string;
    candidate_email: string;
    job_title: string;
    current_round_id: string | null;
};



// Map status to progress percentage and color
const statusProgressMap = {
    applied: { progress: 10, variant: 'default' },
    screening_in_progress: { progress: 20, variant: 'default' },
    screening_completed: { progress: 30, variant: 'default' },
    screening_rejected: { progress: 100, variant: 'destructive' },
    interview_scheduled: { progress: 40, variant: 'default' },
    interview_in_progress: { progress: 50, variant: 'default' },
    interview_completed: { progress: 60, variant: 'default' },
    offer_pending: { progress: 70, variant: 'default' },
    offer_sent: { progress: 80, variant: 'default' },
    offer_accepted: { progress: 100, variant: 'success' },
    offer_rejected: { progress: 100, variant: 'destructive' },
    hired: { progress: 100, variant: 'success' },
    rejected: { progress: 100, variant: 'destructive' },
    on_hold: { progress: 50, variant: 'warning' },
    withdrawn: { progress: 100, variant: 'destructive' }
};

// Status badge styling map
const statusBadgeVariant = {
    applied: 'default',
    screening_in_progress: 'secondary',
    screening_completed: 'secondary',
    screening_rejected: 'destructive',
    interview_scheduled: 'default',
    interview_in_progress: 'secondary',
    interview_completed: 'secondary',
    offer_pending: 'secondary',
    offer_sent: 'warning',
    offer_accepted: 'success',
    offer_rejected: 'destructive',
    hired: 'success',
    rejected: 'destructive',
    on_hold: 'outline',
    withdrawn: 'destructive'
};

// Status icon map
const statusIcon = {
    applied: <Info className="h-4 w-4" />,
    screening_in_progress: <Clock className="h-4 w-4" />,
    screening_completed: <CheckCircle className="h-4 w-4" />,
    screening_rejected: <AlertCircle className="h-4 w-4" />,
    interview_scheduled: <Calendar className="h-4 w-4" />,
    interview_in_progress: <Clock className="h-4 w-4" />,
    interview_completed: <CheckCircle className="h-4 w-4" />,
    offer_pending: <Clock className="h-4 w-4" />,
    offer_sent: <Send className="h-4 w-4" />,
    offer_accepted: <CheckCircle className="h-4 w-4" />,
    offer_rejected: <AlertCircle className="h-4 w-4" />,
    hired: <CheckCircle className="h-4 w-4" />,
    rejected: <AlertCircle className="h-4 w-4" />,
    on_hold: <Clock className="h-4 w-4" />,
    withdrawn: <AlertCircle className="h-4 w-4" />
};

function formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const columns: ColumnDef<StatusHistory>[] = [
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string;

            return (
                <div className="flex items-center gap-2">
                    {statusIcon[status as keyof typeof statusIcon]}
                    <Badge variant={
                        (statusBadgeVariant[status as keyof typeof statusBadgeVariant] as
                            | 'default'
                            | 'secondary'
                            | 'destructive'
                            | 'outline'
                        ) || 'default'
                    } className="capitalize">
                        {formatStatus(status)}
                    </Badge>

                </div>
            );
        }
    },
    {
        accessorKey: 'feedback',
        header: 'Feedback',
        cell: ({ row }) => {
            const feedback = row.original.feedback;
            if (!feedback) return <span className="text-muted-foreground">No feedback provided</span>;
            return <div className="max-w-md">{feedback}</div>;
        }
    },
    {
        accessorKey: 'changed_by_name',
        header: 'Changed By',
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 ">
                    <AvatarFallback className="text-xs">
                        {row.original.changed_by_name.toString().substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium">{row.getValue('changed_by_name')}</p>
                    <p className="text-muted-foreground text-xs">{row.original.changed_by_email}</p>
                </div>
            </div>
        )
    },
    {
        accessorKey: 'created_at',
        header: 'Changed At',
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at') as string);
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{format(date, 'PPP')}</span>
                    <span className="text-muted-foreground text-xs">{format(date, 'p')}</span>
                </div>
            );
        }
    }
];

export default function ApplicationStatusPage() {
    const params = useParams();
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const router = useRouter();
    const [application, setApplication] = useState<Application | null>(null);
    const [history, setHistory] = useState<StatusHistory[]>([]);
    // const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('history');
    const [interviewHistory, setInterviewHistory] = useState<InterviewHistory[]>([]);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const [appRes, histRes] = await Promise.all([
                    fetch(`/api/applications/${id}`),
                    fetch(`/api/applications/${id}/status-history`)
                ]);

                const appData = await appRes.json();
                const histData = await histRes.json();

                setApplication(appData);
                // setStatus(appData.status);
                setHistory(histData);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load application data');
            } finally {
                setLoading(false);
            }
        };
        const fetchInterviewHistory = async () => {
            try {
                const res = await fetch(`/api/applications/${id}/interview-history`);
                const data = await res.json();
                if (!data.error) setInterviewHistory(data);
            } catch (err) {
                console.error('Failed to fetch interview rounds', err);
                toast.error('Failed to fetch interview rounds');
            }
        }
        fetchInterviewHistory();

        fetchData();
    }, [id]);



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


    const getProgressInfo = (status: string) => {
        return statusProgressMap[status as keyof typeof statusProgressMap] || { progress: 0, variant: 'default' };
    };



    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 w-full mx-auto py-20">
            <Header title="Application Status" >
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" /> Back to Applications
                </Button>

                {application && (
                    <Badge
                        variant={
                            (statusBadgeVariant[application.status as keyof typeof statusBadgeVariant] as
                                | 'default'
                                | 'secondary'
                                | 'destructive'
                                | 'outline'
                            ) || 'default'
                        }
                        className="text-sm px-3 py-1"
                    >
                        {formatStatus(application.status)}
                    </Badge>
                )}

            </Header>

            {application && (
                <div className="bg-card  p-6">
                    <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-semibold">{application.candidate_name}</h1>
                            <p className="text-muted-foreground flex items-center gap-1 mt-1">
                                <User className="h-4 w-4" /> {application.candidate_email}
                            </p>
                            <p className="text-muted-foreground flex items-center gap-1 mt-1">
                                <Briefcase className="h-4 w-4" /> {application.job_title}
                            </p>
                        </div>
                        <div className="text-sm text-muted-foreground">Application ID: {id}</div>
                    </div>

                    <div className="mb-8">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Application Progress</span>
                            <span className="text-sm">{getProgressInfo(application.status).progress}%</span>
                        </div>
                        <Progress value={getProgressInfo(application.status).progress} className="h-2" />
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-2 mb-6">
                            <TabsTrigger value="history">Status History</TabsTrigger>
                            <TabsTrigger value="interview" >Interview History</TabsTrigger>
                        </TabsList>



                        <TabsContent value="history">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Status Change History</CardTitle>
                                    <CardDescription>Complete history of all status changes for this application</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {history.length > 0 ? (
                                        <DataTable columns={columns} data={history} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <Info className="h-12 w-12 text-muted-foreground mb-2" />
                                            <h3 className="text-lg font-medium">No status history</h3>
                                            <p className="text-muted-foreground max-w-sm">
                                                There are no status changes recorded for this application yet.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="interview" >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Interview History</CardTitle>
                                    <CardDescription>View the interview history for the selected application</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {interviewHistory.length > 0 ? (
                                        <DataTable columns={InterviewHistoryColumns} data={interviewHistory} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <Info className="h-12 w-12 text-muted-foreground mb-2" />
                                            <h3 className="text-lg font-medium">No Intervies taken yet.</h3>
                                            <p className="text-muted-foreground max-w-sm">
                                                There are no interviews recorded for this application yet.
                                            </p>
                                        </div>
                                    )}

                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}