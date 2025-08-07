"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {useAuth} from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { AvatarDropdown } from './avatar-dropdown';

const AnimatedNavLink = ({ children, isActive, onClick }: { children: React.ReactNode; isActive: boolean; onClick: () => void }) => {
  const defaultTextColor = isActive ? 'text-white font-semibold' : 'text-gray-300 hover:text-white transition-colors';
  const hoverTextColor = 'text-white';
  const textSizeClass = 'text-sm';

  return (
    <button 
      onClick={onClick}
      className={`group relative inline-block overflow-hidden h-5 items-center hover:cursor-pointer ${textSizeClass}`}
    >
      <div className="flex flex-col transition-transform duration-400 ease-out transform group-hover:-translate-y-1/2">
        <span className={defaultTextColor}>{children}</span>
        <span className={hoverTextColor}>{children}</span>
      </div>
    </button>
  );
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const handleNavClick = (href: string) => {
    router.push(href);
    setIsOpen(false); // Close mobile menu if open
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignupClick = () => {
    router.push('/signup');
  };

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isOpen) {
      setHeaderShapeClass('rounded-xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass('rounded-full');
      }, 300);
    }

    return () => {``
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const logoElement = (
    <div className="relative w-5 h-5 flex items-center justify-center">
    <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 top-0 left-1/2 transform -translate-x-1/2 opacity-80"></span>
    <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 left-0 top-1/2 transform -translate-y-1/2 opacity-80"></span>
    <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 right-0 top-1/2 transform -translate-y-1/2 opacity-80"></span>
    <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 bottom-0 left-1/2 transform -translate-x-1/2 opacity-80"></span>
 </div>
  );

  const navLinksData = [
    { label: 'Home', href: '/' },
    { label: 'Explore', href: '/explore' },
    { label: 'Services', href: '/services' },
  ];

  const signupButtonElement = (
    <div className="relative group w-full sm:w-auto">
       <div className="absolute inset-0 -m-2 rounded-full
                     hidden sm:block
                     bg-gray-100
                     opacity-40 filter blur-lg pointer-events-none
                     transition-all duration-300 ease-out
                     group-hover:opacity-60 group-hover:blur-xl group-hover:-m-3"></div>
       <button className="relative z-10 px-4 py-2 sm:px-3 text-xs sm:text-sm font-semibold text-black bg-gradient-to-br from-gray-100 to-gray-300 rounded-full hover:from-gray-200 hover:to-gray-400 transition-all duration-200 w-full sm:w-auto"
          onClick={handleSignupClick}>
         Get Started
       </button>
    </div>
  );

  return (
    <header className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-20
                       flex flex-col items-center
                       pl-6 pr-6 py-3 backdrop-blur-sm
                       ${headerShapeClass}
                       border border-[#333] bg-[#1f1f1f57]
                       w-[calc(100%-2rem)] sm:w-auto
                       transition-[border-radius] duration-0 ease-in-out`}>

      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
        <div className="flex items-center">
           {logoElement}
        </div>

        <nav className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-sm">
          {navLinksData.map((link) => (
            <AnimatedNavLink key={link.href} isActive={pathname === link.href} onClick={() => handleNavClick(link.href)}>
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>
        
        {/* Avatar Desktop */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse"></div>
          ) : user ? (
            <AvatarDropdown >
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarImage src={user.avatarUrl || '/default-avatar.png'} alt="User Avatar" />
                <AvatarFallback className="bg-gray-300 text-gray-700">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </AvatarDropdown>
          ) : (
            signupButtonElement
          )}
        </div>

        <button className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none" onClick={toggleMenu} aria-label={isOpen ? 'Close Menu' : 'Open Menu'}>
          {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          )}
        </button>
      </div>

      <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                       ${isOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
        <nav className="flex flex-col items-center space-y-4 text-base w-full">
          {navLinksData.map((link) => (
            <button 
              key={link.href} 
              onClick={() => handleNavClick(link.href)}
              className={`${pathname === link.href ? 'text-white font-semibold' : 'text-gray-300'} hover:text-white transition-colors w-full text-center`}
            >
              {link.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-center space-y-4 mt-4 w-full">
          { loading? (
            <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse"></div>
          ) : user ? (
            <div className="flex flex-col items-center space-y-3 w-full">
              <AvatarDropdown className="relative">
                <Avatar className="w-10 h-10 cursor-pointer">
                  <AvatarImage src={user.avatarUrl || '/default-avatar.png'}
                    alt="User Avatar"
                  />
                  <AvatarFallback className="bg-gray-300 text-gray-700">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </AvatarDropdown>
            </div>
          ) : (
            signupButtonElement
          )}
        </div>
      </div>
    </header>
  );
}
