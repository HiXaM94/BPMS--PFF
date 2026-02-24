import { useState, useCallback, useRef } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Briefcase, Award,
  Edit, Building2, Clock, Star, GraduationCap, FileText, ShieldAlert,
  Search, CreditCard, Landmark, Hash, Save, X, AlertCircle,
  DollarSign, FileSignature, Camera, Upload, Download, Trash2, Plus, Eye,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { useRole } from '../../contexts/RoleContext';

/* ═══════════════════════════════════════════════════
   ROLE PERMISSION CONFIG
   ═══════════════════════════════════════════════════ */

/** Fields the EMPLOYEE can edit on their own profile */
const EMPLOYEE_EDITABLE = ['email', 'phone', 'location', 'rib', 'emergencyContact', 'profilePhoto'];

/** Fields HR can edit on any profile */
const HR_EDITABLE = ['manager', 'joinDate', 'contractType', 'salary'];

/* ═══════════════════════════════════════════════════
   MOCK DOCUMENTS
   ═══════════════════════════════════════════════════ */

const mockDocuments = {
  1: [
    { id: 'd1', name: 'Employment Contract.pdf', type: 'contract', uploadedBy: 'HR', date: 'Jan 15, 2025', size: '245 KB' },
    { id: 'd2', name: 'NDA Agreement.pdf', type: 'legal', uploadedBy: 'HR', date: 'Jan 15, 2025', size: '128 KB' },
    { id: 'd3', name: 'ID Card Copy.pdf', type: 'identity', uploadedBy: 'Employee', date: 'Jan 16, 2025', size: '1.2 MB' },
  ],
  2: [
    { id: 'd4', name: 'Employment Contract.pdf', type: 'contract', uploadedBy: 'HR', date: 'Mar 1, 2025', size: '245 KB' },
    { id: 'd5', name: 'Marketing Cert.pdf', type: 'certificate', uploadedBy: 'Employee', date: 'Jun 10, 2025', size: '340 KB' },
  ],
  3: [
    { id: 'd6', name: 'Employment Contract.pdf', type: 'contract', uploadedBy: 'HR', date: 'Feb 10, 2025', size: '245 KB' },
    { id: 'd7', name: 'CIN Copy.pdf', type: 'identity', uploadedBy: 'Employee', date: 'Feb 11, 2025', size: '980 KB' },
    { id: 'd8', name: 'Diploma.pdf', type: 'certificate', uploadedBy: 'Employee', date: 'Feb 12, 2025', size: '1.5 MB' },
  ],
  4: [
    { id: 'd9', name: 'Employment Contract.pdf', type: 'contract', uploadedBy: 'HR', date: 'Apr 5, 2025', size: '245 KB' },
  ],
  5: [
    { id: 'd10', name: 'Employment Contract.pdf', type: 'contract', uploadedBy: 'HR', date: 'May 20, 2025', size: '245 KB' },
    { id: 'd11', name: 'Portfolio Link.pdf', type: 'other', uploadedBy: 'Employee', date: 'May 22, 2025', size: '56 KB' },
  ],
  6: [
    { id: 'd12', name: 'Employment Contract.pdf', type: 'contract', uploadedBy: 'HR', date: 'Jun 12, 2025', size: '245 KB' },
    { id: 'd13', name: 'ISTQB Certificate.pdf', type: 'certificate', uploadedBy: 'Employee', date: 'Sep 20, 2025', size: '420 KB' },
  ],
  7: [
    { id: 'd14', name: 'Employment Contract.pdf', type: 'contract', uploadedBy: 'HR', date: 'Jul 3, 2025', size: '245 KB' },
  ],
  8: [
    { id: 'd15', name: 'Employment Contract.pdf', type: 'contract', uploadedBy: 'HR', date: 'Aug 18, 2025', size: '245 KB' },
    { id: 'd16', name: 'CFA Certificate.pdf', type: 'certificate', uploadedBy: 'Employee', date: 'Nov 5, 2025', size: '380 KB' },
  ],
};

const docTypeColors = {
  contract: 'text-blue-500 bg-blue-500/10',
  legal: 'text-violet-500 bg-violet-500/10',
  identity: 'text-amber-500 bg-amber-500/10',
  certificate: 'text-emerald-500 bg-emerald-500/10',
  other: 'text-gray-500 bg-gray-500/10',
};

