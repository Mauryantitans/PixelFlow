import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoutes from './AppRoutes';
import { OperationSchemaProvider } from './contexts/OperationSchemaContext';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <OperationSchemaProvider>
      <AppRoutes />
    </OperationSchemaProvider>
  </React.StrictMode>
);
