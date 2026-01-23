import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Centered } from '@components/layout/Centered';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Button } from '@components/ui/Button';
import { ErrorBox } from '@components/ui/ErrorBox';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'RECRUITER' | 'EMPLOYEE';
}

export default function Register() {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'RECRUITER'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      navigate('/login');
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
          <p className="text-gray-500 text-sm">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorBox message={error} />}

          {/* Name Row */}
          <div className="flex items-center gap-2 w-full">
            <Input
              wrapperClassName="flex-1"
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <Input
              wrapperClassName="flex-1"
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="RECRUITER">Recruiter</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </Select>

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <Button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <button
            className="text-blue-600"
            onClick={() => navigate('/login')}
          >
            Sign in
          </button>
        </div>
      </Card>
    </Centered>
  );
}
