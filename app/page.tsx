"use client"

import { Button } from '@/components/ui/button';
import { ArrowRight, Code, Shield, Users2} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Cloud } from "lucide-react";
import { Chatbot } from '@/components/shared/chatbot';
import { motion } from 'framer-motion';
import { useSetAtom } from 'jotai';
import { contactAtom } from '@/store/home-atom';

// Animation variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5
    }
  }
};

export default function Home() {
  const setOpen = useSetAtom(contactAtom);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-secondary/20 z-[-1]">
        <div className="absolute inset-0  opacity-[0.015]" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center justify-center pt-16 overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="container px-4 md:px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2"
          >
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col justify-center space-y-6"
            >
              <div className="space-y-4">
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80"
                >
                  Transform Your Business with FWC
                </motion.h1>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="max-w-[600px] text-muted-foreground text-base md:text-lg lg:text-xl"
                >
                  Empower your business with expert consulting and AI-driven solutions that deliver real results.
                </motion.p>
              </div>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col gap-4 min-[400px]:flex-row"
              >
                <Button 
                  size="lg" 
                  onClick={() => setOpen(true)}
                  className="bg-primary hover:bg-primary/90  font-medium px-6 py-3 rounded-md transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  asChild
                  className="border-primary/20 hover:bg-primary/5 font-medium transition-all duration-300"
                >
                  <Link href="/careers">Career Opportunities</Link>
                </Button>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mx-auto aspect-video w-full max-w-[600px] overflow-hidden rounded-2xl lg:order-last relative shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent mix-blend-overlay z-10 rounded-2xl" />
              <Image
                alt="Hero"
                src="/assets/fwc-home.png"
                width={600}
                height={400}
                className="object-cover w-full h-full transition-transform duration-5000 hover:scale-105"
                priority
              />
            </motion.div>
          </motion.div>
        </div>

     
      </section>

      {/* Services Preview */}
      <section className="w-full py-20 md:py-28 lg:py-32 mx-auto relative">
        {/* Subtle background effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/0 via-secondary/5 to-background/0" />
        
        <div className="container mx-auto px-4 md:px-6 relative">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
            className="flex flex-col items-center justify-center space-y-4 text-center"
          >
            <motion.div variants={itemVariants} className="space-y-3">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">Our Services</h2>
              <p className="max-w-[800px] text-muted-foreground text-base md:text-lg mx-auto">
                Comprehensive solutions tailored to your business needs with cutting-edge technology
              </p>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={containerVariants}
            className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 py-12"
          >
            {[
              {
                icon: <Cloud className="h-10 w-10" />,
                title: "Cloud Native Application Development",
                description: "Build scalable and secure cloud-native applications using modern DevOps, microservices, and containerization.",
                color: "bg-gradient-to-br from-purple-500 to-indigo-600"
              },
              {
                icon: <Code className="h-10 w-10" />,
                title: "AI Advisory",
                description: "Leverage AI/ML frameworks to enhance business automation, drive innovation, and extract predictive insights from data.",
                color: "bg-gradient-to-br from-blue-500 to-cyan-600"
              },
              {
                icon: <Users2 className="h-10 w-10" />,
                title: "Data Management",
                description: "Develop data-driven strategies for governance, analytics, and scalable cloud platforms to optimize business intelligence.",
                color: "bg-gradient-to-br from-amber-500 to-orange-600"
              },
              {
                icon: <Shield className="h-10 w-10" />,
                title: "Quality Assurance",
                description: "Implement robust testing frameworks to ensure software reliability, security, and continuous improvement.",
                color: "bg-gradient-to-br from-emerald-500 to-green-600"
              },
            ].map((service) => (
              <motion.div
                key={service.title}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="flex flex-col h-full rounded-xl p-6 bg-white/5 backdrop-blur-sm border border-foreground/5 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Icon container with gradient */}
                <div className="h-24 flex items-center justify-center mb-6">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className={`flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full text-primary-foreground shadow-lg ${service.color}`}
                  >
                    {service.icon}
                  </motion.div>
                </div>

                {/* Title */}
                <div className="h-16 flex items-start justify-center mb-4">
                  <h3 className="text-xl font-bold text-center">{service.title}</h3>
                </div>
                
                {/* Description */}
                <div className="flex-grow mt-2">
                  <p className="text-muted-foreground text-sm md:text-base text-center">{service.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mt-6"
          >
            <Button 
              asChild 
              size="lg"
              className="bg-primary hover:bg-primary/90  font-medium px-8 py-6 rounded-md transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
            >
              <Link href="/dashboard">
                Go To HR/Employee Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Chatbot */}
      <Chatbot />
    </main>
  );
}