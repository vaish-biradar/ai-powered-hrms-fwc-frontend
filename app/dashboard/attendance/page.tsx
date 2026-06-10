"use client";

import { useEffect, useState } from "react";
import Header from "../_components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

interface Attendance {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in?: string;
  check_out?: string;
  status: string;
  work_mode?: string;
}

const normalizeEmail = (value?: string | null) => (value || '').trim().toLowerCase();

export default function AttendancePage() {
  const { user } = useUserStore();
  const role = user?.role || 'Employee';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [status, setStatus] = useState("Present");
  const [workMode, setWorkMode] = useState("Office");

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
    if (allEmployees.length > 0 && !employeeId) {
      setEmployeeId(allEmployees[0].id);
    }
  };

  const loadAttendance = async () => {
    const query = role === 'Employee' && employeeId ? `?employee_id=${employeeId}` : '';
    const res = await fetch(`/api/proxy/hrms/attendance${query}`);
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadEmployees();
  }, [role, user?.email]);

  useEffect(() => {
    if (role === 'Employee' && !employeeId) return;
    loadAttendance();
  }, [employeeId, role]);

  const submitAttendance = async () => {
    try {
      if (!employeeId) {
        toast.error("Select an employee");
        return;
      }
      const payload = {
        employee_id: employeeId,
        attendance_date: attendanceDate,
        check_in: checkIn ? new Date(checkIn).toISOString() : null,
        check_out: checkOut ? new Date(checkOut).toISOString() : null,
        status,
        work_mode: workMode,
      };

      const res = await fetch("/api/proxy/hrms/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error || "Failed to save attendance");

      toast.success("Attendance saved");
      loadAttendance();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save attendance");
    }
  };

  return (
    <>
      <Header title="Attendance" />
      <div className="p-4 w-full mx-auto pt-20 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {role === 'HR' ? (
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
            ) : (
              <div>
                <Label>Employee</Label>
                <Input
                  value={(() => {
                    const self = employees.find((e) => e.id === employeeId);
                    return self ? `${self.employee_code} - ${self.first_name} ${self.last_name}` : 'Not linked';
                  })()}
                  readOnly
                />
              </div>
            )}
            <div>
              <Label>Date</Label>
              <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Leave">Leave</SelectItem>
                  <SelectItem value="Half-day">Half-day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Check In</Label>
              <Input type="datetime-local" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div>
              <Label>Check Out</Label>
              <Input type="datetime-local" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
            <div>
              <Label>Work Mode</Label>
              <Select value={workMode} onValueChange={setWorkMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button onClick={submitAttendance}>Save Attendance</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Mode</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow><TableCell colSpan={6}>No attendance records</TableCell></TableRow>
                ) : records.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.employee_id}</TableCell>
                    <TableCell>{String(row.attendance_date).slice(0, 10)}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.check_in ? new Date(row.check_in).toLocaleString() : "-"}</TableCell>
                    <TableCell>{row.check_out ? new Date(row.check_out).toLocaleString() : "-"}</TableCell>
                    <TableCell>{row.work_mode || "-"}</TableCell>
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
