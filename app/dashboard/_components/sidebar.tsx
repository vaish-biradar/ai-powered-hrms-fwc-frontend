"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Bot, FileText, Search, Mic, LayoutDashboardIcon, Folder, Home, BookAudio,  Webhook, Users, UserCog, CalendarClock, Wallet, ClipboardCheck } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"
import { NavUser } from "@/app/dashboard/_components/nav-user"
import {DOHRLIGHT ,DOHRDARK} from "@/constants/common"
import { Badge } from "@/components/ui/badge"
import { useUserStore } from "@/hooks/use-user"

const sections = [
    {
        title: "Management",
        items: [
            { title: "Applications", url: "/dashboard/applications", icon: Folder },
            { title: "Resumes", url: "/dashboard/resumes", icon: FileText },
            { title: "Job Descriptions", url: "/dashboard/jds", icon: Bot },
   
        ],
    },
    {
        title: "Recruitment",
        items: [
            { title: "Search Candidate", url: "/dashboard/candidate-search", icon: Search },
            // { title: "Interview (WIP)", url: "/dashboard/interview", icon: Mic },
            { title: "Schedule Interview", url: "/dashboard/interviews", icon: Mic },
            { title: "Process Transcript", url: "/dashboard/transcript", icon: BookAudio },
        ],
    },
    {
        title: "Interview Panel",
        items: [
            { title: "Manage Panels", url: "/dashboard/panels", icon: Webhook },
            { title: "Panel Members", url: "/dashboard/panel-members", icon: Users },
        ],
    },
    {
        title: "HRMS",
        items: [
            { title: "Employees", url: "/dashboard/employees", icon: UserCog },
            { title: "Attendance", url: "/dashboard/attendance", icon: CalendarClock },
            { title: "Payroll", url: "/dashboard/payroll", icon: Wallet },
            { title: "Performance", url: "/dashboard/performance", icon: ClipboardCheck },
        ],
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { theme } = useTheme()
    const pathname = usePathname()
    const { state } = useSidebar();
    const { user } = useUserStore();
    const logoSrc = theme === "dark" ? DOHRDARK : DOHRLIGHT
    const role = user?.role || 'Employee';

    const visibleSections = sections.filter((section) => {
        if (role === 'HR') return true;
        if (section.title !== 'HRMS') return false;
        return true;
    }).map((section) => ({
        ...section,
        items: role === 'HR'
            ? section.items
            : section.items.filter((item) => [
                '/dashboard/attendance',
                '/dashboard/payroll',
                '/dashboard/performance',
            ].includes(item.url)),
    }));

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="flex items-center justify-center space-x-2">
                {state === "expanded" ? (
                    <div className="flex items-center space-x-1">
                        <Image src={logoSrc} alt="logo" height={30} width={80} />
                        <Badge variant='outline' className="text-xs px-2  bg-secondary text-primary">v1.0.0</Badge>
                    </div>
                ) : (
                    <div className=" items-center space-x-1 px-auto justify-center ">
                        <Image src="/assets/logos/logo-sm.png" alt="logo" height={30} width={30} className="flex justify-center mx-auto" />
                        <Badge variant='outline' className="text-[10px] px-1.5  bg-secondary text-primary">v1.0.0</Badge>
                    </div>
                )}
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <Link href="/" >
                                <SidebarMenuButton
                                    className={`cursor-pointer ${pathname === "/" ? "text-purple-700" : ""}`}
                                    tooltip="Home"
                                >
                                    <Home className="mr-2" />
                                    Home
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            {role === 'HR' && (
                                <Link href="/dashboard">
                                    <SidebarMenuButton
                                        className={`cursor-pointer ${pathname === "/dashboard" ? "text-purple-700" : ""}`}
                                        tooltip="Dashboard"
                                    >
                                        <LayoutDashboardIcon className="mr-2" />
                                        Dashboard
                                    </SidebarMenuButton>
                                </Link>
                            )}
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {visibleSections.map((section) => (
                    <SidebarGroup key={section.title}>
                        <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                        <SidebarMenu>
                            {section.items.map((item) => {
                                const isActive = pathname === item.url || pathname.startsWith(item.url)
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <Link href={item.url}>
                                            <SidebarMenuButton
                                                tooltip={item.title}
                                                className={`cursor-pointer ${isActive ? "text-purple-700" : ""}`}
                                            >
                                                {item.icon && <item.icon className="mr-2" />}
                                                {item.title}
                                            </SidebarMenuButton>
                                        </Link>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}
