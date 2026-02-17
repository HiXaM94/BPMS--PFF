import { useState } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Briefcase, Award,
  Edit, Building2, Clock, Star, GraduationCap, FileText, ShieldAlert,
  Search, CreditCard, Landmark, Hash,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { useRole } from '../../contexts/RoleContext';

/**
 * All mock employees — each has the card fields (name, email, phone, cnss, rib, department)
 * plus full detail fields shown inside the modal.
 */
const allEmployees = [
  {
    id: 1,
    name: 'Ibrahim Rouass',
    email: 'ibrahim.rouass@bpms.io',
    phone: '+212 661 123 456',
    cnss: '1234567890',
    rib: 'MA76 0011 1110 0000 0123 4567 890',
    department: 'Engineering',
    title: 'Senior Full Stack Developer',
    location: 'Casablanca, Morocco',
    manager: 'Mohamed Amine Mounzih',
    joinDate: 'Jan 15, 2025',
    employeeId: 'EMP-2025-001',
    status: 'active',
    avatar: 'IR',
    bio: 'Experienced full-stack developer specializing in React, Node.js, and cloud architecture. Passionate about building scalable SaaS platforms.',
    skills: [
      { name: 'React.js', level: 95 },
      { name: 'Node.js', level: 88 },
      { name: 'TypeScript', level: 82 },
      { name: 'PostgreSQL', level: 78 },
    ],
    certifications: [
      { name: 'AWS Solutions Architect', issuer: 'Amazon', date: 'Mar 2025', status: 'active' },
      { name: 'React Advanced Patterns', issuer: 'Ynov Campus', date: 'Sep 2025', status: 'active' },
    ],
  },
  {
    id: 2,
    name: 'Sarah Martinez',
    email: 'sarah.m@bpms.io',
    phone: '+212 662 234 567',
    cnss: '2345678901',
    rib: 'MA76 0022 2220 0000 0234 5678 901',
    department: 'Marketing',
    title: 'Marketing Manager',
    location: 'Rabat, Morocco',
    manager: 'Ibrahim Rouass',
    joinDate: 'Mar 1, 2025',
    employeeId: 'EMP-2025-002',
    status: 'active',
    avatar: 'SM',
    bio: 'Creative marketing professional with 5+ years of experience in digital campaigns and brand strategy.',
    skills: [
      { name: 'SEO/SEM', level: 92 },
      { name: 'Content Strategy', level: 88 },
      { name: 'Google Analytics', level: 85 },
      { name: 'Social Media', level: 90 },
    ],
    certifications: [
      { name: 'Google Analytics Certified', issuer: 'Google', date: 'Jun 2025', status: 'active' },
    ],
  },
  {
    id: 3,
    name: 'Ahmed Hassan',
    email: 'ahmed.h@bpms.io',
    phone: '+212 663 345 678',
    cnss: '3456789012',
    rib: 'MA76 0033 3330 0000 0345 6789 012',
    department: 'Engineering',
    title: 'Data Analyst',
    location: 'Casablanca, Morocco',
    manager: 'Ibrahim Rouass',
    joinDate: 'Feb 10, 2025',
    employeeId: 'EMP-2025-003',
    status: 'active',
    avatar: 'AH',
    bio: 'Data analyst specializing in business intelligence and reporting. Focused on turning data into actionable insights.',
    skills: [
      { name: 'Python', level: 90 },
      { name: 'SQL', level: 85 },
      { name: 'Power BI', level: 80 },
      { name: 'Excel', level: 92 },
    ],
    certifications: [
      { name: 'Google Data Analytics', issuer: 'Google', date: 'Jun 2025', status: 'active' },
      { name: 'Power BI Data Analyst', issuer: 'Microsoft', date: 'Oct 2025', status: 'active' },
    ],
  },
  {
    id: 4,
    name: 'Clara Dupont',
    email: 'clara.d@bpms.io',
    phone: '+212 664 456 789',
    cnss: '4567890123',
    rib: 'MA76 0044 4440 0000 0456 7890 123',
    department: 'Human Resources',
    title: 'HR Coordinator',
    location: 'Marrakech, Morocco',
    manager: 'Sarah Martinez',
    joinDate: 'Apr 5, 2025',
    employeeId: 'EMP-2025-004',
    status: 'active',
    avatar: 'CD',
    bio: 'HR professional experienced in talent acquisition, onboarding, and employee engagement programs.',
    skills: [
      { name: 'Recruitment', level: 88 },
      { name: 'Employee Relations', level: 82 },
      { name: 'HRIS Systems', level: 75 },
      { name: 'Payroll', level: 70 },
    ],
    certifications: [
      { name: 'SHRM-CP', issuer: 'SHRM', date: 'Aug 2025', status: 'active' },
    ],
  },
  {
    id: 5,
    name: 'John Chen',
    email: 'john.c@bpms.io',
    phone: '+212 665 567 890',
    cnss: '5678901234',
    rib: 'MA76 0055 5550 0000 0567 8901 234',
    department: 'Design',
    title: 'UI/UX Designer',
    location: 'Tangier, Morocco',
    manager: 'Ibrahim Rouass',
    joinDate: 'May 20, 2025',
    employeeId: 'EMP-2025-005',
    status: 'inactive',
    avatar: 'JC',
    bio: 'Product designer passionate about crafting user-centered experiences. Expertise in Figma, prototyping, and design systems.',
    skills: [
      { name: 'Figma', level: 95 },
      { name: 'Prototyping', level: 88 },
      { name: 'Design Systems', level: 82 },
      { name: 'User Research', level: 78 },
    ],
    certifications: [
      { name: 'Google UX Design', issuer: 'Google', date: 'Jul 2025', status: 'active' },
    ],
  },
  {
    id: 6,
    name: 'Fatima Zahra',
    email: 'fatima.z@bpms.io',
    phone: '+212 666 678 901',
    cnss: '6789012345',
    rib: 'MA76 0066 6660 0000 0678 9012 345',
    department: 'QA',
    title: 'QA Engineer',
    location: 'Fes, Morocco',
    manager: 'Ibrahim Rouass',
    joinDate: 'Jun 12, 2025',
    employeeId: 'EMP-2025-006',
    status: 'active',
    avatar: 'FZ',
    bio: 'Quality assurance engineer focused on automated testing and continuous integration pipelines.',
    skills: [
      { name: 'Selenium', level: 90 },
      { name: 'Jest', level: 85 },
      { name: 'Cypress', level: 80 },
      { name: 'CI/CD', level: 75 },
    ],
    certifications: [
      { name: 'ISTQB Foundation', issuer: 'ISTQB', date: 'Sep 2025', status: 'active' },
    ],
  },
  {
    id: 7,
    name: 'Bob Tanaka',
    email: 'bob.t@bpms.io',
    phone: '+212 667 789 012',
    cnss: '7890123456',
    rib: 'MA76 0077 7770 0000 0789 0123 456',
    department: 'Engineering',
    title: 'Backend Developer',
    location: 'Agadir, Morocco',
    manager: 'Ibrahim Rouass',
    joinDate: 'Jul 3, 2025',
    employeeId: 'EMP-2025-007',
    status: 'active',
    avatar: 'BT',
    bio: 'Backend developer specializing in microservices, APIs, and database architecture.',
    skills: [
      { name: 'Node.js', level: 88 },
      { name: 'PostgreSQL', level: 85 },
      { name: 'Docker', level: 80 },
      { name: 'Redis', level: 72 },
    ],
    certifications: [],
  },
  {
    id: 8,
    name: 'Amira Belkacem',
    email: 'amira.b@bpms.io',
    phone: '+212 668 890 123',
    cnss: '8901234567',
    rib: 'MA76 0088 8880 0000 0890 1234 567',
    department: 'Finance',
    title: 'Financial Analyst',
    location: 'Kenitra, Morocco',
    manager: 'Sarah Martinez',
    joinDate: 'Aug 18, 2025',
    employeeId: 'EMP-2025-008',
    status: 'active',
    avatar: 'AB',
    bio: 'Financial analyst with strong background in budgeting, forecasting, and financial modeling.',
    skills: [
      { name: 'Financial Modeling', level: 92 },
      { name: 'Excel', level: 95 },
      { name: 'SAP', level: 78 },
      { name: 'Power BI', level: 80 },
    ],
    certifications: [
      { name: 'CFA Level I', issuer: 'CFA Institute', date: 'Nov 2025', status: 'active' },
    ],
  },
];

