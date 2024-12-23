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
import { signIn, useSession } from "next-auth/react";

export default function CustomNavbar() {
  const currentPath = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();
  // const [name, setName] = useState('');

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     if (session?.user_id) {
  //       const response = await fetch(`/api/users?_id=${session.user_id}`);
  //       if (!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`);
  //       }
  //       const data = await response.json();
  //       if (data.length === 1) {
  //         const userName = data[0].name;
  //         setName(userName.charAt(0).toUpperCase() + userName.slice(1));
  //       }
  //     }
  //   };

  //   fetchUserData();
  // }, [session]);

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
                  }}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </NavbarItem>
            );
          })}
        </NavbarContent>

        {/* Buttons for Sign Up and Login or User's Name */}
        <NavbarContent className="hidden xxl:flex gap-8" justify="end">
          <NavbarItem>
            {session ? (
              <div style={{ color: '#fff', fontWeight: 'bold' }}>
                Welcome {session?.name}!
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
                  color="white"
                  style={{ color: '#fff', marginLeft: '10px' }}
                  href="/login"
                  variant="bordered"
                  onClick={() => signIn()}
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
          justifyContent: 'space-between', // Space between menu items and buttons
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
            <hr style={{ borderTop: '1px solid white', width: '38%', marginTop: '20px' }} />
            {session ? (
            <div style={{ color: '#fff', fontWeight: 'bold', padding: '10px' }}>
              Welcome {session?.name}!
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
              href="/sign-up"
              variant="solid"
              >
              Sign Up
              </Button>
              <Button
              as={Link}
              color="white"
              style={{
                color: '#fff',
                width: '100%',
                maxWidth: '100px', // Restrict the width
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
