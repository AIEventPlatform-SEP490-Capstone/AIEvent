import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

const AuthDebug = () => {
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);
  const location = useLocation();

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">Auth Debug Info</h3>
      <div className="text-xs space-y-1">
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>Current Path:</strong> {location.pathname}</p>
        <p><strong>User Role:</strong> {user?.role || 'None'}</p>
        <p><strong>User Email:</strong> {user?.email || 'None'}</p>
        <p><strong>User Name:</strong> {user?.unique_name || user?.name || 'None'}</p>
        <p><strong>Token:</strong> {token ? 'Present' : 'None'}</p>
        <details className="mt-2">
          <summary className="cursor-pointer font-semibold">Full User Object</summary>
          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(user, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default AuthDebug;
