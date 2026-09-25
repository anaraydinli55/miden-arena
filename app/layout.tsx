import './globals.css';
import type { Metadata, Viewport } from 'next';
import Sidebar from '@/components/navigation/sidebar';
import { WalletProvider } from '@/components/wallet/wallet-provider';

// 📱 MOBİL CİHAZLAR ÜÇÜN DƏQİQ VIEWPORT (Ekranın kiçilməsinin və daşmasının qarşısını alır)
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
          {/* Mobil Header və Desktop Sidebar */}
          <Sidebar />

          {/* Əsas Kontent Sahəsi (Mobildə pt-16, Desktopda md:pl-64) */}
          <main className="min-h-screen min-w-0 bg-[#0b0e14] pt-16 md:pt-0 md:pl-64 transition-all duration-200">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
