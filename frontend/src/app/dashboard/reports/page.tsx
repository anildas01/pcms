"use client";

import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Users, Activity, FileText, Download, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/reports/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (type: string) => {
    const token = localStorage.getItem('token');
    
    // Create an invisible anchor tag to trigger the browser download
    fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}/api/reports/${type}/csv`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => console.error("Download failed", err));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
        <p className="mt-2 text-sm text-gray-700">
          Generate CSV exports and view high-level aggregates of your organization's performance.
        </p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Patients</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.patients || 0}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="bg-green-100 p-3 rounded-full mr-4">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Revenue Collected</p>
            <h3 className="text-2xl font-bold text-gray-900">${(stats?.revenueCollected || 0).toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="bg-yellow-100 p-3 rounded-full mr-4">
            <Activity className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Low Stock Items</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.lowStockWarnings || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="bg-purple-100 p-3 rounded-full mr-4">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Staff</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.staff || 0}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100 p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 border-b border-gray-200 pb-4 mb-6">
          Data Exports (CSV)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          
          <div className="border border-gray-200 rounded-lg p-5 flex flex-col items-center text-center hover:border-blue-500 transition-colors">
            <div className="h-12 w-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Patient Records</h4>
            <p className="text-xs text-gray-500 mb-6 flex-1">Export a complete list of all registered patients, including their demographics, contact info, and status.</p>
            <button 
              onClick={() => handleDownload('patients')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-5 flex flex-col items-center text-center hover:border-blue-500 transition-colors">
            <div className="h-12 w-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Full Inventory</h4>
            <p className="text-xs text-gray-500 mb-6 flex-1">Export combined data for all Medicines and Equipment currently in the system, including stock levels.</p>
            <button 
              onClick={() => handleDownload('inventory')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-5 flex flex-col items-center text-center hover:border-blue-500 transition-colors">
            <div className="h-12 w-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Billing & Invoices</h4>
            <p className="text-xs text-gray-500 mb-6 flex-1">Export financial data containing all patient invoices, amounts, statuses, and dates for accounting purposes.</p>
            <button 
              onClick={() => handleDownload('billing')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
