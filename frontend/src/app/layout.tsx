import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'EthioEvents | Addis Ababa Event Registration & Ticketing Platform',
  description:
    'Experience high-speed, frictionless event registration and ticketing in Addis Ababa, Ethiopia. 1-tap checkout with Telebirr and Chapa, with offline-verified cryptographic digital passes.',
  keywords: [
    'Addis Ababa events',
    'Telebirr ticketing',
    'Millennium Hall concerts',
    'Chapa payments',
    'Ethiopian events',
    'Rophnan Millennium Hall',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#080C14] text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
