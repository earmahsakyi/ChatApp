import React, { useEffect } from 'react';
import {Toaster} from "react-hot-toast"
import {  Routes, Route } from 'react-router-dom';
import Store from './store';
import { Provider, useDispatch } from 'react-redux';
import LandingPage from './components/pages/LandingPage';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import ChatDashboard from './components/pages/ChatDashboard';
import PrivateRoute from './components/routing/PrivateRoute';
import { loadUser } from './actions/authAction'; 

const AppInner = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<Register/>} />
      <Route path="/login" element={<Login/>} />
      <Route path="/chat" element={<PrivateRoute element={ChatDashboard}/>} />
   
    </Routes>
  );
};

const App = () => {
  return (
    <Provider store={Store}>
   
        <AppInner />
    <Toaster position="top-right" /> 
    </Provider>
  );
};

export default App;
