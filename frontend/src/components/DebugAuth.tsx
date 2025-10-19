import React, { useEffect, useState } from 'react';
import { authService } from '../services/auth';

export const DebugAuth: React.FC = () => {
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  useEffect(() => {
    const token = authService.getAccessToken();
    if (token) {
      try {
        // Decode JWT manually (just the payload, not verifying signature)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        setTokenInfo({
          token: token.substring(0, 50) + '...',
          payload: JSON.parse(jsonPayload),
          exists: true,
        });
      } catch (e) {
        setTokenInfo({ error: 'Failed to decode token', exists: true });
      }
    } else {
      setTokenInfo({ exists: false });
    }
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold mb-2">🔍 Auth Debug Info</h3>
      <pre className="text-xs bg-white p-2 rounded overflow-auto">
        {JSON.stringify(tokenInfo, null, 2)}
      </pre>
    </div>
  );
};
