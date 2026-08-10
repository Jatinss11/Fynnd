'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar, Download, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Present', 'Absent', 'Half Day', 'Late', 'On Leave', 'Holiday', 'Week Off'];
const STATUS_COLORS: Record<string, string> = {
  Present: 'badge-green', Absent: 'badge-red', 'Half Day': 'badge-yellow',
  Late: 'badge-orange', 'On Leave': 'badge-blue', Holiday: 'badge-purple', 'Week Off': 'badge-gray',
};

export default function AttendancePage() {
  const qc = useQueryClient();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: employees } = useQuery({
    queryKey: ['hrms-employees-all'],
    queryFn: () => api.get('/hrms/employees', { params: { limit: 100 } }).then(r => r.data.employees),
  });

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['hrms-attendance', selectedDate],
    queryFn: () => api.get('/hrms/attendance', { params: { date: selectedDate } }).then(r => r.data),
  });

  const { data: monthSummary } = useQuery({
    queryKey: ['hrms-attendance-month', month, year],
    queryFn: () => api.get('/hrms/attendance', { params: { month, year } }).then(r => r.data),
  });

  const getStatus = (empId: string) => {
    if (edits[empId]) return edits[empId];
    const rec = attendance?.find((a: any) => a.employeeId?._id === empId || a.employeeId === empId);
    return rec?.status || 'Absent';
  };

  const saveAttendance = async () => {
    if (!employees?.length) return;
    setSaving(true);
    try {
      const records = employees.map((emp: any) => ({
        employeeId: emp._id,
        date: selectedDate,
        status: getStatus(emp._id),
      }));
      await api.post('/hrms/attendance/bulk', { records });
      qc.invalidateQueries({ queryKey: ['hrms-attendance'] });
      setEdits({});
      toast.success('Attendance saved');
    } catch {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // Monthly stats
  const presentCount = monthSummary?.filter((a: any) => a.status === 'Present').length ?? 0;
  const absentCount = monthSummary?.filter((a: any) => a.status === 'Absent').length ?? 0;
  const leaveCount = monthSummary?.filter((a: any) => a.status === 'On Leave').length ?? 0;

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="text-sm text-gray-500">Track daily attendance for all employees</p>
        </div>
        <button onClick={saveAttendance} disabled={saving} className="btn-primary">
          <Save size={15} /> {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Present', value: presentCount, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Absent', value: absentCount, icon: XCircle, color: 'text-red-500 bg-red-50' },
          { label: 'On Leave', value: leaveCount, icon: AlertCircle, color: 'text-orange-500 bg-orange-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon size={18} /></div>
            <div><p className="text-xl font-bold">{value}</p><p className="text-xs text-gray-500">{label} this month</p></div>
          </div>
        ))}
      </div>

      {/* Date picker + month filter */}
      <div className="card mb-4 p-3 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <label className="text-sm font-medium text-gray-700">Date:</label>
          <input type="date" className="input w-44" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm font-medium text-gray-700">Month view:</label>
          <select className="input w-28" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="input w-24" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Attendance table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-800">
            Attendance for {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <span className="text-sm text-gray-500">{employees?.length ?? 0} employees</span>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
        ) : !employees?.length ? (
          <div className="text-center py-12 text-gray-400">
            <Clock size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No employees found. Add employees first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Check In</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Check Out</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map((emp: any) => {
                  const rec = attendance?.find((a: any) => a.employeeId?._id === emp._id || a.employeeId === emp._id);
                  const status = getStatus(emp._id);
                  return (
                    <tr key={emp._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-fynnd-100 text-fynnd-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-gray-400">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{emp.department || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={status}
                          onChange={e => setEdits(prev => ({ ...prev, [emp._id]: e.target.value }))}
                          className={cn('text-xs font-medium px-2.5 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-fynnd-500',
                            status === 'Present' ? 'bg-emerald-50 text-emerald-700' :
                            status === 'Absent' ? 'bg-red-50 text-red-600' :
                            status === 'Late' ? 'bg-orange-50 text-orange-700' :
                            status === 'Half Day' ? 'bg-yellow-50 text-yellow-700' :
                            status === 'On Leave' ? 'bg-blue-50 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          )}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {rec?.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {rec?.checkOut ? new Date(rec.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-medium">
                        {rec?.workHours ? `${rec.workHours.toFixed(1)}h` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
