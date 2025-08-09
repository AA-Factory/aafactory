'use client';
import React, { useState, useEffect } from 'react';

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
    <div className="">

      {/* Light Switch Container */}
      <div className="fixed top-20 left-4 z-50">
        <div className="relative">
          {/* Switch Plate */}
          <div className="w-20 h-32 bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 transition-colors duration-300">
            {/* Switch Screws */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full shadow-inner"></div>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full shadow-inner"></div>

            {/* Switch Button */}
            <button
              onClick={toggleDarkMode}
              className={`absolute left-1/2 transform -translate-x-1/2 w-14 h-12 rounded-sm transition-all duration-200 shadow-md border-2 active:shadow-sm active:scale-95 ${isDark
                ? 'top-16 bg-gradient-to-b from-gray-300 to-gray-400 border-gray-500 shadow-inner'
                : 'top-6 bg-gradient-to-b from-white to-gray-200 border-gray-300'
                }`}
            >
              <div
                className={`w-full h-full rounded-sm bg-gradient-to-b ${isDark
                  ? 'from-gray-400 to-gray-500'
                  : 'from-gray-100 to-gray-300'
                  }`}
              >
                {/* Switch Label */}
                <div className="flex flex-col items-center justify-center h-full text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <span className={isDark ? 'opacity-50' : 'opacity-100'}>ON</span>
                  <span className={!isDark ? 'opacity-50' : 'opacity-100'}>OFF</span>
                </div>
              </div>
            </button>
          </div>

          {/* Switch Label */}
          <div className="mt-2 text-center">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-300">
              {isDark ? '🌙 Dark' : '☀️ Light'}
            </span>
          </div>
        </div>
      </div>


    </div>
  );
};

export default DarkModeSwitch;
