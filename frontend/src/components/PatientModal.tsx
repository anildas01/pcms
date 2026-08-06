"use client";

import React, { useState } from 'react';
import { X, Upload, FileImage, XCircle } from 'lucide-react';

interface Patient {
  id?: number;
  name: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  phone: string;
  address: string;
  diagnosis?: string;
  medicalPapers?: string;
  status: string;
}

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => Promise<void>;
  initialData?: Patient | null;
}

export default function PatientModal({ isOpen, onClose, onSave, initialData }: PatientModalProps) {
  const [formData, setFormData] = useState<Patient>(
    initialData || {
      name: '',
      age: 0,
      gender: '',
      bloodGroup: 'Unknown',
      phone: '',
      address: '',
      diagnosis: '',
      medicalPapers: '',
      status: 'Active'
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];
    
    const token = localStorage.getItem('token');
    const uploadData = new FormData();
    selectedFiles.forEach(file => {
      uploadData.append('files', file);
    });

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: uploadData
    });

    if (!res.ok) {
      throw new Error('Failed to upload images');
    }

    const data = await res.json();
    return data.urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalMedicalPapers = formData.medicalPapers || '';
      
      if (selectedFiles.length > 0) {
        const uploadedUrls = await uploadImages();
        const urlsString = uploadedUrls.join(',');
        finalMedicalPapers = finalMedicalPapers ? `${finalMedicalPapers},${urlsString}` : urlsString;
      }

      const updatedFormData = { ...formData, medicalPapers: finalMedicalPapers };
      await onSave(updatedFormData);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error uploading files or saving patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 p-4">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 sm:p-5 shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Patient' : 'Add New Patient'}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <form id="patient-form" onSubmit={handleSubmit} className="p-4 sm:p-5">
            <div className="grid gap-4 mb-4 sm:grid-cols-2">
              
              <div className="sm:col-span-2">
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-900">Full Name</label>
                <input type="text" name="name" id="name" required
                  value={formData.name} onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                  placeholder="Type patient's full name" />
              </div>

              <div>
                <label htmlFor="age" className="mb-2 block text-sm font-medium text-gray-900">Age</label>
                <input type="number" name="age" id="age" min="0"
                  value={formData.age || ''} onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                  placeholder="Age" />
              </div>

              <div>
                <label htmlFor="gender" className="mb-2 block text-sm font-medium text-gray-900">Gender</label>
                <select name="gender" id="gender"
                  value={formData.gender || ''} onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="bloodGroup" className="mb-2 block text-sm font-medium text-gray-900">Blood Group</label>
                <select name="bloodGroup" id="bloodGroup"
                  value={formData.bloodGroup || 'Unknown'} onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                  <option value="Unknown">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-900">Phone</label>
                <input type="text" name="phone" id="phone" required
                  value={formData.phone} onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                  placeholder="+1 234 567 890" />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-900">Status</label>
                <select name="status" id="status" required
                  value={formData.status} onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                  <option value="Active">Active</option>
                  <option value="Discharged">Discharged</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="mb-2 block text-sm font-medium text-gray-900">Address</label>
                <input type="text" name="address" id="address" required
                  value={formData.address} onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600" 
                  placeholder="Patient's home address" />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="diagnosis" className="mb-2 block text-sm font-medium text-gray-900">Diagnosis</label>
                <textarea name="diagnosis" id="diagnosis" rows={3}
                  value={formData.diagnosis || ''} onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500" 
                  placeholder="Write patient diagnosis here..."></textarea>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-900">Medical Papers & Photos</label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or capture from camera</p>
                      <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 10MB)</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" accept="image/*" multiple capture="environment" onChange={handleFileChange} />
                  </label>
                </div>
                
                {previewUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group rounded-md border p-1 bg-white">
                        <img src={url} alt={`Preview ${index}`} className="h-20 w-full object-cover rounded" />
                        <button 
                          type="button" 
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {formData.medicalPapers && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Existing Documents:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                      {formData.medicalPapers.split(',').map((url, i) => (
                        <div key={`existing-${i}`} className="relative rounded-md border p-1 bg-white">
                          <img src={`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}${url}`} alt="Existing doc" className="h-20 w-full object-cover rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="flex items-center space-x-3 rounded-b border-t border-gray-200 p-4 sm:p-5 shrink-0 bg-gray-50">
          <button form="patient-form" type="submit" disabled={isSubmitting}
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50">
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Patient')}
          </button>
          <button type="button" onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
