"use client";

import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import PatientModal from '@/components/PatientModal';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  diagnosis: string;
  medicalPapers?: string;
  status: string;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Delete state
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleteKeyword, setDeleteKeyword] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePatient = async (patientData: any) => {
    const token = localStorage.getItem('token');
    const isEdit = !!patientData.id;
    const url = isEdit 
      ? `${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}/api/patients/${patientData.id}` 
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/patients`;
      
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(patientData)
    });

    if (res.ok) {
      toast.success(`Patient successfully ${isEdit ? 'updated' : 'added'}!`);
      fetchPatients();
    } else {
      const errorData = await res.json();
      toast.error(`Error saving patient: ${errorData.error || 'Unknown error'}`);
      throw new Error('Failed to save');
    }
  };

  const executeDelete = async () => {
    if (!patientToDelete) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}/api/patients/${patientToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Patient ${patientToDelete.name} was successfully deleted.`);
        fetchPatients();
        setPatientToDelete(null);
        setDeleteKeyword('');
      } else {
        const errData = await res.json();
        toast.error(`Failed to delete patient: ${errData.error || 'Unknown error'}`);
        setPatientToDelete(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while deleting patient');
      setPatientToDelete(null);
    }
  };

  const openAddModal = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Patient Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all patients currently enrolled or previously discharged in the Palliative Care system.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Patient
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
                      Patient Details
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Diagnosis
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Contact
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-gray-500">Loading patients...</td>
                    </tr>
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-gray-500">No patients found. Click 'Add Patient' to get started.</td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id}>
                        <td data-label="Patient Details" className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{patient.name}</span>
                            <span className="text-gray-500 text-xs">{patient.age} yrs • {patient.gender}</span>
                          </div>
                        </td>
                        <td data-label="Diagnosis" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {patient.diagnosis || 'N/A'}
                        </td>
                        <td data-label="Contact" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex flex-col">
                            <span>{patient.phone || 'N/A'}</span>
                            <span className="text-xs truncate max-w-[150px]" title={patient.address}>{patient.address}</span>
                          </div>
                        </td>
                        <td data-label="Status" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            patient.status === 'Active' ? 'bg-green-100 text-green-800' :
                            patient.status === 'Discharged' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {patient.status}
                          </span>
                        </td>
                        <td data-label="Actions" className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button 
                            onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                            title="View Medical History"
                          >
                            History
                          </button>
                          <button 
                            onClick={() => {
                              setEditingPatient(patient);
                              setIsModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              setPatientToDelete(patient);
                              setDeleteKeyword('');
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
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

      {/* Delete Confirmation Modal using Shadcn */}
      <AlertDialog open={!!patientToDelete} onOpenChange={(open) => {
        if (!open) {
          setPatientToDelete(null);
          setDeleteKeyword('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete Patient
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{patientToDelete?.name}</strong>? This action cannot be undone. All medical history and invoices will also be permanently deleted.
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
            <AlertDialogCancel onClick={() => setPatientToDelete(null)}>Cancel</AlertDialogCancel>
            <Button 
              variant="destructive"
              onClick={executeDelete} 
              disabled={deleteKeyword.trim().toUpperCase() !== 'DELETE'}
            >
              Confirm Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Patient Modal */}
      {isModalOpen && (
        <PatientModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSavePatient}
          initialData={editingPatient}
        />
      )}
    </div>
  );
}
