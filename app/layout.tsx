import "./globals.css";
import Providers from "@/components/wallet/providers";
import Sidebar from "@/components/navigation/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#050505] text-white">
        <Providers>
          <div className="min-h-screen">
            <Sidebar />

            <main className="ml-64 min-h-screen">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
