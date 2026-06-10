"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Facebook, Linkedin, Twitter } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { LOGO_PURPLE, LOGO_WHITE } from '@/constants/common';
import { SOCIAL_LINKS, QUICK_LINKS, OFFICES, FOOTER_LINKS, COMPANY_DESCRIPTION, SUBSCRIBE_TEXT } from '@/constants/public/footer';

const FooterMain = () => {
    const { theme } = useTheme();
    const logoSrc = theme === "dark" ? LOGO_WHITE : LOGO_PURPLE;
    
 

    const getIconComponent = (iconName: string) => {
      switch (iconName) {
      case 'Twitter': return <Twitter className="h-5 w-5" />;
      case 'Linkedin': return <Linkedin className="h-5 w-5" />;
      case 'Facebook': return <Facebook className="h-5 w-5" />;
      default: return null;
      }
    };
    
  return (
    <footer className="bg-muted/50 pt-12 pb-8 bg-gradient-to-b from-background to-secondary ">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 mb-12">
            {/* Logo & Social Links */}
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center mb-4">
                  <Link href="/" className="-m-1.5 p-1.5">
                    <Image src={logoSrc} alt="logo" height={30} width={100} />
                  </Link>
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                  {COMPANY_DESCRIPTION}
                </p>
              </div>
              <div className="flex space-x-4">
                {SOCIAL_LINKS.map((link) => (
                  <Button 
                    key={link.name}
                    variant="ghost" 
                    size="icon" 
                    asChild 
                    className="rounded-full hover:bg-secondary"
                  >
                    <Link href={link.href} aria-label={link.name}>
                      {getIconComponent(link.icon)}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3">
                {QUICK_LINKS.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href} 
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Offices - Condensed layout */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Our Offices</h3>
              <div className="text-muted-foreground text-xs leading-tight">
                <div className="mb-3">
                  <p className="font-semibold text-sm mb-1">{OFFICES.us.title}</p>
                  <p>{OFFICES.us.address}</p>
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">India Offices</p>
                  <ol className="list-decimal pl-4 space-y-2">
                    {OFFICES.india.map((office, index) => (
                      <li key={index}>
                        <Link 
                          href={office.mapLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-start hover:text-foreground transition-colors"
                        >
                          <span>{office.address}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* Subscribe */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Subscribe</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {SUBSCRIBE_TEXT}
              </p>
              <div className="flex gap-2">
                <Input 
                  placeholder="Your email" 
                  type="email" 
                  className="flex-1 focus:ring-2 focus:ring-primary" 
                />
                <Button className="whitespace-nowrap">Subscribe</Button>
              </div>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              © {new Date().getFullYear()} FWC. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
              {FOOTER_LINKS.map((link, index) => (
                <Link 
                  key={index}
                  href={link.href} 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
  )
}

export default FooterMain