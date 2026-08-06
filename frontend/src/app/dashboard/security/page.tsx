"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Monitor, Smartphone, Globe, LogOut } from 'lucide-react';

export default function SecurityPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:4000/api/security/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:4000/api/security/sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Basic device detection based on User-Agent string
  const getDeviceIcon = (userAgent: string) => {
    if (!userAgent) return <Globe className="h-6 w-6 text-gray-400" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-6 w-6 text-gray-500" />;
    }
    return <Monitor className="h-6 w-6 text-gray-500" />;
  };

  const formatDeviceName = (userAgent: string) => {
    if (!userAgent) return 'Unknown Device';
    if (userAgent.includes('Edg')) return 'Microsoft Edge';
    if (userAgent.includes('Chrome')) return 'Google Chrome';
    if (userAgent.includes('Firefox')) return 'Mozilla Firefox';
    if (userAgent.includes('Safari')) return 'Apple Safari';
    return userAgent.split(' ')[0] || 'Unknown Browser';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Account Security</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage your active sessions and secure your account.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Device Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow sm:rounded-lg border border-gray-100">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <ShieldCheck className="mr-2 h-5 w-5 text-green-500" /> Active Devices
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  You're currently logged in to these devices. If you don't recognize a device, revoke access immediately.
                </p>
              </div>
            </div>
            
            <ul role="list" className="divide-y divide-gray-200">
              {loading ? (
                <li className="px-4 py-6 text-center text-gray-500 text-sm">Loading sessions...</li>
              ) : sessions.length === 0 ? (
                <li className="px-4 py-6 text-center text-gray-500 text-sm">No active sessions found.</li>
              ) : (
                sessions.map((session, index) => (
                  <li key={session.id} className={`px-4 py-5 sm:px-6 ${index === 0 ? 'bg-blue-50/30' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-gray-100 p-3 rounded-full">
                          {getDeviceIcon(session.device)}
                        </div>
                        <div className="ml-4">
                          <h4 className="text-md font-medium text-gray-900 flex items-center">
                            {formatDeviceName(session.device)} 
                            {index === 0 && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                This Device
                              </span>
                            )}
                          </h4>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            IP: {session.ipAddress || 'Unknown'} &bull; Last Active: {new Date(session.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {index !== 0 && (
                        <button 
                          onClick={() => revokeSession(session.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-200 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none"
                        >
                          <LogOut className="h-3 w-3 mr-1" /> Revoke
                        </button>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* 2FA Stubs */}
        <div className="space-y-6">
          <div className="bg-white shadow sm:rounded-lg border border-gray-100">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Two-Factor Authentication</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <p className="text-sm text-gray-600 mb-4">
                Add an extra layer of security to your account by enabling Two-Factor Authentication (2FA).
              </p>
              
              <div className="flex items-center justify-between py-4 border-t border-gray-100">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Email OTP</h4>
                  <p className="text-xs text-gray-500">Receive a one-time code via email.</p>
                </div>
                <button type="button" className="bg-gray-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-not-allowed transition-colors ease-in-out duration-200 focus:outline-none">
                  <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200" />
                </button>
              </div>

              <div className="flex items-center justify-between py-4 border-t border-gray-100">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">SMS OTP</h4>
                  <p className="text-xs text-gray-500">Receive a code on your registered phone.</p>
                </div>
                <button type="button" className="bg-gray-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-not-allowed transition-colors ease-in-out duration-200 focus:outline-none">
                  <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200" />
                </button>
              </div>
              
              <div className="mt-4 bg-yellow-50 p-3 rounded text-xs text-yellow-800">
                2FA features are currently disabled by the system administrator.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
