import React, { useState } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const UserProfile: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center space-x-2 text-sm bg-gray-800 border border-gray-600 rounded-md px-3 py-2 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <User className="h-4 w-4 text-gray-300 flex-shrink-0" />
        <div className="text-left flex-1 min-w-0">
          <p className="font-medium text-white text-sm truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>
        <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" />
      </button>

      {isDropdownOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {user.jobTitle && (
              <p className="text-xs text-gray-400 mt-1">{user.jobTitle}</p>
            )}
          </div>
          
          {user.groups && user.groups.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-500">Gruppen-Mitgliedschaft:</p>
              <p className="text-xs text-green-600 mt-1">
                ✓ Group Text Editor
              </p>
            </div>
          )}

          <div className="py-1">
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="h-4 w-4 mr-3" />
              {isLoading ? 'Abmeldung...' : 'Abmelden'}
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default UserProfile;