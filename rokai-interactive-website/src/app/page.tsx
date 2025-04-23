"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

// Dynamically import 3D components with no SSR
const Scene3DDynamic = dynamic(() => import('@/components/Scene3D').then(mod => ({ default: mod.Scene3D })), { ssr: false });
const ScrollSection = dynamic(() => import('@/components/ScrollSection').then(mod => ({ default: mod.ScrollSection })), { ssr: false });
const AnimatedContent = dynamic(() => import('@/components/AnimatedContent').then(mod => ({ default: mod.AnimatedContent })), { ssr: false });
const ContactForm = dynamic(() => import('@/components/ContactForm').then(mod => ({ default: mod.ContactForm })), { ssr: false });

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const setHasInteracted = useAppStore((state) => state.setHasInteracted);
  
  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Handle user interaction
  const handleInteraction = () => {
    setHasInteracted(true);
  };
  
  if (!mounted) return null;
  
  return (
    <main className="relative w-full bg-black text-white">
      {/* 3D Canvas - fixed in the background */}
      <Scene3DDynamic />
      
      {/* Scrollable content */}
      <div className="relative z-10 w-full" onClick={handleInteraction}>
        {/* Hero Section */}
        <ScrollSection sectionId="home" bgColor="transparent">
          <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
            <AnimatedContent delay={0.2}>
              <h1 className="text-6xl md:text-8xl font-bold mb-6">
                In a world of AI, <br />
                <span className="text-blue-500">We keep it real.</span>
              </h1>
            </AnimatedContent>
            
            <AnimatedContent delay={0.4}>
              <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-12">
                RokAi Trading offers you the bridge from frustration to success, 
                scanning and executing trades while you live your life.
              </p>
            </AnimatedContent>
            
            <AnimatedContent delay={0.6}>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-md text-lg font-medium transition-all">
                Start Your Journey
              </button>
            </AnimatedContent>
          </div>
        </ScrollSection>
        
        {/* About Section */}
        <ScrollSection sectionId="about" bgColor="rgba(0,0,0,0.7)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <AnimatedContent direction="left">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                RokAi: Built from Frustration, Driven by Innovation
              </h2>
              <p className="text-lg mb-6">
                RokAi began as a frustration – the struggle of human intelligence trying to predict 
                and conquer the market, fighting against endless losses, expensive fees, and no real leverage.
              </p>
              <p className="text-lg">
                Today, RokAi is the bridge to that frustration – using AI to make smarter, 
                data-driven decisions that give you the freedom to focus on what matters most.
              </p>
            </AnimatedContent>
            
            <AnimatedContent direction="right" delay={0.3}>
              <div className="bg-gray-900 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 text-blue-500">Our Mission</h3>
                <p className="mb-6">
                  To democratize artificial intelligence by creating accessible, affordable, 
                  and immediately valuable AI automation tools for small businesses.
                </p>
                
                <h3 className="text-2xl font-bold mb-4 text-blue-500">Our Vision</h3>
                <p>
                  A future where businesses of all sizes can harness the transformative power of AI, 
                  creating a more level playing field in every industry.
                </p>
              </div>
            </AnimatedContent>
          </div>
        </ScrollSection>
        
        {/* Trading Platform Section */}
        <ScrollSection sectionId="trading" bgColor="rgba(0,0,0,0.7)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <AnimatedContent direction="left">
              <div className="bg-gray-900 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 text-blue-500">Real-time Analysis</h3>
                <p className="mb-6">
                  Our AI continuously scans markets for optimal trading opportunities based on 
                  advanced pattern recognition and predictive analytics.
                </p>
                
                <h3 className="text-2xl font-bold mb-4 text-blue-500">Automated Execution</h3>
                <p className="mb-6">
                  Once opportunities are identified, trades are executed with precision timing 
                  to maximize potential returns.
                </p>
                
                <h3 className="text-2xl font-bold mb-4 text-blue-500">Risk Management</h3>
                <p>
                  Sophisticated algorithms monitor positions and implement stop-loss strategies 
                  to protect your investments.
                </p>
              </div>
            </AnimatedContent>
            
            <AnimatedContent direction="right" delay={0.3}>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                AI-Powered Trading That Works While You Don&apos;t
              </h2>
              <p className="text-lg mb-6">
                RokAi&apos;s trading platform leverages cutting-edge artificial intelligence to analyze 
                market conditions, identify opportunities, and execute trades automatically.
              </p>
              <p className="text-lg mb-8">
                While you focus on your life, our AI works tirelessly to help grow your investments 
                based on data-driven strategies, not emotions or hunches.
              </p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium transition-all">
                Explore Trading Platform
              </button>
            </AnimatedContent>
          </div>
        </ScrollSection>
        
        {/* Solutions Section */}
        <ScrollSection sectionId="solutions" bgColor="rgba(0,0,0,0.7)">
          <AnimatedContent>
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
              RokAi Solutions for Small and Medium Businesses
            </h2>
          </AnimatedContent>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedContent delay={0.2}>
              <div className="bg-gray-900 p-8 rounded-lg h-full transform transition-all duration-300 hover:scale-105 hover:bg-gray-800">
                <h3 className="text-2xl font-bold mb-4 text-blue-500">AI Development</h3>
                <p>
                  Creating advanced AI models tailored to your business challenges, from customer 
                  service automation to predictive analytics.
                </p>
              </div>
            </AnimatedContent>
            
            <AnimatedContent delay={0.4}>
              <div className="bg-gray-900 p-8 rounded-lg h-full transform transition-all duration-300 hover:scale-105 hover:bg-gray-800">
                <h3 className="text-2xl font-bold mb-4 text-blue-500">Data Analysis</h3>
                <p>
                  Harnessing your business data to uncover actionable insights, identify trends, 
                  and make data-driven decisions.
                </p>
              </div>
            </AnimatedContent>
            
            <AnimatedContent delay={0.6}>
              <div className="bg-gray-900 p-8 rounded-lg h-full transform transition-all duration-300 hover:scale-105 hover:bg-gray-800">
                <h3 className="text-2xl font-bold mb-4 text-blue-500">Custom AI Solutions</h3>
                <p>
                  Designing AI applications for unique business needs, from inventory management 
                  to customer behavior prediction.
                </p>
              </div>
            </AnimatedContent>
          </div>
          
          <AnimatedContent delay={0.8}>
            <div className="text-center mt-12">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium transition-all">
                Discover All Solutions
              </button>
            </div>
          </AnimatedContent>
        </ScrollSection>
        
        {/* Contact Section */}
        <ScrollSection sectionId="contact" bgColor="rgba(0,0,0,0.7)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <AnimatedContent direction="left">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform Your Business with AI?
              </h2>
              <p className="text-lg mb-8">
                Get in touch with our team to discuss how RokAi can help you leverage the power 
                of artificial intelligence for your specific needs.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <span>contact@rok-ai.com</span>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
            </AnimatedContent>
            
            <AnimatedContent direction="right" delay={0.3}>
              <ContactForm />
            </AnimatedContent>
          </div>
        </ScrollSection>
        
        {/* Footer */}
        <footer className="bg-gray-900 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">RokAi</h3>
                <p className="text-gray-400">
                  Empowering businesses with accessible AI solutions.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-4">Solutions</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>AI Development</li>
                  <li>Data Analysis</li>
                  <li>Custom Solutions</li>
                  <li>Trading Platform</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>About Us</li>
                  <li>Careers</li>
                  <li>Blog</li>
                  <li>Contact</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-4">Connect</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
              <p>© 2025 RokAi. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