const avatarColors = [
  'from-brand-500 to-brand-600',
  'from-violet-500 to-purple-600',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-red-500 to-rose-600',
  'from-cyan-500 to-blue-600',
];

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon size={16} className="text-text-tertiary mt-0.5 shrink-0" />
      <div>
        <span className="text-[11px] text-text-tertiary uppercase tracking-wider block">{label}</span>
        <span className="text-sm font-medium text-text-primary">{value}</span>
      </div>
    </div>
  );
}

export default function EmployeeProfile() {
  const { currentRole } = useRole();
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deptFilter, setDeptFilter] = useState('all');

  const isEmployee = currentRole.id === 'employee';

  // Employee can only see themselves (mock: Ahmed Hassan, id=3)
  const visibleEmployees = isEmployee
    ? allEmployees.filter(e => e.id === 3)
    : allEmployees;

  const departments = [...new Set(allEmployees.map(e => e.department))];

  const filtered = visibleEmployees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.email.toLowerCase().includes(search.toLowerCase()) ||
                        e.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Employee Profiles"
        description={isEmployee
          ? 'View your profile information'
          : `${visibleEmployees.length} employees in the organization`}
        icon={User}
        iconColor="from-brand-500 to-brand-600"
      />

      {/* Employee restriction notice */}
      {isEmployee && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10
                        border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm animate-fade-in">
          <ShieldAlert size={18} className="shrink-0" />
          <span>
            <strong>View restricted.</strong> You can only view your own profile information.
          </span>
        </div>
      )}

      {/* Search + Filter bar (hidden for employee since they see only 1 card) */}
      {!isEmployee && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in"
             style={{ animationDelay: '100ms' }}>
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-surface-primary border border-border-secondary
                         focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400
                         transition-all duration-200 text-text-primary placeholder:text-text-tertiary"
            />
          </div>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm bg-surface-primary border border-border-secondary
                       focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer
                       text-text-primary"
          >
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}

      {/* ═══ Employee Cards Grid ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((emp, idx) => (
          <div
            key={emp.id}
            onClick={() => setSelectedEmployee(emp)}
            className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                       hover:shadow-lg hover:border-brand-400/40 hover:-translate-y-0.5
                       transition-all duration-300 cursor-pointer group animate-fade-in"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            {/* Avatar + Status */}
            <div className="flex items-start justify-between mb-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl
                               bg-gradient-to-br ${avatarColors[idx % avatarColors.length]}
                               text-white font-bold text-sm shadow-md
                               group-hover:scale-110 transition-transform duration-300`}>
                {emp.avatar}
              </div>
              <StatusBadge
                variant={emp.status === 'active' ? 'success' : emp.status === 'inactive' ? 'danger' : 'warning'}
                dot size="sm"
              >
                {emp.status}
              </StatusBadge>
            </div>

            {/* Name */}
            <h3 className="text-sm font-bold text-text-primary truncate group-hover:text-brand-500 transition-colors">
              {emp.name}
            </h3>

            {/* Department badge */}
            <div className="mt-1.5 mb-3">
              <StatusBadge variant="brand" size="sm">{emp.department}</StatusBadge>
            </div>

            {/* Info rows */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail size={12} className="text-text-tertiary shrink-0" />
                <span className="truncate">{emp.email}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Phone size={12} className="text-text-tertiary shrink-0" />
                <span>{emp.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Hash size={12} className="text-text-tertiary shrink-0" />
                <span>CNSS: {emp.cnss}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Landmark size={12} className="text-text-tertiary shrink-0" />
                <span className="truncate">RIB: {emp.rib.slice(0, 16)}…</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-tertiary text-sm animate-fade-in">
          No employees found matching your search.
        </div>
      )}

      {/* ═══ Employee Detail Modal ═══ */}
      <Modal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title="Employee Details"
        maxWidth="max-w-2xl"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            {/* Header row */}
            <div className="flex items-start gap-4">
              <div className={`flex items-center justify-center w-16 h-16 rounded-2xl
                               bg-gradient-to-br ${avatarColors[allEmployees.findIndex(e => e.id === selectedEmployee.id) % avatarColors.length]}
                               text-white text-xl font-bold shadow-lg shrink-0`}>
                {selectedEmployee.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-text-primary">{selectedEmployee.name}</h3>
                <p className="text-sm text-text-secondary">{selectedEmployee.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge
                    variant={selectedEmployee.status === 'active' ? 'success' : 'danger'}
                    dot size="sm"
                  >
                    {selectedEmployee.status}
                  </StatusBadge>
                  <span className="text-[11px] text-text-tertiary">{selectedEmployee.employeeId}</span>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary">
              <p className="text-sm text-text-secondary leading-relaxed">{selectedEmployee.bio}</p>
            </div>

            {/* Two-column info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5
                            divide-y sm:divide-y-0 divide-border-secondary">
              <div className="space-y-0.5 divide-y divide-border-secondary">
                <InfoItem icon={Mail} label="Email" value={selectedEmployee.email} />
                <InfoItem icon={Phone} label="Phone" value={selectedEmployee.phone} />
                <InfoItem icon={MapPin} label="Location" value={selectedEmployee.location} />
                <InfoItem icon={Building2} label="Department" value={selectedEmployee.department} />
              </div>
              <div className="space-y-0.5 divide-y divide-border-secondary">
                <InfoItem icon={Briefcase} label="Position" value={selectedEmployee.title} />
                <InfoItem icon={User} label="Reports To" value={selectedEmployee.manager} />
                <InfoItem icon={Calendar} label="Join Date" value={selectedEmployee.joinDate} />
                <InfoItem icon={Hash} label="CNSS" value={selectedEmployee.cnss} />
              </div>
            </div>

            {/* RIB — full width */}
            <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary">
              <div className="flex items-center gap-2 mb-1">
                <Landmark size={14} className="text-text-tertiary" />
                <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-semibold">RIB</span>
              </div>
              <span className="text-sm font-mono font-medium text-text-primary tracking-wide">
                {selectedEmployee.rib}
              </span>
            </div>

            {/* Skills */}
            {selectedEmployee.skills?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Skills</h4>
                <div className="space-y-2.5">
                  {selectedEmployee.skills.map(skill => (
                    <div key={skill.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-text-primary">{skill.name}</span>
                        <span className="text-[11px] text-text-tertiary">{skill.level}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-700"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {selectedEmployee.certifications?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Certifications</h4>
                <div className="space-y-2">
                  {selectedEmployee.certifications.map(cert => (
                    <div key={cert.name} className="flex items-start gap-3 p-3 rounded-xl bg-surface-secondary
                                                    border border-border-secondary">
                      <Award size={16} className="text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-text-primary block truncate">{cert.name}</span>
                        <span className="text-[11px] text-text-tertiary">{cert.issuer} • {cert.date}</span>
                      </div>
                      <StatusBadge variant="success" size="sm">{cert.status}</StatusBadge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
