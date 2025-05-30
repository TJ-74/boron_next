import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Post Job | Boron',
  description: 'Submit job postings and connect with talented professionals',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 