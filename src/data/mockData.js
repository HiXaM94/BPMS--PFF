/**
 * Centralized mock data for all role-based dashboards.
 * Organized by role → section for clean separation.
 */

// ═══════════════════════════════════════
// ADMIN DASHBOARD DATA
// ═══════════════════════════════════════
export const adminData = {
  stats: [
    { id: 1, title: 'Total Organizations', value: '12', change: '+2', changeType: 'positive', subtitle: 'this quarter' },
    { id: 2, title: 'Active Users', value: '1,284', change: '+18.5%', changeType: 'positive' },
    { id: 3, title: 'Running Processes', value: '346', change: '+7.2%', changeType: 'positive' },
    { id: 4, title: 'System Uptime', value: '99.97%', change: '+0.02%', changeType: 'positive', subtitle: 'last 30 days' },
    { id: 5, title: 'API Calls Today', value: '42.8K', change: '+12%', changeType: 'positive' },
    { id: 6, title: 'Error Rate', value: '0.03%', change: '-0.01%', changeType: 'positive', subtitle: 'improving' },
  ],
  weeklyProcesses: [
    { label: 'Mon', value: 156 },
    { label: 'Tue', value: 189 },
    { label: 'Wed', value: 142 },
    { label: 'Thu', value: 210 },
    { label: 'Fri', value: 178 },
    { label: 'Sat', value: 65 },
    { label: 'Sun', value: 38 },
  ],
  monthlyUsers: [
    { label: 'Sep', value: 980 },
    { label: 'Oct', value: 1050 },
    { label: 'Nov', value: 1120 },
    { label: 'Dec', value: 1180 },
    { label: 'Jan', value: 1240 },
    { label: 'Feb', value: 1284 },
  ],
  organizations: [
    { id: 1, name: 'TechCorp Inc.', users: 245, processes: 48, status: 'active', plan: 'Enterprise' },
    { id: 2, name: 'FinServe Global', users: 189, processes: 36, status: 'active', plan: 'Business' },
    { id: 3, name: 'MediCare Plus', users: 156, processes: 29, status: 'active', plan: 'Enterprise' },
    { id: 4, name: 'EduLearn Academy', users: 112, processes: 22, status: 'trial', plan: 'Starter' },
    { id: 5, name: 'RetailMax', users: 198, processes: 41, status: 'active', plan: 'Business' },
    { id: 6, name: 'BuildPro Services', users: 87, processes: 15, status: 'suspended', plan: 'Starter' },
  ],
  systemLogs: [
    { id: 1, event: 'New organization registered', details: 'EduLearn Academy — Starter plan', time: '2m ago', severity: 'info' },
    { id: 2, event: 'High API usage alert', details: 'TechCorp exceeded 10K/hr threshold', time: '15m ago', severity: 'warning' },
    { id: 3, event: 'Database backup completed', details: 'All tenants backed up successfully', time: '1h ago', severity: 'success' },
    { id: 4, event: 'User account suspended', details: 'BuildPro — payment overdue', time: '3h ago', severity: 'danger' },
    { id: 5, event: 'SSL certificate renewed', details: 'Wildcard cert auto-renewed', time: '5h ago', severity: 'success' },
  ],
  globalLeaveRequests: [
    { id: 1, org: 'TechCorp', employee: 'Sarah Martinez', type: 'Annual Leave', dates: 'Feb 20 – Feb 24', status: 'pending', urgent: true },
    { id: 2, org: 'FinServe', employee: 'John Chen', type: 'Sick Leave', dates: 'Feb 14', status: 'approved', urgent: false },
    { id: 3, org: 'MediCare', employee: 'Amira Belkacem', type: 'Annual Leave', dates: 'Mar 3 – Mar 7', status: 'pending', urgent: false },
    { id: 4, org: 'TechCorp', employee: 'David O\'Connor', type: 'Remote Work', dates: 'Feb 17 – Feb 21', status: 'approved', urgent: false },
    { id: 5, org: 'RetailMax', employee: 'Lisa Park', type: 'Maternity', dates: 'Mar 1 – May 31', status: 'approved', urgent: false },
    { id: 6, org: 'Global Logistics', employee: 'Marcus Thorne', type: 'Unpaid Leave', dates: 'Feb 28 – Mar 5', status: 'pending', urgent: true },
    { id: 7, org: 'EduLearn', employee: 'Elena Rodriguez', type: 'Sick Leave', dates: 'Feb 22 – Feb 23', status: 'rejected', urgent: false },
    { id: 8, org: 'FinServe', employee: 'Siddharth Gupta', type: 'Remote Work', dates: 'Mar 10 – Mar 12', status: 'pending', urgent: false },
  ],
};

