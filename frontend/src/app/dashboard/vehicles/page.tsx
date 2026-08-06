"use client";

import React, { useEffect, useState } from 'react';
import { Truck, Fuel, ShieldCheck, Wrench, Search, Plus } from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:4000/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setVehicles(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vehicle Fleet</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage ambulances and transport vehicles, track fuel levels and maintenance.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <Wrench className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            Maintenance Log
          </button>
          <button className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Vehicle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-gray-500">Loading fleet...</p>
        ) : vehicles.length === 0 ? (
          <div className="col-span-full bg-white p-8 text-center rounded-lg border border-gray-200 border-dashed">
            <Truck className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding an ambulance or transport van to your fleet.</p>
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{vehicle.name}</h3>
                      <p className="text-xs text-gray-500">{vehicle.type} • {vehicle.plateNumber || 'No Plate'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vehicle.status === 'Available' ? 'bg-green-100 text-green-800' : 
                    vehicle.status === 'In Use' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {vehicle.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center"><Fuel className="h-3 w-3 mr-1"/> Fuel Level</p>
                    <p className="text-sm font-medium text-gray-900">{vehicle.fuelLevel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center"><ShieldCheck className="h-3 w-3 mr-1"/> Assigned Driver</p>
                    <p className="text-sm font-medium text-gray-900">{vehicle.driverId ? `Driver #${vehicle.driverId}` : 'Unassigned'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end">
                <button className="text-sm text-blue-600 font-medium hover:text-blue-500">Edit Details</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
