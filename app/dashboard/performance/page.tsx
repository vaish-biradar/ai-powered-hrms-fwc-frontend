"use client";

import { useEffect, useState } from "react";
import Header from "../_components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useUserStore } from "@/hooks/use-user";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_code: string;
  email?: string;
}

interface Review {
  id: string;
  employee_id: string;
  review_cycle: string;
  reviewer_name: string;
  goals?: string[];
  rating?: number;
  feedback?: string;
  review_date: string;
}

const normalizeEmail = (value?: string | null) => (value || '').trim().toLowerCase();

export default function PerformancePage() {
  const { user } = useUserStore();
  const role = user?.role || 'Employee';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [reviewCycle, setReviewCycle] = useState("Q1 2026");
  const [reviewerName, setReviewerName] = useState("HR Manager");
  const [goals, setGoals] = useState("");
  const [rating, setRating] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().slice(0, 10));

  const loadEmployees = async () => {
    const res = await fetch("/api/proxy/hrms/employees");
    const data = await res.json();
    const allEmployees = Array.isArray(data) ? data : [];

    if (role === 'Employee') {
      if (!user?.email) {
        setEmployees([]);
        setEmployeeId("");
        return;
      }

      const self = allEmployees.find((emp: Employee) => normalizeEmail(emp.email) === normalizeEmail(user.email));
      if (self) {
        setEmployees([self]);
        setEmployeeId(self.id);
      } else {
        setEmployees([]);
        setEmployeeId("");
        toast.error("No employee profile linked to this login email");
      }
      return;
    }

    setEmployees(allEmployees);
    if (allEmployees.length > 0 && !employeeId) setEmployeeId(allEmployees[0].id);
  };

  const loadReviews = async () => {
    const query = role === 'Employee' && employeeId ? `?employee_id=${employeeId}` : '';
    const res = await fetch(`/api/proxy/hrms/performance${query}`);
    const data = await res.json();
    setReviews(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadEmployees();
  }, [role, user?.email]);

  useEffect(() => {
    if (role === 'Employee' && !employeeId) return;
    loadReviews();
  }, [employeeId, role]);

  const createReview = async () => {
    try {
      const payload = {
        employee_id: employeeId,
        review_cycle: reviewCycle,
        reviewer_name: reviewerName,
        goals: goals.split("\n").map((goal) => goal.trim()).filter(Boolean),
        rating: rating ? Number(rating) : null,
        feedback,
        review_date: reviewDate,
      };

      const res = await fetch("/api/proxy/hrms/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error || "Failed to create review");

      toast.success("Performance review created");
      setGoals("");
      setRating("");
      setFeedback("");
      loadReviews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create review");
    }
  };

  return (
    <>
      <Header title="Performance" />
      <div className="p-4 w-full mx-auto pt-20 space-y-4">
        {role === 'HR' && (
        <Card>
          <CardHeader><CardTitle>Create Performance Review</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Employee</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.employee_code} - {e.first_name} {e.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Review Cycle</Label><Input value={reviewCycle} onChange={(e) => setReviewCycle(e.target.value)} /></div>
            <div><Label>Reviewer Name</Label><Input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} /></div>
            <div><Label>Rating (1-5)</Label><Input type="number" min="1" max="5" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} /></div>
            <div><Label>Review Date</Label><Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} /></div>
            <div className="md:col-span-2">
              <Label>Goals (one per line)</Label>
              <Textarea value={goals} onChange={(e) => setGoals(e.target.value)} className="h-24" />
            </div>
            <div className="md:col-span-2">
              <Label>Feedback</Label>
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} className="h-24" />
            </div>
            <div className="md:col-span-2 flex justify-end"><Button onClick={createReview}>Save Review</Button></div>
          </CardContent>
        </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Performance Reviews</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Cycle</TableCell>
                  <TableCell>Reviewer</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Feedback</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow><TableCell colSpan={6}>No reviews yet</TableCell></TableRow>
                ) : reviews.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.employee_id}</TableCell>
                    <TableCell>{row.review_cycle}</TableCell>
                    <TableCell>{row.reviewer_name}</TableCell>
                    <TableCell>{row.rating ?? "-"}</TableCell>
                    <TableCell>{String(row.review_date).slice(0, 10)}</TableCell>
                    <TableCell className="max-w-[420px] truncate">{row.feedback || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
