"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
