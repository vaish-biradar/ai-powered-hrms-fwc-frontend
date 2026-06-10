'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/core/theme/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";
import { FileBadge, Home, LayoutDashboard, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import ContactForm from "@/components/public/contact-form"; // ← Create this component from the ContactPage logic

import { LOGO_PURPLE, LOGO_WHITE } from "@/constants/common";
import { useAtom } from "jotai";
import { contactAtom } from "@/store/home-atom";

const navigation: { name: keyof typeof iconMap; href: string }[] = [
  { name: 'Home', href: '/' },
  { name: 'Career', href: '/careers' },
  { name: 'HR/Employee', href: '/dashboard' },
];

const iconMap = {
  Home: <Home className="w-4 h-4 mr-2" />,
  Career: <FileBadge className="w-4 h-4 mr-2" />,
  'HR/Employee': <LayoutDashboard className="w-4 h-4 mr-2" />,
};

export default function Navbar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? LOGO_WHITE : LOGO_PURPLE;

  const [open, setOpen] = useAtom(contactAtom);

  return (
    <header className="fixed w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b">
      <div className="container mx-auto">
        <nav className="flex items-center justify-between p-4" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5">
              <Image src={logoSrc} alt="logo" height={30} width={100} />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:gap-x-6 items-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-semibold leading-6 relative group transition-all duration-300 ease-in-out ${pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
                  }`}
              >
                {item.name}
                <span
                  className={`absolute bottom-[-2px] left-0 h-0.5 bg-primary transition-all duration-300 ease-in-out ${pathname === item.href ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                />
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Contact Us</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Contact Us</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    We would love to hear from you! Please fill out the form below and we will get back to you as soon as possible.
                  </DialogDescription>
                </DialogHeader>
                <ContactForm onClose={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
            <ThemeToggle />
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 lg:hidden">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2  text-sm"
                >
                  Contact Us
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">
                    Contact Us
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    We would love to hear from you! Please fill out the form below
                    and we will get back to you as soon as possible.
                  </DialogDescription>
                </DialogHeader>
                <ContactForm onClose={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>
                    <Image src={logoSrc} alt="logo" height={24} width={80} />
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col space-y-2 mt-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2  text-sm font-medium transition-colors ${pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-primary"
                        }`}
                    >
                      {iconMap[item.name] ?? <LayoutDashboard className="w-4 h-4 mr-2" />}
                      {item.name}
                    </Link>
                  ))}

                  {/* Contact Us as dialog in mobile too */}

                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
