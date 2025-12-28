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

export default function CustomNavbar() {
  const currentPath = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Reveal Your Giftee', href: '/from' },
    { label: 'Submit Video', href: '/submitvideo' },
    { label: 'Videos', href: '/gifts' },
    {
      label: 'Spreadsheet',
      href: 'https://docs.google.com/spreadsheets/d/13qDgupji-Bod1UbMZkUGbbL_saxBg8TBWZr7W_QZDbk/edit?gid=1912476070#gid=1912476070',
    },
    { label: 'Archive', href: '/archives' },
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
        <div className="xxl:hidden flex items-center justify-center" style={{ position: 'relative', zIndex: 1001, minWidth: '44px', minHeight: '44px' }}>
          <NavbarMenuToggle
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="h-10 w-10 flex items-center justify-center"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
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
                  target={item.label === 'Spreadsheet' ? '_blank' : undefined}
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
            {/* Hidden */}
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
                  target={item.label === 'Spreadsheet' ? '_blank' : undefined}
                  onClick={() => setIsMenuOpen(false)}
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
          {/* Hidden */}
        </div>
      </NavbarMenu>
    </Navbar>
  );
}