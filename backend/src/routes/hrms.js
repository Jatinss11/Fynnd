const router = require('express').Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const PerformanceReview = require('../models/PerformanceReview');
const Department = require('../models/Department');
const Holiday = require('../models/Holiday');
const { auth, requireRole } = require('../middleware/auth');
const { isValidObjectId, safePagination } = require('../middleware/validate');

// ── DEPARTMENTS ───────────────────────────────────────────────────────────────

router.get('/departments', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const depts = await Department.find({ companyId: req.user._id, isActive: true })
      .populate('headId', 'firstName lastName designation');
    res.json(depts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/departments', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const dept = await Department.create({ ...req.body, companyId: req.user._id });
    res.status(201).json(dept);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/departments/:id', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const dept = await Department.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user._id },
      req.body, { new: true }
    );
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/departments/:id', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    await Department.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user._id },
      { isActive: false }
    );
    res.json({ message: 'Department deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── EMPLOYEES ─────────────────────────────────────────────────────────────────

router.get('/employees', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const { search, department, status, sort = '-createdAt' } = req.query;
    const { page, limit } = safePagination(req.query.page, req.query.limit, 50);
    const query = { companyId: req.user._id, isActive: true };
    if (department) query.department = department;
    if (status) query.status = status;
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ firstName: re }, { lastName: re }, { email: re }, { employeeId: re }, { designation: re }];
    }
    const [employees, total] = await Promise.all([
      Employee.find(query)
        .populate('reportingTo', 'firstName lastName designation')
        .sort(sort).skip((page - 1) * limit).limit(limit),
      Employee.countDocuments(query),
    ]);
    res.json({ employees, total, pages: Math.ceil(total / limit), page });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/employees/stats', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const companyId = req.user._id;
    const [total, active, onLeave, newThisMonth] = await Promise.all([
      Employee.countDocuments({ companyId, isActive: true }),
      Employee.countDocuments({ companyId, status: 'Active', isActive: true }),
      Employee.countDocuments({ companyId, status: 'On Leave', isActive: true }),
      Employee.countDocuments({
        companyId, isActive: true,
        joiningDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
    ]);
    const byDept = await Employee.aggregate([
      { $match: { companyId: req.user._id, isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ total, active, onLeave, newThisMonth, byDept });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/employees/:id', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const emp = await Employee.findOne({ _id: req.params.id, companyId: req.user._id })
      .populate('reportingTo', 'firstName lastName designation');
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json(emp);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/employees', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    // Auto-generate employee ID
    const count = await Employee.countDocuments({ companyId: req.user._id });
    const employeeId = req.body.employeeId || `EMP${String(count + 1).padStart(4, '0')}`;
    const emp = await Employee.create({ ...req.body, employeeId, companyId: req.user._id, createdBy: req.user._id });
    res.status(201).json(emp);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Employee ID or email already exists' });
    res.status(500).json({ message: err.message });
  }
});

router.put('/employees/:id', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const { _id, companyId, createdBy, ...updates } = req.body;
    const emp = await Employee.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user._id },
      updates, { new: true, runValidators: true }
    );
    if (!emp) return res.status(404).json({ message: 'Employee not found' });
    res.json(emp);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/employees/:id', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    await Employee.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user._id },
      { isActive: false, status: 'Terminated' }
    );
    res.json({ message: 'Employee removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── ATTENDANCE ────────────────────────────────────────────────────────────────

router.get('/attendance', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const { employeeId, month, year, date } = req.query;
    const query = { companyId: req.user._id };
    if (employeeId) query.employeeId = employeeId;
    if (date) {
      const d = new Date(date);
      query.date = { $gte: new Date(d.setHours(0,0,0,0)), $lt: new Date(d.setHours(23,59,59,999)) };
    } else if (month && year) {
      query.date = {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1),
      };
    }
    const records = await Attendance.find(query)
      .populate('employeeId', 'firstName lastName employeeId department designation')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/attendance', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, notes, location } = req.body;
    
    // Calculate work hours
    let workHours = 0;
    if (checkIn && checkOut) {
      workHours = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60);
    }
    
    const record = await Attendance.findOneAndUpdate(
      { employeeId, date: new Date(date), companyId: req.user._id },
      { employeeId, date: new Date(date), companyId: req.user._id, checkIn, checkOut, status, notes, location, workHours },
      { upsert: true, new: true }
    );
    res.status(201).json(record);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/attendance/bulk', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const { records } = req.body; // array of attendance records
    const ops = records.map(r => ({
      updateOne: {
        filter: { employeeId: r.employeeId, date: new Date(r.date), companyId: req.user._id },
        update: { ...r, companyId: req.user._id },
        upsert: true,
      }
    }));
    await Attendance.bulkWrite(ops);
    res.json({ message: `${records.length} records saved` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/attendance/summary/:employeeId', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    
    const records = await Attendance.find({
      employeeId: req.params.employeeId,
      companyId: req.user._id,
      date: { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) },
    });
    
    const summary = {
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      late: records.filter(r => r.status === 'Late').length,
      halfDay: records.filter(r => r.status === 'Half Day').length,
      onLeave: records.filter(r => r.status === 'On Leave').length,
      totalWorkHours: records.reduce((sum, r) => sum + (r.workHours || 0), 0),
      totalOvertime: records.reduce((sum, r) => sum + (r.overtime || 0), 0),
    };
    res.json({ summary, records });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── LEAVES ────────────────────────────────────────────────────────────────────

router.get('/leaves', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const { employeeId, status, month, year } = req.query;
    const query = { companyId: req.user._id };
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;
    if (month && year) {
      query.startDate = { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) };
    }
    const leaves = await Leave.find(query)
      .populate('employeeId', 'firstName lastName employeeId department designation')
      .populate('approvedBy', 'name')
      .sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/leaves', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const leave = await Leave.create({ ...req.body, companyId: req.user._id });
    res.status(201).json(leave);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/leaves/:id/approve', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const leave = await Leave.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user._id },
      { status: 'Approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    ).populate('employeeId');
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    
    // Deduct from leave balance
    const leaveTypeMap = { Casual: 'casual', Sick: 'sick', Earned: 'earned', Unpaid: 'unpaid' };
    const balanceKey = leaveTypeMap[leave.leaveType];
    if (balanceKey) {
      await Employee.findByIdAndUpdate(leave.employeeId._id, {
        $inc: { [`leaveBalance.${balanceKey}`]: -leave.totalDays }
      });
    }
    res.json(leave);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/leaves/:id/reject', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const leave = await Leave.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user._id },
      { status: 'Rejected', approvedBy: req.user._id, approvedAt: new Date(), rejectionReason: req.body.reason },
      { new: true }
    );
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    res.json(leave);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PAYROLL ───────────────────────────────────────────────────────────────────

router.get('/payroll', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const { month, year, employeeId, status } = req.query;
    const query = { companyId: req.user._id };
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (employeeId) query.employeeId = employeeId;
    if (status) query.paymentStatus = status;
    const payrolls = await Payroll.find(query)
      .populate('employeeId', 'firstName lastName employeeId department designation')
      .sort({ year: -1, month: -1 });
    res.json(payrolls);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/payroll/generate', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const { month, year } = req.body;
    const employees = await Employee.find({ companyId: req.user._id, status: 'Active', isActive: true });
    
    const payrolls = [];
    for (const emp of employees) {
      const existing = await Payroll.findOne({ employeeId: emp._id, month, year, companyId: req.user._id });
      if (existing) continue;
      
      // Get attendance for the month
      const attendance = await Attendance.find({
        employeeId: emp._id,
        date: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) },
      });
      
      const workingDays = new Date(year, month, 0).getDate(); // days in month
      const presentDays = attendance.filter(a => ['Present', 'Late', 'Half Day'].includes(a.status)).length;
      const leaveDays = attendance.filter(a => a.status === 'On Leave').length;
      const absentDays = workingDays - presentDays - leaveDays;
      
      const basicSalary = emp.salary || 0;
      const hra = Math.round(basicSalary * 0.4);
      const allowances = Math.round(basicSalary * 0.1);
      const grossSalary = basicSalary + hra + allowances;
      
      const pf = Math.round(basicSalary * 0.12);
      const esi = grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0;
      const tax = grossSalary > 50000 ? Math.round(grossSalary * 0.1) : 0;
      const totalDeductions = pf + esi + tax;
      
      // Pro-rate if absent
      const perDaySalary = grossSalary / workingDays;
      const deductForAbsent = Math.round(perDaySalary * Math.max(0, absentDays));
      const netSalary = Math.round(grossSalary - totalDeductions - deductForAbsent);
      
      const payroll = await Payroll.create({
        employeeId: emp._id,
        companyId: req.user._id,
        month, year,
        basicSalary, hra, allowances,
        grossSalary,
        pf, esi, tax, totalDeductions,
        netSalary,
        workingDays, presentDays, absentDays, leaveDays,
        generatedBy: req.user._id,
      });
      payrolls.push(payroll);
    }
    res.json({ message: `Generated payroll for ${payrolls.length} employees`, payrolls });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/payroll/:id', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const payroll = await Payroll.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user._id },
      req.body, { new: true }
    ).populate('employeeId', 'firstName lastName employeeId');
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });
    res.json(payroll);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/payroll/mark-paid', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const { ids } = req.body;
    await Payroll.updateMany(
      { _id: { $in: ids }, companyId: req.user._id },
      { paymentStatus: 'Paid', paymentDate: new Date() }
    );
    res.json({ message: `${ids.length} payrolls marked as paid` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PERFORMANCE REVIEWS ───────────────────────────────────────────────────────

router.get('/reviews', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    const query = { companyId: req.user._id };
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;
    const reviews = await PerformanceReview.find(query)
      .populate('employeeId', 'firstName lastName employeeId department designation')
      .populate('reviewerId', 'name')
      .sort({ reviewDate: -1 });
    res.json(reviews);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/reviews', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const review = await PerformanceReview.create({
      ...req.body,
      companyId: req.user._id,
      reviewerId: req.user._id,
    });
    // Update employee's last review date
    await Employee.findByIdAndUpdate(req.body.employeeId, {
      lastReviewDate: req.body.reviewDate,
      nextReviewDate: req.body.nextReviewDate,
      performanceRating: req.body.overallRating,
    });
    res.status(201).json(review);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/reviews/:id', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const review = await PerformanceReview.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user._id },
      req.body, { new: true }
    );
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── HOLIDAYS ──────────────────────────────────────────────────────────────────

router.get('/holidays', auth, async (req, res) => {
  try {
    const { year } = req.query;
    const query = { companyId: req.user._id, isActive: true };
    if (year) {
      query.date = { $gte: new Date(year, 0, 1), $lt: new Date(parseInt(year) + 1, 0, 1) };
    }
    const holidays = await Holiday.find(query).sort({ date: 1 });
    res.json(holidays);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/holidays', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    const holiday = await Holiday.create({ ...req.body, companyId: req.user._id });
    res.status(201).json(holiday);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/holidays/:id', auth, requireRole('admin', 'client'), async (req, res) => {
  try {
    await Holiday.findOneAndUpdate({ _id: req.params.id, companyId: req.user._id }, { isActive: false });
    res.json({ message: 'Holiday removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
