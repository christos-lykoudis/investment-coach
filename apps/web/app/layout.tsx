import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: process.env.NEXT_PUBLIC_TITLE ?? process.env.TITLE ?? 'Stocks101',
  description: process.env.DESCRIPTION ?? 'Read-only AI investment coach MVP',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
