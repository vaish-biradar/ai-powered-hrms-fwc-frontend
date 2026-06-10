"use client"
import Header from "../_components/app-header"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Mail, Users, UserPlus, Star, Building, Calendar } from "lucide-react"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import axios from "axios"
import { departments } from "@/constants/panels/department"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable, FilterOption } from "@/components/ui/data-table"


import { PanelMember } from "@/types/dashboard"
import { useAtom } from "jotai"
import { membersAtom } from "@/store/panel-members"
type Member = {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
};

type InterviewPanel = {
  id: string;
  name: string;
  department: string;
  members: Member[]; // Member IDs
  positions: string[];
  active: boolean;
  createdAt: string;
  interviewsCompleted: number;
};
export default function PanelMembersPage() {
  const [isViewMemberDialogOpen, setIsViewMemberDialogOpen] = useState(false)
  const [isInviteMemberDialogOpen, setIsInviteMemberDialogOpen] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<(PanelMember) | null>(null)
  const [loading, setLoading] = useState<boolean>(true);
  const session = useSession();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    department: '',
    role: '',
    panel: '',
    expertiseInput: '',
    message: '',
  });
  const [panels, setPanels] = useState<InterviewPanel[]>([])
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [members, setMembers] = useAtom(membersAtom);
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/panels/members");
      const formatted = response.data.map((member: PanelMember) => ({
        ...member,
        expertise: typeof member.expertise === "string"
          ? member.expertise.split(",").map((e: string) => e.trim())
          : member.expertise,
      }));
      setMembers(formatted);
      console.log("Members data:", formatted);
      return formatted; // So handleRefresh can use the new data if needed
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching members:", err.message);
      } else {
        console.error("Error fetching members:", err);
      }
      return [];
    } finally {
      setLoading(false);
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



  const handleRefresh = useCallback(async () => {
    await fetchMembers();
  }, [fetchMembers]);



  const handleSendInvitation = async () => {
    try {
      // Prepare the form data for the POST request
      const inviteData = {
        ...formData,
        panelName : panels.find((panel) => panel.id === formData.panel)?.name || '', // Get the panel name from the selected panel ID
        expertise: formData.expertiseInput.split(',').map((expertise) => expertise.trim()), // Split expertise input into an array
        accessToken: session.data?.accessToken, // Pass the access token from the session
      };

      // Send POST request to the API route
      const response = await fetch('/api/panels/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData), // Send the invite data as JSON
      });

      const data = await response.json();

      if (data.success) {
        setIsInviteMemberDialogOpen(false);
        toast('Invitation sent', {
          description: 'The invitation has been sent successfully.',
        });
      } else {
        toast.error('Failed to send invitation', {
          description: data.message || 'An error occurred while sending the invitation.',
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation', {
        description: 'An error occurred while sending the invitation.',
      });
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }


  const renderActionMenu = (member: PanelMember) => {



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
              setSelectedMember(member)
              setIsViewMemberDialogOpen(true)
            }}
          >
            <Users className="mr-2 h-4 w-4" />
            View Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSelectedMember(member)
              setIsAddMemberDialogOpen(true)
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add to Panel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const handleAddPanel = async () => {
    if (!selectedMember || selectedPanels.length === 0) return;

   
    try {
      const res = await fetch(`/api/panels/members/add-panels/${selectedMember.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panelIds: selectedPanels }),
      });

      if (!res.ok) throw new Error('Failed to add member to panel');

      // Update local panel state
      setPanels(
        panels.map((panel) =>
          selectedPanels.includes(panel.id)
            ? {
              ...panel,
              members: [...panel.members, selectedMember],
            }
            : panel
        )
      );

      setIsAddMemberDialogOpen(false);
      setSelectedPanels([]);

      toast.success("Member added to panel", {
        description: `${selectedMember.name} has been added to the selected panels.`,
      });
    } catch (err) {
      console.error('Error adding member to panel:', err);
      toast.error("Failed to add member to panel");
    }

   
  };
  const columns: ColumnDef<PanelMember, unknown>[] = [
    {
      accessorKey: "member",
      header: "Member",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
              <AvatarFallback>{member.name.split(' ').map(word => word[0]).join('').toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{member.name}</div>
              <div className="text-xs text-muted-foreground">{member.email}</div>
            </div>
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
      accessorKey: "expertise",
      header: "Expertise",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(row.original.expertise) ? (
            row.original.expertise.map((exp, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {exp}
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="text-xs">
              {row.original.expertise}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "panelsJoined",
      header: "Panels Joined",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const panels = row.original?.panels ?? [];
        const count = panels.length;
        const isJoined = count > 0;
        return (
          <Badge variant={isJoined ? "default" : "outline"}>
            {isJoined ? `Joined (${count})` : "Not Joined"}
          </Badge>
        );
      },
    }
    ,
    {
      accessorKey: "interviewsCompleted",
      header: "Interviews Completed",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const interview = row.original.interviewsCompleted ?? 0;
        const InterviewCompleted = interview > 0;
        return (
          <Badge variant={InterviewCompleted ? "default" : "outline"}>
            {InterviewCompleted ? `${InterviewCompleted}` : "0"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const status = (row.original.invitation_status ?? "").toLowerCase();

        const getBadgeVariant = () => {
          switch (status) {
            case "accepted":
              return "default"; // green
            case "rejected":
              return "destructive"; // red
            case "pending":
            default:
              return "secondary"; // gray or neutral
          }
        };

        return (
          <Badge variant={getBadgeVariant()}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          {renderActionMenu(row.original)}
        </div>
      ),
    },
  ];

  const customFilters: FilterOption<PanelMember, string>[] = [
    {
      columnId: 'status',
      label: 'Status',
      options: [
        { value: 'accepted', label: 'Accepted' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'pending', label: 'Pending' },
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
      <Header title="Panel Members" >
        <Button onClick={() => setIsInviteMemberDialogOpen(true)}>
          <Mail className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </Header>


      <div className="p-4 w-full mx-auto pt-20">
    
          <DataTable<PanelMember, unknown>
            columns={columns}
            data={members}
            searchKey="member"
            searchPlaceholder="Search all columns..."
            pageSize={10}
            enableMultiSort={true}
            enableGlobalFilter={true}
            enableColumnFilters={false}
            showTabs={false}
            customFilters={customFilters as FilterOption<PanelMember, unknown>[]}
            showRefreshButton={true}
            onRefresh={handleRefresh}
  
            isLoading={loading}
          />




        {/* View Member Dialog */}
        {selectedMember && (
          <Dialog open={isViewMemberDialogOpen} onOpenChange={setIsViewMemberDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Member Profile</DialogTitle>
                <DialogDescription>Detailed information about {selectedMember.name}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedMember.avatar || "/placeholder.svg"} alt={selectedMember.name} />
                    <AvatarFallback>{selectedMember.initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-medium">{selectedMember.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedMember.role}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                      <Badge variant="outline">{selectedMember.department}</Badge>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm ml-1">{selectedMember.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMember.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMember.department}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Interview Statistics</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Panels Joined: </span>
                        <Badge variant={selectedMember.panels?.length > 0 ? "default" : "outline"}>
                          {selectedMember.panels?.length > 0
                            ? `${selectedMember.panels.length}`
                            : "Not Joined"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Interviews Completed: {selectedMember.interviewsCompleted}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(selectedMember.expertise) ? (
                      selectedMember.expertise.map((exp, index) => (
                        <Badge key={index}>{exp}</Badge>
                      ))
                    ) : (
                      <Badge>{selectedMember.expertise}</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Panel Participation</h4>
                  <div className="border rounded-md divide-y">
                    {selectedMember.panels && selectedMember.panels.length > 0 ? (
                      selectedMember.panels.map((panel) => (
                        <div key={panel.id} className="p-3 flex justify-between items-center">
                          <div>
                            <div className="font-medium">{panel.panel_name}</div>
                            <div className="text-xs text-muted-foreground">{panel.department}</div>
                          </div>
                          <Badge variant={panel.status === "active" ? "default" : "secondary"}>
                            {panel.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-muted-foreground">
                        Not currently assigned to any panels
                      </div>
                    )}
                  </div>
                </div>

              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewMemberDialogOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsViewMemberDialogOpen(false)
                    setIsAddMemberDialogOpen(true)
                  }}
                >
                  Add to Panel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Invite Member Dialog */}
        <Dialog open={isInviteMemberDialogOpen} onOpenChange={setIsInviteMemberDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Invite Panel Member</DialogTitle>
              <DialogDescription>Send an invitation to join an interview panel</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@example.com"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Name</Label>
                  <Input
                    id="invite-name"
                    placeholder="John Doe"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleSelectChange('department', value)}
                  >
                    <SelectTrigger id="invite-department">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Input
                    id="invite-role"
                    placeholder="e.g., Senior Engineer"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-panel">Panel</Label>
                  <Select
                    value={formData.panel}
                    onValueChange={(value) => handleSelectChange('panel', value)}
                  >
                    <SelectTrigger id="invite-panel">
                      <SelectValue placeholder="Select panel" />
                    </SelectTrigger>
                    <SelectContent>
                      {panels
                        .filter((p) => p.active)
                        .map((panel) => (
                          <SelectItem key={panel.id} value={panel.id}>
                            {panel.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-expertise">Expertise</Label>
                <Input
                  id="invite-expertise"
                  placeholder="Enter expertise (comma separated)"
                  name="expertiseInput"
                  value={formData.expertiseInput}
                  onChange={handleInputChange}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.expertiseInput
                    .split(',')
                    .filter(Boolean)
                    .map((expertise, index) => (
                      <Badge key={index}>{expertise.trim()}</Badge>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-message">Invitation Message</Label>
                <Textarea
                  id="invite-message"
                  placeholder="Enter a personalized message for the invitation..."
                  className="min-h-[100px]"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteMemberDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendInvitation}>Send Invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



        {/* Add to Panel Dialog */}
        {selectedMember && (
          <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add to Panel</DialogTitle>
                <DialogDescription>Add {selectedMember.name} to an interview panel</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="add-to-panel">Select Panel</Label>
                  <div className="border rounded-md p-2">
                    <div className="text-sm font-medium mb-1">Select Panels to Add</div>
                    {panels
                      .filter(
                        (p) =>
                          p.active &&
                          !selectedMember.panels?.some((joined) => joined.id === p.id)
                      )
                      .map((panel) => (
                        <label
                          key={panel.id}
                          className="flex items-center gap-2 text-sm py-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPanels.includes(panel.id)}
                            onChange={(e) =>
                              setSelectedPanels((prev) =>
                                e.target.checked
                                  ? [...prev, panel.id]
                                  : prev.filter((id) => id !== panel.id)
                              )
                            }
                          />
                          {panel.name}
                        </label>
                      ))}
                    {panels.filter(
                      (p) =>
                        p.active &&
                        !selectedMember.panels?.some((joined) => joined.id === p.id)
                    ).length === 0 && (
                        <div className="text-xs text-muted-foreground">
                          No available panels to join
                        </div>
                      )}
                  </div>

                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleAddPanel()}>Add to Panel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
