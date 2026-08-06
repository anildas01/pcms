"use client";

import React, { useEffect, useState } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

interface AuditLog {
  id: number;
  user: {
    name: string;
    email: string;
  } | null;
  module: string;
  action: string;
  oldData: string | null;
  newData: string | null;
  reason: string | null;
  createdAt: string;
}

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/audit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <ShieldAlert className="mr-2 h-6 w-6 text-gray-500" />
          Activity History (Audit Trail)
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          An immutable record of all system activity. Changes to inventory, patients, and financial records are logged here permanently.
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent System Activity
          </h3>
          <button 
            onClick={fetchLogs}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Refresh Logs
          </button>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {loading ? (
              <li className="px-4 py-8 text-center text-gray-500">Loading audit logs...</li>
            ) : logs.length === 0 ? (
              <li className="px-4 py-8 text-center text-gray-500">No activity recorded yet.</li>
            ) : (
              logs.map((log) => (
                <li key={log.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      {log.user?.name || 'System User'} <span className="text-gray-500 font-normal">({log.user?.email || 'unknown'})</span>
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.action === 'Create' || log.action === 'Clock In' ? 'bg-green-100 text-green-800' :
                        log.action === 'Update' || log.action === 'Clock Out' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <Activity className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-gray-700 mr-2">Module:</span> {log.module}
                      </p>
                      {log.reason && (
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                           <span className="font-semibold text-gray-700 mr-2">Reason:</span> {log.reason}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-xs text-gray-500 sm:mt-0">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
