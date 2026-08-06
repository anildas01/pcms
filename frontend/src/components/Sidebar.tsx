"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Pill, 
  Stethoscope, 
  UserSquare2, 
  Home, 
  Settings,
  HeartHandshake,
  X,
  FileText,
  Clock,
  ShieldAlert,
  Truck,
  ShoppingCart,
  ClipboardList,
  Send,
  BarChart3,
  Lock
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patient Management', href: '/dashboard/patients', icon: UserSquare2 },
  { name: 'Medicine Inventory', href: '/dashboard/medicines', icon: Pill },
  { name: 'Equipment Inventory', href: '/dashboard/equipment', icon: Stethoscope },
  { name: 'Home Visits', href: '/dashboard/visits', icon: Home },
  { name: 'Vehicle Fleet', href: '/dashboard/vehicles', icon: Truck },
  { name: 'Billing & Invoices', href: '/dashboard/billing', icon: FileText },
  { name: 'Procurement', href: '/dashboard/purchases', icon: ShoppingCart },
  { name: 'Staff & Volunteers', href: '/dashboard/users', icon: Users },
  { name: 'Tasks & Volunteers', href: '/dashboard/tasks', icon: ClipboardList },
  { name: 'Dispatch Center', href: '/dashboard/dispatch', icon: Send },
  { name: 'Attendance', href: '/dashboard/attendance', icon: Clock },
  { name: 'Reports & Analytics', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Activity History', href: '/dashboard/audit', icon: ShieldAlert },
  { name: 'Account Security', href: '/dashboard/security', icon: Lock },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin';

  const filteredNavigation = navigation.filter(item => {
    if (isAdmin) return true;
    if (item.name === 'Dashboard') return true; // Everyone sees Dashboard
    if (user?.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(item.href);
    }
    // If no permissions array, default to true or false? Let's default to false to be secure, except Dashboard
    return false;
  });

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white shadow-xl">
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
        <div className="flex items-center">
          <HeartHandshake className="h-8 w-8 text-blue-400 mr-3" />
          <span className="text-xl font-bold tracking-tight text-white">PalliaCare</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-3">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose && onClose()}
                className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              {user ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user ? user.name : 'User'}</p>
            <p className="text-xs font-medium text-slate-400">{user ? user.role : 'Guest'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
