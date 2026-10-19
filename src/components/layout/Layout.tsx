import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { cn } from '../../utils/cn';
import { ScrollProgressScribble } from '../doodles/Doodles';

const Layout: React.FC = () => {
  useSmoothScroll();
  // The home hero runs full-bleed under the transparent header.
  const isHome = useLocation().pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollProgressScribble />
      <div className="grain" aria-hidden />
      <Navbar />
      <main className={cn('flex-grow overflow-x-clip', !isHome && 'pt-16')}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
