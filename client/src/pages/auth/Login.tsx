import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

import { Centered } from '../../components/layout/Centered';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ErrorBox } from '../../components/ui/ErrorBox';

interface LoginFormData {
  username: string;
  password: string;
}

export default function Login() {
  const [formData, setFormData] = useState<LoginFormData>({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      login(data.token, data.user);
      navigate('/interviews', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Centered>
      <Card>
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">ReadySetHire</h1>
          <p className="text-gray-500 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorBox message={error} />}

          <Input
            label="Username or Email"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center mt-4 text-sm text-gray-600">
          Don't have an account?{' '}
          <button className="text-blue-600" onClick={() => navigate('/register')}>
            Sign up
          </button>
        </div>
      </Card>
    </Centered>
  );
}
