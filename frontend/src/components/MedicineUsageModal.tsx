"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Medicine {
  id: number;
  name: string;
  quantity: number;
  type: string;
}

interface MedicineUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medicineId: number, quantityUsed: number, reason: string) => Promise<void>;
  medicines: Medicine[];
}

export default function MedicineUsageModal({ isOpen, onClose, onSave, medicines }: MedicineUsageModalProps) {
  const [medicineId, setMedicineId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [homeCareSession, setHomeCareSession] = useState('');
  const [isNewSession, setIsNewSession] = useState(false);
  const [knownSessions, setKnownSessions] = useState<string[]>(['Home Care 1', 'Home Care 2']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedSessions = localStorage.getItem('knownHomeCares');
    if (savedSessions) {
      try {
        setKnownSessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error('Failed to parse known home cares from local storage');
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMedicineId('');
      setQuantity('');
      setHomeCareSession('');
      setIsNewSession(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedMed = medicines.find(m => m.id === medicineId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineId || !quantity || quantity <= 0) return;
    
    if (selectedMed && quantity > selectedMed.quantity) {
      alert(`Cannot use more than available stock (${selectedMed.quantity})`);
      return;
    }

    if (isNewSession && homeCareSession.trim()) {
      const updatedSessions = Array.from(new Set([...knownSessions, homeCareSession.trim()]));
      setKnownSessions(updatedSessions);
      localStorage.setItem('knownHomeCares', JSON.stringify(updatedSessions));
    }

    setIsSubmitting(true);
    try {
      const details = homeCareSession.trim() ? ` (Session: ${homeCareSession.trim()})` : '';
      const reason = `Usage: Used ${quantity} ${selectedMed?.type || 'item'}${details}`;
      
      await onSave(medicineId as number, quantity as number, reason);
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
            Record Usage
          </h3>
          <button onClick={onClose} type="button" className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
            <X className="h-5 w-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            
            <div className="sm:col-span-2">
              <label htmlFor="medicineId" className="mb-2 block text-sm font-medium text-gray-900">Select Item</label>
              <select 
                name="medicineId" id="medicineId" required
                value={medicineId} 
                onChange={(e) => setMedicineId(e.target.value ? parseInt(e.target.value) : '')}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600"
              >
                <option value="" disabled>-- Select an item --</option>
                {medicines.filter(m => m.quantity > 0).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} (In Stock: {m.quantity}) - {m.type}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="quantity" className="mb-2 block text-sm font-medium text-gray-900">Quantity Used</label>
              <input type="number" name="quantity" id="quantity" required
                min="1" max={selectedMed ? selectedMed.quantity : undefined}
                value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || '')}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                placeholder="0" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="homeCareSession" className="mb-2 block text-sm font-medium text-gray-900">Home Care Session</label>
              
              {!isNewSession ? (
                <div className="flex gap-2">
                  <select 
                    name="homeCareSession" 
                    id="homeCareSession"
                    value={homeCareSession} 
                    onChange={(e) => setHomeCareSession(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a session...</option>
                    {knownSessions.map((sessionName, idx) => (
                      <option key={idx} value={sessionName}>{sessionName}</option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsNewSession(true);
                      setHomeCareSession('');
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
                    name="homeCareSession" 
                    id="homeCareSession"
                    value={homeCareSession} 
                    onChange={(e) => setHomeCareSession(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500" 
                    placeholder="Enter new home care session..." 
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsNewSession(false);
                      setHomeCareSession('');
                    }}
                    className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

          </div>
          
          <div className="flex items-center space-x-4 border-t pt-4 sm:pt-5">
            <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Record Usage'}
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
