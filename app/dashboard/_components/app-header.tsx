import { ReactNode } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"; // Ensure correct import

interface HeaderProps {
  title?: string;
  children?: ReactNode;
}

const Header = ({ title = "", children }: HeaderProps) => {
  const { state, isMobile} = useSidebar(); // Get sidebar state

  // Determine sidebar width
  const sidebarWidth = isMobile ? ( 0) : state === "expanded" ? 256 : 47;

  return (
    <div
      className="fixed top-0 z-50 bg-sidebar px-4 py-3 border flex flex-nowrap items-center justify-between transition-all"
      style={{ left: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)` }}
    >
      {/* Sidebar Trigger & Title */}
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger />
        <h3 className="text-base font-medium truncate w-full sm:w-auto">{title}</h3>
      </div>

      {/* Optional Children (Buttons, Search, etc.) */}
      <div className="flex items-center gap-3 ">{children}</div>
    </div>
  );
};

export default Header;
