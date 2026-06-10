"use client"

import {
    Briefcase,
    ChevronsUpDown,
    LogOut,
    Phone,
    Sun,
    Moon,
    Monitor
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useUserStore } from "@/hooks/use-user"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export function NavUser() {
    const { isMobile } = useSidebar()
    const { user } = useUserStore()
    const { theme, setTheme } = useTheme()
    const [currentTheme, setCurrentTheme] = useState(theme)

    const getInitials = (name: string) => {
        if (!name) return ""
        const parts = name.split(" ")
        return parts.length === 1
            ? parts[0][0].toUpperCase()
            : parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
    }



    const handleThemeChange = (value: string): void => {
        setCurrentTheme(value);
        setTheme(value);
    };



    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-muted/50 transition-colors duration-200"
                        >
                            <Avatar className="h-8 w-8 border border-border shadow-sm">
                                <AvatarImage src={user?.image} alt={user?.name} />
                                <AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials(user?.name || "")}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                                <span className="truncate font-semibold">{user?.name}</span>
                                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "top"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-3 p-3">
                                <Avatar className="h-10 w-10 border border-border shadow-sm">
                                    <AvatarImage src={user?.image} alt={user?.name} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials(user?.name || "")}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user?.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <DropdownMenuItem disabled className="cursor-default flex items-center py-2">
                                <Phone className="mr-3 h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{user?.phone || "No phone number"}</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem disabled className="cursor-default flex items-center py-2">
                                <Briefcase className="mr-3 h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{user?.jobTitle || "No job title"} {user?.role ? `• ${user.role}` : ''}</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem className="p-2 cursor-default">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">

                                    <span>Theme</span>
                                </div>

                                <ToggleGroup type="single" value={currentTheme} variant="outline" className="border rounded-md">
                                    <ToggleGroupItem
                                        value="system"
                                        aria-label="System theme"
                                        onClick={() => handleThemeChange("system")}
                                        className="cursor-pointer data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                                    >
                                        <Monitor className="h-4 w-4" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="light"
                                        aria-label="Light theme"
                                        onClick={() => handleThemeChange("light")}
                                        className="cursor-pointer data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                                    >
                                        <Sun className="h-4 w-4 text-yellow-600" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="dark"
                                        aria-label="Dark theme"
                                        onClick={() => handleThemeChange("dark")}
                                        className="cursor-pointer data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                                    >
                                        <Moon className="h-4 w-4" />
                                    </ToggleGroupItem>
                                </ToggleGroup>

                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="flex items-center py-2 cursor-pointer text-destructive hover:text-destructive focus:text-destructive"
                            onClick={() => signOut()}
                        >
                            <LogOut className="mr-3 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}