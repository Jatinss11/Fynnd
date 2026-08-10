'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { DollarSign, Play, CheckCircle, Clock, Download, Filter, IndianRupee } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'badge-yellow', Processing: 'badge-blue', Paid: 'badge-green', Failed: 'badge-red',
};

export default function PayrollPage() {
  const qc = useQueryClient();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const { data: payrolls, isLoading } = useQuery({
    queryKey: ['hrms-payroll', month, year, statusFilter],
    queryFn: () => api.get('/hrms/payroll', { params: { month, year, status: statusFilter || undefined } }).then(r => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post('/hrms/payroll/generate', { month, year }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['hrms-payroll'] });
      toast.success(res.data.message);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to generate'),
  });

  const markPaidMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/hrms/payroll/mark-paid', { ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrms-payroll'] });
      setSelected([]);
      toast.success('Marked as paid');
    },
  });

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === payrolls?.length ? [] : payrolls?.map((p: any) => p._id) ?? []);

  const totalGross = payrolls?.reduce((s: number, p: any) => s + p.grossSalary, 0) ?? 0;
  const totalNet = payrolls?.reduce((s: number, p: any) => s + p.netSalary, 0) ?? 0;
  const totalDeductions = payrolls?.reduce((s: number, p: any) => s + p.totalDeductions, 0) ?? 0;
  const paidCount = payrolls?.filter((p: any) => p.paymentStatus === 'Paid').length ?? 0;

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="text-sm text-gray-500">{months[month - 1]} {year} · {payrolls?.length ?? 0} employees</p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <button onClick={() => markPaidMutation.mutate(selected)} className="btn-secondary text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              <CheckCircle size={15} /> Mark {selected.length} Paid
            </button>
          )}
          <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="btn-primary">
            <Play size={15} /> {generateMutation.isPending ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Gross Salary', value: `₹${totalGross.toLocaleString('en-IN')}`, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Deductions', value: `₹${totalDeductions.toLocaleString('en-IN')}`, color: 'text-red-500 bg-red-50' },
          { label: 'Net Payable', value: `₹${totalNet.toLocaleString('en-IN')}`, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Paid', value: `${paidCount} / ${payrolls?.length ?? 0}`, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <p className={`text-xl font-bold ${color.split(' ')[0]}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-4 p-3 flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          <select className="input w-28" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="input w-24" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex gap-2 ml-auto">
          {['', 'Pending', 'Paid', 'Failed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                statusFilter === s ? 'bg-fynnd-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Payroll table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="card h-14 animate-pulse bg-gray-50" />)}</div>
      ) : !payrolls?.length ? (
        <div className="card text-center py-14">
          <IndianRupee size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-600">No payroll generated yet</p>
          <p className="text-sm text-gray-400 mb-4">Click "Generate Payroll" to create payslips for {months[month - 1]} {year}</p>
          <button onClick={() => generateMutation.mutate()} className="btn-primary mx-auto">Generate Payroll</button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selected.length === payrolls.length} onChange={toggleAll} className="rounded" />
                  </th>
                  {['Employee', 'Basic', 'HRA', 'Gross', 'Deductions', 'Net Salary', 'Days', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payrolls.map((p: any) => (
                  <tr key={p._id} className={cn('hover:bg-gray-50 transition-colors', selected.includes(p._id) && 'bg-fynnd-50')}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggleSelect(p._id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.employeeId?.firstName} {p.employeeId?.lastName}</p>
                      <p className="text-xs text-gray-400">{p.employeeId?.employeeId} · {p.employeeId?.department}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">₹{p.basicSalary?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-gray-600">₹{p.hra?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">₹{p.grossSalary?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-red-500">-₹{p.totalDeductions?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">₹{p.netSalary?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.presentDays}/{p.workingDays}d</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_COLORS[p.paymentStatus]}`}>{p.paymentStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      {p.paymentStatus === 'Pending' && (
                        <button onClick={() => markPaidMutation.mutate([p._id])}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Mark Paid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
