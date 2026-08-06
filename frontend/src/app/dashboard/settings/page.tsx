"use client";

import React, { useEffect, useState } from 'react';
import { Save, Server, ShieldCheck, Mail, Building2, UploadCloud } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSettings(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key, value })
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const triggerBackup = async () => {
    setBackupMsg('Backing up database...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/settings/backup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBackupMsg(data.message);
        setTimeout(() => setBackupMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setBackupMsg('Backup failed!');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage global organization details and secure your database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow sm:rounded-lg border border-gray-100">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Building2 className="mr-2 h-5 w-5 text-gray-500" /> Organization Profile
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {loading ? <p className="text-sm text-gray-500">Loading settings...</p> : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                    <input 
                      type="text" 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={settings.orgName || ''}
                      onChange={(e) => setSettings({...settings, orgName: e.target.value})}
                      onBlur={(e) => handleSave('orgName', e.target.value)}
                      placeholder="e.g. CareFlow Palliative Center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input 
                      type="email" 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={settings.contactEmail || ''}
                      onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                      onBlur={(e) => handleSave('contactEmail', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone Number</label>
                    <input 
                      type="text" 
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={settings.contactPhone || ''}
                      onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                      onBlur={(e) => handleSave('contactPhone', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center text-sm text-gray-500 pt-2">
                    <Save className="h-4 w-4 mr-1 text-gray-400" />
                    Changes are auto-saved when you click away. {saving && <span className="ml-2 text-blue-500">Saving...</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security & Backup */}
        <div className="space-y-6">
          <div className="bg-white shadow sm:rounded-lg border border-gray-100">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Server className="mr-2 h-5 w-5 text-gray-500" /> Backup & Recovery
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-sm text-gray-600 mb-6">
                Trigger a manual backup of the entire SQLite database. It is highly recommended to do this weekly.
              </p>
              <button 
                onClick={triggerBackup}
                disabled={backupMsg !== ''}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
              >
                <UploadCloud className="mr-2 h-4 w-4" /> Create Backup
              </button>
              {backupMsg && (
                <p className={`mt-3 text-sm font-medium ${backupMsg.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
                  {backupMsg}
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
