import { useState, useRef, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Briefcase, Award,
  Edit, Building2, Clock, Star, GraduationCap, FileText, ShieldAlert,
  Search, CreditCard, Landmark, Hash, Camera, Heart, FileUp,
  X, Check, Upload, Paperclip, Trash2, DollarSign, CalendarClock,
  AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { useRole } from '../../contexts/RoleContext';

/* ═════════════════════════════════════════════════════════════════
   MOCK DATA
   ═════════════════════════════════════════════════════════════════ */

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
    photo: null,
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
    emergencyContact: { name: 'Fatima Rouass', relationship: 'Mother', phone: '+212 661 000 111' },
    contractType: 'CDI',
    salary: 18000,
    hiringDate: '2025-01-15',
    documents: [
      { id: 'd1', name: 'Employment_Contract.pdf', uploadDate: '2025-01-15' },
      { id: 'd2', name: 'ID_Copy.pdf', uploadDate: '2025-01-16' },
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
    photo: null,
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
    emergencyContact: { name: 'Carlos Martinez', relationship: 'Spouse', phone: '+212 662 111 222' },
    contractType: 'CDI',
    salary: 15000,
    hiringDate: '2025-03-01',
    documents: [
      { id: 'd3', name: 'Employment_Contract.pdf', uploadDate: '2025-03-01' },
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
    photo: null,
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
    emergencyContact: { name: 'Youssef Hassan', relationship: 'Brother', phone: '+212 663 222 333' },
    contractType: 'CDD',
    salary: 12000,
    hiringDate: '2025-02-10',
    documents: [
      { id: 'd4', name: 'Employment_Contract.pdf', uploadDate: '2025-02-10' },
      { id: 'd5', name: 'Diploma_Copy.pdf', uploadDate: '2025-02-11' },
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
    photo: null,
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
    emergencyContact: { name: 'Jean Dupont', relationship: 'Father', phone: '+212 664 333 444' },
    contractType: 'CDI',
    salary: 14000,
    hiringDate: '2025-04-05',
    documents: [
      { id: 'd6', name: 'Employment_Contract.pdf', uploadDate: '2025-04-05' },
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
    photo: null,
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
    emergencyContact: { name: 'Lisa Chen', relationship: 'Spouse', phone: '+212 665 444 555' },
    contractType: 'Freelance',
    salary: 16000,
    hiringDate: '2025-05-20',
    documents: [],
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
    photo: null,
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
    emergencyContact: { name: 'Khadija Zahra', relationship: 'Sister', phone: '+212 666 555 666' },
    contractType: 'CDD',
    salary: 11000,
    hiringDate: '2025-06-12',
    documents: [
      { id: 'd7', name: 'Employment_Contract.pdf', uploadDate: '2025-06-12' },
      { id: 'd8', name: 'ISTQB_Certificate.pdf', uploadDate: '2025-09-20' },
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
    photo: null,
    bio: 'Backend developer specializing in microservices, APIs, and database architecture.',
    skills: [
      { name: 'Node.js', level: 88 },
      { name: 'PostgreSQL', level: 85 },
      { name: 'Docker', level: 80 },
      { name: 'Redis', level: 72 },
    ],
    certifications: [],
    emergencyContact: { name: 'Yuki Tanaka', relationship: 'Spouse', phone: '+212 667 666 777' },
    contractType: 'Internship',
    salary: 5000,
    hiringDate: '2025-07-03',
    documents: [
      { id: 'd9', name: 'Internship_Agreement.pdf', uploadDate: '2025-07-03' },
    ],
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
    photo: null,
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
    emergencyContact: { name: 'Omar Belkacem', relationship: 'Brother', phone: '+212 668 777 888' },
    contractType: 'CDI',
    salary: 13500,
    hiringDate: '2025-08-18',
    documents: [
      { id: 'd10', name: 'Employment_Contract.pdf', uploadDate: '2025-08-18' },
      { id: 'd11', name: 'CFA_Certificate.pdf', uploadDate: '2025-11-20' },
    ],
  },
];

const CONTRACT_TYPES = ['CDI', 'CDD', 'Internship', 'Freelance'];

const contractColors = {
  CDI: 'success',
  CDD: 'info',
  Internship: 'warning',
  Freelance: 'violet',
};

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

/* ═════════════════════════════════════════════════════════════════
   HELPER: Format currency
   ═════════════════════════════════════════════════════════════════ */
function formatSalary(amount) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/* ═════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═════════════════════════════════════════════════════════════════ */

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

/** Avatar that shows photo or initials */
function EmployeeAvatar({ emp, colorClass, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-12 h-12 rounded-xl text-sm',
    md: 'w-16 h-16 rounded-2xl text-xl',
    lg: 'w-20 h-20 rounded-2xl text-2xl',
  };
  if (emp.photo) {
    return (
      <img
        src={emp.photo}
        alt={emp.name}
        className={`${sizes[size]} object-cover shadow-md ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${colorClass}
                   text-white font-bold shadow-md ${sizes[size]} ${className}`}
    >
      {emp.avatar}
    </div>
  );
}

/** Section header used inside modal */
function SectionHeader({ icon: Icon, title, iconColor = 'text-text-tertiary' }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={15} className={iconColor} />
      <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{title}</h4>
    </div>
  );
}


/* ═════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════════════ */

export default function EmployeeProfile() {
  const { currentRole } = useRole();
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deptFilter, setDeptFilter] = useState('all');

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  // Manager search state (for HR searchable dropdown)
  const [managerSearch, setManagerSearch] = useState('');
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const managerDropdownRef = useRef(null);

  // Employees state (local mock — no global state mutation)
  const [employees, setEmployees] = useState(allEmployees);

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  const isEmployee = currentRole.id === 'employee';
  const isHr = currentRole.id === 'hr';
  const isAdminOrHr = currentRole.id === 'admin' || isHr;
  const canSeeSalary = isAdminOrHr || isEmployee;
  const canEditSalary = isAdminOrHr;

  // Close manager dropdown on outside click
  useEffect(() => {
    if (!managerDropdownOpen) return;
    function handleClick(e) {
      if (managerDropdownRef.current && !managerDropdownRef.current.contains(e.target)) {
        setManagerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [managerDropdownOpen]);

  // Employee can only see themselves (mock: Ahmed Hassan, id=3)
  const visibleEmployees = isEmployee
    ? employees.filter(e => e.id === 3)
    : employees;

  const departments = [...new Set(employees.map(e => e.department))];

  const filtered = visibleEmployees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.email.toLowerCase().includes(search.toLowerCase()) ||
                        e.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  /* ────── Edit handlers ────── */

  function openEdit(emp) {
    setEditData({
      ...emp,
      emergencyContact: { ...(emp.emergencyContact || { name: '', relationship: '', phone: '' }) },
      documents: [...(emp.documents || [])],
    });
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditData(null);
  }

  function saveEdit() {
    if (!editData) return;
    setEmployees(prev => prev.map(e => e.id === editData.id ? { ...editData } : e));
    // Update selectedEmployee to reflect saved data
    setSelectedEmployee({ ...editData });
    setIsEditing(false);
    setEditData(null);
  }

  function handleEditChange(field, value) {
    setEditData(prev => ({ ...prev, [field]: value }));
  }

  function handleEmergencyChange(field, value) {
    setEditData(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [field]: value },
    }));
  }

  /** Photo upload (mock — we store as data URL) */
  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      handleEditChange('photo', ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    handleEditChange('photo', null);
  }

  /** Document upload (mock — just add an entry) */
  function handleDocUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
    };
    setEditData(prev => ({
      ...prev,
      documents: [...(prev.documents || []), newDoc],
    }));
    // Reset input
    if (docInputRef.current) docInputRef.current.value = '';
  }

  function removeDocument(docId) {
    setEditData(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.id !== docId),
    }));
  }

  /* ────── Which data to render inside modal ────── */
  const displayEmp = isEditing ? editData : selectedEmployee;

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
        {filtered.map((emp, idx) => {
          const colorClass = avatarColors[idx % avatarColors.length];
          return (
            <div
              key={emp.id}
              onClick={() => { setSelectedEmployee(emp); setIsEditing(false); setEditData(null); }}
              className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                         hover:shadow-lg hover:border-brand-400/40 hover:-translate-y-0.5
                         transition-all duration-300 cursor-pointer group animate-fade-in"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Avatar + Status */}
              <div className="flex items-start justify-between mb-4">
                <EmployeeAvatar
                  emp={emp}
                  colorClass={colorClass}
                  size="sm"
                  className="group-hover:scale-110 transition-transform duration-300"
                />
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

              {/* Department badge + Contract badge */}
              <div className="mt-1.5 mb-3 flex items-center gap-1.5 flex-wrap">
                <StatusBadge variant="brand" size="sm">{emp.department}</StatusBadge>
                {emp.contractType && (
                  <StatusBadge variant={contractColors[emp.contractType] || 'neutral'} size="sm">
                    {emp.contractType}
                  </StatusBadge>
                )}
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
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-tertiary text-sm animate-fade-in">
          No employees found matching your search.
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
           EMPLOYEE DETAIL MODAL
         ═══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!selectedEmployee}
        onClose={() => { setSelectedEmployee(null); cancelEdit(); }}
        title={isEditing ? 'Edit Employee' : 'Employee Details'}
        maxWidth="max-w-3xl"
      >
        {displayEmp && (
          <div className="space-y-6">

            {/* ──── HEADER ROW ──── */}
            <div className="flex items-start gap-4">
              {/* Avatar / Photo */}
              <div className="relative shrink-0">
                <EmployeeAvatar
                  emp={displayEmp}
                  colorClass={avatarColors[employees.findIndex(e => e.id === displayEmp.id) % avatarColors.length]}
                  size="md"
                />
                {/* Photo upload overlay — only when employee is editing their OWN profile */}
                {isEditing && isEmployee && displayEmp.id === 3 && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center rounded-2xl
                                 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200
                                 cursor-pointer"
                      title="Upload photo"
                    >
                      <Camera size={20} className="text-white" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    {displayEmp.photo && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white
                                   flex items-center justify-center shadow-md hover:bg-red-600
                                   transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-text-primary">{displayEmp.name}</h3>
                <p className="text-sm text-text-secondary">{displayEmp.title}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <StatusBadge
                    variant={displayEmp.status === 'active' ? 'success' : 'danger'}
                    dot size="sm"
                  >
                    {displayEmp.status}
                  </StatusBadge>
                  <span className="text-[11px] text-text-tertiary">{displayEmp.employeeId}</span>
                  {displayEmp.contractType && (
                    <StatusBadge variant={contractColors[displayEmp.contractType] || 'neutral'} size="sm">
                      {displayEmp.contractType}
                    </StatusBadge>
                  )}
                </div>
              </div>

              {/* Edit / Save / Cancel buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => openEdit(selectedEmployee)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                               bg-brand-500/10 text-brand-600 dark:text-brand-400
                               hover:bg-brand-500/20 transition-colors cursor-pointer"
                  >
                    <Edit size={13} /> {isEmployee ? 'Edit Profile' : 'Edit'}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold
                                 bg-surface-tertiary text-text-secondary
                                 hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X size={13} /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold
                                 bg-brand-500 text-white hover:bg-brand-600 transition-colors cursor-pointer"
                    >
                      <Check size={13} /> Save
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ──── ABOUT ──── */}
            <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary">
              <p className="text-sm text-text-secondary leading-relaxed">{displayEmp.bio}</p>
            </div>

            {/* ──── TWO-COLUMN INFO ──── */}
            {/* Employee edit mode: Email, Phone, Location are editable; rest read-only */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5
                            divide-y sm:divide-y-0 divide-border-secondary">
              <div className="space-y-0.5 divide-y divide-border-secondary">
                {isEditing && isEmployee ? (
                  <>
                    {/* Editable: Email */}
                    <div className="flex items-start gap-3 py-2.5">
                      <Mail size={16} className="text-text-tertiary mt-2.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-[11px] text-text-tertiary uppercase tracking-wider block mb-1">Email</span>
                        <input
                          type="email"
                          value={editData.email || ''}
                          onChange={e => handleEditChange('email', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-surface-primary border border-border-secondary
                                     focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary"
                        />
                      </div>
                    </div>
                    {/* Editable: Phone */}
                    <div className="flex items-start gap-3 py-2.5">
                      <Phone size={16} className="text-text-tertiary mt-2.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-[11px] text-text-tertiary uppercase tracking-wider block mb-1">Phone</span>
                        <input
                          type="tel"
                          value={editData.phone || ''}
                          onChange={e => handleEditChange('phone', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-surface-primary border border-border-secondary
                                     focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary"
                        />
                      </div>
                    </div>
                    {/* Editable: Location */}
                    <div className="flex items-start gap-3 py-2.5">
                      <MapPin size={16} className="text-text-tertiary mt-2.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-[11px] text-text-tertiary uppercase tracking-wider block mb-1">Location</span>
                        <input
                          type="text"
                          value={editData.location || ''}
                          onChange={e => handleEditChange('location', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-surface-primary border border-border-secondary
                                     focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary"
                        />
                      </div>
                    </div>
                    {/* Read-only: Department */}
                    <InfoItem icon={Building2} label="Department" value={displayEmp.department} />
                  </>
                ) : (
                  <>
                    <InfoItem icon={Mail} label="Email" value={displayEmp.email} />
                    <InfoItem icon={Phone} label="Phone" value={displayEmp.phone} />
                    <InfoItem icon={MapPin} label="Location" value={displayEmp.location} />
                    <InfoItem icon={Building2} label="Department" value={displayEmp.department} />
                  </>
                )}
              </div>
              <div className="space-y-0.5 divide-y divide-border-secondary">
                <InfoItem icon={Briefcase} label="Position" value={displayEmp.title} />

                {/* Reports To — editable for HR only */}
                {isEditing && isHr ? (
                  <div className="flex items-start gap-3 py-2.5">
                    <User size={16} className="text-text-tertiary mt-2.5 shrink-0" />
                    <div className="flex-1" ref={managerDropdownRef}>
                      <span className="text-[11px] text-text-tertiary uppercase tracking-wider block mb-1">Reports To</span>
                      <div className="relative">
                        <div
                          className="flex items-center w-full px-3 py-2 rounded-lg text-sm bg-surface-primary
                                     border border-border-secondary focus-within:ring-2 focus-within:ring-brand-500/30
                                     cursor-text"
                          onClick={() => setManagerDropdownOpen(true)}
                        >
                          <Search size={13} className="text-text-tertiary shrink-0 mr-2" />
                          <input
                            type="text"
                            value={managerDropdownOpen ? managerSearch : (editData.manager || '')}
                            onChange={e => {
                              setManagerSearch(e.target.value);
                              if (!managerDropdownOpen) setManagerDropdownOpen(true);
                            }}
                            onFocus={() => {
                              setManagerSearch('');
                              setManagerDropdownOpen(true);
                            }}
                            placeholder="Search employee…"
                            className="w-full bg-transparent focus:outline-none text-text-primary
                                       placeholder:text-text-tertiary text-sm"
                          />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setManagerDropdownOpen(o => !o); }}
                            className="shrink-0 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
                          >
                            {managerDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>

                        {/* Dropdown list */}
                        {managerDropdownOpen && (
                          <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-xl
                                          bg-surface-elevated border border-border-secondary shadow-lg
                                          animate-fade-in">
                            {employees
                              .filter(e => e.id !== editData.id) // exclude self
                              .filter(e =>
                                managerSearch === ''
                                  ? true
                                  : e.name.toLowerCase().includes(managerSearch.toLowerCase())
                              )
                              .map(e => (
                                <button
                                  key={e.id}
                                  type="button"
                                  onClick={() => {
                                    handleEditChange('manager', e.name);
                                    setManagerSearch('');
                                    setManagerDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm
                                              hover:bg-surface-secondary transition-colors cursor-pointer
                                              ${e.name === editData.manager ? 'bg-brand-500/5 text-brand-600 dark:text-brand-400 font-semibold' : 'text-text-primary'}`}
                                >
                                  <div className={`flex items-center justify-center w-7 h-7 rounded-lg
                                                    bg-gradient-to-br ${avatarColors[employees.indexOf(e) % avatarColors.length]}
                                                    text-white text-[10px] font-bold shrink-0`}>
                                    {e.avatar}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="block truncate">{e.name}</span>
                                    <span className="text-[11px] text-text-tertiary">{e.title}</span>
                                  </div>
                                  {e.name === editData.manager && (
                                    <Check size={14} className="text-brand-500 shrink-0" />
                                  )}
                                </button>
                              ))}
                            {employees
                              .filter(e => e.id !== editData.id)
                              .filter(e => managerSearch === '' || e.name.toLowerCase().includes(managerSearch.toLowerCase()))
                              .length === 0 && (
                              <div className="px-3 py-4 text-center text-sm text-text-tertiary">
                                No employees found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <InfoItem icon={User} label="Reports To" value={displayEmp.manager} />
                )}

                <InfoItem icon={Calendar} label="Join Date" value={displayEmp.joinDate} />
                <InfoItem icon={Hash} label="CNSS" value={displayEmp.cnss} />
              </div>
            </div>

            {/* ──── RIB — full width ──── */}
            <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary">
              <div className="flex items-center gap-2 mb-1">
                <Landmark size={14} className="text-text-tertiary" />
                <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-semibold">RIB</span>
              </div>
              {isEditing && isEmployee ? (
                <input
                  type="text"
                  value={editData.rib || ''}
                  onChange={e => handleEditChange('rib', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm font-mono bg-surface-primary border border-border-secondary
                             focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary tracking-wide"
                />
              ) : (
                <span className="text-sm font-mono font-medium text-text-primary tracking-wide">
                  {displayEmp.rib}
                </span>
              )}
            </div>

            {/* ──── HIRING DATE & CONTRACT TYPE ──── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hiring Date */}
              <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarClock size={14} className="text-brand-500" />
                  <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-semibold">
                    Hiring Date
                  </span>
                </div>
                {isEditing && !isEmployee ? (
                  <input
                    type="date"
                    value={editData.hiringDate || ''}
                    onChange={e => handleEditChange('hiringDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-surface-primary border border-border-secondary
                               focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary"
                  />
                ) : (
                  <span className="text-sm font-medium text-text-primary">
                    {formatDate(displayEmp.hiringDate)}
                  </span>
                )}
              </div>

              {/* Contract Type */}
              <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-violet-500" />
                  <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-semibold">
                    Contract Type
                  </span>
                </div>
                {isEditing && !isEmployee ? (
                  <div className="relative">
                    <select
                      value={editData.contractType || ''}
                      onChange={e => handleEditChange('contractType', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-surface-primary border border-border-secondary
                                 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary
                                 appearance-none cursor-pointer pr-8"
                    >
                      <option value="">Select type…</option>
                      {CONTRACT_TYPES.map(ct => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                    </select>
                    <ChevronDown size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                  </div>
                ) : (
                  <StatusBadge variant={contractColors[displayEmp.contractType] || 'neutral'} size="md">
                    {displayEmp.contractType || '—'}
                  </StatusBadge>
                )}
              </div>
            </div>

            {/* ──── SALARY ──── */}
            {canSeeSalary && (
              <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={14} className="text-emerald-500" />
                  <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-semibold">
                    Salary
                  </span>
                  {isAdminOrHr && (
                    <span className="ml-auto text-[10px] rounded-full px-2 py-0.5
                                     bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                      Admin / HR only
                    </span>
                  )}
                  {isEmployee && (
                    <span className="ml-auto text-[10px] rounded-full px-2 py-0.5
                                     bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                      Read-only
                    </span>
                  )}
                </div>
                {isEditing && canEditSalary ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">MAD</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={editData.salary ?? ''}
                      onChange={e => handleEditChange('salary', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-14 pr-3 py-2 rounded-lg text-sm bg-surface-primary border border-border-secondary
                                 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary"
                    />
                  </div>
                ) : (
                  <span className="text-lg font-bold text-text-primary">
                    {displayEmp.salary != null ? formatSalary(displayEmp.salary) : '—'}
                  </span>
                )}
              </div>
            )}

            {/* ──── EMERGENCY CONTACT (editable for all roles including Employee) ──── */}
            <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary">
              <SectionHeader icon={Heart} title="Emergency Contact" iconColor="text-red-500" />
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-text-tertiary uppercase tracking-wider block mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={editData.emergencyContact?.name || ''}
                      onChange={e => handleEmergencyChange('name', e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3 py-2 rounded-lg text-sm bg-surface-primary border border-border-secondary
                                 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary
                                 placeholder:text-text-tertiary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-tertiary uppercase tracking-wider block mb-1">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={editData.emergencyContact?.relationship || ''}
                      onChange={e => handleEmergencyChange('relationship', e.target.value)}
                      placeholder="e.g. Spouse"
                      className="w-full px-3 py-2 rounded-lg text-sm bg-surface-primary border border-border-secondary
                                 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary
                                 placeholder:text-text-tertiary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-tertiary uppercase tracking-wider block mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editData.emergencyContact?.phone || ''}
                      onChange={e => handleEmergencyChange('phone', e.target.value)}
                      placeholder="+212 6XX XXX XXX"
                      className="w-full px-3 py-2 rounded-lg text-sm bg-surface-primary border border-border-secondary
                                 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary
                                 placeholder:text-text-tertiary"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[11px] text-text-tertiary uppercase tracking-wider block">Name</span>
                    <span className="text-sm font-medium text-text-primary">
                      {displayEmp.emergencyContact?.name || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-text-tertiary uppercase tracking-wider block">Relationship</span>
                    <span className="text-sm font-medium text-text-primary">
                      {displayEmp.emergencyContact?.relationship || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-text-tertiary uppercase tracking-wider block">Phone</span>
                    <span className="text-sm font-medium text-text-primary">
                      {displayEmp.emergencyContact?.phone || '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ──── SKILLS ──── */}
            {displayEmp.skills?.length > 0 && (
              <div>
                <SectionHeader icon={Star} title="Skills" iconColor="text-amber-500" />
                <div className="space-y-2.5">
                  {displayEmp.skills.map(skill => (
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

            {/* ──── CERTIFICATIONS ──── */}
            {displayEmp.certifications?.length > 0 && (
              <div>
                <SectionHeader icon={Award} title="Certifications" iconColor="text-amber-500" />
                <div className="space-y-2">
                  {displayEmp.certifications.map(cert => (
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

            {/* ──── DOCUMENTS (not editable by Employee) ──── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionHeader icon={Paperclip} title="Documents" iconColor="text-blue-500" />
                {isEditing && !isEmployee && (
                  <>
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                 bg-blue-500/10 text-blue-600 dark:text-blue-400
                                 hover:bg-blue-500/20 transition-colors cursor-pointer"
                    >
                      <Upload size={12} /> Upload
                    </button>
                    <input
                      ref={docInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleDocUpload}
                    />
                  </>
                )}
              </div>

              {(isEditing && !isEmployee ? editData.documents : displayEmp.documents)?.length > 0 ? (
                <div className="space-y-2">
                  {(isEditing && !isEmployee ? editData.documents : displayEmp.documents).map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary
                                 border border-border-secondary group/doc"
                    >
                      <FileText size={16} className="text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-text-primary block truncate">{doc.name}</span>
                        <span className="text-[11px] text-text-tertiary">
                          Uploaded {formatDate(doc.uploadDate)}
                        </span>
                      </div>
                      {isEditing && !isEmployee && (
                        <button
                          type="button"
                          onClick={() => removeDocument(doc.id)}
                          className="opacity-0 group-hover/doc:opacity-100 p-1 rounded-md
                                     hover:bg-red-500/10 text-red-500 transition-all cursor-pointer"
                          title="Remove document"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-text-tertiary text-sm rounded-xl
                                bg-surface-secondary border border-dashed border-border-secondary">
                  <Paperclip size={20} className="mx-auto mb-2 opacity-40" />
                  No documents attached
                </div>
              )}
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}