// ═══════════════════════════════════════
// HR DASHBOARD DATA
// ═══════════════════════════════════════
export const hrData = {
  stats: [
    { id: 1, title: 'Total Employees', value: '245', change: '+8', changeType: 'positive', subtitle: 'this month' },
    { id: 2, title: 'Open Positions', value: '12', change: '+3', changeType: 'negative', subtitle: 'unfilled' },
    { id: 3, title: 'Pending Requests', value: '28', change: '-5', changeType: 'positive', subtitle: 'vs last week' },
    { id: 4, title: 'Avg Onboarding', value: '4.2d', change: '-1.3d', changeType: 'positive', subtitle: 'improving' },
  ],
  recruitmentPipeline: [
    { label: 'Applied', value: 48 },
    { label: 'Screened', value: 32 },
    { label: 'Interview', value: 18 },
    { label: 'Technical', value: 12 },
    { label: 'Offer', value: 6 },
    { label: 'Hired', value: 4 },
  ],
  monthlyHiring: [
    { label: 'Sep', value: 5 },
    { label: 'Oct', value: 8 },
    { label: 'Nov', value: 6 },
    { label: 'Dec', value: 3 },
    { label: 'Jan', value: 7 },
    { label: 'Feb', value: 4 },
  ],
  leaveRequests: [
    { id: 1, employeeName: 'Sarah Martinez', type: 'Annual Leave', startDate: '2026-02-20', endDate: '2026-02-24', daysCount: 5, status: 'pending', department: 'Engineering', reason: 'Annual family vacation' },
    { id: 2, employeeName: 'John Chen', type: 'Sick Leave', startDate: '2026-02-14', endDate: '2026-02-14', daysCount: 1, status: 'approved', department: 'Design', reason: 'Flu recovery' },
    { id: 3, employeeName: 'Amira Belkacem', type: 'Annual Leave', startDate: '2026-03-03', endDate: '2026-03-07', daysCount: 5, status: 'pending', department: 'Marketing', reason: 'Personal time' },
    { id: 4, employeeName: 'David O\'Connor', type: 'Remote Work', startDate: '2026-02-17', endDate: '2026-02-21', daysCount: 5, status: 'approved', department: 'Engineering', reason: 'Working from hometown' },
    { id: 5, employeeName: 'Lisa Park', type: 'Maternity', startDate: '2026-03-01', endDate: '2026-05-31', daysCount: 90, status: 'approved', department: 'Finance', reason: 'Maternity leave' },
    { id: 6, employeeName: 'Omar Rizk', type: 'Annual Leave', startDate: '2026-02-25', endDate: '2026-02-26', daysCount: 2, status: 'rejected', department: 'Sales', reason: 'Peak sales period' },
  ],
  onboarding: [
    { id: 1, name: 'Emma Wilson', position: 'Frontend Developer', startDate: 'Feb 17', step: 3, totalSteps: 5, status: 'in-progress' },
    { id: 2, name: 'Ahmed Hassan', position: 'Data Analyst', startDate: 'Feb 10', step: 5, totalSteps: 5, status: 'completed' },
    { id: 3, name: 'Clara Dupont', position: 'Product Manager', startDate: 'Feb 24', step: 1, totalSteps: 5, status: 'not-started' },
  ],
  performanceDistribution: [
    { label: 'Excellent', value: 42, color: '#83bf6e' },
    { label: 'Good', value: 35, color: '#2a85ff' },
    { label: 'Average', value: 18, color: '#ff9a55' },
    { label: 'Below Avg', value: 5, color: '#ff6a55' },
  ],
  departmentEfficiency: [
    { label: 'Engineering', value: 94 },
    { label: 'Design', value: 88 },
    { label: 'Marketing', value: 82 },
    { label: 'Finance', value: 91 },
    { label: 'Sales', value: 76 },
  ],
  topPerformers: [
    { id: 1, name: 'Fatima Zahra', dept: 'Engineering', completion: '98%', tasks: 31 },
    { id: 2, name: 'Alice Wang', dept: 'Engineering', completion: '96%', tasks: 24 },
    { id: 3, name: 'John Chen', dept: 'Design', completion: '94%', tasks: 28 },
    { id: 4, name: 'Amira Belkacem', dept: 'Marketing', completion: '92%', tasks: 22 },
  ],
};

