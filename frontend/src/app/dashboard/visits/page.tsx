"use client";

import React, { useEffect, useState } from 'react';
import { CalendarPlus, Edit, Trash2, MapPin, AlertTriangle } from 'lucide-react';
import VisitModal from '@/components/VisitModal';
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

interface Visit {
  id: number;
  patientId: number;
  nurseId: number;
  date: string;
  notes?: string;
  medicines?: any[];
  equipment?: any[];
  patient: {
    name: string;
    address: string;
  };
  nurse: {
    name: string;
  };
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<any | null>(null);

  // Delete Confirmation State
  const [visitToDelete, setVisitToDelete] = useState<Visit | null>(null);
  const [deleteKeyword, setDeleteKeyword] = useState('');

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:4000/api/visits', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setVisits(data);
      }
    } catch (err) {
      console.error('Failed to fetch visits', err);
      toast.error('Failed to load visits.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVisit = async (visitData: any) => {
    const token = localStorage.getItem('token');
    const isEdit = !!visitData.id;
    const url = isEdit 
      ? `http://127.0.0.1:4000/api/visits/${visitData.id}` 
      : 'http://127.0.0.1:4000/api/visits';
      
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(visitData)
    });

    if (res.ok) {
      toast.success(isEdit ? 'Visit updated successfully' : 'Visit scheduled successfully');
      fetchVisits();
    } else {
      const errorData = await res.json();
      toast.error(`Error saving visit: ${errorData.error || 'Unknown error'}`);
      throw new Error('Failed to save');
    }
  };

  const handleDeleteVisit = async () => {
    if (!visitToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:4000/api/visits/${visitToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast.success(`Visit deleted successfully. Any linked inventory has been restored.`);
        fetchVisits();
      } else {
        toast.error('Failed to delete visit');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while deleting the visit');
    } finally {
      setVisitToDelete(null);
      setDeleteKeyword('');
    }
  };

  const openAddModal = () => {
    setEditingVisit(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Home Visits</h1>
          <p className="mt-2 text-sm text-gray-700">
            Schedule, assign, and track palliative care home visits, including medicine and equipment delivery.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <CalendarPlus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Visit
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
                      Date & Time
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Patient Details
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Assigned Nurse
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Inventory Given
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-gray-500">Loading schedule...</td>
                    </tr>
                  ) : visits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-gray-500">No upcoming visits found. Click 'Add Visit' to get started.</td>
                    </tr>
                  ) : (
                    visits.map((visit) => (
                      <tr key={visit.id}>
                        <td data-label="Date & Time" className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="font-semibold text-gray-900">
                            {new Date(visit.date).toLocaleDateString()}
                          </div>
                          <div className="text-blue-600 font-medium text-xs">
                            {new Date(visit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td data-label="Patient Details" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="font-medium text-gray-900">{visit.patient.name}</div>
                          <div className="text-gray-500 text-xs flex items-center mt-0.5 truncate max-w-[200px]" title={visit.patient.address}>
                            <MapPin className="h-3 w-3 mr-1" /> {visit.patient.address || 'No address'}
                          </div>
                        </td>
                        <td data-label="Assigned Nurse" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs mr-2">
                              {visit.nurse.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{visit.nurse.name}</span>
                          </div>
                        </td>
                        <td data-label="Inventory Given" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex flex-col space-y-1">
                            {visit.medicines && visit.medicines.length > 0 ? (
                              <div className="text-xs">
                                <span className="font-semibold text-gray-700">Meds: </span>
                                {visit.medicines.map((m: any) => `${m.quantity} ${m.medicine.unit} ${m.medicine.name}`).join(', ')}
                              </div>
                            ) : null}
                            {visit.equipment && visit.equipment.length > 0 ? (
                              <div className="text-xs">
                                <span className="font-semibold text-gray-700">Eq: </span>
                                {visit.equipment.map((e: any) => `${e.action} ${e.equipment.name}`).join(', ')}
                              </div>
                            ) : null}
                            {!(visit.medicines?.length) && !(visit.equipment?.length) && (
                              <span className="text-xs italic text-gray-400">None</span>
                            )}
                          </div>
                        </td>
                        <td data-label="Actions" className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button 
                            onClick={() => {
                              setEditingVisit(visit);
                              setIsModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <Edit className="h-4 w-4 inline" />
                          </button>
                          <button 
                            onClick={() => setVisitToDelete(visit)}
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
        <VisitModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveVisit}
          initialData={editingVisit}
        />
      )}

      {/* Delete Confirmation Modal using Shadcn */}
      <AlertDialog open={!!visitToDelete} onOpenChange={(open) => {
        if (!open) {
          setVisitToDelete(null);
          setDeleteKeyword('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete Visit
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this visit for <strong>{visitToDelete?.patient?.name}</strong>? 
              This action cannot be undone. Any medicines or equipment assigned during this visit will be returned to inventory.
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
            <AlertDialogCancel onClick={() => setVisitToDelete(null)}>Cancel</AlertDialogCancel>
            <Button 
              variant="destructive"
              onClick={handleDeleteVisit} 
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
