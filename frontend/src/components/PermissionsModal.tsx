"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: number, permissions: string[]) => Promise<void>;
  user: any;
}

export const navigationOptions = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Patient Management', path: '/dashboard/patients' },
  { name: 'Medicine Inventory', path: '/dashboard/medicines' },
  { name: 'Equipment Inventory', path: '/dashboard/equipment' },
  { name: 'Home Visits', path: '/dashboard/visits' },
  { name: 'Vehicle Fleet', path: '/dashboard/vehicles' },
  { name: 'Billing & Invoices', path: '/dashboard/billing' },
  { name: 'Procurement', path: '/dashboard/purchases' },
  { name: 'Staff & Volunteers', path: '/dashboard/users' },
  { name: 'Tasks & Volunteers', path: '/dashboard/tasks' },
  { name: 'Dispatch Center', path: '/dashboard/dispatch' },
  { name: 'Attendance', path: '/dashboard/attendance' },
  { name: 'Reports & Analytics', path: '/dashboard/reports' },
  { name: 'Activity History', path: '/dashboard/audit' },
  { name: 'Account Security', path: '/dashboard/security' },
  { name: 'Settings', path: '/dashboard/settings' }
];

export default function PermissionsModal({ isOpen, onClose, onSave, user }: PermissionsModalProps) {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      if (user.role?.name?.toLowerCase() === 'admin' || user.role?.name?.toLowerCase() === 'superadmin') {
        // Admins automatically get all permissions
        setSelectedPaths(navigationOptions.map(opt => opt.path));
      } else {
        setSelectedPaths(user.permissions || []);
      }
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const isAdmin = user.role?.name?.toLowerCase() === 'admin' || user.role?.name?.toLowerCase() === 'superadmin';

  const handleCheckboxChange = (path: string, checked: boolean) => {
    if (isAdmin) return; // Admins cannot be restricted
    
    if (checked) {
      setSelectedPaths(prev => [...prev, path]);
    } else {
      setSelectedPaths(prev => prev.filter(p => p !== path));
    }
  };

  const handleSelectAll = () => {
    if (isAdmin) return;
    setSelectedPaths(navigationOptions.map(opt => opt.path));
  };

  const handleDeselectAll = () => {
    if (isAdmin) return;
    setSelectedPaths([]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSave(user.id, selectedPaths);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 p-4">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4 sm:p-5">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Manage Permissions
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Select which sidebar options <span className="font-semibold text-gray-700">{user.name}</span> can access.
            </p>
          </div>
          <button onClick={onClose} type="button" className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
            <X className="h-5 w-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {isAdmin && (
            <div className="mb-4 rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Admin Role Detected</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>This user has the Admin role, which means they automatically have full access to all modules. You cannot restrict their permissions here.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="mb-4 flex gap-3">
              <button onClick={handleSelectAll} className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium">Select All</button>
              <span className="text-gray-300">|</span>
              <button onClick={handleDeselectAll} className="text-sm text-red-600 hover:text-red-800 hover:underline font-medium">Deselect All</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
            {navigationOptions.map((opt) => (
              <label 
                key={opt.path} 
                className={`flex items-start p-3 rounded-lg border ${
                  selectedPaths.includes(opt.path) ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:bg-gray-50'
                } ${isAdmin ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    checked={selectedPaths.includes(opt.path)}
                    onChange={(e) => handleCheckboxChange(opt.path, e.target.checked)}
                    disabled={isAdmin}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <span className={`font-medium ${selectedPaths.includes(opt.path) ? 'text-blue-900' : 'text-gray-900'}`}>
                    {opt.name}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-4 border-t p-4 sm:p-5">
          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={isSubmitting || isAdmin} 
            className="flex w-full items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Permissions'}
          </button>
          <button type="button" onClick={onClose} className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