// ═══════════════════════════════════════
// TEAM MANAGER DASHBOARD DATA
// ═══════════════════════════════════════
export const managerData = {
  stats: [
    { id: 1, title: 'Team Members', value: '18', change: '+2', changeType: 'positive', subtitle: 'new this month' },
    { id: 2, title: 'Active Tasks', value: '42', change: '-8', changeType: 'positive', subtitle: 'resolved' },
    { id: 3, title: 'Pending Approvals', value: '7', change: '+3', changeType: 'negative', subtitle: 'awaiting review' },
    { id: 4, title: 'Completion Rate', value: '87%', change: '+4.5%', changeType: 'positive' },
  ],
  teamPerformance: [
    { label: 'Mon', value: 18 },
    { label: 'Tue', value: 24 },
    { label: 'Wed', value: 21 },
    { label: 'Thu', value: 28 },
    { label: 'Fri', value: 22 },
    { label: 'Sat', value: 6 },
    { label: 'Sun', value: 3 },
  ],
  processCompletion: [
    { label: 'Wk 1', value: 32 },
    { label: 'Wk 2', value: 38 },
    { label: 'Wk 3', value: 41 },
    { label: 'Wk 4', value: 45 },
    { label: 'Wk 5', value: 42 },
    { label: 'Wk 6', value: 48 },
  ],
  pendingApprovals: [
    { id: 1, title: 'Budget Increase Request', requester: 'Sarah M.', type: 'Finance', priority: 'high', submitted: '2h ago', amount: '$12,500' },
    { id: 2, title: 'New Hire — Junior Dev', requester: 'HR Team', type: 'Recruitment', priority: 'medium', submitted: '4h ago', amount: null },
    { id: 3, title: 'Travel Reimbursement', requester: 'John C.', type: 'Expense', priority: 'low', submitted: '1d ago', amount: '$2,340' },
    { id: 4, title: 'Software License — Figma', requester: 'Design Team', type: 'Procurement', priority: 'medium', submitted: '1d ago', amount: '$840/yr' },
    { id: 5, title: 'Office Relocation Plan', requester: 'Admin Dept.', type: 'Operations', priority: 'high', submitted: '2d ago', amount: null },
  ],
  teamMembers: [
    { id: 1, name: 'Alice Wang', role: 'Sr. Developer', tasksCompleted: 24, tasksActive: 3, performance: 'excellent', efficiency: 94, status: 'Active' },
    { id: 2, name: 'Bob Tanaka', role: 'Developer', tasksCompleted: 18, tasksActive: 4, performance: 'good', efficiency: 86, status: 'Active' },
    { id: 3, name: 'Fatima Zahra', role: 'QA Engineer', tasksCompleted: 31, tasksActive: 2, performance: 'excellent', efficiency: 98, status: 'Active' },
    { id: 4, name: 'Carlos Ruiz', role: 'Designer', tasksCompleted: 15, tasksActive: 5, performance: 'average', efficiency: 72, status: 'Active' },
    { id: 5, name: 'Diana Kim', role: 'Developer', tasksCompleted: 22, tasksActive: 2, performance: 'good', efficiency: 89, status: 'On Leave' },
    { id: 6, name: 'Ethan Brown', role: 'Jr. Developer', tasksCompleted: 12, tasksActive: 6, performance: 'improving', efficiency: 68, status: 'Active' },
  ],
  assignedProjects: [
    {
      id: 1,
      title: 'B2B Portal Refactor',
      department: 'Engineering',
      deadline: 'Mar 15, 2026',
      status: 'Active',
      members: 8,
      progress: 68,
      description: 'Complete overhaul of the B2B customer portal to improve performance and add 3D visualization capabilities.',
      client: 'Internal / Enterprise Sales',
      budget: '$45,000'
    },
    {
      id: 2,
      title: 'AI Recommendation Engine',
      department: 'Data Science',
      deadline: 'Apr 02, 2026',
      status: 'Active',
      members: 5,
      progress: 32,
      description: 'Implementing a machine learning based recommendation system to personalize user experiences.',
      client: 'Global Marketing',
      budget: '$30,000'
    },
    {
      id: 3,
      title: 'Security Audit Q1',
      department: 'DevOps',
      deadline: 'Mar 10, 2026',
      status: 'Critical',
      members: 3,
      progress: 85,
      description: 'Quarterly infrastructure security audit and vulnerability patch management.',
      client: 'System Compliance',
      budget: '$15,000'
    },
  ],
  pendingTasks: [
    { id: 101, title: 'API Integration Layer', assignee: 'Alice Wang', project: 'B2B Portal', priority: 'High', submitted: '2h ago' },
    { id: 102, title: 'Auth Middleware Fix', assignee: 'Bob Tanaka', project: 'B2B Portal', priority: 'Critical', submitted: '4h ago' },
    { id: 103, title: 'Design System Update', assignee: 'Carlos Ruiz', project: 'Global UI', priority: 'Medium', submitted: '1d ago' },
  ],
  teamLeaveRequests: [
    { id: 1, employeeName: 'Bob Tanaka', type: 'Annual Leave', dates: 'Feb 26 – Feb 28', status: 'pending', urgent: false },
    { id: 2, employeeName: 'Carlos Ruiz', type: 'Remote Work', dates: 'Feb 24', status: 'pending', urgent: true },
  ],
};

