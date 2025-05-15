import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#a855f7', marginBottom: '20px' }}>
        Welcome {session.user?.name || 'User'} 👋
      </h1>

      <p>This is your secure dashboard. More features coming soon.</p>

      <pre style={{ background: '#222', color: '#ddd', padding: '12px', borderRadius: '8px', marginTop: '20px' }}>
        {JSON.stringify(session, null, 2)}
      </pre>

      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#a855f7', textDecoration: 'underline' }}>
          Back to Home
        </a>
      </div>
    </div>
  );
}
