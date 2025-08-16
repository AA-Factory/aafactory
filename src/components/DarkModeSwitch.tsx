'use client';
import React, { useState, useEffect } from 'react';
import { HiSun, HiMoon } from 'react-icons/hi';

const DarkModeSwitch: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved preference in localStorage first
    const savedPreference = localStorage.getItem('darkMode');
    if (savedPreference !== null) {
      setIsDark(savedPreference === 'true');
    } else {
      // If no saved preference, fall back to body class
      const existingDarkMode = document.body.classList.contains('dark');
      setIsDark(existingDarkMode);
    }
  }, []);

  useEffect(() => {
    // Toggle dark class on body
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', String(isDark));
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="group relative px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200 ease-in-out flex items-center space-x-2"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <HiSun
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ease-in-out ${isDark
            ? 'opacity-0 rotate-90 scale-75'
            : 'opacity-100 rotate-0 scale-100'
            } text-yellow-500 group-hover:text-yellow-600`}
        />
        {/* Moon Icon */}
        <HiMoon
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ease-in-out ${isDark
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 -rotate-90 scale-75'
            } text-blue-400 group-hover:text-blue-500`}
        />
      </div>

      {/* Optional tooltip on hover */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {isDark ? 'Light mode' : 'Dark mode'}
      </div>
    </button>
  );
};

export default DarkModeSwitch;