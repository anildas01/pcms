"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Role {
  id: number;
  name: string;
}

interface User {
  id?: number;
  name: string;
  email: string;
  status: string;
  roleId: number;
  role?: {
    name: string;
  };
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: any) => Promise<void>;
  initialData?: User | null;
  roles: Role[];
}

export default function UserModal({ isOpen, onClose, onSave, initialData, roles }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    status: 'active',
    roleId: roles.length > 0 ? roles[0].id : 0
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          email: initialData.email || '',
          password: '',
          status: initialData.status || 'active',
          roleId: initialData.roleId || (roles.length > 0 ? roles[0].id : 0)
        });
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          status: 'active',
          roleId: roles.length > 0 ? roles[0].id : 0
        });
      }
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, roles]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'roleId' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submissionData: any = { ...formData };
      if (!submissionData.password && initialData) {
        delete submissionData.password;
      }
      await onSave(submissionData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 p-4">
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4 sm:p-5">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit User' : 'Add User'}
          </h3>
          <button onClick={onClose} type="button" className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
            <X className="h-5 w-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-900">Name</label>
              <input type="text" name="name" id="name" required
                value={formData.name} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                placeholder="e.g. John Doe" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900">Email Address</label>
              <input type="email" name="email" id="email" required
                value={formData.email} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                placeholder="e.g. john@example.com" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-900">
                Password {initialData && <span className="text-gray-400 font-normal">(Leave blank to keep unchanged)</span>}
              </label>
              <input type="password" name="password" id="password"
                required={!initialData}
                minLength={6}
                value={formData.password} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                placeholder="Minimum 6 characters" />
            </div>

            <div>
              <label htmlFor="roleId" className="mb-2 block text-sm font-medium text-gray-900">Role</label>
              <select name="roleId" id="roleId" required
                value={formData.roleId} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600">
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-900">Status</label>
              <select name="status" id="status" required
                value={formData.status} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 border-t pt-4 sm:pt-5">
            <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save User'}
            </button>
            <button type="button" onClick={onClose} className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
