import React, { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <Login onSwitchToRegister={() => setIsLogin(false)} />
  ) : (
    <Register onSwitchToLogin={() => setIsLogin(true)} />
  );
};