// ═══════════════════════════════════════
// EMPLOYEE DASHBOARD DATA
// ═══════════════════════════════════════
export const employeeData = {
  stats: [
    { id: 1, title: 'My Active Tasks', value: '6', change: '-2', changeType: 'positive', subtitle: 'completed today' },
    { id: 2, title: 'Completed This Week', value: '14', change: '+5', changeType: 'positive' },
    { id: 3, title: 'Pending Requests', value: '3', subtitle: 'awaiting approval' },
    { id: 4, title: 'Workflow Progress', value: '78%', change: '+12%', changeType: 'positive', subtitle: 'this sprint' },
  ],
  weeklyActivity: [
    { label: 'Mon', value: 5 },
    { label: 'Tue', value: 7 },
    { label: 'Wed', value: 4 },
    { label: 'Thu', value: 8 },
    { label: 'Fri', value: 6 },
    { label: 'Sat', value: 1 },
    { label: 'Sun', value: 0 },
  ],
  myTasks: [
    { id: 1, title: 'Review Q4 Financial Report', process: 'Quarterly Review', priority: 'high', deadline: 'Feb 14', status: 'in-progress' },
    { id: 2, title: 'Submit timesheet approval', process: 'Weekly Ops', priority: 'medium', deadline: 'Feb 15', status: 'pending' },
    { id: 3, title: 'Update project documentation', process: 'Sprint Cycle', priority: 'low', deadline: 'Feb 18', status: 'pending' },
    { id: 4, title: 'Complete security training', process: 'Compliance', priority: 'high', deadline: 'Feb 20', status: 'not-started' },
    { id: 5, title: 'Code review — PR #247', process: 'Dev Workflow', priority: 'medium', deadline: 'Feb 14', status: 'in-progress' },
    { id: 6, title: 'Prepare sprint demo', process: 'Sprint Cycle', priority: 'medium', deadline: 'Feb 16', status: 'not-started' },
  ],
  myRequests: [
    { id: 1, type: 'Leave Request', submitted: 'Feb 10', dates: 'Feb 20–24', status: 'pending' },
    { id: 2, type: 'Equipment Request', submitted: 'Feb 8', details: 'External monitor', status: 'approved' },
    { id: 3, type: 'Training Budget', submitted: 'Feb 5', details: 'React Advanced — $299', status: 'rejected' },
  ],
  recentActivity: [
    { id: 1, action: 'Completed task "Deploy staging env"', time: '30m ago' },
    { id: 2, action: 'Submitted leave request for Feb 20–24', time: '2h ago' },
    { id: 3, action: 'Commented on PR #245', time: '3h ago' },
    { id: 4, action: 'Approved by manager — equipment request', time: '1d ago' },
    { id: 5, action: 'Completed security awareness module', time: '2d ago' },
  ],
};
