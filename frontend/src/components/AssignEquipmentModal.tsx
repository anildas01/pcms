"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { toast } from 'sonner';
import PatientModal from './PatientModal';

interface AssignEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableEquipment: any[];
}

export default function AssignEquipmentModal({ isOpen, onClose, onSuccess, availableEquipment }: AssignEquipmentModalProps) {
  const [equipmentId, setEquipmentId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const quantity = 1;
  const [assignedAt, setAssignedAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  const fetchPatients = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  const handlePatientSaved = async (patientData: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(patientData)
    });

    if (res.ok) {
      const newPatient = await res.json();
      setPatients(prev => [newPatient, ...prev]);
      setPatientId(newPatient.id);
      setIsPatientModalOpen(false);
      toast.success("Patient created successfully!");
    } else {
      const errorData = await res.json();
      toast.error(`Failed to create patient: ${errorData.error || 'Unknown error'}`);
      throw new Error('Failed to save patient');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId || !patientId) {
      toast.error("Please select both an equipment and a patient.");
      return;
    }

    const selectedEq = availableEquipment.find(eq => eq.id === equipmentId);
    if (!selectedEq) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}/api/equipment/${equipmentId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ patientId, quantity, assignedAt })
      });

      if (res.ok) {
        toast.success("Equipment successfully assigned!");
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        toast.error(`Failed to assign: ${errorData.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4 sm:p-5">
          <h3 className="text-xl font-semibold text-gray-900">
            Assign Equipment
          </h3>
          <button onClick={onClose} type="button" className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div className="space-y-4 mb-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Select Available Equipment</label>
              <SearchableSelect
                required
                options={availableEquipment.map(eq => ({ value: eq.id, label: `${eq.name} (Type: ${eq.type} | Cond: ${eq.condition})` }))}
                value={equipmentId || ''}
                onChange={(val) => setEquipmentId(val as number)}
                placeholder="Search equipment..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-900">Assign to Patient</label>
                <button 
                  type="button" 
                  onClick={() => setIsPatientModalOpen(true)}
                  className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add New
                </button>
              </div>
              <SearchableSelect
                required
                options={patients.map(p => ({ value: p.id, label: `${p.name} (ID: ${p.id})` }))}
                value={patientId || ''}
                onChange={(val) => setPatientId(val as number)}
                placeholder="Search patient..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Assigned Date</label>
              <input 
                type="date" 
                required
                value={assignedAt}
                onChange={(e) => setAssignedAt(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3 rounded-b border-t border-gray-200 pt-4">
            <button type="submit" disabled={isSubmitting}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50">
              {isSubmitting ? 'Assigning...' : 'Assign Equipment'}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </form>
      </div>

      {isPatientModalOpen && (
        <PatientModal 
          isOpen={isPatientModalOpen} 
          onClose={() => setIsPatientModalOpen(false)} 
          onSave={handlePatientSaved} 
        />
      )}
    </div>
  );
}
