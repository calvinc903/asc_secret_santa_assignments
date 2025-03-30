'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarMenuItem,
  Link,
  Button,
} from '@nextui-org/react';
import Image from 'next/image';
import SantaHatImage from '../../public/Santa Red Hat Icon.png';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase'; // Ensure this exports an initialized auth instance

export default function CustomNavbar() {
  const currentPath = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Reveal Your Giftee', href: '/from' },
    { label: 'Submit Video', href: '/submitvideo' },
    { label: 'Gifts', href: '/gifts' },
    {
      label: 'Spreadsheet',
      href: 'https://docs.google.com/spreadsheets/d/1Nvjh48RAc9l-lNNdLw5dhgJpnLsdOGNO7uNFatB1NuA/edit?gid=1912476070#gid=1912476070',
    },
  ];

  return (
    <Navbar
      maxWidth="full"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 1000,
        backgroundColor: '#f24236',
        color: '#fff',
      }}
    >
      <div className="flex justify-between items-center w-full px-0">
        {/* Logo and Brand */}
        <NavbarBrand className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src={SantaHatImage}
              alt="Santa Hat Icon"
              height={40}
              style={{ marginRight: '10px' }}
            />
            <p className="font-bold text-white">ASC Secret Santa</p>
          </Link>
        </NavbarBrand>

        {/* Menu Toggle for Mobile */}
        <div className="xxl:hidden">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="h-10 w-10 flex items-center justify-center"
          />
        </div>

        {/* Centered Links for Large Screens */}
        <NavbarContent
          className="hidden xxl:flex gap-8"
          justify="center"
          width="100%"
        >
          {menuItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <NavbarItem key={item.label} isActive={isActive}>
                <Link
                  style={{
                    color: '#fff',
                    fontWeight: isActive ? 'bold' : 'normal',
                    borderBottom: isActive ? '2px solid #fff' : 'none',
                    paddingBottom: '4px', // adjust spacing if needed
                  }}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </NavbarItem>
            );
          })}
        </NavbarContent>

        {/* Buttons for Sign Up/Login or User's Name with Logout */}
        <NavbarContent className="hidden xxl:flex gap-8" justify="end">
          <NavbarItem>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>
                  Welcome {user.displayName || 'User'}!
                </div>
                <Button
                  onClick={handleLogout}
                  style={{ backgroundColor: '#fff', color: '#f24236' }}
                  variant="solid"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button
                  as={Link}
                  style={{ backgroundColor: '#fff', color: '#f24236' }}
                  href="/signup"
                  variant="solid"
                >
                  Sign Up
                </Button>
                <Button
                  as={Link}
                  style={{ color: '#fff', marginLeft: '10px' }}
                  href="/login"
                  variant="bordered"
                >
                  Login
                </Button>
              </>
            )}
          </NavbarItem>
        </NavbarContent>
      </div>

      {/* Mobile Menu */}
      <NavbarMenu
        style={{
          position: 'fixed',
          right: 0,
          top: '60px',
          height: 'calc(100vh - 60px)',
          width: '100vw',
          backgroundColor: '#f24236',
          color: '#fff',
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingLeft: '20px',
        }}
      >
        <div>
          {/* Menu Items */}
          {menuItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <NavbarMenuItem
                key={item.label}
                style={{
                  textAlign: 'left',
                  paddingLeft: '10px',
                }}
              >
                <Link
                  style={{
                    color: 'white',
                    fontWeight: isActive ? 'bold' : 'normal',
                    textDecoration: 'none',
                  }}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </NavbarMenuItem>
            );
          })}
          <hr
            style={{
              borderTop: '1px solid white',
              width: '38%',
              marginTop: '20px',
            }}
          />
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px' }}>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>
                Welcome {user.displayName || 'User'}!
              </div>
              <Button
                onClick={handleLogout}
                style={{ backgroundColor: '#fff', color: '#f24236', maxWidth: '100px' }}
                variant="solid"
              >
                Logout
              </Button>
            </div>
          ) : (
            <>
              <Button
                as={Link}
                style={{
                  backgroundColor: '#fff',
                  color: '#f24236',
                  width: '100%',
                  maxWidth: '100px',
                  marginTop: '20px',
                  marginRight: '10px',
                }}
                href="/signup"
                variant="solid"
              >
                Sign Up
              </Button>
              <Button
                as={Link}
                style={{
                  color: '#fff',
                  width: '100%',
                  maxWidth: '100px',
                }}
                href="/login"
                variant="bordered"
              >
                Login
              </Button>
            </>
          )}
        </div>
      </NavbarMenu>
    </Navbar>
  );
}