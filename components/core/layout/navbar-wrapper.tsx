"use client"; 
import { usePathname } from "next/navigation";
import Navbar from "@/components/public/navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null; // Hide navbar on /dashboard

  return <Navbar />;
}
