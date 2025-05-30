import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | Boron',
  description: 'Manage your professional profile and career information',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {children}
    </div>
  );
} 