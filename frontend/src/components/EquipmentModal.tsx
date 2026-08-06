"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface Equipment {
  id?: number;
  name: string;
  type: string;
  quantity?: number;
  condition?: string;
  conditions?: {
    Excellent?: number;
    Good?: number;
    Fair?: number;
    Poor?: number;
    [key: string]: number | undefined;
  };
}

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipment: Equipment) => Promise<void>;
  initialData?: Equipment | null;
}

export default function EquipmentModal({ isOpen, onClose, onSave, initialData }: EquipmentModalProps) {
  const [formData, setFormData] = useState<Equipment>(
    initialData || {
      name: '',
      type: '',
      quantity: 1,
      condition: 'Good',
      conditions: {
        Excellent: 0,
        Good: 0,
        Fair: 0,
        Poor: 0
      }
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (['Excellent', 'Good', 'Fair', 'Poor'].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        conditions: {
          ...prev.conditions,
          [name]: parseInt(value) || 0
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'quantity' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 p-4">
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b p-4 sm:p-5 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Equipment' : 'Add Equipment'}
          </h3>
          <button onClick={onClose} type="button" className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
            <X className="h-5 w-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            
            <div className="sm:col-span-2">
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-900">Equipment Name</label>
              <input type="text" name="name" id="name" required
                value={formData.name} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                placeholder="e.g. Oxygen Concentrator" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="type" className="mb-2 block text-sm font-medium text-gray-900">Equipment Type</label>
              <input type="text" name="type" id="type" required
                value={formData.type} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                placeholder="e.g. Respiratory, Mobility" />
            </div>

            {!initialData ? (
              <>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-900">Quantities by Condition</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-700">Excellent</label>
                      <input type="number" name="Excellent" min="0" value={formData.conditions?.Excellent || 0} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700">Good</label>
                      <input type="number" name="Good" min="0" value={formData.conditions?.Good || 0} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700">Fair</label>
                      <input type="number" name="Fair" min="0" value={formData.conditions?.Fair || 0} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700">Poor</label>
                      <input type="number" name="Poor" min="0" value={formData.conditions?.Poor || 0} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="sm:col-span-2">
                  <label htmlFor="quantity" className="mb-2 block text-sm font-medium text-gray-900">Quantity / Number Available</label>
                  <input type="number" name="quantity" id="quantity" required min="1"
                    value={formData.quantity} onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                    placeholder="Enter quantity" />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="condition" className="mb-2 block text-sm font-medium text-gray-900">Condition</label>
                  <select name="condition" id="condition"
                    value={formData.condition} onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </>
            )}

          </div>
          
          <div className="flex items-center space-x-3 rounded-b border-t border-gray-200 pt-4 sticky bottom-0 bg-white">
            <button type="submit" disabled={isSubmitting}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Equipment')}
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
