import './globals.css';
import type { Metadata, Viewport } from 'next';
import Sidebar from '@/components/navigation/sidebar';
import { WalletProvider } from '@/components/wallet/wallet-provider';

// 📱 Exact viewport for mobile devices (prevents unwanted zoom-out and overflow)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0b0e14',
};

export const metadata: Metadata = {
  title: 'Miden Arena | ZK Prediction Markets',
  description: 'Zero-Knowledge prediction markets on Miden Testnet',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0e14] text-white antialiased min-h-screen overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200">
        <WalletProvider>
          {/* Mobile header and desktop sidebar */}
          <Sidebar />

          {/* Main content area (pt-16 on mobile, md:pl-64 on desktop) */}
          <main className="min-h-screen min-w-0 bg-[#0b0e14] pt-16 md:pt-0 md:pl-64 transition-all duration-200">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
