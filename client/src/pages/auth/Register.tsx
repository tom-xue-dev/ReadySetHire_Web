import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/config/apiConfig';

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
  companyName: string;
  role:  'RECRUITER' | 'EMPLOYEE';
}

export default function Register() {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    role: 'RECRUITER'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // Role switch: clear recruiter-only fields when selecting EMPLOYEE
      if (name === 'role') {
        const nextRole = value as RegisterFormData['role'];
        if (nextRole === 'EMPLOYEE') {
          return {
            ...prev,
            role: nextRole,
            firstName: '',
            lastName: '',
            companyName: '',
          };
        }
        return { ...prev, role: nextRole };
      }

      return { ...prev, [name]: value } as RegisterFormData;
    });
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

    if (formData.role === 'RECRUITER') {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('First name and last name are required for recruiters');
        setLoading(false);
        return;
      }
      if (!formData.companyName.trim()) {
        setError('Company name is required for recruiters');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.role === 'RECRUITER' ? formData.firstName : undefined,
          lastName: formData.role === 'RECRUITER' ? formData.lastName : undefined,
          companyName: formData.role === 'RECRUITER' ? formData.companyName : undefined,
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
          </Select>

          {formData.role === 'RECRUITER' && (
            <>
              {/* Name Row (Recruiter only) */}
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
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </>
          )}

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
