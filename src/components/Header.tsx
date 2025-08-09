'use client';

import React, { useState } from 'react';
import {
  HiMenu,
  HiX,
  HiUser,
  HiChatAlt2,
  HiCode,
  HiLightningBolt,
  HiCog,
  HiAdjustments,
} from 'react-icons/hi';
import { IconType } from 'react-icons';
import Link from 'next/link';
import { ActiveAvatarsDisplay } from './avatars/ActiveAvatarsDisplay';
import { useActiveAvatars } from '@/contexts/ActiveAvatarsContext';

interface NavLink {
  name: string;
  href: string;
  icon: IconType;
}

const HeaderNav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { activeAvatarIds, clearActiveAvatars } = useActiveAvatars();

  const navLinks: NavLink[] = [
    { name: 'Act', href: '/act', icon: HiLightningBolt },
    { name: 'Avatar', href: '/avatar/create', icon: HiUser },
    { name: 'Avatars', href: '/avatars', icon: HiUser },
    { name: 'Chat', href: '/chat', icon: HiChatAlt2 },
    { name: 'Editor', href: '/editor', icon: HiCode },
    { name: 'React', href: '/react', icon: HiCode },
    { name: 'Settings', href: '/settings', icon: HiCog },
    { name: 'Utils', href: '/utils', icon: HiAdjustments },
  ];

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  const handleClearAvatars = () => {
    clearActiveAvatars();
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                AAFactory
              </span>
            </Link>
          </div>

          {/* Active Avatars Display - Desktop */}
          <div className="hidden md:flex flex-1 justify-center max-w-md">
            {activeAvatarIds.length > 0 && (
              <div className="ml-8">
                <Link href="/avatars" className="">
                  <ActiveAvatarsDisplay size="sm" maxDisplay={6} />
                </Link>

                {/* Clear button - only visible on hover */}
                {/* <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClearAvatars();
                  }}
                  className="ml-3 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200 text-xs font-medium"
                  title="Clear all active avatars"
                >
                  Clear
                </button> */}
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="ml-6 flex items-baseline space-x-4">
              {navLinks.map(({ name, href, icon: IconComponent }) => (
                <Link
                  key={name}
                  href={href}
                  className="group relative px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200 ease-in-out flex items-center space-x-2"
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{name}</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 group-hover:w-full transition-all duration-200"></div>
                </Link>
              ))}
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? (
                <HiX className="block h-6 w-6" />
              ) : (
                <HiMenu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Active Avatars Display - Mobile (below main header) */}
        {activeAvatarIds.length > 0 && (
          <div className="md:hidden pb-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <Link href="/avatars" className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <ActiveAvatarsDisplay size="sm" maxDisplay={8} />
              </Link>

              <button
                onClick={handleClearAvatars}
                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
            {navLinks.map(({ name, href, icon: IconComponent }) => (
              <Link
                key={name}
                href={href}
                onClick={closeMenu}
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <IconComponent className="h-5 w-5" />
                <span>{name}</span>
              </Link>
            ))}

            {/* Avatar Management Section in Mobile Menu */}
            {activeAvatarIds.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Active Avatars ({activeAvatarIds.length})
                  </p>
                  <div className="flex items-center justify-between">
                    <ActiveAvatarsDisplay size="sm" maxDisplay={6} />
                    <button
                      onClick={handleClearAvatars}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default HeaderNav;