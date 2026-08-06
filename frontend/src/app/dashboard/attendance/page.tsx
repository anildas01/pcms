"use client";

import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, UserCheck, Calendar } from 'lucide-react';

interface AttendanceRecord {
  id: number;
  userId: number;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function AttendancePage() {
  const [myRecord, setMyRecord] = useState<AttendanceRecord | null>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch my today's record
      const todayRes = await fetch('http://127.0.0.1:4000/api/attendance/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (todayRes.ok) {
        const data = await todayRes.json();
        setMyRecord(data.record);
      }

      // Fetch all records
      const allRes = await fetch('http://127.0.0.1:4000/api/attendance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (allRes.ok) {
        setAllRecords(await allRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:4000/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to clock in');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:4000/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to clock out');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Attendance Tracker</h1>
        <p className="mt-2 text-sm text-gray-700">
          Clock in when you start your shift, and clock out when you finish.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1 bg-white shadow rounded-lg border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
          <Clock className="h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">My Today's Shift</h2>
          
          {!myRecord ? (
            <div className="w-full mt-4">
              <p className="text-sm text-gray-500 mb-4">You have not clocked in today.</p>
              <button 
                onClick={handleClockIn}
                disabled={actionLoading}
                className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Clock In Now'}
              </button>
            </div>
          ) : (
            <div className="w-full mt-2">
              <div className="bg-gray-50 rounded p-3 mb-4 text-left">
                <p className="text-sm text-gray-500">Clocked In</p>
                <p className="font-semibold text-gray-900">
                  {myRecord.clockIn ? new Date(myRecord.clockIn).toLocaleTimeString() : '-'}
                </p>
                
                <p className="text-sm text-gray-500 mt-2">Clocked Out</p>
                <p className="font-semibold text-gray-900">
                  {myRecord.clockOut ? new Date(myRecord.clockOut).toLocaleTimeString() : '-'}
                </p>
              </div>

              {!myRecord.clockOut ? (
                <button 
                  onClick={handleClockOut}
                  disabled={actionLoading}
                  className="w-full bg-orange-600 text-white font-medium py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Clock Out'}
                </button>
              ) : (
                <div className="flex items-center justify-center text-green-600 font-medium">
                  <CheckCircle2 className="h-5 w-5 mr-2" /> Shift Completed
                </div>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-white shadow rounded-lg border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
            <UserCheck className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Recent Attendance Logs</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <table className="responsive-table min-w-full divide-y divide-gray-200">
              <thead className="bg-white sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : allRecords.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No attendance records found.</td></tr>
                ) : (
                  allRecords.map((record) => (
                    <tr key={record.id}>
                      <td data-label="Staff" className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-800 font-medium text-xs">
                              {record.user?.name?.substring(0,2).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{record.user?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td data-label="Date" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td data-label="Clock In" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {record.clockIn ? new Date(record.clockIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                      </td>
                      <td data-label="Clock Out" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.clockOut ? new Date(record.clockOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}
                      </td>
                      <td data-label="Status" className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
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
  );
}
