"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Invoice {
  id?: number;
  patientId: number;
  amount: number;
  status: string;
  dueDate?: string;
  description?: string;
}

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => Promise<void>;
  initialData?: Invoice | null;
}

export default function BillingModal({ isOpen, onClose, onSave, initialData }: BillingModalProps) {
  const [formData, setFormData] = useState<Invoice>(
    initialData || {
      patientId: 0,
      amount: 0,
      status: 'Pending',
      dueDate: '',
      description: ''
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'patientId' ? parseInt(value) || 0 : name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined
      };
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
            {initialData ? 'Edit Invoice' : 'Create Invoice'}
          </h3>
          <button onClick={onClose} type="button" className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
            <X className="h-5 w-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            
            <div className="sm:col-span-2">
              <label htmlFor="patientId" className="mb-2 block text-sm font-medium text-gray-900">Patient ID</label>
              <input type="number" name="patientId" id="patientId" required min="1"
                value={formData.patientId || ''} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                placeholder="Enter Patient ID" />
            </div>

            <div>
              <label htmlFor="amount" className="mb-2 block text-sm font-medium text-gray-900">Amount ($)</label>
              <input type="number" name="amount" id="amount" required min="0" step="0.01"
                value={formData.amount || ''} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                placeholder="0.00" />
            </div>

            <div>
              <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-900">Status</label>
              <select name="status" id="status"
                value={formData.status} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="dueDate" className="mb-2 block text-sm font-medium text-gray-900">Due Date</label>
              <input type="date" name="dueDate" id="dueDate"
                value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-900">Description</label>
              <textarea name="description" id="description" rows={3}
                value={formData.description} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500" 
                placeholder="e.g. Home care visit (2 hours) + Medications"></textarea>
            </div>

          </div>
          
          <div className="flex items-center space-x-3 rounded-b border-t border-gray-200 pt-4">
            <button type="submit" disabled={isSubmitting}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Invoice')}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
