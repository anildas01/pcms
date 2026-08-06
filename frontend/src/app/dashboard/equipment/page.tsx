"use client";

import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ShieldAlert, CheckCircle2, Wrench, AlertTriangle, ArrowRightLeft, Undo2, Download } from 'lucide-react';
import EquipmentModal from '@/components/EquipmentModal';
import AssignEquipmentModal from '@/components/AssignEquipmentModal';
import ReturnEquipmentModal from '@/components/ReturnEquipmentModal';
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

interface Equipment {
  id: number;
  name: string;
  type: string;
  condition: string;
  quantity: number;
  availableNow: number;
  assignments: any[];
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Delete Confirmation State
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [deleteKeyword, setDeleteKeyword] = useState('');

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/equipment`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEquipment(data);
      }
    } catch (err) {
      console.error('Failed to fetch equipment', err);
      toast.error('Failed to load equipment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEquipment = async (equipmentData: any) => {
    const token = localStorage.getItem('token');
    const isEdit = !!equipmentData.id;
    const url = isEdit 
      ? `${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}/api/equipment/${equipmentData.id}` 
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/equipment`;
      
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(equipmentData)
    });

    if (res.ok) {
      toast.success(isEdit ? 'Equipment updated successfully' : 'Equipment added successfully');
      fetchEquipment();
    } else {
      const errorData = await res.json();
      toast.error(`Error saving equipment: ${errorData.error || 'Unknown error'}`);
      throw new Error('Failed to save');
    }
  };

  const handleDeleteEquipment = async () => {
    if (!equipmentToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}/api/equipment/${equipmentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast.success(`Equipment ${equipmentToDelete.name} deleted successfully`);
        fetchEquipment();
      } else {
        toast.error('Failed to delete equipment');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while deleting equipment');
    } finally {
      setEquipmentToDelete(null);
      setDeleteKeyword('');
    }
  };

  const openAddModal = () => {
    setEditingEquipment(null);
    setIsModalOpen(true);
  };

  const downloadCSV = () => {
    if (equipment.length === 0) {
      toast.error('No equipment data to download');
      return;
    }

    const headers = ['ID', 'Name', 'Type', 'Condition', 'Quantity', 'Available Now', 'Assigned To', 'Date Added'];
    const csvRows = [headers.join(',')];

    equipment.forEach(item => {
      const assignedTo = item.assignments && item.assignments.length > 0
        ? item.assignments.map((a: any) => `${a.quantity}x to ${a.patient?.name || `ID: ${a.patientId}`}`).join('; ')
        : 'None';
      
      const row = [
        item.id,
        `"${item.name}"`,
        `"${item.type}"`,
        `"${item.condition}"`,
        item.quantity,
        item.availableNow,
        `"${assignedTo}"`,
        `"${new Date(item.createdAt).toLocaleString()}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `equipment_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started!');
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Equipment Inventory</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track all durable medical equipment (DME), check their status, and manage maintenance logs.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
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
            onClick={() => setIsReturnModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <Undo2 className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
            Return Equipment
          </button>
          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <ArrowRightLeft className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Assign
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Equipment
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg bg-white border border-gray-100">
              <table className="responsive-table min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Equipment Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Quantity
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Condition
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Available Now
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date Added
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-gray-500">Loading equipment...</td>
                    </tr>
                  ) : equipment.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-sm text-gray-500">No equipment found. Click 'Add Equipment' to get started.</td>
                    </tr>
                  ) : (
                    equipment.map((item: any) => (
                      <tr key={item.id}>
                        <td data-label="Equipment Name" className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {item.name}
                        </td>
                        <td data-label="Type" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className="inline-flex rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                            {item.type}
                          </span>
                        </td>
                        <td data-label="Quantity" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-medium">
                          {item.quantity}
                        </td>
                        <td data-label="Condition" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`font-medium ${item.condition === 'Poor' ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.condition}
                          </span>
                        </td>
                        <td data-label="Available Now" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex flex-col">
                            <span className={`font-semibold ${item.availableNow > 0 ? 'text-green-700' : 'text-red-600'}`}>
                              {item.availableNow} / {item.quantity} Available
                            </span>
                            {item.assignments && item.assignments.length > 0 && (
                              <div className="mt-1 flex flex-col gap-1">
                                {item.assignments.map((a: any) => (
                                  <span key={a.id} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                                    {a.quantity}x assigned to {a.patient?.name || `Patient ID: ${a.patientId}`}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td data-label="Date Added" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td data-label="Actions" className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button 
                            onClick={() => {
                              setEditingEquipment(item);
                              setIsModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <Edit className="h-4 w-4 inline" />
                          </button>
                          <button 
                            onClick={() => setEquipmentToDelete(item)}
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
        <EquipmentModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveEquipment}
          initialData={editingEquipment}
        />
      )}

      {isAssignModalOpen && (
        <AssignEquipmentModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={fetchEquipment}
          availableEquipment={equipment.filter(e => e.availableNow > 0)}
        />
      )}

      {isReturnModalOpen && (
        <ReturnEquipmentModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          onSuccess={fetchEquipment}
          inUseEquipment={equipment.filter(e => e.assignments && e.assignments.length > 0)}
        />
      )}

      {/* Delete Confirmation Modal using Shadcn */}
      <AlertDialog open={!!equipmentToDelete} onOpenChange={(open) => {
        if (!open) {
          setEquipmentToDelete(null);
          setDeleteKeyword('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete Equipment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{equipmentToDelete?.name}</strong>? This action cannot be undone. It will permanently remove its data from our servers.
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
            <AlertDialogCancel onClick={() => setEquipmentToDelete(null)}>Cancel</AlertDialogCancel>
            <Button 
              variant="destructive"
              onClick={handleDeleteEquipment} 
              disabled={deleteKeyword.trim().toUpperCase() !== 'DELETE'}
            >
              Confirm Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
