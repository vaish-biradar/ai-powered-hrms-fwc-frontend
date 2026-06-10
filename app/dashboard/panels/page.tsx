"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  MoreHorizontal,
  Plus,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  View,
  Users,
  Building,
  Calendar,
  Check,
  X,
  User,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useAtom } from "jotai"
import { membersAtom } from "@/store/panel-members"

import { departments } from "@/constants/panels/department"
import axios from "axios"
import { PanelMember } from "@/types/dashboard"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable, FilterOption } from "@/components/ui/data-table"

import Header from "../_components/app-header"
import { ScrollArea } from "@/components/ui/scroll-area"
type Member = PanelMember;

type InterviewPanel = {
  id: string;
  name: string;
  department: string;
  members: Member[];
  positions: string[];
  active: boolean;
  createdAt: string;
  interviewsCompleted: number;
};
export default function InterviewPanelsPage() {




  const [isCreatePanelDialogOpen, setIsCreatePanelDialogOpen] = useState(false)
  const [isEditPanelDialogOpen, setIsEditPanelDialogOpen] = useState(false)
  const [isDeletePanelDialogOpen, setIsDeletePanelDialogOpen] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);

  const [selectedPanel, setSelectedPanel] = useState<InterviewPanel | null>(null)
  const [panelName, setPanelName] = useState(selectedPanel?.name || '');
  const [department, setDepartment] = useState(selectedPanel?.department || '');
  const [status, setStatus] = useState(selectedPanel?.active ? 'active' : 'inactive');
  const [positions, setPositions] = useState(selectedPanel?.positions.join(', ') || '');
  const [panels, setPanels] = useState<InterviewPanel[]>([])
  const [members, setMembers] = useAtom(membersAtom)
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<PanelMember[]>([]);

  const fetchMembers = useCallback(async () => {
    try {
      setMembersLoading(true);
      const response = await axios.get("/api/panels/members");

      const formatted = response.data.map((member: PanelMember) => ({
        ...member,
        expertise: typeof member.expertise === "string"
          ? member.expertise.split(",").map((e: string) => e.trim())
          : member.expertise,
      }));

      setAllMembers(formatted);

      // For the Create Panel dialog keep only accepted members
      const accepted = formatted.filter((m: PanelMember) => m.invitation_status === 'accepted');
      setMembers(accepted);
      return formatted;
    } catch (err) {
      console.error("Error fetching members:", err instanceof Error ? err.message : err);
      toast.error("Failed to load panel members");
      return [];
    } finally {
      setMembersLoading(false);
    }
  }, [setMembers]);


  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const fetchPanels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/panels');
      if (!res.ok) {
        throw new Error('Failed to fetch panels');
      }
      const data: InterviewPanel[] = await res.json();
      console.log("panels", data);

      setPanels(data);
    } catch (err) {
      console.error('Error fetching panels:', err);
      toast.error("Failed to load interview panels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPanels();
  }, [fetchPanels]);
  useEffect(() => {
    if (isAddMemberDialogOpen && selectedPanel) {
      setSelectedMembers(selectedPanel.members || []);
    }
  }, [isAddMemberDialogOpen, selectedPanel]);


  const handleRefresh = useCallback(async () => {
    await fetchPanels();
  }, [fetchPanels]);

  useEffect(() => {
    if (selectedPanel) {
      setPanelName(selectedPanel.name);
      setDepartment(selectedPanel.department);
      setStatus(selectedPanel.active ? 'active' : 'inactive');
      setPositions(selectedPanel.positions.join(', '));
    }
  }, [selectedPanel]);
  const [formData, setFormData] = useState<{
    panel_name: string;
    department: string;
    positions: string;
    status: string;
    members: string[];
  }>({
    panel_name: '',
    department: '',
    positions: '',
    status: 'active',
    members: [],
  });



  const handleCreatePanel = async () => {
    try {
      const panelData = {
        panel_name: formData.panel_name,
        department: formData.department,
        positions: formData.positions.split(',').map((pos) => pos.trim()),
        active: formData.status === 'active',
        members: formData.members,
      };

      const res = await fetch('/api/panels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(panelData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create panel');
      }

      await res.json();

      // Refresh panels to include the new one
      fetchPanels();

      setIsCreatePanelDialogOpen(false);
      // Reset form
      setFormData({
        panel_name: '',
        department: '',
        positions: '',
        status: 'active',
        members: [],
      });

      toast.success("Panel created", {
        description: "The interview panel has been created successfully.",
      });
    } catch (err) {
      console.error('Error creating panel:', err);
      toast.error("Failed to create panel", {
        description: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  };

  const handleEditPanel = async () => {
    if (!selectedPanel) return;

    const updatedFields: Partial<InterviewPanel> = {};

    if (panelName !== selectedPanel.name) updatedFields.name = panelName;
    if (department !== selectedPanel.department) updatedFields.department = department;
    if ((status === 'active') !== selectedPanel.active) updatedFields.active = (status === 'active');

    const updatedPositions = positions.split(',').map(p => p.trim());
    if (JSON.stringify(updatedPositions) !== JSON.stringify(selectedPanel.positions)) {
      updatedFields.positions = updatedPositions;
    }

    if (Object.keys(updatedFields).length === 0) {
      toast.info("No changes detected");
      return;
    }

    try {
      const res = await fetch(`/api/panels/${selectedPanel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });

      if (!res.ok) throw new Error('Failed to update panel');

      setIsEditPanelDialogOpen(false);
      toast.success("Panel updated", {
        description: "The interview panel has been updated successfully.",
      });
      fetchPanels();
    } catch (err) {
      console.error('Error updating panel:', err);
      toast.error("Failed to update panel");
    }
  };


  const handleDeletePanel = async () => {
    if (!selectedPanel) return;

    try {
      const res = await fetch(`/api/panels/${selectedPanel.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete panel');

      // For now, update local state directly
      setPanels(panels.filter((panel) => panel.id !== selectedPanel.id));
      setIsDeletePanelDialogOpen(false);
      toast.success("Panel deleted", {
        description: "The interview panel has been deleted successfully.",
      });
    } catch (err) {
      console.error('Error deleting panel:', err);
      toast.error("Failed to delete panel");
    }
  }

  const handleAddMember = async () => {
    if (!selectedPanel || selectedMembers.length === 0) return;
  
    // Filter out already present members
    const existingIds = selectedPanel.members.map((m) => m.id);
    const newMembers = selectedMembers.filter((m) => !existingIds.includes(m.id));
  
    if (newMembers.length === 0) {
      toast.warning("All selected members are already in the panel.");
      return;
    }
  
    try {
      const res = await fetch(`/api/panels/members/${selectedPanel.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: newMembers.map((m) => m.id) }),
      });
  
      if (!res.ok) throw new Error('Failed to add members');
  
      // Update local panel state
      setPanels(
        panels.map((panel) =>
          panel.id === selectedPanel.id
            ? {
                ...panel,
                members: [...panel.members, ...newMembers],
              }
            : panel
        )
      );
  
      setIsAddMemberDialogOpen(false);
      setSelectedMembers([]);
  
      toast.success("Members added", {
        description: `${newMembers.length} member(s) added to the panel.`,
      });
    } catch (err) {
      console.error('Error adding members:', err);
      toast.error("Failed to add members to panel");
    }
  };
  

  const handleRemoveMember = async (panelId: string, memberId: string) => {
    try {
      const res = await fetch(`/api/panels/members/${panelId}/member/${memberId}`, {
        method: 'DELETE',
      });
  
      if (!res.ok) throw new Error('Failed to remove member');
  
      // Update global panels list
      setPanels((prev) =>
        prev.map((panel) =>
          panel.id === panelId
            ? { ...panel, members: panel.members.filter((member) => member.id !== memberId) }
            : panel
        )
      );
  
      // Update selected panel (for modal dialog)
      setSelectedPanel((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.filter((member) => member.id !== memberId),
            }
          : null
      );
  
      const memberName = getMemberById(memberId)?.name || "Member";
  
      toast.success("Member removed", {
        description: `${memberName} has been removed from the panel successfully.`,
      });
    } catch (err) {
      console.error('Error removing member:', err);
      toast.error("Failed to remove member from panel");
    }
  };
  

  const handleTogglePanelStatus = async (panelId: string) => {
    try {
      const panel = panels.find(p => p.id === panelId);
      if (!panel) return;

      // In a real implementation, make an API call
      const res = await fetch(`/api/panels/${panelId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !panel.active }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      // For now, update local state directly
      setPanels(panels.map((p) => (p.id === panelId ? { ...p, active: !p.active } : p)));

      toast.success("Status updated", {
        description: `Panel is now ${panel.active ? 'inactive' : 'active'}.`,
      });
    } catch (err) {
      console.error('Error updating panel status:', err);
      toast.error("Failed to update panel status");
    }
  }

  const getMemberById = (id: string) => {
    return members.find((member) => member.id === id) || null;
  };

  const getMemberInitials = (name: string | null | undefined): string => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return '??';
    }

    const parts = name.trim().split(/\s+/); // Handles multiple spaces
    const initials = parts.map(part => part[0].toUpperCase()).slice(0, 2).join('');
    return initials || '??';
  };



  const renderActionMenu = (panel: InterviewPanel) => {



    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setSelectedPanel(panel);
              setIsViewDetailsDialogOpen(true);
            }}
          >
            <View className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSelectedPanel(panel);
              setIsAddMemberDialogOpen(true);
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSelectedPanel(panel);
              setIsEditPanelDialogOpen(true);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Panel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTogglePanelStatus(panel.id)}>
            {panel.active ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => {
              setSelectedPanel(panel);
              setIsDeletePanelDialogOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  const columns: ColumnDef<InterviewPanel, unknown>[] = [
    {
      accessorKey: "panel_name",
      header: "Panel Name",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const panel = row.original;
        return (
          <div className="flex flex-col  gap-3">
            <div className="font-medium">{panel.name}</div>
            <div className="text-xs text-muted-foreground">Created: {panel.createdAt}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => (
        <div className="hidden md:table-cell !whitespace-break-spaces">
          <span>{row.original.department}</span>
        </div>
      ),
    },
    {
      accessorKey: "members",
      header: "Members",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const panel = row.original;
        return (
          <div className="flex -space-x-2">
            {panel.members?.slice(0, 3).map((member) => {


              return member ? (
                <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                  {/* <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name || "Member"} /> */}
                  <AvatarFallback>
                    {member.name ? getMemberInitials(member.name) : "??"}
                  </AvatarFallback>
                </Avatar>
              ) : null;
            })}
            {panel.members.length > 3 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                +{panel.members.length - 3}
              </div>
            )}
            {panel.members.length === 0 && (
              <span className="text-sm text-muted-foreground">No members</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "positions",
      header: "Positions",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const panel = row.original;
        return (
          <div className="flex flex-wrap gap-1">
            {panel.positions.map((position, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {position}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "interviews_completed",
      header: "Interviews Completed",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const panel = row.original;
        return <span>{panel.interviewsCompleted}</span>;
      },
    },

    {
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const panel = row.original;



        return (
          <Badge variant={panel.active ? "default" : "secondary"}>
            {panel.active ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          {renderActionMenu(row.original)}
        </div>
      ),
    },
  ];

  const customFilters: FilterOption<InterviewPanel, string>[] = [
    {
      columnId: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ]
    },
    {
      columnId: 'department',
      label: 'Department',
      options: Array.from(new Set(departments.map(department => department.name)))
        .map(title => ({ value: title, label: title }))
    },


  ];


  return (
    <div className="flex flex-col gap-4">
      <Header title="Interview Panels">
        <Button onClick={() => setIsCreatePanelDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Panel
        </Button>
      </Header>

      <div className="space-y-4 pt-20 px-2 sm:px-4 w-full mx-auto">




        <DataTable<InterviewPanel, unknown>
          columns={columns}
          data={panels}
          pageSize={10}
          enableMultiSort={true}
          enableGlobalFilter={true}
          enableColumnFilters={false}
          showTabs={false}
          customFilters={customFilters as FilterOption<InterviewPanel, unknown>[]}
          showRefreshButton={true}
          onRefresh={handleRefresh}
          isLoading={loading}
        />



        {/* Create Panel Dialog */}
        <Dialog open={isCreatePanelDialogOpen} onOpenChange={setIsCreatePanelDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create Interview Panel</DialogTitle>
              <DialogDescription>Create a new interview panel for your organization</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="panel-name">Panel Name</Label>
                <Input
                  id="panel-name"
                  placeholder="e.g., Engineering Frontend Panel"
                  value={formData.panel_name}
                  onChange={(e) => setFormData({ ...formData, panel_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="panel-department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger id="panel-department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panel-status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="panel-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="panel-positions">Positions (comma separated)</Label>
                <Input
                  id="panel-positions"
                  placeholder="e.g., Frontend Developer, UI Engineer"
                  value={formData.positions}
                  onChange={(e) => setFormData({ ...formData, positions: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Initial Panel Members</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-[200px] overflow-y-auto">
                  {members.length > 0 ? (
                    members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`member-${member.id}`}
                          checked={formData.members.includes(member.id)}
                          onCheckedChange={(checked) => {
                            const updated = checked
                              ? [...formData.members, member.id]
                              : formData.members.filter((id) => id !== member.id);
                            setFormData({ ...formData, members: updated });
                          }}
                        />
                        <label
                          htmlFor={`member-${member.id}`}
                          className="flex items-center gap-2 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback>{getMemberInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div>{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.department}</div>
                          </div>
                        </label>
                      </div>
                    ))
                  ) : membersLoading ? (
                    <div className="text-sm text-muted-foreground">Loading members...</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No accepted members available.</div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatePanelDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreatePanel}
                disabled={!formData.panel_name || !formData.department || !formData.positions}
              >
                Create Panel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Panel Dialog */}
        {selectedPanel && (
          <Dialog open={isEditPanelDialogOpen} onOpenChange={setIsEditPanelDialogOpen}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Edit Interview Panel</DialogTitle>
                <DialogDescription>Update the details of {selectedPanel.name}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-panel-name">Panel Name</Label>
                  <Input
                    id="edit-panel-name"
                    value={panelName}
                    onChange={(e) => setPanelName(e.target.value)}
                  />              </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-panel-department">Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger id="edit-panel-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-panel-status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="edit-panel-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-panel-positions">Positions (comma separated)</Label>
                  <Input
                    id="edit-panel-positions"
                    value={positions}
                    onChange={(e) => setPositions(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Panel Members</Label>
                  <div className="border rounded-md p-4 space-y-2 max-h-[200px] overflow-y-auto">
                    {selectedPanel.members.length > 0 ? (
                      selectedPanel.members.map((member) => {
                        return member ? (
                          <div key={member.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                {/* <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} /> */}
                                <AvatarFallback>{getMemberInitials(member.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm">{member.name}</div>
                                <div className="text-xs text-muted-foreground">{member.department}</div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemoveMember(selectedPanel.id, member.id)}
                            >
                              <UserMinus className="h-3 w-3" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <div className="text-sm text-muted-foreground">No members in this panel</div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditPanelDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditPanel}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      {selectedPanel && (

     <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
       <DialogContent className="sm:max-w-[650px] md:max-w-[700px] rounded-xl shadow-lg border-0">
         <DialogHeader className="pb-4 border-b">
           <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-primary">
             <Users className="h-5 w-5" /> Panel Details
           </DialogTitle>
           <DialogDescription className="text-sm text-muted-foreground pt-1">
             Detailed information about <span className="font-medium">{selectedPanel.name}</span>
           </DialogDescription>
         </DialogHeader>
         
         <div className="grid gap-6 py-6">
           {/* Panel Overview Section */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <div className="flex items-center gap-2">
                 <Users className="h-4 w-4 text-muted-foreground" />
                 <Label className="text-sm font-medium">Panel Name</Label>
               </div>
               <div className="text-sm text-gray-800 font-medium pl-6">{selectedPanel.name}</div>
             </div>
             
             <div className="space-y-2">
               <div className="flex items-center gap-2">
                 <Building className="h-4 w-4 text-muted-foreground" />
                 <Label className="text-sm font-medium">Department</Label>
               </div>
               <div className="text-sm text-gray-800 pl-6">{selectedPanel.department}</div>
             </div>
             
             <div className="space-y-2">
               <div className="flex items-center gap-2">
                 <Calendar className="h-4 w-4 text-muted-foreground" />
                 <Label className="text-sm font-medium">Created On</Label>
               </div>
               <div className="text-sm text-gray-800 pl-6">{selectedPanel.createdAt}</div>
             </div>
             
             <div className="space-y-2">
               <div className="flex items-center gap-2">
                 {selectedPanel.active ? (
                   <Check className="h-4 w-4 text-green-500" />
                 ) : (
                   <X className="h-4 w-4 text-red-500" />
                 )}
                 <Label className="text-sm font-medium">Status</Label>
               </div>
               <div className={`text-sm font-medium pl-6 ${selectedPanel.active ? "text-green-600" : "text-red-600"}`}>
                 {selectedPanel.active ? "Active" : "Inactive"}
               </div>
             </div>
           </div>
           
           {/* Positions Section */}
           <div className="space-y-3">
             <div className="flex items-center gap-2">
               <User className="h-4 w-4 text-muted-foreground" />
               <Label className="text-sm font-medium">Positions</Label>
             </div>
             <div className="flex flex-wrap gap-2 pl-6">
               {selectedPanel.positions.map((position, index) => (
                 <Badge key={index} variant="outline" className="text-xs py-1 px-2 rounded-md bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                   {position}
                 </Badge>
               ))}
             </div>
           </div>
           
           {/* Panel Members Section */}
           <div className="space-y-3">
             <div className="flex items-center gap-2">
               <Users className="h-4 w-4 text-muted-foreground" />
               <Label className="text-sm font-medium">Current Panel Members</Label>
             </div>
             <ScrollArea className="h-[220px] rounded-lg border border-slate-200 p-1">
               <div className="grid grid-cols-1 gap-2 p-2">
                 {selectedPanel?.members?.length > 0 ? (
                   selectedPanel.members.map((member) => (
                     <div key={member.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors">
                       <div className="flex items-center gap-3">
                         <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                           <AvatarFallback className="bg-primary/10 text-primary">
                             {getMemberInitials(member.name)}
                           </AvatarFallback>
                         </Avatar>
                         <div>
                           <div className="text-sm font-medium text-gray-800">{member.name}</div>
                           <div className="text-xs text-muted-foreground">{member.department}</div>
                         </div>
                       </div>
                       <Badge variant="outline" className={`text-xs py-1 px-2 rounded-full ${
                         member.role === 'Chair' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                         member.role === 'Secretary' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                         'bg-gray-50 text-gray-700 border-gray-200'
                       }`}>
                         {member.role}
                       </Badge>
                     </div>
                   ))
                 ) : (
                   <div className="text-sm text-center py-8 text-muted-foreground">No members in this panel</div>
                 )}
               </div>
             </ScrollArea>
           </div>
         </div>
         
         <DialogFooter className="flex justify-between items-center pt-4 border-t">
          
           <div className="flex gap-3">
             <Button variant="outline" onClick={() => setIsViewDetailsDialogOpen(false)}>
               Close
             </Button>
             <Button onClick={() => setIsEditPanelDialogOpen(true)}>
               Edit Panel
             </Button>
           </div>
         </DialogFooter>
       </DialogContent>
     </Dialog>
)}

        {/* Delete Panel Dialog */}
        {selectedPanel && (
          <Dialog open={isDeletePanelDialogOpen} onOpenChange={setIsDeletePanelDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Delete Interview Panel</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {selectedPanel.name}? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeletePanelDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeletePanel}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Member Dialog */}
        <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add Panel Member</DialogTitle>
              <DialogDescription>
                {selectedPanel ? `Add a new member to ${selectedPanel.name}` : "Add a member to an interview panel"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!selectedPanel && (
                <div className="space-y-2">
                  <Label htmlFor="add-member-panel">Select Panel</Label>
                  <Select>
                    <SelectTrigger id="add-member-panel">
                      <SelectValue placeholder="Select panel" />
                    </SelectTrigger>
                    <SelectContent>
                      {panels.map((panel) => (
                        <SelectItem key={panel.id} value={panel.id}>
                          {panel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Select Member</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-[300px] overflow-y-auto">
                  {membersLoading ? (
                    <p className="text-sm text-muted-foreground">Loading members...</p>
                  ) : allMembers.length > 0 ? (
                    allMembers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`add-member-${member.id}`}
                          checked={selectedMembers.some((m) => m.id === member.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMembers((prev) => [...prev, member]);
                            } else {
                              setSelectedMembers((prev) => prev.filter((m) => m.id !== member.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`add-member-${member.id}`}
                          className="flex items-center gap-2 text-sm leading-none cursor-pointer"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span>{member.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {member.department} • {member.role}
                              {member.invitation_status && member.invitation_status !== 'accepted' && (
                                <span className="ml-1 text-yellow-600">({member.invitation_status})</span>
                              )}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No members found. Invite members first from the Panel Members page.</p>
                  )}

                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={selectedMembers.length === 0}>
  Add Member{selectedMembers.length > 1 ? 's' : ''}
</Button>

            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

