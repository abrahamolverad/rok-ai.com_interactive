import { authOptions } from '@/lib/authOptions';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <DashboardClient />;
}