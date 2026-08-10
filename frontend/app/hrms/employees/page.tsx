'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import Link from 'next/link';
import { Plus, Search, Filter, Users, Mail, Phone, Building2, Briefcase, MoreVertical, Edit, Trash2, X } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

const STATUS_COLORS: Record<string, string> = {
  Active: 'badge-green', Probation: 'badge-yellow', 'On Leave': 'badge-orange',
  'Notice Period': 'badge-red', Resigned: 'badge-gray', Terminated: 'badge-red',
};

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Legal', 'Customer Support'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'];

export default function EmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState<any>(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', department: '',
    designation: '', employmentType: 'Full-time', joiningDate: '',
    salary: '', city: '', state: '', gender: '', dateOfBirth: '',
    reportingTo: '', status: 'Active',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data, isLoading } = useQuery({
    queryKey: ['hrms-employees', search, deptFilter, statusFilter],
    queryFn: () => api.get('/hrms/employees', { params: { search, department: deptFilter, status: statusFilter } }).then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editEmp
      ? api.put(`/hrms/employees/${editEmp._id}`, data)
      : api.post('/hrms/employees', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrms-employees'] });
      qc.invalidateQueries({ queryKey: ['hrms-stats'] });
      setShowModal(false);
      setEditEmp(null);
      toast.success(editEmp ? 'Employee updated' : 'Employee added');
      setForm({ firstName: '', lastName: '', email: '', phone: '', department: '', designation: '', employmentType: 'Full-time', joiningDate: '', salary: '', city: '', state: '', gender: '', dateOfBirth: '', reportingTo: '', status: 'Active' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/hrms/employees/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hrms-employees'] }); toast.success('Employee removed'); },
  });

  const openEdit = (emp: any) => {
    setEditEmp(emp);
    setForm({
      firstName: emp.firstName, lastName: emp.lastName, email: emp.email,
      phone: emp.phone || '', department: emp.department || '',
      designation: emp.designation || '', employmentType: emp.employmentType || 'Full-time',
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
      salary: emp.salary?.toString() || '', city: emp.city || '', state: emp.state || '',
      gender: emp.gender || '', dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split('T')[0] : '',
      reportingTo: emp.reportingTo?._id || '', status: emp.status || 'Active',
    });
    setShowModal(true);
  };

  const employees = data?.employees ?? [];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} total employees</p>
        </div>
        <button onClick={() => { setEditEmp(null); setShowModal(true); }} className="btn-primary">
          <Plus size={15} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4 p-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-3 text-gray-400" />
            <input className="input pl-9" placeholder="Search name, email, ID..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-44" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="input w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {['Active', 'Probation', 'On Leave', 'Notice Period', 'Resigned', 'Terminated'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || deptFilter || statusFilter) && (
            <button onClick={() => { setSearch(''); setDeptFilter(''); setStatusFilter(''); }} className="btn-secondary px-3">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-gray-50" />)}</div>
      ) : employees.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-600">No employees found</p>
          <p className="text-sm text-gray-400 mb-4">Add your first employee to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">Add Employee</button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Department', 'Contact', 'Joining Date', 'Salary', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map((emp: any) => (
                  <tr key={emp._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-fynnd-100 text-fynnd-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {emp.firstName?.[0]}{emp.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-gray-400">{emp.employeeId} · {emp.designation || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Building2 size={13} className="text-gray-400" />
                        {emp.department || '—'}
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">{emp.employmentType}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1.5 text-gray-600"><Mail size={12} className="text-gray-400" />{emp.email}</p>
                      {emp.phone && <p className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5"><Phone size={11} />{emp.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(emp.joiningDate)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {emp.salary ? `₹${emp.salary.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_COLORS[emp.status] || 'badge-gray'}`}>{emp.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(emp)} className="btn-ghost p-1.5 text-gray-400 hover:text-fynnd-600"><Edit size={14} /></button>
                        <button onClick={() => { if (confirm(`Remove ${emp.firstName}?`)) deleteMutation.mutate(emp._id); }} className="btn-ghost p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditEmp(null); }} title={editEmp ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={e => { e.preventDefault(); saveMutation.mutate({ ...form, salary: form.salary ? Number(form.salary) : undefined }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">First Name *</label><input className="input" required value={form.firstName} onChange={e => set('firstName', e.target.value)} /></div>
            <div><label className="label">Last Name *</label><input className="input" required value={form.lastName} onChange={e => set('lastName', e.target.value)} /></div>
            <div><label className="label">Email *</label><input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="label">Department</label>
              <select className="input" value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="">Select</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="label">Designation</label><input className="input" placeholder="e.g. Senior Engineer" value={form.designation} onChange={e => set('designation', e.target.value)} /></div>
            <div><label className="label">Employment Type</label>
              <select className="input" value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {['Active', 'Probation', 'On Leave', 'Notice Period', 'Resigned', 'Terminated'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Joining Date *</label><input className="input" type="date" required value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} /></div>
            <div><label className="label">Monthly Salary (₹)</label><input className="input" type="number" placeholder="e.g. 50000" value={form.salary} onChange={e => set('salary', e.target.value)} /></div>
            <div><label className="label">City</label><input className="input" value={form.city} onChange={e => set('city', e.target.value)} /></div>
            <div><label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select</option>
                {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          {saveMutation.isError && <p className="text-red-500 text-sm">{(saveMutation.error as any)?.response?.data?.message}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : editEmp ? 'Update' : 'Add Employee'}</button>
            <button type="button" onClick={() => { setShowModal(false); setEditEmp(null); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
