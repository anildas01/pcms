"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface Medicine {
  id: number;
  quantity: number;
}

interface Equipment {
  id: number;
  action: 'Given' | 'Taken Back';
}

interface Visit {
  id?: number;
  patientId: number;
  nurseId: number;
  date: string;
  notes?: string;
  medicines: Medicine[];
  equipment: Equipment[];
}

interface VisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (visit: Visit) => Promise<void>;
  initialData?: any | null;
}

export default function VisitModal({ isOpen, onClose, onSave, initialData }: VisitModalProps) {
  const [formData, setFormData] = useState<Visit>(
    initialData ? {
      id: initialData.id,
      patientId: initialData.patientId,
      nurseId: initialData.nurseId,
      date: initialData.date,
      notes: initialData.notes || '',
      medicines: initialData.medicines ? initialData.medicines.map((m: any) => ({ id: m.medicineId || m.medicine?.id || m.id, quantity: m.quantity })) : [],
      equipment: initialData.equipment ? initialData.equipment.map((e: any) => ({ id: e.equipmentId || e.equipment?.id || e.id, action: e.action })) : []
    } : {
      patientId: 0,
      nurseId: 0,
      date: '',
      notes: '',
      medicines: [],
      equipment: []
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [nurses, setNurses] = useState<any[]>([]);
  const [dbMedicines, setDbMedicines] = useState<any[]>([]);
  const [dbEquipment, setDbEquipment] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [pRes, nRes, mRes, eRes] = await Promise.all([
        fetch('http://127.0.0.1:4000/api/patients', { headers }),
        fetch('http://127.0.0.1:4000/api/users', { headers }),
        fetch('http://127.0.0.1:4000/api/medicines', { headers }),
        fetch('http://127.0.0.1:4000/api/equipment', { headers })
      ]);
      
      if (pRes.ok) setPatients(await pRes.json());
      if (nRes.ok) {
        const users = await nRes.json();
        setNurses(users.filter((u: any) => u.role?.name === 'Nurse' || u.role?.name === 'Admin' || u.role?.name === 'Doctor'));
      }
      if (mRes.ok) setDbMedicines(await mRes.json());
      if (eRes.ok) setDbEquipment(await eRes.json());
    } catch (error) {
      console.error("Failed to fetch data for modal", error);
      setFetchError("Failed to load select options.");
    }
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'patientId' || name === 'nurseId') ? parseInt(value) || 0 : value
    }));
  };

  // Medicine handlers
  const addMedicine = () => setFormData(prev => ({ ...prev, medicines: [...prev.medicines, { id: 0, quantity: 1 }] }));
  const updateMedicine = (index: number, field: string, value: number) => {
    const newMeds = [...formData.medicines];
    newMeds[index] = { ...newMeds[index], [field]: value } as Medicine;
    setFormData(prev => ({ ...prev, medicines: newMeds }));
  };
  const removeMedicine = (index: number) => setFormData(prev => ({ ...prev, medicines: prev.medicines.filter((_, i) => i !== index) }));

  // Equipment handlers
  const addEquipment = () => setFormData(prev => ({ ...prev, equipment: [...prev.equipment, { id: 0, action: 'Given' }] }));
  const updateEquipment = (index: number, field: string, value: any) => {
    const newEq = [...formData.equipment];
    newEq[index] = { ...newEq[index], [field]: value } as Equipment;
    setFormData(prev => ({ ...prev, equipment: newEq }));
  };
  const removeEquipment = (index: number) => setFormData(prev => ({ ...prev, equipment: prev.equipment.filter((_, i) => i !== index) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.nurseId || !formData.date) {
      alert("Please fill all required fields");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const validMeds = formData.medicines.filter(m => m.id > 0 && m.quantity > 0);
      const validEq = formData.equipment.filter(e => e.id > 0);
      
      const submissionData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        medicines: validMeds,
        equipment: validEq
      };
      
      await onSave(submissionData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 p-4">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b p-4 sm:p-5 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Visit' : 'Add Visit'}
          </h3>
          <button onClick={onClose} type="button" className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        {fetchError && <div className="p-4 text-sm text-red-600 bg-red-50">{fetchError}</div>}

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            
            <div className="sm:col-span-2">
              <label htmlFor="patientId" className="mb-2 block text-sm font-medium text-gray-900">Patient *</label>
              <SearchableSelect
                required
                options={patients.map(p => ({ value: p.id, label: `${p.name} (ID: ${p.id})` }))}
                value={formData.patientId || ''}
                onChange={(val) => setFormData(prev => ({ ...prev, patientId: val as number }))}
                placeholder="Select a patient..."
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="nurseId" className="mb-2 block text-sm font-medium text-gray-900">Assigned Nurse *</label>
              <SearchableSelect
                required
                options={nurses.map(n => ({ value: n.id, label: `${n.name} (${n.role?.name})` }))}
                value={formData.nurseId || ''}
                onChange={(val) => setFormData(prev => ({ ...prev, nurseId: val as number }))}
                placeholder="Select a nurse..."
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="date" className="mb-2 block text-sm font-medium text-gray-900">Date & Time *</label>
              <input type="datetime-local" name="date" id="date" required
                value={formData.date ? new Date(formData.date).toISOString().slice(0,16) : ''} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="notes" className="mb-2 block text-sm font-medium text-gray-900">Notes (Optional)</label>
              <textarea name="notes" id="notes" rows={2}
                value={formData.notes} onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500" 
                placeholder="Write any instructions or visit notes..."></textarea>
            </div>

          </div>

          {isEdit && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-sm mb-4">
              Note: Medicines and Equipment cannot be modified after the visit is saved to protect inventory tracking.
            </div>
          )}

          <>
            {/* Medicine Inventory Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-900">Medicines (Optional)</h4>
                {!isEdit && (
                  <button type="button" onClick={addMedicine} className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800">
                    <Plus className="h-4 w-4 mr-1" /> Add Medicine
                  </button>
                )}
              </div>
              {formData.medicines.map((med, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <div className="flex-1">
                    <SearchableSelect
                      required
                      options={dbMedicines.map(m => ({ value: m.id, label: `${m.name} (Stock: ${m.quantity} ${m.unit})` }))}
                      value={med.id || ''}
                      onChange={(val) => !isEdit && updateMedicine(index, 'id', val as number)}
                      placeholder="Select Medicine..."
                    />
                  </div>
                  <input
                    type="number" required min="1" disabled={isEdit}
                    value={med.quantity || ''}
                    onChange={(e) => updateMedicine(index, 'quantity', parseInt(e.target.value))}
                    placeholder="Qty"
                    className="w-24 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 disabled:opacity-75 disabled:bg-gray-100"
                  />
                  {!isEdit && (
                    <button type="button" onClick={() => removeMedicine(index)} className="text-red-500 p-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {formData.medicines.length === 0 && <p className="text-sm text-gray-500 italic">No medicines added.</p>}
            </div>

            {/* Equipment Inventory Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-900">Equipment (Optional)</h4>
                {!isEdit && (
                  <button type="button" onClick={addEquipment} className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800">
                    <Plus className="h-4 w-4 mr-1" /> Add Equipment
                  </button>
                )}
              </div>
              {formData.equipment.map((eq, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <div className="flex-1">
                    <SearchableSelect
                      required
                      options={dbEquipment.map(e => ({ value: e.id, label: `${e.name} (${e.status})` }))}
                      value={eq.id || ''}
                      onChange={(val) => !isEdit && updateEquipment(index, 'id', val as number)}
                      placeholder="Select Equipment..."
                    />
                  </div>
                  <select
                    required disabled={isEdit}
                    value={eq.action}
                    onChange={(e) => updateEquipment(index, 'action', e.target.value)}
                    className="w-32 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600 disabled:opacity-75 disabled:bg-gray-100"
                  >
                    <option value="Given">Given</option>
                    <option value="Taken Back">Taken Back</option>
                  </select>
                  {!isEdit && (
                    <button type="button" onClick={() => removeEquipment(index)} className="text-red-500 p-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {formData.equipment.length === 0 && <p className="text-sm text-gray-500 italic">No equipment added.</p>}
            </div>
          </>

          <div className="flex items-center space-x-3 rounded-b border-t border-gray-200 pt-4 sticky bottom-0 bg-white">
            <button type="submit" disabled={isSubmitting}
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Visit')}
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
