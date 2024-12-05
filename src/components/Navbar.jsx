// components/Navbar.jsx
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button } from "@nextui-org/react";
import Image from 'next/image';
import SantaHatImage from '../../public/Santa Red Hat Icon.png';


export default function CustomNavbar() {
  return (
    <Navbar maxWidth="full" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000, backgroundColor: '#f24236', color: '#fff'}}>
      <NavbarBrand>
      <Image
        src={SantaHatImage}
        alt="Santa Hat Icon"
        height={40} 
        style={{ marginRight: '10px' }}
      />
        <p className="font-bold text-inherit">ASC Secret Santa</p>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-8" justify="center" width="100%">
        <NavbarItem>
          <Link style={{ color: '#fff' }} href="#">
            Home
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link style={{ color: '#fff' }} href="#" aria-current="page">
            Find Your Match
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link style={{ color: '#fff' }} href="#" aria-current="page">
            Santas
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link style={{ color: '#fff' }} href="https://docs.google.com/spreadsheets/d/1Nvjh48RAc9l-lNNdLw5dhgJpnLsdOGNO7uNFatB1NuA/edit?gid=1912476070#gid=1912476070" aria-current="page">
            Gifts Spreadsheet
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent className="hidden sm:flex gap-4" justify="end" width="100%">
        <NavbarItem>
          <Button as={Link} style={{ color: '#fff' }} href="#" variant="flat">
            Login
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}