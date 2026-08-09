"use client";

import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

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

interface Supplier {
  id: number;
  name: string;
}

interface MedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medicine: Medicine) => Promise<void>;
  initialData?: Medicine | null;
}

export default function MedicineModal({ isOpen, onClose, onSave, initialData }: MedicineModalProps) {
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
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  const fetchSuppliers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/suppliers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : (name === 'purchasePrice' ? parseFloat(value) || '' : value)
    }));
  };

  const handleSaveSupplier = async () => {
    if (!newSupplierName.trim()) return;
    const token = localStorage.getItem('token');
    try {
      if (isEditingSupplier) {
        const selectedSupplier = suppliers.find(s => s.name === formData.supplier);
        if (selectedSupplier) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/suppliers/${selectedSupplier.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: newSupplierName })
          });
          if (res.ok) {
            toast.success("Supplier updated!");
            setFormData(prev => ({ ...prev, supplier: newSupplierName }));
            fetchSuppliers();
          } else {
            toast.error("Failed to update supplier");
          }
        }
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/suppliers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: newSupplierName })
        });
        if (res.ok) {
          toast.success("Supplier added!");
          setFormData(prev => ({ ...prev, supplier: newSupplierName }));
          fetchSuppliers();
        } else {
          toast.error("Failed to add supplier");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsNewSupplier(false);
      setIsEditingSupplier(false);
      setNewSupplierName('');
    }
  };

  const handleDeleteSupplier = async () => {
    const selectedSupplier = suppliers.find(s => s.name === formData.supplier);
    if (!selectedSupplier) return;
    
    if (confirm(`Are you sure you want to delete supplier "${selectedSupplier.name}"? This action cannot be undone.`)) {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/suppliers/${selectedSupplier.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success("Supplier deleted");
          setFormData(prev => ({ ...prev, supplier: '' }));
          fetchSuppliers();
        } else {
          toast.error("Failed to delete supplier");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred");
      }
    }
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
              
              {!isNewSupplier && !isEditingSupplier ? (
                <div className="flex gap-2">
                  <select 
                    name="supplier" 
                    id="supplier"
                    value={formData.supplier || ''} 
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  
                  {formData.supplier ? (
                    <div className="flex shrink-0 gap-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          setNewSupplierName(formData.supplier || '');
                          setIsEditingSupplier(true);
                        }}
                        className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Edit Supplier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={handleDeleteSupplier}
                        className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Delete Supplier"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsNewSupplier(true);
                        setNewSupplierName('');
                      }}
                      className="shrink-0 inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add New
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newSupplierName} 
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500" 
                    placeholder="Enter supplier name..." 
                    autoFocus
                  />
                  <div className="flex shrink-0 gap-2">
                    <button 
                      type="button" 
                      onClick={handleSaveSupplier}
                      className="inline-flex items-center rounded-lg border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Check className="h-4 w-4 mr-1" /> Save
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsNewSupplier(false);
                        setIsEditingSupplier(false);
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
