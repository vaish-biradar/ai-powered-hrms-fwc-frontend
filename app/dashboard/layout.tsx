

import { AppSidebar } from "@/app/dashboard/_components/sidebar"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { AuthProvider } from "@/hooks/use-authrefresh"
export default function HRDashboardLayout({ children }: { children: React.ReactNode })  {
 
  return (
    <AuthProvider>
    <SidebarProvider className="overflow-x-hidden">
      <AppSidebar />
      <SidebarInset >
      {children}
      </SidebarInset>
    </SidebarProvider>
    </AuthProvider>
  )
}
