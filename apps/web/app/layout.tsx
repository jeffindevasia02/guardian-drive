import './globals.css';
export const metadata = {
  title: 'School Run',
  description: 'Sydney child pick-up/drop-off MVP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
