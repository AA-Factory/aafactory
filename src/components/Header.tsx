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
import DarkModeSwitch from './DarkModeSwitch';

interface NavLink {
  name: string;
  href?: string;
  icon: IconType;
  submenu?: { name: string; href: string }[];
}

const HeaderNav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { activeAvatarIds, clearActiveAvatars } = useActiveAvatars();

  const navLinks: NavLink[] = [
    {
      name: 'Avatars',
      icon: HiUser,
      submenu: [
        { name: 'Create Avatar', href: '/avatar/create' },
        { name: 'Manage Avatars', href: '/avatars' }
      ]
    },
    {
      name: 'Content Creation',
      icon: HiCode,
      submenu: [
        { name: 'Generate Video', href: '/content_creation/generate_video' },
        { name: 'Editor', href: '/editor' }
      ]
    },
    {
      name: 'Real-Time',
      icon: HiLightningBolt,
      submenu: [
        { name: 'Chat', href: '/chat' },
        { name: 'Act', href: '/act' },
        { name: 'ReAct', href: '/react' }
      ]
    },
    { name: 'Utils', href: '/utils', icon: HiAdjustments },
    { name: 'Settings', href: '/settings', icon: HiCog },
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
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="ml-6 flex items-baseline space-x-4">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                if (link.submenu) {
                  return (
                    <div
                      key={link.name}
                      className="relative group"
                      onMouseEnter={() => setOpenDropdown(link.name)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        className="group relative px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200 ease-in-out flex items-center space-x-2"
                        type="button"
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{link.name}</span>
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 group-hover:w-full transition-all duration-200"></div>
                      </button>
                      {openDropdown === link.name && (
                        <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
                          {link.submenu.map((sublink) => (
                            <Link
                              key={sublink.name}
                              href={sublink.href}
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                              onClick={() => setOpenDropdown(null)}
                            >
                              {sublink.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={link.name}
                    href={link.href!}
                    className="group relative px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200 ease-in-out flex items-center space-x-2"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{link.name}</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 group-hover:w-full transition-all duration-200"></div>
                  </Link>
                );
              })}

              <DarkModeSwitch />
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <DarkModeSwitch />
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
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              if (link.submenu) {
                return (
                  <div key={link.name}>
                    <div className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200">
                      <IconComponent className="h-5 w-5" />
                      <span>{link.name}</span>
                    </div>
                    <div className="ml-8 space-y-1">
                      {link.submenu.map((sublink) => (
                        <Link
                          key={sublink.name}
                          href={sublink.href}
                          className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200"
                          onClick={closeMenu}
                        >
                          {sublink.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={link.name}
                  href={link.href!}
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all duration-200"
                  onClick={closeMenu}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {/* Avatar Management Section in Mobile Menu */}
            {activeAvatarIds.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Active Avatars ({activeAvatarIds.length})
                  </p>
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