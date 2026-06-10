"use client"
import { FOOTER_LINKS } from "@/constants/public/footer";
import Link from "next/link";
import { useEffect, useState } from "react";

function Footer() {
    const [isVisible, setIsVisible] = useState(false);
  
    useEffect(() => {
      // Delay footer appearance by 600ms
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 600);
  
      return () => clearTimeout(timer);
    }, []);
  
    return (
      
        <footer 
          className={`bg-muted/50 pt-10 bg-gradient-to-b from-background to-secondary transition-opacity duration-500${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
              
          <div className="container flex flex-col md:flex-row justify-between py-5 items-center mx-auto px-4 sm:px-6 lg:px-8 border-t border-muted/50">
            
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              © {new Date().getFullYear()} FWC. All rights reserved.
            </p>
            <div className="flex space-x-6">
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
        </footer>
    );
  }
  export default Footer;