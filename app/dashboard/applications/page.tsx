
"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, CheckCircle, Filter } from "lucide-react";
import { useDocumentPreview } from "./_hooks/use-preview";
import { ApplicationsTableView } from "./_components/table-view";
import Header from "../_components/app-header";
import { useAtom } from "jotai";
import {
  applicationsAtom, loadingAtom, fetchApplicationsAtom, searchTermAtom,
  statusFilterAtom, jobTitleFilterAtom
} from "@/store/application-atom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";

export default function ApplicationsPage() {
  const [applications] = useAtom(applicationsAtom);
  const [loading] = useAtom(loadingAtom);
  const [, rawFetchApplications] = useAtom(fetchApplicationsAtom);
  const fetchApplications = useCallback(() => rawFetchApplications(), [rawFetchApplications]);
  const { handleView } = useDocumentPreview();
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom);
  const [jobTitleFilter, setJobTitleFilter] = useAtom(jobTitleFilterAtom);
  const uniqueJobTitles = ["all", ...new Set(applications.map(app => app.job_title))];
  const statusOptions = ["all", "screening", "interviewed", "rejected", "hired", "applied"];
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header title="Candidate Applications">
        <div className="flex items-center justify-between">
          {/* Search Input - Full width on larger screens, icon on mobile */}
          <div className="relative flex-grow mr-2">

            {/* Mobile Search Icon */}
            <div className="md:hidden">
              <Input
                placeholder="Search candidates..."
                className="w-full h-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile Filter Dialog Trigger */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Filter className="h-5 w-5" />
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Filter Candidates</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Status Filter */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <CheckCircle className="h-5 w-5" />
                  <label htmlFor="status" className="text-left col-span-1">
                    Status
                  </label>
                  <div className="col-span-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(status => (
                          <SelectItem key={status} value={status}>
                            {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Job Title Filter */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Briefcase className="h-5 w-5" />
                  <label htmlFor="jobTitle" className="text-left col-span-1">
                    Job Title
                  </label>
                  <div className="col-span-2">
                    <Select value={jobTitleFilter} onValueChange={setJobTitleFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Job Title" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueJobTitles.map(title => (
                          <SelectItem key={title} value={title}>
                            {title === "all" ? "All Positions" : title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Header>

      {/* Main Content Wrapper */}
      <div className="flex-grow p-4 w-full mx-auto pt-16">
      
           <ApplicationsTableView onViewDocument={handleView} loading={loading} onRefresh={fetchApplications} />
      
      </div>
    </div>
  );
}