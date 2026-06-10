"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../_components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  employment_type: string;
  date_of_joining: string;
  manager_name?: string;
  base_salary: number;
  status: string;
}

const defaultForm = {
  employee_code: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  employment_type: "Full-time",
  date_of_joining: "",
  manager_name: "",
  base_salary: "0",
  status: "Active",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState("");

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/proxy/hrms/employees${q}`);
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const activeCount = useMemo(() => employees.filter((e) => e.status === "Active").length, [employees]);

  const onCreate = async () => {
    try {
      const requiredFields: Array<[keyof typeof form, string]> = [
        ["employee_code", "Employee Code"],
        ["first_name", "First Name"],
        ["last_name", "Last Name"],
        ["email", "Email"],
        ["department", "Department"],
        ["designation", "Designation"],
        ["employment_type", "Employment Type"],
        ["date_of_joining", "Date of Joining"],
        ["status", "Status"],
      ];

      const missingField = requiredFields.find(([key]) => !String(form[key]).trim());
      if (missingField) {
        toast.error(`${missingField[1]} is required`);
        return;
      }

      const payload = {
        ...form,
        employee_code: form.employee_code.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        department: form.department.trim(),
        designation: form.designation.trim(),
        employment_type: form.employment_type.trim(),
        manager_name: form.manager_name.trim() || null,
        status: form.status.trim(),
        base_salary: Number(form.base_salary || 0),
      };

      const res = await fetch("/api/proxy/hrms/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const detailMessage = Array.isArray(data?.detail)
          ? data.detail.map((item: { loc?: string[]; msg?: string }) => item?.msg || item?.loc?.join(".")) .filter(Boolean).join(", ")
          : data?.detail;
        throw new Error(detailMessage || data?.error || "Failed to create employee");
      }

      toast.success("Employee created successfully");
      setForm(defaultForm);
      setOpen(false);
      loadEmployees();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create employee");
    }
  };

  return (
    <>
      <Header title="Employees" />
      <div className="p-4 w-full mx-auto pt-20 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Employees</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{employees.length}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Employees</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{activeCount}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name/email/code"
              />
              <Button onClick={loadEmployees} variant="outline">Search</Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>Add</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Employee</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label>Employee Code</Label><Input required value={form.employee_code} onChange={(e) => setForm((p) => ({ ...p, employee_code: e.target.value }))} /></div>
                    <div><Label>Email</Label><Input required type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
                    <div><Label>First Name</Label><Input required value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} /></div>
                    <div><Label>Last Name</Label><Input required value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} /></div>
                    <div><Label>Department</Label><Input required value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} /></div>
                    <div><Label>Designation</Label><Input required value={form.designation} onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))} /></div>
                    <div><Label>Employment Type</Label><Input required value={form.employment_type} onChange={(e) => setForm((p) => ({ ...p, employment_type: e.target.value }))} /></div>
                    <div><Label>Date of Joining</Label><Input required type="date" value={form.date_of_joining} onChange={(e) => setForm((p) => ({ ...p, date_of_joining: e.target.value }))} /></div>
                    <div><Label>Base Salary</Label><Input type="number" value={form.base_salary} onChange={(e) => setForm((p) => ({ ...p, base_salary: e.target.value }))} /></div>
                    <div><Label>Status</Label><Input required value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} /></div>
                    <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
                    <div><Label>Manager Name</Label><Input value={form.manager_name} onChange={(e) => setForm((p) => ({ ...p, manager_name: e.target.value }))} /></div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={onCreate}>Create Employee</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
                ) : employees.length === 0 ? (
                  <TableRow><TableCell colSpan={6}>No employees found</TableCell></TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.employee_code}</TableCell>
                      <TableCell>{employee.first_name} {employee.last_name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.designation}</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === "Active" ? "default" : "secondary"}>{employee.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
