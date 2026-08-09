"use client";

import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle, AlertTriangle, Download, Stethoscope } from 'lucide-react';
import MedicineModal from '@/components/MedicineModal';
import MedicineUsageModal from '@/components/MedicineUsageModal';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Medicine {
  id: number;
  name: string;
  supplier?: string;
  quantity: number;
  type: string;
  expiryDate?: string;
  createdAt: string;
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  
  // Delete Confirmation State
  const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null);
  const [deleteKeyword, setDeleteKeyword] = useState('');

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/medicines`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMedicines(data);
      }
    } catch (err) {
      console.error('Failed to fetch medicines', err);
      toast.error('Failed to load medicines.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMedicine = async (medicineData: any) => {
    const token = localStorage.getItem('token');
    const isEdit = !!medicineData.id;
    const url = isEdit 
      ? `${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}/api/medicines/${medicineData.id}` 
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/medicines`;
      
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(medicineData)
    });

    if (res.ok) {
      toast.success(isEdit ? 'Medicine updated successfully' : 'Medicine added successfully');
      fetchMedicines();
    } else {
      const errorData = await res.json();
      toast.error(`Error saving medicine: ${errorData.error || 'Unknown error'}`);
      throw new Error('Failed to save');
    }
  };

  const handleSaveUsage = async (medicineId: number, quantityUsed: number, reason: string) => {
    const token = localStorage.getItem('token');
    
    // Find current medicine to get its remaining stock
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return;
    
    const newQuantity = medicine.quantity - quantityUsed;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}/api/medicines/${medicineId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: medicine.name,
        quantity: newQuantity,
        type: medicine.type,
        reason: reason
      })
    });

    if (res.ok) {
      toast.success('Usage recorded successfully');
      fetchMedicines();
    } else {
      const errorData = await res.json();
      toast.error(`Error recording usage: ${errorData.error || 'Unknown error'}`);
    }
  };

  const downloadCSV = () => {
    if (medicines.length === 0) {
      toast.error('No inventory data to download');
      return;
    }

    const headers = ['ID', 'Item Name', 'Type', 'Stock Level', 'Expiry Date', 'Date Added'];
    const csvRows = [headers.join(',')];

    medicines.forEach(item => {
      const row = [
        item.id,
        `"${item.name}"`,
        `"${item.type}"`,
        item.quantity,
        `"${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}"`,
        `"${new Date(item.createdAt).toLocaleString()}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medicine_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteMedicine = async () => {
    if (!medicineToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}/api/medicines/${medicineToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast.success(`Medicine ${medicineToDelete.name} deleted successfully`);
        fetchMedicines();
      } else {
        toast.error('Failed to delete medicine');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while deleting medicine');
    } finally {
      setMedicineToDelete(null);
      setDeleteKeyword('');
    }
  };

  const openAddModal = () => {
    setEditingMedicine(null);
    setIsModalOpen(true);
  };

  const isLowStock = (qty: number) => qty < 20;

  const filteredMedicines = typeFilter === 'All' 
    ? medicines 
    : medicines.filter(m => m.type === typeFilter);

  return (
    <div>
      <div className="sticky top-[-24px] z-20 bg-gray-50 pb-4 pt-6 -mt-6 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 border-b border-gray-200">
        <div className="sm:flex sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Medicine Inventory</h1>
            <p className="mt-2 text-sm text-gray-700">
              Track your medical supplies, stock levels, and expiration dates.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 items-center">
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option className="text-black" value="All">All Types</option>
              <option className="text-black" value="Medicine">Medicine</option>
              <option className="text-black" value="Medical Supplies">Medical Supplies</option>
            </select>
            <button
              type="button"
              onClick={downloadCSV}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <Download className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
              Download CSV
            </button>
            <button
              type="button"
              onClick={() => setIsUsageModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:w-auto"
            >
              <Stethoscope className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Usage
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg bg-white border border-gray-100">
              <table className="responsive-table min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Item Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Stock Level
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Expiry Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date Added
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-gray-500">Loading inventory...</td>
                    </tr>
                  ) : filteredMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-gray-500">No items found.</td>
                    </tr>
                  ) : (
                    filteredMedicines.map((med) => (
                      <tr key={med.id}>
                        <td data-label="Item Name" className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="font-medium text-gray-900">{med.name}</div>
                          <div className="text-gray-500 text-xs">{med.supplier ? `Supplier: ${med.supplier}` : 'No supplier'}</div>
                        </td>
                        <td data-label="Stock Level" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className={`font-semibold ${isLowStock(med.quantity) ? 'text-red-600' : 'text-gray-900'}`}>
                            {med.quantity}
                          </div>
                          {isLowStock(med.quantity) && (
                            <div className="text-red-600 text-xs flex items-center mt-1">
                              <AlertCircle className="h-3 w-3 mr-1" /> Low Stock
                            </div>
                          )}
                        </td>
                        <td data-label="Expiry Date" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td data-label="Date Added" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(med.createdAt).toLocaleString()}
                        </td>
                        <td data-label="Type" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            med.type === 'Medicine' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {med.type || 'Medicine'}
                          </span>
                        </td>
                        <td data-label="Actions" className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button 
                            onClick={() => {
                              setEditingMedicine(med);
                              setIsModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <Edit className="h-4 w-4 inline" />
                          </button>
                          <button 
                            onClick={() => setMedicineToDelete(med)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <MedicineModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveMedicine}
          initialData={editingMedicine}
          knownSuppliers={Array.from(new Set(medicines.map(m => m.supplier).filter(Boolean))) as string[]}
        />
      )}

      {/* Delete Confirmation Modal using Shadcn */}
      <AlertDialog open={!!medicineToDelete} onOpenChange={(open) => {
        if (!open) {
          setMedicineToDelete(null);
          setDeleteKeyword('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete Medicine
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{medicineToDelete?.name}</strong>? This action cannot be undone. It will permanently remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <strong>DELETE</strong> to confirm:
            </label>
            <Input 
              type="text" 
              value={deleteKeyword}
              onChange={(e) => setDeleteKeyword(e.target.value)}
              placeholder="DELETE"
              className="mt-1 block w-full focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMedicineToDelete(null)}>Cancel</AlertDialogCancel>
            <Button 
              variant="destructive"
              onClick={handleDeleteMedicine} 
              disabled={deleteKeyword.trim().toUpperCase() !== 'DELETE'}
            >
              Confirm Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MedicineUsageModal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
        onSave={handleSaveUsage}
        medicines={medicines}
      />
    </div>
  );
}
