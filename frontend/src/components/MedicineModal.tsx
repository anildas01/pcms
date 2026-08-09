"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Medicine {
  id?: number;
  name: string;
  supplier?: string;
  quantity: number;
  type: string;
  unit?: string;
  expiryDate?: string;
  status?: string;
  purchaseDate?: string;
  purchasePrice?: number | string;
}

interface MedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medicine: Medicine) => Promise<void>;
  initialData?: Medicine | null;
  knownSuppliers?: string[];
}

export default function MedicineModal({ isOpen, onClose, onSave, initialData, knownSuppliers = [] }: MedicineModalProps) {
  const [formData, setFormData] = useState<Medicine>(
    initialData || {
      name: '',
      supplier: '',
      quantity: 0,
      type: 'Medicine',
      unit: 'units',
      expiryDate: '',
      status: 'In Stock',
      purchaseDate: '',
      purchasePrice: ''
    }
  );
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : (name === 'purchasePrice' ? parseFloat(value) || '' : value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        expiryDate: formData.expiryDate ? formData.expiryDate : undefined,
        purchaseDate: formData.purchaseDate ? formData.purchaseDate : undefined,
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined
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
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4 sm:p-5">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Medicine' : 'Add Medicine'}
          </h3>
          <button onClick={onClose} type="button" className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
            <X className="h-5 w-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-900">Type</label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <input type="radio" name="type" value="Medicine" checked={formData.type === 'Medicine'} onChange={handleChange} className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  Medicine
                </label>
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <input type="radio" name="type" value="Medical Supplies" checked={formData.type === 'Medical Supplies'} onChange={handleChange} className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  Medical Supplies
                </label>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-900">{formData.type === 'Medicine' ? 'Medicine Name' : 'Supply Name'}</label>
              <input type="text" name="name" id="name" required
                value={formData.name} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                placeholder={`e.g. ${formData.type === 'Medicine' ? 'Paracetamol 500mg' : 'Bandages'}`} />
            </div>

            <div>
              <label htmlFor="quantity" className="mb-2 block text-sm font-medium text-gray-900">Quantity</label>
              <input type="number" name="quantity" id="quantity" required min="0"
                value={formData.quantity || ''} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                placeholder="0" />
            </div>



            <div>
              <label htmlFor="expiryDate" className="mb-2 block text-sm font-medium text-gray-900">Expiry Date</label>
              <input type="date" name="expiryDate" id="expiryDate"
                value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''} 
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" />
            </div>



            <div className="sm:col-span-2">
              <label htmlFor="supplier" className="mb-2 block text-sm font-medium text-gray-900">Supplier</label>
              
              {!isNewSupplier ? (
                <div className="flex gap-2">
                  <select 
                    name="supplier" 
                    id="supplier"
                    value={formData.supplier || ''} 
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a supplier...</option>
                    {knownSuppliers.map((supplierName, idx) => (
                      <option key={idx} value={supplierName}>{supplierName}</option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsNewSupplier(true);
                      setFormData(prev => ({ ...prev, supplier: '' }));
                    }}
                    className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    + Add New
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="supplier" 
                    id="supplier"
                    value={formData.supplier || ''} 
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500" 
                    placeholder="Enter new supplier name..." 
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsNewSupplier(false);
                      setFormData(prev => ({ ...prev, supplier: '' }));
                    }}
                    className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="purchaseDate" className="mb-2 block text-sm font-medium text-gray-900">Purchase Date</label>
                <input type="date" name="purchaseDate" id="purchaseDate" 
                  value={formData.purchaseDate || ''} onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" />
              </div>
              
              <div>
                <label htmlFor="purchasePrice" className="mb-2 block text-sm font-medium text-gray-900">Purchase Price</label>
                <input type="number" step="0.01" min="0" name="purchasePrice" id="purchasePrice" 
                  value={formData.purchasePrice || ''} onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                  placeholder="0.00" />
              </div>
            </div>

          </div>
          
          <div className="flex items-center space-x-3 rounded-b border-t border-gray-200 pt-4">
            <button type="submit" disabled={isSubmitting}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Medicine')}
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
