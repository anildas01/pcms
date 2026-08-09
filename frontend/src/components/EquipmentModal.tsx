"use client";

import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface Equipment {
  id?: number;
  name: string;
  type: string;
  quantity?: number;
  condition?: string;
  conditions?: Record<string, number>;
}

interface EquipmentItem {
  type: string; // Equipment number
  condition: string;
}

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  // We will pass either a single Equipment (for edits) or an array of Equipment (for bulk creates)
  onSave: (equipment: Equipment | Equipment[]) => Promise<void>;
  initialData?: Equipment | null;
}

export default function EquipmentModal({ isOpen, onClose, onSave, initialData }: EquipmentModalProps) {
  // State for the common name
  const [name, setName] = useState(initialData?.name || '');
  
  // State for the dynamic list (only used for creating)
  const [items, setItems] = useState<EquipmentItem[]>([]);
  
  // Temporary state for the new item being added to the list
  const [newNumber, setNewNumber] = useState('');
  const [newCondition, setNewCondition] = useState('Good');
  
  // State for single edit mode
  const [editNumber, setEditNumber] = useState(initialData?.type || '');
  const [editCondition, setEditCondition] = useState(initialData?.condition || 'Good');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!newNumber.trim()) return;
    if (items.some(item => item.type.toLowerCase() === newNumber.trim().toLowerCase())) {
      alert("This equipment number has already been added to the list.");
      return;
    }
    setItems([...items, { type: newNumber.trim(), condition: newCondition }]);
    setNewNumber('');
    setNewCondition('Good');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter an equipment name.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialData) {
        // Editing an existing single piece of equipment
        await onSave({
          ...initialData,
          name,
          type: editNumber,
          condition: editCondition
        });
      } else {
        // Creating new equipment
        if (items.length === 0) {
          alert("Please add at least one equipment number.");
          setIsSubmitting(false);
          return;
        }
        
        // Construct an array of equipments to save
        const bulkEquipments: Equipment[] = items.map(item => ({
          name,
          type: item.type,
          quantity: 1,
          condition: item.condition
        }));
        
        await onSave(bulkEquipments);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 p-4">
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b p-4 sm:p-5 shrink-0 bg-white z-10 rounded-t-lg">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Equipment' : 'Add Equipment'}
          </h3>
          <button onClick={onClose} type="button" className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
            <X className="h-5 w-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-grow">
          <div className="p-4 sm:p-5 overflow-y-auto">
            <div className="grid gap-4 mb-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-900">Equipment Name</label>
                <input type="text" name="name" id="name" required
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                  placeholder="e.g. Wheelchair, Oxygen Concentrator" />
              </div>

              {!initialData ? (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col min-h-0">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Add Equipment Numbers</h4>
                  
                  <div className="flex gap-2 items-end mb-4 shrink-0">
                    <div className="flex-grow">
                      <label className="block text-xs text-gray-700 mb-1">Equipment Number / ID</label>
                      <input type="text" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} 
                        onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
                        placeholder="e.g. WC-001"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Condition</label>
                      <select value={newCondition} onChange={(e) => setNewCondition(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border text-gray-900">
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>
                    <button type="button" onClick={handleAddItem} disabled={!newNumber.trim()}
                      className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center h-[38px]">
                      <Plus className="h-4 w-4" /> Add
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {items.length === 0 ? (
                      <p className="text-xs text-gray-500 italic text-center py-2">No equipment numbers added yet.</p>
                    ) : (
                      items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white border border-gray-200 p-2 rounded text-sm">
                          <div>
                            <span className="font-medium text-gray-900">{item.type}</span>
                            <span className="text-gray-500 ml-2">({item.condition})</span>
                          </div>
                          <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">Equipment Number / ID</label>
                    <input type="text" required
                      value={editNumber} onChange={(e) => setEditNumber(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                      placeholder="e.g. WC-001" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">Condition</label>
                    <select value={editCondition} onChange={(e) => setEditCondition(e.target.value)}
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
          </div>
          
          <div className="flex items-center space-x-3 rounded-b-lg border-t border-gray-200 p-4 sm:p-5 bg-gray-50 shrink-0">
            <button type="submit" disabled={isSubmitting}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : `Save ${items.length > 0 ? items.length : ''} Equipment`)}
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
