import { useEffect, useState } from 'react';

type OfficeToolkitContent = {
  blogPosts: unknown[];
  signatureTemplates: unknown[];
  resumeTemplates: unknown[];
  currencies: unknown[];
};

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.authenticated) {
        onSuccess();
      } else {
        setError(data.error || 'Galat password');
      }
    } catch {
      setError('Kuch galat ho gaya, dobara try karo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleLogin} style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: '340px', border: '1px solid #e5e5e5' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 700 }}>Admin Login</h2>
        <input
          type="password"
          placeholder="Password daalo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '14px' }}
        />
        {error && <p style={{ color: '#d33', fontSize: '13px', marginBottom: '10px' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', background: '#173d3a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
        >
          {loading ? 'Checking...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

function AdminDashboard() {
  const [content, setContent] = useState<OfficeToolkitContent | null>(null);
  const [rawText, setRawText] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/content', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setContent(data);
        setRawText(JSON.stringify(data, null, 2));
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/admin';
  };

  const handleSave = async () => {
    setStatus('Saving...');
    try {
      const parsed = JSON.parse(rawText);
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(parsed),
      });
      if (!res.ok) throw new Error('Save failed');
      setStatus('Saved!');
      setTimeout(() => setStatus(''), 2000);
    } catch {
      setStatus('Error: JSON sahi format me nahi hai, check karo.');
    }
  };

  if (!content) return <p style={{ padding: '40px' }}>Loading...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700 }}>Admin Panel</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
        Neeche content JSON format me hai (blog posts, signature templates, resume templates, currencies). Change karke Save dabao.
      </p>
      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        style={{ width: '100%', height: '500px', fontFamily: 'monospace', fontSize: '13px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}
      />
      <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={handleSave} style={{ padding: '10px 24px', background: '#173d3a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
          Save Changes
        </button>
        {status && <span>{status}</span>}
      </div>
    </div>
  );
}

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/admin/session', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) return <p style={{ padding: '40px' }}>Loading...</p>;
  if (!authenticated) return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  return <AdminDashboard />;
}