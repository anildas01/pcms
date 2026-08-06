"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { toast } from 'sonner';

interface ReturnEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inUseEquipment: any[];
}

export default function ReturnEquipmentModal({ isOpen, onClose, onSuccess, inUseEquipment }: ReturnEquipmentModalProps) {
  const [assignmentId, setAssignmentId] = useState<number | null>(null);
  const [returnCondition, setReturnCondition] = useState<string>('Good');
  const [patients, setPatients] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('token');
      fetch('http://127.0.0.1:4000/api/patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setPatients(data))
      .catch(err => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allAssignments = inUseEquipment.flatMap(eq => 
    eq.assignments.map((a: any) => ({
      ...a,
      equipmentName: eq.name,
      equipmentCondition: eq.condition
    }))
  );

  const selectedAssignment = assignmentId ? allAssignments.find(a => a.id === assignmentId) : null;
  const assignedPatient = selectedAssignment ? patients.find(p => p.id === selectedAssignment.patientId) : null;

  useEffect(() => {
    if (selectedAssignment) {
      setReturnCondition(selectedAssignment.equipmentCondition || 'Good');
    }
  }, [assignmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentId) {
      toast.error("Please select an assignment to return.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:4000/api/equipment/return/${assignmentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ returnCondition })
      });

      if (res.ok) {
        toast.success("Equipment successfully returned!");
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        toast.error(`Failed to return: ${errorData.error}`);
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
            Return Equipment
          </h3>
          <button onClick={onClose} type="button" className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div className="space-y-4 mb-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Select Assignment to Return</label>
              <SearchableSelect
                required
                options={allAssignments.map(a => ({ 
                  value: a.id, 
                  label: `${a.equipmentName} (Cond: ${a.equipmentCondition}) - Qty: ${a.quantity}x - Pat ID: ${a.patientId}` 
                }))}
                value={assignmentId || ''}
                onChange={(val) => setAssignmentId(val as number)}
                placeholder="Search active assignments..."
              />
            </div>

            {selectedAssignment && (
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                <p className="text-sm text-blue-900 font-medium mb-1">Currently Assigned To:</p>
                <p className="text-sm text-blue-700">
                  {assignedPatient 
                    ? `${assignedPatient.name} (Patient ID: ${assignedPatient.id})` 
                    : `Patient ID: ${selectedAssignment.patientId} (Name not found)`}
                </p>
                <p className="text-sm text-blue-700 mt-2 font-medium">Quantity to Return: {selectedAssignment.quantity}</p>
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-blue-900">Return Condition</label>
                  <select 
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    className="block w-full rounded-lg border border-blue-300 bg-white p-2.5 text-sm text-blue-900 focus:border-blue-500 focus:ring-blue-500">
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3 rounded-b border-t border-gray-200 pt-4">
            <button type="submit" disabled={isSubmitting || !selectedAssignment}
              className="rounded-lg bg-green-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {isSubmitting ? 'Returning...' : 'Mark as Returned'}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
