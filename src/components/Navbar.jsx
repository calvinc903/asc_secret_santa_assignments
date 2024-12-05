'use client';

import React, { useState } from 'react';
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
    { label: 'Find Your Match', href: '/from' },
    { label: 'Santas', href: '/santas' },
    {
      label: 'Gifts Spreadsheet',
      href: 'https://docs.google.com/spreadsheets/d/1Nvjh48RAc9l-lNNdLw5dhgJpnLsdOGNO7uNFatB1NuA/edit?gid=1912476070#gid=1912476070',
    },
    { label: 'Sign Up', href: '/sign-up' },
    { label: 'Login', href: '/login' },
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
      <div className="flex justify-between items-center w-full px-4">
        {/* Logo and Brand */}
        <NavbarBrand className="flex items-center">
          <Image
            src={SantaHatImage}
            alt="Santa Hat Icon"
            height={40}
            style={{ marginRight: '10px' }}
          />
          <p className="font-bold text-inherit">ASC Secret Santa</p>
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
          {menuItems.slice(0, 4).map((item) => {
            const isActive = currentPath === item.href; // Check if the current path matches the item's href
            return (
              <NavbarItem key={item.label} isActive={isActive}>
                <Link
                  style={{
                    color: '#fff',
                    fontWeight: isActive ? 'bold' : 'normal',
                  }}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </NavbarItem>
            );
          })}
        </NavbarContent>

        {/* Buttons for Sign Up and Login */}
        <NavbarContent className="hidden xxl:flex gap-8" justify="end">
          <NavbarItem>
            <Button
              as={Link}
              style={{ backgroundColor: '#fff', color: '#f24236' }}
              href="/sign-up"
              variant="solid"
            >
              Sign Up
            </Button>
            <Button
              as={Link}
              color="white"
              style={{ color: '#fff', marginLeft: '10px' }}
              href="/login"
              variant="bordered"
            >
              Login
            </Button>
          </NavbarItem>
        </NavbarContent>
      </div>

      {/* Mobile Menu */}
      <NavbarMenu
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: '380px',
          backgroundColor: '#f24236',
          color: '#fff',
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: 1000,
          paddingLeft: '20px', // Add padding to align text with Santa hat
        }}
      >
        {/* Logo and Header */}
        <NavbarMenuItem>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '20px 0', // Add spacing around the logo and text
            }}
          >
            <Image
              src={SantaHatImage}
              alt="Santa Hat Icon"
              width={50}
              height={50}
            />
            <p
              style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '18px',
                margin: 0,
                textAlign: 'left',
              }}
            >
              ASC Secret Santa
            </p>
          </div>
        </NavbarMenuItem>

        {/* Menu Items */}
        {menuItems.map((item) => {
          const isActive = currentPath === item.href; // Check if the current path matches the item's href
          return (
            <NavbarMenuItem
              key={item.label}
              style={{
                textAlign: 'left', // Ensure text is left-aligned
                paddingLeft: '60px', // Add left padding to align with the Santa hat
              }}
            >
              <Link
                style={{
                  color: 'white',
                  fontWeight: isActive ? 'bold' : 'normal', // Bold active item
                  textDecoration: 'none',
                }}
                href={item.href}
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          );
        })}
      </NavbarMenu>   
    </Navbar>
  );
}