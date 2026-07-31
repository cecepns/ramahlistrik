import React, { createContext, useContext, useState, useEffect } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('ramah_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ramah_token') || null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      if (res.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('ramah_user', JSON.stringify(res.data.user));
        localStorage.setItem('ramah_token', res.data.token);
        toast.success(`Selamat datang kembali, ${res.data.user.name}!`);
        return res.data.user;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal login, periksa email & password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.REGISTER, formData);
      if (res.success) {
        toast.success(res.message);
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Pendaftaran gagal');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ramah_user');
    localStorage.removeItem('ramah_token');
    toast.success('Anda telah keluar dari sistem.');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
