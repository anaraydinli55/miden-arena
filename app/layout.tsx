import './globals.css';
import Sidebar from '@/components/navigation/sidebar';
import { WalletProvider } from '@/components/wallet/wallet-provider';

export const metadata = {
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
      <body className="bg-[#0b0e14] text-white antialiased min-h-screen flex">
        <WalletProvider>
          {/* Sol Sabit Menyu */}
          <Sidebar />

          {/* Sağ Əsas Məzmun Sahəsi */}
          <main className="flex-1 min-w-0 min-h-screen overflow-y-auto bg-[#0b0e14]">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
