"use client";

import React, { useEffect, useState } from 'react';
import { ClipboardList, UserCircle2, Clock, CheckCircle, Plus } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setTasks(await res.json());
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
          <h1 className="text-2xl font-semibold text-gray-900">Tasks & Volunteers</h1>
          <p className="mt-2 text-sm text-gray-700">
            Assign and track tasks for volunteers and staff members.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex">
          <button className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Assign Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Column */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
              Pending
            </h3>
            <span className="bg-gray-200 text-gray-700 text-xs py-1 px-2 rounded-full font-medium">
              {tasks.filter(t => t.status === 'Pending').length}
            </span>
          </div>
          <div className="space-y-4">
            {loading ? <p className="text-sm text-gray-500 text-center">Loading...</p> : 
             tasks.filter(t => t.status === 'Pending').map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              In Progress
            </h3>
            <span className="bg-gray-200 text-gray-700 text-xs py-1 px-2 rounded-full font-medium">
              {tasks.filter(t => t.status === 'In Progress').length}
            </span>
          </div>
          <div className="space-y-4">
            {tasks.filter(t => t.status === 'In Progress').map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Completed
            </h3>
            <span className="bg-gray-200 text-gray-700 text-xs py-1 px-2 rounded-full font-medium">
              {tasks.filter(t => t.status === 'Completed').length}
            </span>
          </div>
          <div className="space-y-4">
            {tasks.filter(t => t.status === 'Completed').map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow transition-shadow">
      <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-600">
          <UserCircle2 className="h-4 w-4 mr-1 text-gray-400" />
          {task.assignee ? task.assignee.name : 'Unassigned'}
        </div>
        {task.dueDate && (
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