/* ═══════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════ */

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
    contractType: 'CDI',
    salary: 18000,
    emergencyContact: '+212 661 000 111',
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
    contractType: 'CDI',
    salary: 15000,
    emergencyContact: '+212 662 000 222',
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
    contractType: 'CDD',
    salary: 12000,
    emergencyContact: '',
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
    contractType: 'CDI',
    salary: 13000,
    emergencyContact: '+212 664 000 444',
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
    contractType: 'CDD',
    salary: 11000,
    emergencyContact: '',
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
    contractType: 'CDI',
    salary: 13500,
    emergencyContact: '+212 666 000 666',
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
    contractType: 'CDI',
    salary: 14000,
    emergencyContact: '',
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
    contractType: 'CDD',
    salary: 12500,
    emergencyContact: '+212 668 000 888',
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

/** Formats a number as MAD currency */
function formatSalary(amount) {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 }).format(amount);
}

/* ── Reusable sub-components ──────────────────────── */

function InfoItem({ icon: Icon, label, value, suffix }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon size={16} className="text-text-tertiary mt-0.5 shrink-0" />
      <div>
        <span className="text-[11px] text-text-tertiary uppercase tracking-wider block">
          {label}
          {suffix && <span className="text-[10px] opacity-60 ml-1">{suffix}</span>}
        </span>
        <span className="text-sm font-medium text-text-primary">{value}</span>
      </div>
    </div>
  );
}

/** Section heading with optional badge */
function SectionHeading({ number, title, badge }) {
  return (
    <div className="flex items-center gap-2.5 pb-1">
      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-brand-500/10
                        text-brand-500 text-[10px] font-bold shrink-0">{number}</span>
      <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{title}</h4>
      {badge && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-surface-secondary
                          text-text-tertiary border border-border-secondary">{badge}</span>
      )}
    </div>
  );
}

