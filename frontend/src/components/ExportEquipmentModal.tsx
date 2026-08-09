"use client";

import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { toast } from 'sonner';

interface ExportEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentData: any[];
}

export default function ExportEquipmentModal({ isOpen, onClose, equipmentData }: ExportEquipmentModalProps) {
  const [selectedEquipmentName, setSelectedEquipmentName] = useState<string>('');
  const [condition, setCondition] = useState<string>('All');
  const [assignmentStatus, setAssignmentStatus] = useState<string>('All');
  const [assignedById, setAssignedById] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleDownload = () => {
    if (equipmentData.length === 0) {
      toast.error('No equipment data to download');
      return;
    }

    let filteredData = [...equipmentData];

    // Filter by single equipment
    if (selectedEquipmentName) {
      filteredData = filteredData.filter(eq => eq.name === selectedEquipmentName);
    }

    // Filter by condition
    if (condition !== 'All') {
      filteredData = filteredData.filter(eq => eq.condition === condition);
    }

    // Filter by assignment status
    if (assignmentStatus === 'Assigned Only') {
      filteredData = filteredData.filter(eq => eq.assignments && eq.assignments.length > 0 && eq.assignments.some((a: any) => a.status === 'In Use'));
    } else if (assignmentStatus === 'Unassigned Only') {
      filteredData = filteredData.filter(eq => !eq.assignments || eq.assignments.length === 0 || !eq.assignments.some((a: any) => a.status === 'In Use'));
    }

    // Prepare headers
    const headers = ['ID', 'Name', 'Type', 'Condition', 'Quantity', 'Available Now', 'Assigned To', 'Date Added'];
    const csvRows = [headers.join(',')];

    filteredData.forEach(item => {
      // Filter the assignments to include in the CSV string
      let activeAssignments = (item.assignments || []).filter((a: any) => a.status === 'In Use');

      // Filter assignments by assigned person
      if (assignedById) {
        activeAssignments = activeAssignments.filter((a: any) => a.assignedById === assignedById);
      }

      // Filter assignments by date range
      if (startDate) {
        const start = new Date(startDate).getTime();
        activeAssignments = activeAssignments.filter((a: any) => new Date(a.assignedAt).getTime() >= start);
      }
      if (endDate) {
        const end = new Date(endDate).getTime();
        // Set end time to end of day
        const endObj = new Date(end);
        endObj.setHours(23, 59, 59, 999);
        activeAssignments = activeAssignments.filter((a: any) => new Date(a.assignedAt).getTime() <= endObj.getTime());
      }

      // If the user filtered by assignment criteria but this item has no matching assignments left, skip it if "Assigned Only" is active
      if ((assignedById || startDate || endDate) && activeAssignments.length === 0 && assignmentStatus === 'Assigned Only') {
        return; // Skip this equipment in the export
      }

      const assignedToStr = activeAssignments.length > 0
        ? activeAssignments.map((a: any) => `${a.quantity}x to ${a.patient?.name || `ID: ${a.patientId}`} (On: ${new Date(a.assignedAt).toLocaleDateString()})`).join('; ')
        : 'None';
      
      const row = [
        item.id,
        `"${item.name}"`,
        `"${item.type}"`,
        `"${item.condition}"`,
        item.quantity,
        item.availableNow,
        `"${assignedToStr}"`,
        `"${item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}"`
      ];
      csvRows.push(row.join(','));
    });

    if (csvRows.length <= 1) {
      toast.error('No data matches the selected filters');
      return;
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `equipment_filtered_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4 sm:p-5">
          <h3 className="text-xl font-semibold text-gray-900">
            Export to CSV
          </h3>
          <button onClick={onClose} type="button" className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">Select Specific Equipment</label>
            <SearchableSelect
              options={[{ value: '', label: 'All Equipment' }, ...Array.from(new Set(equipmentData.map(eq => eq.name))).sort().map(name => ({ value: name, label: name }))]}
              value={selectedEquipmentName}
              onChange={(val) => setSelectedEquipmentName(val as string)}
              placeholder="Search equipment..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Condition</label>
              <select 
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="All">All</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Assignment Status</label>
              <select 
                value={assignmentStatus}
                onChange={(e) => setAssignmentStatus(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="All">All</option>
                <option value="Assigned Only">Assigned Only</option>
                <option value="Unassigned Only">Unassigned Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">Assigned By Person (Optional)</label>
            <SearchableSelect
              options={[{ value: '', label: 'Anyone' }, ...users.map(u => ({ value: u.id, label: u.name }))]}
              value={assignedById || ''}
              onChange={(val) => setAssignedById(val as number || null)}
              placeholder="Search staff..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Assigned After</label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">Assigned Before</label>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

        </div>
        
        <div className="flex items-center space-x-3 rounded-b border-t border-gray-200 p-4 sm:p-5">
          <button type="button" onClick={handleDownload}
            className="inline-flex items-center rounded-lg bg-green-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700">
            <Download className="mr-2 h-4 w-4" /> Download CSV
          </button>
          <button type="button" onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
