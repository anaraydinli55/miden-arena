import './globals.css';

export const metadata = {
  title: 'Miden Arena',
  description: 'Prediction market on Polygon Miden zkVM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0b0e14] text-white">
        {children}
      </body>
    </html>
  );
}
