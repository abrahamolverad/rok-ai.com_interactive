"use client";

import { useEffect, useState } from 'react';

interface ContactFormProps {
  className?: string;
}

export function ContactForm({ className = '' }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState({
    submitting: false,
    success: false,
    error: false,
    message: ''
  });

  // Reset status message after 5 seconds
  useEffect(() => {
    if (status.success || status.error) {
      const timer = setTimeout(() => {
        setStatus(prev => ({
          ...prev,
          success: false,
          error: false,
          message: ''
        }));
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [status.success, status.error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({
        submitting: false,
        success: false,
        error: true,
        message: 'Please fill out all fields'
      });
      return;
    }
    
    // Set submitting state
    setStatus({
      submitting: true,
      success: false,
      error: false,
      message: ''
    });
    
    try {
      // Submit form data to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success
        setStatus({
          submitting: false,
          success: true,
          error: false,
          message: data.message || 'Message sent successfully!'
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          message: ''
        });
      } else {
        // API error
        setStatus({
          submitting: false,
          success: false,
          error: true,
          message: data.message || 'Something went wrong. Please try again.'
        });
      }
    } catch (error) {
      // Network error
      setStatus({
        submitting: false,
        success: false,
        error: true,
        message: 'Network error. Please try again.'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-gray-900 p-8 rounded-lg ${className}`}>
      {status.success && (
        <div className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-md text-green-200">
          {status.message}
        </div>
      )}
      
      {status.error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-md text-red-200">
          {status.message}
        </div>
      )}
      
      <div className="mb-6">
        <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
        <input 
          type="text" 
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Your name"
          disabled={status.submitting}
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
        <input 
          type="email" 
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your@email.com"
          disabled={status.submitting}
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
        <textarea 
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="How can we help you?"
          disabled={status.submitting}
        ></textarea>
      </div>
      
      <button 
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={status.submitting}
      >
        {status.submitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
