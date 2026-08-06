"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingCart, PackageOpen, Plus, Factory } from 'lucide-react';

export default function PurchasesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [orderRes, suppRes] = await Promise.all([
        fetch('http://127.0.0.1:4000/api/purchases/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://127.0.0.1:4000/api/purchases/suppliers', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (orderRes.ok) setOrders(await orderRes.json());
      if (suppRes.ok) setSuppliers(await suppRes.json());
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
          <h1 className="text-2xl font-semibold text-gray-900">Procurement</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage suppliers and track purchase orders for medicines and equipment.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <button className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <Factory className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            Suppliers ({suppliers.length})
          </button>
          <button className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            New Purchase Order
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingCart className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">Active Purchase Orders</h3>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="responsive-table min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 flex flex-col items-center">
                  <PackageOpen className="h-8 w-8 text-gray-300 mb-2" />
                  No purchase orders found.
                </td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td data-label="Order ID" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#PO-{order.id.toString().padStart(4, '0')}</td>
                    <td data-label="Supplier" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.supplier?.name}</td>
                    <td data-label="Date" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                    <td data-label="Amount" className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</td>
                    <td data-label="Status" className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        order.status === 'Received' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td data-label="Actions" className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
