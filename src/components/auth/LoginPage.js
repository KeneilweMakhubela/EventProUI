import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'player',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [apiErrors, setApiErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApiErrors = (errorMessage) => {
    const newApiErrors = {};
    
    if (errorMessage.toLowerCase().includes('email')) {
      newApiErrors.email = errorMessage;
    } else if (errorMessage.toLowerCase().includes('password')) {
      newApiErrors.password = errorMessage;
    } else if (errorMessage.toLowerCase().includes('invalid credentials')) {
      newApiErrors.email = 'Invalid email or password';
      newApiErrors.password = 'Invalid email or password';
    } else {
      setLoginError(errorMessage);
    }
    
    setApiErrors(newApiErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setApiErrors({});
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const result = await login(formData.email, formData.password, formData.role);
      
      if (result.success) {
        // Login successful - reload will happen
        window.location.reload();
      } else {
        handleApiErrors(result.error);
      }
    } catch (error) {
      setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (apiErrors[name]) {
      setApiErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(155deg, #e9edf0 0%, #dce3e8 40%, #f0f4f8 100%)'
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#02a2e0] to-[#00a5df] rounded-3xl shadow-lg shadow-cyan-500/40 mb-4">
            <i className="fas fa-ticket-alt text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-[#132149]">
            <span className="text-[#50b4d9] font-medium">Event</span> Pro
          </h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-[2.5rem] custom-shadow-xl p-8">
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-red-500"></i>
              <p className="text-sm text-red-700">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sign in as
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'player' }))}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-2xl font-semibold transition-all duration-200 text-xs ${
                    formData.role === 'player'
                      ? 'bg-[#02a2e0] text-white shadow-lg shadow-cyan-500/40'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-user text-lg"></i>
                  <span>Attendee</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'sponsor' }))}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-2xl font-semibold transition-all duration-200 text-xs ${
                    formData.role === 'sponsor'
                      ? 'bg-[#02a2e0] text-white shadow-lg shadow-cyan-500/40'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-star text-lg"></i>
                  <span>Sponsor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-2xl font-semibold transition-all duration-200 text-xs ${
                    formData.role === 'admin'
                      ? 'bg-[#02a2e0] text-white shadow-lg shadow-cyan-500/40'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-shield-alt text-lg"></i>
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-gray-400"></i>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl border-2 transition-all duration-200 outline-none ${
                    errors.email || apiErrors.email
                      ? 'border-red-300 bg-red-50 focus:border-red-500' 
                      : 'border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white'
                  }`}
                />
              </div>
              {(errors.email || apiErrors.email) && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <i className="fas fa-exclamation-circle"></i> {errors.email || apiErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full pl-11 pr-12 py-3 rounded-2xl border-2 transition-all duration-200 outline-none ${
                    errors.password || apiErrors.password
                      ? 'border-red-300 bg-red-50 focus:border-red-500' 
                      : 'border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {(errors.password || apiErrors.password) && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <i className="fas fa-exclamation-circle"></i> {errors.password || apiErrors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-[#02a2e0] hover:text-[#0189bd] font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary-gradient text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i> Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-gray-200 hover:bg-gray-50 transition-all duration-200">
              <i className="fab fa-google text-red-500"></i>
              <span className="text-sm font-medium hidden sm:inline">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-gray-200 hover:bg-gray-50 transition-all duration-200">
              <i className="fab fa-facebook text-blue-600"></i>
              <span className="text-sm font-medium hidden sm:inline">Facebook</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-gray-200 hover:bg-gray-50 transition-all duration-200">
              <i className="fab fa-github text-gray-800"></i>
              <span className="text-sm font-medium hidden sm:inline">GitHub</span>
            </button>
          </div>

          {/* Register Link */}
          <p className="text-center mt-6 text-sm text-gray-500">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-[#02a2e0] hover:text-[#0189bd] font-semibold"
            >
              Create one
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-gray-400">
          © 2026 Event Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;