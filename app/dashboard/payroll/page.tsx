"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "../_components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUserStore } from "@/hooks/use-user";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_code: string;
  email?: string;
}

interface PayrollRecord {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  gross_salary: number;
  deductions: number;
  bonuses: number;
  net_salary: number;
  status: string;
  paid_on?: string;
}

const normalizeEmail = (value?: string | null) => (value || '').trim().toLowerCase();

export default function PayrollPage() {
  const { user } = useUserStore();
  const role = user?.role || 'Employee';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [payStart, setPayStart] = useState("");
  const [payEnd, setPayEnd] = useState("");
  const [grossSalary, setGrossSalary] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [bonuses, setBonuses] = useState("0");

  const loadEmployees = useCallback(async () => {
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
  }, [employeeId, role, user?.email]);

  const loadPayroll = useCallback(async () => {
    const query = role === 'Employee' && employeeId ? `?employee_id=${employeeId}` : '';
    const res = await fetch(`/api/proxy/hrms/payroll${query}`);
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  }, [employeeId, role]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (role === 'Employee' && !employeeId) return;
    loadPayroll();
  }, [loadPayroll, employeeId, role]);

  const createPayroll = async () => {
    try {
      const payload = {
        employee_id: employeeId,
        pay_period_start: payStart,
        pay_period_end: payEnd,
        gross_salary: Number(grossSalary || 0),
        deductions: Number(deductions || 0),
        bonuses: Number(bonuses || 0),
      };

      const res = await fetch("/api/proxy/hrms/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error || "Failed to create payroll");

      toast.success("Payroll created");
      loadPayroll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create payroll");
    }
  };

  const markPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/proxy/hrms/payroll/${id}/mark-paid`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error || "Failed to update payroll status");
      toast.success("Payroll marked as paid");
      loadPayroll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update payroll status");
    }
  };

  return (
    <>
      <Header title="Payroll" />
      <div className="p-4 w-full mx-auto pt-20 space-y-4">
        {role === 'HR' && (
          <Card>
            <CardHeader><CardTitle>Create Payroll Record</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <div><Label>Pay Period Start</Label><Input type="date" value={payStart} onChange={(e) => setPayStart(e.target.value)} /></div>
              <div><Label>Pay Period End</Label><Input type="date" value={payEnd} onChange={(e) => setPayEnd(e.target.value)} /></div>
              <div><Label>Gross Salary</Label><Input type="number" value={grossSalary} onChange={(e) => setGrossSalary(e.target.value)} /></div>
              <div><Label>Deductions</Label><Input type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} /></div>
              <div><Label>Bonuses</Label><Input type="number" value={bonuses} onChange={(e) => setBonuses(e.target.value)} /></div>
              <div className="md:col-span-3 flex justify-end"><Button onClick={createPayroll}>Create Payroll</Button></div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Payroll Records</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Gross</TableCell>
                  <TableCell>Deductions</TableCell>
                  <TableCell>Bonuses</TableCell>
                  <TableCell>Net</TableCell>
                  <TableCell>Status</TableCell>
                    {role === 'HR' && <TableCell>Action</TableCell>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow><TableCell colSpan={role === 'HR' ? 8 : 7}>No payroll records found</TableCell></TableRow>
                ) : records.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.employee_id}</TableCell>
                    <TableCell>{String(row.pay_period_start).slice(0, 10)} - {String(row.pay_period_end).slice(0, 10)}</TableCell>
                    <TableCell>{row.gross_salary}</TableCell>
                    <TableCell>{row.deductions}</TableCell>
                    <TableCell>{row.bonuses}</TableCell>
                    <TableCell>{row.net_salary}</TableCell>
                    <TableCell><Badge variant={row.status === "Paid" ? "default" : "secondary"}>{row.status}</Badge></TableCell>
                    {role === 'HR' && <TableCell>
                      {row.status !== "Paid" ? (
                        <Button size="sm" onClick={() => markPaid(row.id)}>Mark Paid</Button>
                      ) : "-"}
                    </TableCell>}
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