/** Styled editable input with green border */
function EditableInput({ icon: Icon, label, value, onChange, type = 'text', placeholder, mono }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] text-text-tertiary uppercase tracking-wider font-semibold mb-1.5">
        <Icon size={12} /> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-xl text-sm bg-surface-primary border-2 border-emerald-500/30
                   focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400
                   transition-all duration-200 text-text-primary placeholder:text-text-tertiary
                   ${mono ? 'font-mono tracking-wide' : ''}`}
      />
    </div>
  );
}

/** Styled editable select dropdown */
function EditableSelect({ icon: Icon, label, value, onChange, options }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] text-text-tertiary uppercase tracking-wider font-semibold mb-1.5">
        <Icon size={12} /> {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface-primary border-2 border-emerald-500/30
                   focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400
                   transition-all duration-200 text-text-primary cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */

export default function EmployeeProfile() {
  const { currentRole } = useRole();
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deptFilter, setDeptFilter] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [employeeData, setEmployeeData] = useState(allEmployees);
  const [documents, setDocuments] = useState(mockDocuments);
  const photoInputRef = useRef(null);

  const isEmployee = currentRole.id === 'employee';
  const isHR = currentRole.id === 'hr';
  const canEdit = isEmployee || isHR;

  // Employee can only see themselves (mock: Ahmed Hassan, id=3)
  const visibleEmployees = isEmployee
    ? employeeData.filter(e => e.id === 3)
    : employeeData;

  const departments = [...new Set(employeeData.map(e => e.department))];

  const filtered = visibleEmployees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.email.toLowerCase().includes(search.toLowerCase()) ||
                        e.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  /* ── Build editable field snapshot based on role ── */
  const buildEditData = useCallback((emp) => {
    if (isEmployee) {
      return {
        email: emp.email,
        phone: emp.phone,
        location: emp.location,
        rib: emp.rib,
        emergencyContact: emp.emergencyContact || '',
      };
    }
    if (isHR) {
      return {
        manager: emp.manager,
        joinDate: emp.joinDate,
        contractType: emp.contractType || 'CDI',
        salary: emp.salary ?? 0,
      };
    }
    return {};
  }, [isEmployee, isHR]);

  /* ── Handler: enter edit mode ── */
  const handleStartEdit = useCallback((emp) => {
    setEditData(buildEditData(emp));
    setSelectedEmployee(emp);
    setIsEditing(true);
  }, [buildEditData]);

  /* ── Handler: Employee clicks "Edit Profile" in header ── */
  const handleEditProfile = useCallback(() => {
    const myProfile = employeeData.find(e => e.id === 3);
    if (myProfile) handleStartEdit(myProfile);
  }, [employeeData, handleStartEdit]);

  /* ── Handler: save ── */
  const handleSaveEdit = useCallback(() => {
    if (!selectedEmployee) return;
    setEmployeeData(prev =>
      prev.map(emp =>
        emp.id === selectedEmployee.id
          ? { ...emp, ...editData }
          : emp
      )
    );
    setSelectedEmployee(prev => prev ? { ...prev, ...editData } : null);
    setIsEditing(false);
    setEditData({});
  }, [selectedEmployee, editData]);

  /* ── Handler: cancel ── */
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditData({});
  }, []);

  /* ── Helper: update single edit field ── */
  const setField = useCallback((key, val) => {
    setEditData(prev => ({ ...prev, [key]: val }));
  }, []);

  /* ── Handler: HR adds a mock document ── */
  const handleAddDocument = useCallback(() => {
    if (!selectedEmployee || !isHR) return;
    const newDoc = {
      id: `d-new-${Date.now()}`,
      name: 'New Document.pdf',
      type: 'other',
      uploadedBy: 'HR',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      size: '0 KB',
    };
    setDocuments(prev => ({
      ...prev,
      [selectedEmployee.id]: [...(prev[selectedEmployee.id] || []), newDoc],
    }));
  }, [selectedEmployee, isHR]);

  /* ── Handler: HR removes a document ── */
  const handleRemoveDocument = useCallback((docId) => {
    if (!selectedEmployee || !isHR) return;
    setDocuments(prev => ({
      ...prev,
      [selectedEmployee.id]: (prev[selectedEmployee.id] || []).filter(d => d.id !== docId),
    }));
  }, [selectedEmployee, isHR]);

  /* ── Get documents for selected employee ── */
  const empDocuments = selectedEmployee ? (documents[selectedEmployee.id] || []) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Employee Profiles"
        description={isEmployee
          ? 'View your profile information'
          : `${visibleEmployees.length} employees in the organization`}
        icon={User}
        iconColor="from-brand-500 to-brand-600"
      >
        {/* Employee "Edit Profile" button — top-right of header */}
        {isEmployee && (
          <button
            onClick={handleEditProfile}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                       bg-gradient-to-r from-emerald-500 to-emerald-600
                       text-white text-sm font-semibold shadow-md shadow-emerald-500/20
                       hover:from-emerald-600 hover:to-emerald-700
                       hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30
                       active:translate-y-0 active:shadow-sm
                       transition-all duration-200 cursor-pointer"
          >
            <Edit size={16} />
            Edit Profile
          </button>
        )}
      </PageHeader>

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

      {/* ═══════════════════════════════════════════════
          EMPLOYEE DETAIL MODAL
          ═══════════════════════════════════════════════ */}
      <Modal
        isOpen={!!selectedEmployee}
        onClose={() => { setSelectedEmployee(null); setIsEditing(false); setEditData({}); }}
        title={isEditing ? (isHR ? 'Edit Employee' : 'Edit Profile') : 'Employee Details'}
        maxWidth="max-w-2xl"
      >
        {selectedEmployee && (
          <div className="space-y-6">

            {/* ── Modal Header ── */}
            <div className="flex items-start gap-4">
              {/* Avatar with photo change overlay for employee edit mode */}
              <div className="relative shrink-0 group/avatar">
                <div className={`flex items-center justify-center w-16 h-16 rounded-2xl
                                 bg-gradient-to-br ${avatarColors[employeeData.findIndex(e => e.id === selectedEmployee.id) % avatarColors.length]}
                                 text-white text-xl font-bold shadow-lg`}>
                  {selectedEmployee.avatar}
                </div>
                {/* Photo change overlay — Employee edit mode only */}
                {isEditing && isEmployee && (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl
                               bg-black/50 opacity-0 group-hover/avatar:opacity-100
                               transition-opacity duration-200 cursor-pointer"
                    title="Change profile photo"
                  >
                    <Camera size={18} className="text-white" />
                  </button>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={() => {/* Mock: would handle upload */}}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-text-primary">{selectedEmployee.name}</h3>
                <p className="text-sm text-text-secondary">{selectedEmployee.title}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <StatusBadge
                    variant={selectedEmployee.status === 'active' ? 'success' : 'danger'}
                    dot size="sm"
                  >
                    {selectedEmployee.status}
                  </StatusBadge>
                  <span className="text-[11px] text-text-tertiary">{selectedEmployee.employeeId}</span>
                  {isEditing && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                     bg-emerald-500/10 text-emerald-600 dark:text-emerald-400
                                     text-[11px] font-semibold animate-fade-in">
                      <Edit size={10} />
                      {isHR ? 'HR Editing' : 'Editing'}
                    </span>
                  )}
                </div>
              </div>

              {/* HR "Edit" button inside modal (only when not already editing) */}
              {isHR && !isEditing && (
                <button
                  onClick={() => handleStartEdit(selectedEmployee)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl shrink-0
                             bg-gradient-to-r from-blue-500 to-blue-600
                             text-white text-xs font-semibold shadow-md shadow-blue-500/20
                             hover:from-blue-600 hover:to-blue-700
                             hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30
                             active:translate-y-0 active:shadow-sm
                             transition-all duration-200 cursor-pointer"
                >
                  <Edit size={13} />
                  Edit Employee
                </button>
              )}
            </div>

            {/* ── About ── */}
            <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary">
              <p className="text-sm text-text-secondary leading-relaxed">{selectedEmployee.bio}</p>
            </div>

            {/* ══════════════════════════════════════════
                EDIT MODE — Sectioned Layout
                ══════════════════════════════════════════ */}
            {isEditing ? (
              <div className="space-y-6 animate-fade-in">

                {/* Hint banner */}
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-500 shrink-0" />
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {isEmployee
                      ? 'You can edit your personal fields below. HR fields and documents are read-only.'
                      : 'You can edit HR fields and manage documents below. Personal fields are read-only.'}
                  </span>
                </div>

                {/* ═══ SECTION 1 — Personal Info ═══ */}
                <div className="space-y-3">
                  <SectionHeading
                    number="1"
                    title="Personal Information"
                    badge={isEmployee ? 'Editable' : 'Read-only'}
                  />

                  {isEmployee ? (
                    /* ── Employee can edit these ── */
                    <div className="space-y-4 p-4 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/[0.02]">
                      {/* Profile Photo hint */}
                      <div className="flex items-center gap-3 pb-3 border-b border-border-secondary">
                        <Camera size={14} className="text-emerald-500" />
                        <span className="text-xs text-text-secondary">
                          Hover over your avatar above to change your profile photo.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <EditableInput
                          icon={Mail} label="Email" type="email"
                          value={editData.email || ''}
                          onChange={v => setField('email', v)}
                        />
                        <EditableInput
                          icon={Phone} label="Phone" type="tel"
                          value={editData.phone || ''}
                          onChange={v => setField('phone', v)}
                        />
                        <EditableInput
                          icon={MapPin} label="Location"
                          value={editData.location || ''}
                          onChange={v => setField('location', v)}
                        />
                        <EditableInput
                          icon={ShieldAlert} label="Emergency Contact"
                          value={editData.emergencyContact || ''}
                          onChange={v => setField('emergencyContact', v)}
                          placeholder="e.g. +212 660 000 000"
                        />
                      </div>
                      <EditableInput
                        icon={Landmark} label="RIB" mono
                        value={editData.rib || ''}
                        onChange={v => setField('rib', v)}
                      />
                    </div>
                  ) : (
                    /* ── HR sees these read-only ── */
                    <div className="bg-surface-secondary/50 rounded-xl p-4 border border-border-secondary">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                        <InfoItem icon={Mail} label="Email" value={selectedEmployee.email} />
                        <InfoItem icon={Phone} label="Phone" value={selectedEmployee.phone} />
                        <InfoItem icon={MapPin} label="Location" value={selectedEmployee.location} />
                        <InfoItem icon={ShieldAlert} label="Emergency Contact" value={selectedEmployee.emergencyContact || '—'} />
                      </div>
                      <div className="mt-1 pt-1 border-t border-border-secondary">
                        <InfoItem icon={Landmark} label="RIB" value={selectedEmployee.rib} />
                      </div>
                    </div>
                  )}
                </div>

                {/* ═══ SECTION 2 — HR Info ═══ */}
                <div className="space-y-3">
                  <SectionHeading
                    number="2"
                    title="HR Information"
                    badge={isHR ? 'Editable' : 'Read-only'}
                  />

                  {isHR ? (
                    /* ── HR can edit these ── */
                    <div className="space-y-4 p-4 rounded-xl border-2 border-blue-500/20 bg-blue-500/[0.02]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <EditableInput
                          icon={User} label="Reports To"
                          value={editData.manager || ''}
                          onChange={v => setField('manager', v)}
                        />
                        <EditableInput
                          icon={Calendar} label="Hiring Date"
                          value={editData.joinDate || ''}
                          onChange={v => setField('joinDate', v)}
                          placeholder="e.g. Jan 15, 2025"
                        />
                        <EditableSelect
                          icon={FileSignature} label="Contract Type"
                          value={editData.contractType || 'CDI'}
                          onChange={v => setField('contractType', v)}
                          options={['CDI', 'CDD', 'Freelance', 'Internship']}
                        />
                        <EditableInput
                          icon={DollarSign} label="Salary (MAD)" type="number"
                          value={editData.salary ?? ''}
                          onChange={v => setField('salary', v === '' ? '' : Number(v))}
                          placeholder="e.g. 15000"
                        />
                      </div>
                      {/* Static fields shown alongside */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 pt-2 border-t border-blue-500/10">
                        <InfoItem icon={Building2} label="Department" value={selectedEmployee.department} />
                        <InfoItem icon={Briefcase} label="Position" value={selectedEmployee.title} />
                        <InfoItem icon={Hash} label="CNSS" value={selectedEmployee.cnss} />
                      </div>
                    </div>
                  ) : (
                    /* ── Employee sees HR fields read-only ── */
                    <div className="bg-surface-secondary/50 rounded-xl p-4 border border-border-secondary">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                        <InfoItem icon={User} label="Reports To" value={selectedEmployee.manager} />
                        <InfoItem icon={Calendar} label="Hiring Date" value={selectedEmployee.joinDate} />
                        <InfoItem icon={FileSignature} label="Contract Type" value={selectedEmployee.contractType || '—'} />
                        <InfoItem icon={DollarSign} label="Salary" value={formatSalary(selectedEmployee.salary ?? 0)} suffix="(read-only)" />
                        <InfoItem icon={Building2} label="Department" value={selectedEmployee.department} />
                        <InfoItem icon={Briefcase} label="Position" value={selectedEmployee.title} />
                        <InfoItem icon={Hash} label="CNSS" value={selectedEmployee.cnss} />
                      </div>
                    </div>
                  )}
                </div>

                {/* ═══ SECTION 3 — Documents ═══ */}
                <div className="space-y-3">
                  <SectionHeading
                    number="3"
                    title="Documents"
                    badge={isHR ? 'Editable' : 'View only'}
                  />

                  <div className={`rounded-xl p-4 border ${isHR ? 'border-2 border-blue-500/20 bg-blue-500/[0.02]' : 'border-border-secondary bg-surface-secondary/50'}`}>
                    {/* HR: Upload button */}
                    {isHR && (
                      <button
                        onClick={handleAddDocument}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl mb-3
                                   bg-blue-500/10 text-blue-600 dark:text-blue-400
                                   text-xs font-semibold border border-blue-500/20
                                   hover:bg-blue-500/20 transition-all duration-200 cursor-pointer"
                      >
                        <Plus size={13} />
                        Upload Document
                      </button>
                    )}

                    {empDocuments.length === 0 ? (
                      <p className="text-xs text-text-tertiary py-2">No documents uploaded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {empDocuments.map(doc => (
                          <div key={doc.id}
                               className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-primary
                                          border border-border-secondary group/doc">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0
                                             ${docTypeColors[doc.type] || docTypeColors.other}`}>
                              <FileText size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-text-primary block truncate">{doc.name}</span>
                              <span className="text-[11px] text-text-tertiary">
                                {doc.uploadedBy} • {doc.date} • {doc.size}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                              <button className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-tertiary
                                                 hover:text-brand-500 transition-colors cursor-pointer" title="View">
                                <Eye size={13} />
                              </button>
                              <button className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-tertiary
                                                 hover:text-brand-500 transition-colors cursor-pointer" title="Download">
                                <Download size={13} />
                              </button>
                              {isHR && (
                                <button
                                  onClick={() => handleRemoveDocument(doc.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary
                                             hover:text-red-500 transition-colors cursor-pointer" title="Remove"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Save / Cancel ── */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-secondary">
                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                               bg-surface-secondary text-text-secondary text-sm font-semibold
                               border border-border-secondary
                               hover:bg-surface-primary hover:text-text-primary
                               transition-all duration-200 cursor-pointer"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                               text-white text-sm font-semibold shadow-md
                               hover:-translate-y-0.5 hover:shadow-lg
                               active:translate-y-0 active:shadow-sm
                               transition-all duration-200 cursor-pointer
                               ${isHR
                                 ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/20 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/30'
                                 : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/30'
                               }`}
                  >
                    <Save size={14} />
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              /* ══════════════════════════════════════════
                 READ-ONLY VIEW (all roles)
                 ══════════════════════════════════════════ */
              <>
                {/* ═══ SECTION 1 — Personal Info ═══ */}
                <div className="space-y-3">
                  <SectionHeading number="1" title="Personal Information" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5
                                  divide-y sm:divide-y-0 divide-border-secondary">
                    <div className="space-y-0.5 divide-y divide-border-secondary">
                      <InfoItem icon={Mail} label="Email" value={selectedEmployee.email} />
                      <InfoItem icon={Phone} label="Phone" value={selectedEmployee.phone} />
                      <InfoItem icon={MapPin} label="Location" value={selectedEmployee.location} />
                    </div>
                    <div className="space-y-0.5 divide-y divide-border-secondary">
                      <InfoItem icon={ShieldAlert} label="Emergency Contact" value={selectedEmployee.emergencyContact || '—'} />
                      <InfoItem icon={Building2} label="Department" value={selectedEmployee.department} />
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
                </div>

                {/* ═══ SECTION 2 — HR Info ═══ */}
                <div className="space-y-3">
                  <SectionHeading number="2" title="HR Information" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5
                                  divide-y sm:divide-y-0 divide-border-secondary">
                    <div className="space-y-0.5 divide-y divide-border-secondary">
                      <InfoItem icon={Briefcase} label="Position" value={selectedEmployee.title} />
                      <InfoItem icon={User} label="Reports To" value={selectedEmployee.manager} />
                      <InfoItem icon={Calendar} label="Hiring Date" value={selectedEmployee.joinDate} />
                    </div>
                    <div className="space-y-0.5 divide-y divide-border-secondary">
                      <InfoItem icon={FileSignature} label="Contract Type" value={selectedEmployee.contractType || '—'} />
                      <InfoItem icon={DollarSign} label="Salary" value={formatSalary(selectedEmployee.salary ?? 0)}
                                suffix={isEmployee ? '(read-only)' : undefined} />
                    </div>
                  </div>
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

                {/* ═══ SECTION 3 — Documents (always last) ═══ */}
                <div className="space-y-3">
                  <SectionHeading number="3" title="Documents" />
                  <div className="rounded-xl p-4 border border-border-secondary bg-surface-secondary/50">
                    {empDocuments.length === 0 ? (
                      <p className="text-xs text-text-tertiary py-2">No documents uploaded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {empDocuments.map(doc => (
                          <div key={doc.id}
                               className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-primary
                                          border border-border-secondary group/doc">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0
                                             ${docTypeColors[doc.type] || docTypeColors.other}`}>
                              <FileText size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-text-primary block truncate">{doc.name}</span>
                              <span className="text-[11px] text-text-tertiary">
                                {doc.uploadedBy} • {doc.date} • {doc.size}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                              <button className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-tertiary
                                                 hover:text-brand-500 transition-colors cursor-pointer" title="View">
                                <Eye size={13} />
                              </button>
                              <button className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-tertiary
                                                 hover:text-brand-500 transition-colors cursor-pointer" title="Download">
                                <Download size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
