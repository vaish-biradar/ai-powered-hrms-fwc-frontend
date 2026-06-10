'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, BookOpen, BriefcaseBusiness, Clock, icons, MapPin, type LucideIcon } from "lucide-react";

import Header from './_components/app-header';
import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import ApplicationChart from './_components/trends-chart';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getSimilarityInfo, getStatusColor } from './_components/helper-items';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jobDescriptionsAtom, selectedJdAtom, selectedJobDescriptionAtom } from '@/store/candidatesearch-atom';
import { useAtom, useAtomValue } from 'jotai';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { departments as panelDepartments } from '@/constants/panels/department';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow
} from "@/components/ui/table";

function HRDashboardLoading() {
  return (
    <>
      <div className="p-4 w-full mx-auto pt-20">
        {/* Department Selector Loading */}
        <div className="mb-6">
          <Skeleton className="h-10 w-64" />
        </div>
        
        {/* Stats Grid Loading */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and Search Loading */}
        <div className="grid gap-6 md:grid-cols-2 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Application Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidate Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-1/4 mb-2" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-6 w-16" />
                    ))}
                  </div>
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications Loading */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {['Candidate', 'Position', 'Date', 'Match Score', 'Status'].map((header, index) => (
                        <th key={index} className="py-3 text-left font-medium text-sm">
                          <Skeleton className="h-4 w-3/4" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((row) => (
                      <tr key={row} className="border-b">
                        {[1, 2, 3, 4, 5].map((cell) => (
                          <td key={cell} className="py-3">
                            <Skeleton className="h-4 w-3/4" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

interface HRStat {
  title: string;
  value: string;
  change: string;
  icon: string;
  department?: string;
}

interface ApplicationData {
  name: string; // Month name (e.g., "Jan", "Feb", "Mar")
  applied: number;
  screening: number;
  interview: number;
  hired: number;
  rejected: number;
  departments?: string[];
  [key: string]: number | string | string[] | undefined; // For department-specific data like "Engineering_applied"
}

interface RecentApplicationData {
  id: string;
  candidateName: string;
  candidateEmail: string;
  appliedDate: string;
  similarity: string;
  position: string;
  status: string;
  department: string;
}

interface Department {
  id: string;
  name: string;
}

const FIXED_DEPARTMENT_NAMES = panelDepartments.map((dept) => dept.name);

const normalizeDepartment = (value?: string) => {
  if (!value) return "";

  const normalized = value.trim().toLowerCase();

  if (["technology", "it service", "it services", "technology services", "epm practices", "cpm practices"].includes(normalized)) {
    return "Technology";
  }
  if (["sales"].includes(normalized)) {
    return "Sales";
  }
  if (["hr", "human resources"].includes(normalized)) {
    return "HR";
  }
  if (["finance", "fin"].includes(normalized)) {
    return "Finance";
  }

  return value;
};

export default function HRDashboardPage() {
  const [allStats, setAllStats] = useState<HRStat[]>([]);
  const [allApplicationData, setAllApplicationData] = useState<ApplicationData[]>([]);
  const [allRecentApplicationData, setAllRecentApplicationData] = useState<RecentApplicationData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([
    { id: "all", name: "All Departments" },
    ...FIXED_DEPARTMENT_NAMES.map((name) => ({ id: name, name })),
  ]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allJobDescriptions, setAllJobDescriptions] = useAtom(jobDescriptionsAtom);
  const [selectedJd, setSelectedJd] = useAtom(selectedJdAtom);
  const selectedJob = useAtomValue(selectedJobDescriptionAtom);

  const { status } = useSession();
  const router = useRouter();

  // Filter data based on selected department
  const filteredStats = useMemo(() => {
    // Find the Total Resumes stat
    const totalResumesStats = allStats.find(stat => stat.title === "Total Resumes");
    
    if (selectedDepartment === "all") {
      // For "All Departments" view, show all department-agnostic stats
      return allStats.filter(stat => !stat.department);
    }
    
    // For specific department views:
    // 1. Include department-specific stats
    // 2. Always include the Total Resumes stat if it exists
    const departmentStats = allStats.filter(stat => stat.department === selectedDepartment);
    
    if (totalResumesStats && !departmentStats.some(stat => stat.title === "Total Resumes")) {
      return [totalResumesStats, ...departmentStats];
    }
    
    return departmentStats;
  }, [allStats, selectedDepartment]);

  const filteredJobDescriptions = useMemo(() => {
    if (selectedDepartment === "all") {
      return allJobDescriptions;
    }
    return allJobDescriptions.filter(jd => jd.department === selectedDepartment);
  }, [allJobDescriptions, selectedDepartment]);

  const filteredRecentApplications = useMemo(() => {
    if (selectedDepartment === "all") {
      return allRecentApplicationData;
    }
    return allRecentApplicationData.filter(app => app.department === selectedDepartment);
  }, [allRecentApplicationData, selectedDepartment]);

  // Transform application data for the selected department
  const transformedApplicationData = useMemo(() => {
    if (selectedDepartment === "all") {
      return allApplicationData;
    }
    
    return allApplicationData.map(monthData => {
      const result = {
        name: monthData.name,
        applied: Number(monthData[`${selectedDepartment}_applied`] || 0),
        screening: Number(monthData[`${selectedDepartment}_screening`] || 0),
        interview: Number(monthData[`${selectedDepartment}_interview`] || 0),
        hired: Number(monthData[`${selectedDepartment}_hired`] || 0),
        rejected: Number(monthData[`${selectedDepartment}_rejected`] || 0),
      };
      return result;
    });
  }, [allApplicationData, selectedDepartment]);

  // Handle department selection
  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartment(departmentId);
  
    // Reset selected job if changing departments
    if (selectedJd) {
      const currentJd = allJobDescriptions.find(jd => jd.id === selectedJd);
      if (currentJd && departmentId !== "all" && currentJd.department !== departmentId) {
        setSelectedJd("");
      }
    }
  
    // Set the first available job description for the selected department
    if (departmentId !== "all") {
      const firstJdInDepartment = allJobDescriptions.find(jd => jd.department === departmentId);
      if (firstJdInDepartment) {
        setSelectedJd(firstJdInDepartment.id);
      }
    }
  };
  

  // Handle job description selection
  const handleSelectJd = (jdId: string) => {
    setSelectedJd(jdId);
  };

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch job descriptions
        const jdsResponse = await fetch("/api/jds");
        if (!jdsResponse.ok) throw new Error("Failed to fetch job descriptions");
        const jdsData = await jdsResponse.json();
        const normalizedJds = (Array.isArray(jdsData) ? jdsData : []).map((jd) => ({
          ...jd,
          department: normalizeDepartment(jd.department),
        }));
        setAllJobDescriptions(normalizedJds);
        setDepartments([
          { id: "all", name: "All Departments" },
          ...FIXED_DEPARTMENT_NAMES.map((name) => ({ id: name, name })),
        ]);
        
        // Fetch dashboard stats
        const statsResponse = await fetch("/api/dashboard-stats");
        const contentType = statsResponse.headers.get("content-type") || "";

        if (!statsResponse.ok) {
          const errorText = await statsResponse.text();
          let errorMessage = errorText;
          try {
            const parsed = JSON.parse(errorText);
            errorMessage = parsed.message || parsed.error || errorText;
          } catch {
            // keep raw text if JSON parsing fails
          }
          throw new Error(`Failed to fetch dashboard stats: ${statsResponse.status} ${errorMessage}`);
        }

        if (!contentType.includes("application/json")) {
          const bodyText = await statsResponse.text();
          throw new Error(`Dashboard stats response was not JSON: ${contentType}. Response: ${bodyText}`);
        }

        const statsData = await statsResponse.json();

        const normalizedStats = (statsData.hrStats || []).map((stat: HRStat) => ({
          ...stat,
          department: stat.department ? normalizeDepartment(stat.department) : stat.department,
        }));

        const statusKeys = ["applied", "screening", "interview", "hired", "rejected"];
        const normalizedApplicationData = (statsData.applicationData || []).map((row: ApplicationData) => {
          const normalizedRow: ApplicationData = { ...row };

          FIXED_DEPARTMENT_NAMES.forEach((dept) => {
            statusKeys.forEach((status) => {
              normalizedRow[`${dept}_${status}`] = 0;
            });
          });

          Object.entries(row).forEach(([key, value]) => {
            const match = key.match(/^(.*)_(applied|screening|interview|hired|rejected)$/);
            if (!match) return;

            const sourceDepartment = match[1];
            const status = match[2];
            const normalizedDepartment = normalizeDepartment(sourceDepartment);

            if (!FIXED_DEPARTMENT_NAMES.includes(normalizedDepartment)) return;

            const targetKey = `${normalizedDepartment}_${status}`;
            normalizedRow[targetKey] = Number(normalizedRow[targetKey] || 0) + Number(value || 0);
          });

          normalizedRow.departments = FIXED_DEPARTMENT_NAMES;
          return normalizedRow;
        });

        const normalizedRecentApplications = (statsData.recentApplications || []).map((application: RecentApplicationData) => ({
          ...application,
          department: normalizeDepartment(application.department),
        }));

        setAllStats(normalizedStats);
        setAllApplicationData(normalizedApplicationData);
        setAllRecentApplicationData(normalizedRecentApplications);
        
        // Set default selected job if available
        if (normalizedJds.length > 0) {
          setSelectedJd(normalizedJds[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setAllJobDescriptions, setSelectedJd]);

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-500";
      case "Closed": return "bg-red-500";
      case "Draft": return "bg-gray-500";
      default: return "bg-blue-500";
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      <Header title="HR Dashboard">
        <div className="flex items-center justify-between w-full px-4 py-2">
          {/* Header content */}
        </div>
      </Header>
      {loading ? <HRDashboardLoading /> :
        <div className='p-4 w-full mx-auto pt-20'>
          {/* Department Selector */}
          <div className="mb-6">
            <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filteredStats.map((stat) => {
              const IconComponent = (icons as Record<string, LucideIcon>)[stat.icon];

              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground" />}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.change} from last month
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-8">
            {/* Application Chart */}
            <ApplicationChart applicationData={transformedApplicationData} />

            {/* Candidate Search Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Candidate Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Position {selectedDepartment !== "all" && `(${selectedDepartment})`}
                    </label>
                    <Select onValueChange={handleSelectJd} value={selectedJd || undefined}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a job position" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredJobDescriptions.map((jd) => (
                          <SelectItem key={jd.id} value={jd.id}>
                            {jd.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedJd && selectedJob && (
                    <div className="mt-6 space-y-6">
                      <div className="w-full">
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-sm text-gray-500">
                            Posted: {selectedJob?.created_at ? new Date(selectedJob?.created_at).toLocaleDateString() : "N/A"}
                          </span>
                          <Badge className={`${getBadgeColor(selectedJob?.status || "Active")} text-white`}>
                            {selectedJob?.status || "Active"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        {[
                          { icon: <BriefcaseBusiness className="h-4 w-4 text-gray-500" />, label: selectedJob?.department || "N/A" },
                          { icon: <MapPin className="h-4 w-4 text-gray-500" />, label: selectedJob?.location || "N/A" },
                          { icon: <Clock className="h-4 w-4 text-gray-500" />, label: selectedJob?.employment_type || "N/A" },
                          { icon: <Award className="h-4 w-4 text-gray-500" />, label: selectedJob?.experience_level || "N/A" },
                          { icon: <BookOpen className="h-4 w-4 text-gray-500" />, label: `${selectedJob?.total_openings || 0} Openings` },
                        ].map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            {item.icon}
                            <span className="text-sm">{item.label}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {(selectedJob?.skills || "").split(',').map((skill, index) => (
                            <Badge key={index} variant="secondary" className="">
                              {skill.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                    onClick={() => router.push(`/dashboard/candidate-search${selectedDepartment !== "all" ? `?department=${selectedDepartment}` : ""}`)}
                  >
                    Find Matching Candidates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Applications Table */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>
                  Recent Applications
                  {selectedDepartment !== "all" && ` - ${selectedDepartment}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell className="w-1/5 text-left font-medium text-sm">Candidate</TableCell>
                        <TableCell className="w-1/5 text-left font-medium text-sm">Position</TableCell>
                        <TableCell className="w-1/5 text-left font-medium text-sm">Date</TableCell>
                        <TableCell className="w-1/5 text-left font-medium text-sm">Match Score</TableCell>
                        <TableCell className="w-1/5 text-left font-medium text-sm">Status</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecentApplications.length > 0 ? filteredRecentApplications.map((application, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div>
                              <span className="font-medium">{application.candidateName}</span>
                              <br />
                              <span className="text-sm text-gray-500">{application.candidateEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell>{application.position}</TableCell>
                          <TableCell>
                            {application.appliedDate
                              ? format(new Date(application.appliedDate), "dd MMM yyyy")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "font-medium",
                                getSimilarityInfo(Number(application.similarity) * 100).color
                              )}
                            >
                              {`${(Number(application.similarity) * 100).toFixed(2)} %`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "cursor-pointer px-3 py-1 rounded-md",
                                getStatusColor(application.status)
                              )}
                            >
                              {application.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                            No applications found for {selectedDepartment === "all" ? "any department" : `the ${selectedDepartment} department`}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>}
    </>
  );
}