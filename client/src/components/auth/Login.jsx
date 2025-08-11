import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {toast} from 'react-hot-toast'
import { login } from "@/actions/authAction";
import { useDispatch, useSelector } from 'react-redux';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const navigate = useNavigate();
    const dispatch = useDispatch();
  const loading = useSelector(state => state.auth.loading);
   const [formData, setFormData] = useState({
    email: '',
    password: '',
  });




  const onChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value})
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if(!formData.email || !formData.password) {
      toast.error('All fields are required');
      return;
    }
    try {
      const result = await dispatch(login(formData));
      
      if (result?.success) {
        toast.success('Login Succesful')
        setTimeout(()=>navigate('/chat'),1000)
        
}else if (result?.error) {
  toast.error(result.error); 
}

    } catch (err) {
     // More robust error handling
      let errorMsg = 'Login failed';
      
      if (err.response?.data?.msg) {
        errorMsg = err.response.msg;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      toast.error(errorMsg)
    }
    
 
  };

  return (
    <main className="container flex min-h-[80vh] items-center justify-center py-12">
      <section className="w-full max-w-md rounded-xl border bg-card p-8 shadow">
        <h1 className="text-2xl font-bold">Login to SwiftChat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Forgot password? <a href="#" className="underline">Reset it</a>
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" name="email"
            value={formData.email}
            onChange={onChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" name="password"
            value={formData.password}
            onChange={onChange} />
          </div>
          <Button  type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
            </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          New to SwiftChat? <Link to="/signup" className="underline">Create an account</Link>
        </p>
      </section>
    </main>
  );
};

export default Login;
