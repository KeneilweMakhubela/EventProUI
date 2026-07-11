import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const RegisterPage = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'player',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [apiErrors, setApiErrors] = useState({});

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.firstName || formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!formData.lastName || formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApiErrors = (errorMessage) => {
    const newApiErrors = {};
    
    // Parse error messages from API response
    if (errorMessage.includes('email')) {
      newApiErrors.email = errorMessage;
    } else if (errorMessage.includes('password')) {
      newApiErrors.password = errorMessage;
    } else if (errorMessage.includes('phone')) {
      newApiErrors.phone = errorMessage;
    } else {
      // General error
      setRegisterError(errorMessage);
    }
    
    setApiErrors(newApiErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setApiErrors({});
    
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else {
      if (validateStep2()) {
        setIsLoading(true);
        
        try {
          const result = await register({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: formData.role,
          });
          
          if (result.success) {
            // Registration successful - reload will happen in App.js
            window.location.reload();
          } else {
            handleApiErrors(result.error);
          }
        } catch (error) {
          setRegisterError(error.message || 'Registration failed. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];
  const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'Event Manager';
      case 'sponsor': return 'Event Sponsor';
      case 'player': return 'Attendee';
      default: return role;
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
            <i className="fas fa-user-plus text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-[#132149]">
            Join <span className="text-[#50b4d9] font-medium">Event</span> Pro
          </h1>
          <p className="text-gray-500 mt-2">Create your account in seconds</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step === 1 ? 'text-[#02a2e0]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step === 1 ? 'bg-[#02a2e0] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <span className="text-sm font-medium hidden sm:inline">Personal Info</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200">
              <div className={`h-full transition-all duration-300 ${
                step === 2 ? 'w-full bg-[#02a2e0]' : 'w-0'
              }`}></div>
            </div>
            <div className={`flex items-center gap-2 ${step === 2 ? 'text-[#02a2e0]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step === 2 ? 'bg-[#02a2e0] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className="text-sm font-medium hidden sm:inline">Security</span>
            </div>
          </div>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-[2.5rem] custom-shadow-xl p-8">
          {registerError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-red-500"></i>
              <p className="text-sm text-red-700">{registerError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 ? (
              <>
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    I want to
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
                      <span>Attend</span>
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
                      <span>Manage</span>
                    </button>
                  </div>
                  
                  {/* Role Description */}
                  <div className="mt-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="flex items-start gap-2">
                      <i className={`fas ${
                        formData.role === 'player' ? 'fa-user' : 
                        formData.role === 'sponsor' ? 'fa-star' : 
                        'fa-shield-alt'
                      } text-[#02a2e0] mt-0.5`}></i>
                      <div>
                        <p className="text-sm font-semibold text-[#132149]">
                          {formData.role === 'player' && 'Event Attendee'}
                          {formData.role === 'sponsor' && 'Event Sponsor'}
                          {formData.role === 'admin' && 'Event Manager'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formData.role === 'player' && 'Discover events, RSVP, and manage your bookings'}
                          {formData.role === 'sponsor' && 'Sponsor events, manage contributions, and track impact'}
                          {formData.role === 'admin' && 'Create events, manage players, and oversee operations'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* First Name and Last Name - Side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-user text-gray-400"></i>
                      </div>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        className={`w-full pl-11 pr-4 py-3 rounded-2xl border-2 transition-all duration-200 outline-none ${
                          errors.firstName || apiErrors.firstName
                            ? 'border-red-300 bg-red-50 focus:border-red-500' 
                            : 'border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white'
                        }`}
                      />
                    </div>
                    {(errors.firstName || apiErrors.firstName) && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i> {errors.firstName || apiErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-user text-gray-400"></i>
                      </div>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        className={`w-full pl-11 pr-4 py-3 rounded-2xl border-2 transition-all duration-200 outline-none ${
                          errors.lastName || apiErrors.lastName
                            ? 'border-red-300 bg-red-50 focus:border-red-500' 
                            : 'border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white'
                        }`}
                      />
                    </div>
                    {(errors.lastName || apiErrors.lastName) && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle"></i> {errors.lastName || apiErrors.lastName}
                      </p>
                    )}
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

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fas fa-phone text-gray-400"></i>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className={`w-full pl-11 pr-4 py-3 rounded-2xl border-2 transition-all duration-200 outline-none ${
                        errors.phone || apiErrors.phone
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : 'border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white'
                      }`}
                    />
                  </div>
                  {(errors.phone || apiErrors.phone) && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i> {errors.phone || apiErrors.phone}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Summary of Step 1 */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-2">
                  <h4 className="text-sm font-semibold text-[#132149] mb-2">Account Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</p>
                    <p><span className="font-medium">Email:</span> {formData.email}</p>
                    <p><span className="font-medium">Phone:</span> {formData.phone}</p>
                    <p>
                      <span className="font-medium">Role:</span> 
                      <span className={`inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        formData.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : formData.role === 'sponsor'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        <i className={`fas ${
                          formData.role === 'admin' ? 'fa-shield-alt' : 
                          formData.role === 'sponsor' ? 'fa-star' : 
                          'fa-user'
                        } text-xs`}></i>
                        {getRoleLabel(formData.role)}
                      </span>
                    </p>
                  </div>
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
                      placeholder="Create a strong password"
                      className={`w-full pl-11 pr-12 py-3 rounded-2xl border-2 transition-all duration-200 outline-none ${
                        errors.password || apiErrors.password
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : formData.password && passwordStrength >= 3
                            ? 'border-green-300 bg-green-50 focus:border-green-500'
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
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              level <= passwordStrength ? strengthColors[passwordStrength] : 'bg-gray-200'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-xs font-medium ${
                          passwordStrength <= 1 ? 'text-red-500' :
                          passwordStrength <= 2 ? 'text-orange-500' :
                          passwordStrength <= 3 ? 'text-yellow-500' :
                          passwordStrength <= 4 ? 'text-green-500' :
                          'text-green-600'
                        }`}>
                          {strengthLabels[passwordStrength]}
                        </p>
                        <p className="text-xs text-gray-400">
                          {passwordStrength < 5 ? 'Add special characters for stronger password' : 'Excellent password!'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Password Requirements */}
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-medium text-gray-500 mb-2">Password must contain:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`flex items-center gap-1.5 text-xs ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                        <i className={`fas ${formData.password.length >= 8 ? 'fa-check-circle' : 'fa-circle'}`}></i>
                        Min 8 characters
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                        <i className={`fas ${/[A-Z]/.test(formData.password) ? 'fa-check-circle' : 'fa-circle'}`}></i>
                        Uppercase letter
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                        <i className={`fas ${/[a-z]/.test(formData.password) ? 'fa-check-circle' : 'fa-circle'}`}></i>
                        Lowercase letter
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                        <i className={`fas ${/\d/.test(formData.password) ? 'fa-check-circle' : 'fa-circle'}`}></i>
                        Number
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fas fa-lock text-gray-400"></i>
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={`w-full pl-11 pr-12 py-3 rounded-2xl border-2 transition-all duration-200 outline-none ${
                        errors.confirmPassword 
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
                            ? 'border-green-300 bg-green-50 focus:border-green-500'
                            : 'border-gray-200 bg-gray-50 focus:border-[#02a2e0] focus:bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i> {errors.confirmPassword}
                    </p>
                  )}
                  {!errors.confirmPassword && formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                      <i className="fas fa-check-circle"></i> Passwords match
                    </p>
                  )}
                </div>

                {/* Terms & Conditions */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-[#02a2e0] focus:ring-[#02a2e0]"
                    />
                    <span className="text-sm text-gray-600">
                      I agree to the{' '}
                      <a href="#" className="text-[#02a2e0] hover:underline">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="text-[#02a2e0] hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                  {errors.agreeTerms && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <i className="fas fa-exclamation-circle"></i> {errors.agreeTerms}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-200"
                >
                  <i className="fas fa-arrow-left"></i> Back
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary-gradient text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating account...
                  </>
                ) : step === 1 ? (
                  <>
                    Continue <i className="fas fa-arrow-right"></i>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Create Account
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <p className="text-center mt-6 text-sm text-gray-500">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-[#02a2e0] hover:text-[#0189bd] font-semibold"
            >
              Sign in
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

export default RegisterPage;