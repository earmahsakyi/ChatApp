import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from 'react-router-dom';
import {toast} from 'react-hot-toast'
import { registerUser } from "@/actions/authAction";

const Register = () => {
   const loading = useSelector(state => state.auth.loading);
   const dispatch = useDispatch();
   const navigate = useNavigate();

     // Form state
  const [user, setUser] = useState({ 
    email: '',
    username: '',
    password: '',
    password2: '',
    
  });

  // UI state
  const [errors, setErrors] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',

  });

  const { email, password, password2, username } = user;

  const validateEmail = (email) => {
    return /^\S+@\S+\.\S+$/.test(email);
  };

    // Handle input changes with validation
  const onChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });

    // Real-time validation
    switch (name) {
      case 'email':
        setErrors({
          ...errors,
          email: !validateEmail(value) ? 'Invalid email format' : ''
        });
        break;
      case 'password':
        setErrors({
          ...errors,
          password: value.length < 6 ? 'Password must be 6+ characters' : ''
        });
        break;
      case 'password2':
        setErrors({
          ...errors,
          password2: value !== password ? 'Passwords do not match' : ''
        });
        break;
    }
  };

  const onSubmit = async (e) => {

    e.preventDefault();
    if (email === '' || password==='' || password2 === '' || username === ''){
      toast.error('All fields are required!')
    return;
  }
    try {
    const result = await dispatch(registerUser({ email, password, username }));
    
    if(result?.success){
      toast.success('Registration was successful')
    // Navigate after state updates
    setTimeout(() => navigate('/login'), 1000);
    }else if (result?.error) {
      toast.error(result.error)
    }
   
    
    
  } catch (err) {
    console.error(err);
    toast.error("Registration Failed")
  }

  };

  return (
    <main className="container flex min-h-[80vh] items-center justify-center py-12">
      <section className="w-full max-w-md rounded-xl border bg-card p-8 shadow">
        <h1 className="text-2xl font-bold">Sign Up for SwiftChat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="underline">
            Login
          </Link>
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="BurnaBoy" name="username" value={username}  onChange={onChange}  />
             
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" value={email} onChange={onChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" value={password} onChange={onChange} />
            {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="password2" type="password" name="password2"  value={password2} onChange={onChange}  />
            {errors.password2 && (
                  <p className="text-sm text-destructive">{errors.password2}</p>
                )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading  ? 'Creating...' : 'Create Account'}
          </Button>
        </form>
      </section>
    </main>
  );
};

export default Register;
