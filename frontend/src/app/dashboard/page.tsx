"use client";

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Stethoscope, 
  AlertCircle, 
  Home 
} from 'lucide-react';

export default function Dashboard() {
  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    lowStockMedicines: 0,
    activeEquipment: 0,
    todaysVisits: 0
  });
  const [upcomingVisits, setUpcomingVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch Stats
      const statsRes = await fetch('http://127.0.0.1:4000/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStatsData(data);
      }

      // Fetch Visits for the upcoming list
      const visitsRes = await fetch('http://127.0.0.1:4000/api/visits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (visitsRes.ok) {
        const visits = await visitsRes.json();
        // Filter to future scheduled visits and take top 3
        const future = visits.filter((v: any) => v.status === 'Scheduled' && new Date(v.date) > new Date());
        setUpcomingVisits(future.slice(0, 3));
      }

    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const displayStats = [
    { name: 'Active Patients', stat: statsData.totalPatients.toString(), icon: Users, change: 'Total tracked', changeType: 'neutral' },
    { name: 'Today\'s Home Visits', stat: statsData.todaysVisits.toString(), icon: Home, change: 'Scheduled', changeType: 'neutral' },
    { name: 'Active Equipment', stat: statsData.activeEquipment.toString(), icon: Stethoscope, change: 'Currently in use', changeType: 'neutral' },
    { name: 'Low Stock Medicines', stat: statsData.lowStockMedicines.toString(), icon: AlertCircle, change: 'Requires Attention', changeType: statsData.lowStockMedicines > 0 ? 'decrease' : 'neutral' },
  ];

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {displayStats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:pt-6 border border-gray-100"
          >
            <dt>
              <div className="absolute rounded-md bg-blue-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-1">
              <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.changeType === 'increase' ? 'text-green-600' : item.changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Home Visits</h2>
          <div className="space-y-4">
            {upcomingVisits.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming visits scheduled.</p>
            ) : (
              upcomingVisits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {visit.patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{visit.patient.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]" title={visit.patient.address}>{visit.patient.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(visit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">Assigned to: {visit.nurse.name}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {[
                { content: 'New patient registered', target: 'Alice Smith', date: '1h ago' },
                { content: 'Equipment requested', target: 'Oxygen Cylinder', date: '3h ago' },
                { content: 'Stock refilled', target: 'Morphine 10mg', date: '5h ago' },
              ].map((event, eventIdx) => (
                <li key={eventIdx}>
                  <div className="relative pb-8">
                    {eventIdx !== 2 ? (
                      <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center ring-8 ring-white">
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-500">
                            {event.content} <span className="font-medium text-gray-900">{event.target}</span>
                          </p>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          <time dateTime={event.date}>{event.date}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
