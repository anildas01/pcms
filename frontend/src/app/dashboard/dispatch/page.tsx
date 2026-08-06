"use client";

import React, { useEffect, useState } from 'react';
import { Send, MapPin, CheckCircle, Truck, Clock } from 'lucide-react';

export default function DispatchPage() {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDispatches();
  }, []);

  const fetchDispatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/dispatch`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDispatches(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const returnDispatch = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}`}/api/dispatch/${id}/return`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDispatches();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dispatch Center</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track active vehicle deployments, stock transfers, and field assignments.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex">
          <button className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            <Send className="-ml-1 mr-2 h-5 w-5" />
            New Dispatch
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center">
            <Truck className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">Logistics Feed</h3>
          </div>
        </div>
        
        <ul role="list" className="divide-y divide-gray-200">
          {loading ? (
            <li className="px-4 py-8 text-center text-gray-500">Loading dispatches...</li>
          ) : dispatches.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">No dispatch records found.</li>
          ) : (
            dispatches.map((dispatch) => (
              <li key={dispatch.id} className="px-4 py-5 sm:px-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${dispatch.status === 'Active' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                        <Send className={`h-5 w-5 ${dispatch.status === 'Active' ? 'text-orange-600' : 'text-gray-500'}`} />
                      </span>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-md font-medium text-gray-900">
                        {dispatch.vehicle?.name} <span className="text-gray-400 font-normal">to</span> {dispatch.destination}
                      </h4>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        Driver: {dispatch.driver?.name || 'Unassigned'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      dispatch.status === 'Active' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {dispatch.status}
                    </span>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <Clock className="mr-1 h-3 w-3" />
                      Dispatched: {new Date(dispatch.dispatchTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    {dispatch.status === 'Active' && (
                      <button 
                        onClick={() => returnDispatch(dispatch.id)}
                        className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Mark Returned
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
