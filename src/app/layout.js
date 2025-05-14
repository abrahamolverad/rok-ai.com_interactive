import './globals.css';

export const metadata = {
  title: 'ROK AI Interactive',
  description: 'Financial Intelligence Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}