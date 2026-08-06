"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Activity, FileText, Pill } from 'lucide-react';

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  status: string;
}

interface HistoryRecord {
  id: string | number;
  date: string;
  type: string;
  description: string;
}

export default function PatientHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // New Record State
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Note',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch Patient Details
      const pRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}/api/patients/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pRes.ok) setPatient(await pRes.json());

      // Fetch History
      const hRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}/api/patients/${patientId}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (hRes.ok) setHistory(await hRes.json());

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}/api/patients/${patientId}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newRecord,
          date: new Date(newRecord.date).toISOString()
        })
      });

      if (res.ok) {
        setIsAdding(false);
        setNewRecord({ date: new Date().toISOString().split('T')[0], type: 'Note', description: '' });
        fetchData();
      } else {
        alert('Failed to add record');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'Diagnosis': return <Activity className="h-5 w-5 text-red-500" />;
      case 'Treatment': return <Pill className="h-5 w-5 text-blue-500" />;
      case 'Home Visit': return <Activity className="h-5 w-5 text-green-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) return <div className="p-8 text-center">Loading patient data...</div>;
  if (!patient) return <div className="p-8 text-center text-red-500">Patient not found</div>;

  return (
    <div>
      <div className="mb-6 flex items-center">
        <button onClick={() => router.back()} className="mr-4 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{patient.name}'s Medical History</h1>
          <p className="text-sm text-gray-500">
            {patient.age} y/o {patient.gender} | Diagnosis: <span className="font-medium text-gray-900">{patient.diagnosis || 'Unknown'}</span> | Status: <span className="font-medium text-blue-600">{patient.status}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Chronological Timeline</h2>
            
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No medical history recorded yet.</p>
            ) : (
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {history.map((record, recordIdx) => (
                    <li key={record.id}>
                      <div className="relative pb-8">
                        {recordIdx !== history.length - 1 ? (
                          <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex items-start space-x-3">
                          <div className="relative">
                            <span className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center ring-8 ring-white border border-gray-200">
                              {getIconForType(record.type)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 py-1.5">
                            <div className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900 mr-2">{record.type}</span>
                              <span className="whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</span>
                            </div>
                            <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-md border border-gray-100">
                              <p>{record.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Action Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow border border-gray-100 p-6 sticky top-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Record</h2>
            
            {!isAdding ? (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <Plus className="mr-2 h-4 w-4" /> Add to Timeline
              </button>
            ) : (
              <form onSubmit={handleAddRecord} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" required
                    value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select required
                    value={newRecord.type} onChange={e => setNewRecord({...newRecord, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="Note">General Note</option>
                    <option value="Diagnosis">Diagnosis Update</option>
                    <option value="Treatment">Treatment Prescribed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={4} required
                    value={newRecord.description} onChange={e => setNewRecord({...newRecord, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter details..." />
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">Save</button>
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
