"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [showNotifs, setShowNotifs] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const notifRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://127.0.0.1:4000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://127.0.0.1:4000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // update local state instantly
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 shadow-sm">
      <div className="flex items-center flex-1">
        <button
          type="button"
          className="mr-4 text-gray-500 hover:text-gray-900 focus:outline-none md:hidden"
          onClick={onMenuClick}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <form className="flex w-full max-w-lg items-center" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">Search</label>
          <div className="relative w-full text-gray-400 focus-within:text-gray-600">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
              <Search className="h-5 w-5" aria-hidden="true" />
            </div>
            <input
              id="search-field"
              className="block h-full w-full border-transparent py-2 pl-8 pr-3 text-gray-900 placeholder-gray-500 focus:border-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
              placeholder="Search patients, medicines, or staff..."
              type="search"
              name="search"
            />
          </div>
        </form>
      </div>
      <div className="ml-4 flex items-center space-x-4">
        
        {/* NOTIFICATIONS DROPDOWN */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>
          
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-md">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                  {notifications.filter(n => !n.isRead).length} New
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500 text-center">You have no notifications.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-4 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && <span className="h-2 w-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center text-sm text-gray-600 hover:text-red-600 font-medium transition-colors border border-gray-200 rounded-md px-3 py-1.5 shadow-sm bg-gray-50 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:block">Log out</span>
        </button>
      </div>
    </header>
  );
}
