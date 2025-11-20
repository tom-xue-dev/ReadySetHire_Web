import type { CSSProperties } from "react";
import type { Job } from "@/types";

export default function JobForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Job>;
  onSubmit: (values: Job) => void;
  onCancel: () => void;
}) {
  const valuesRef = { ...defaultJob(), ...initial } as Job;

  function defaultJob(): Job {
    return { 
      title: "", 
      description: "", 
      requirements: "",
      location: "",
      salary: "",
      status: "DRAFT",
      company: "",
      department: ""
    };
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload: Job = {
      id: valuesRef.id,
      title: String(formData.get('title') || ''),
      description: String(formData.get('description') || ''),
      requirements: String(formData.get('requirements') || ''),
      location: String(formData.get('location') || ''),
      salary: String(formData.get('salary') || ''),
      status: String(formData.get('status') || 'DRAFT'),
      company: String(formData.get('company') || ''),
      department: String(formData.get('department') || ''),
    };
    onSubmit(payload);
  }

  const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
  const labelStyle: CSSProperties = { fontSize: 13, color: '#374151', fontWeight: '500' };
  const inputStyle: CSSProperties = { 
    padding: '10px 12px', 
    border: '1px solid #d1d5db', 
    borderRadius: 6,
    fontSize: '14px',
    transition: 'border-color 0.2s'
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      {/* Title and Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="title">Job Title *</label>
          <input 
            id="title" 
            name="title" 
            defaultValue={valuesRef.title} 
            style={inputStyle} 
            maxLength={255} 
            required 
            placeholder="e.g., Senior Software Engineer"
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="status">Status *</label>
          <select id="status" name="status" defaultValue={valuesRef.status} style={inputStyle} required>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Company and Department */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="company">Company</label>
          <input 
            id="company" 
            name="company" 
            defaultValue={valuesRef.company} 
            style={inputStyle} 
            maxLength={255}
            placeholder="e.g., Tech Corp"
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="department">Department</label>
          <input 
            id="department" 
            name="department" 
            defaultValue={valuesRef.department} 
            style={inputStyle} 
            maxLength={255}
            placeholder="e.g., Engineering"
          />
        </div>
      </div>

      {/* Location and Salary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="location">Location</label>
          <input 
            id="location" 
            name="location" 
            defaultValue={valuesRef.location} 
            style={inputStyle} 
            maxLength={255}
            placeholder="e.g., San Francisco, CA"
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="salary">Salary Range</label>
          <input 
            id="salary" 
            name="salary" 
            defaultValue={valuesRef.salary} 
            style={inputStyle} 
            maxLength={255}
            placeholder="e.g., $80,000 - $120,000"
          />
        </div>
      </div>

      {/* Description */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="description">Job Description *</label>
        <textarea 
          id="description" 
          name="description" 
          defaultValue={valuesRef.description} 
          style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} 
          maxLength={2000} 
          required
          placeholder="Describe the role, responsibilities, and what you're looking for..."
        />
      </div>

      {/* Requirements */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="requirements">Requirements</label>
        <textarea 
          id="requirements" 
          name="requirements" 
          defaultValue={valuesRef.requirements} 
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} 
          maxLength={2000}
          placeholder="List the required skills, experience, and qualifications..."
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        <button 
          type="button" 
          onClick={onCancel} 
          style={{ 
            padding: '10px 20px', 
            borderRadius: 6, 
            border: '1px solid #d1d5db', 
            background: '#fff',
            color: '#374151',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          style={{ 
            padding: '10px 20px', 
            borderRadius: 6, 
            border: '1px solid #2563eb', 
            background: '#2563eb', 
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {valuesRef.id ? 'Update Job' : 'Create Job'}
        </button>
      </div>
    </form>
  );
}
