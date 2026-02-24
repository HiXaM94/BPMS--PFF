# BPMS Features & API Integration Guide

---

## Table of Contents

1. [Module-by-Module Guide](#module-by-module-guide)
2. [Feature Specifications](#feature-specifications)
3. [API Integration Roadmap](#api-integration-roadmap)
4. [Database Schema](#database-schema-example)
5. [Testing Workflows](#testing-workflows)
6. [Data Export & Reporting](#data-export--reporting)

---

## Module-by-Module Guide

### 1. Dashboard Module

**Current Status**: ✅ Implemented with mock data

**Location**: `src/pages/Dashboard.jsx` and role-specific dashboards

#### Features:
- Role-based dashboard content
- Quick statistics display
- Recent activity feed
- Performance metrics
- Task overview

#### Role-Specific Dashboards:
- **Admin Dashboard**: System overview, user stats, system health
- **HR Dashboard**: Recruitment metrics, payroll status, employee stats
- **Manager Dashboard**: Team performance, task assignments, attendance
- **Employee Dashboard**: Personal tasks, attendance, vacation balance

#### API Endpoints (Future):
```
GET /api/dashboards/{role}
GET /api/dashboards/stats/overview
GET /api/dashboards/activity/recent
```

### 2. Enterprise Management

**Current Status**: ✅ UI Implemented | ❌ API Not Connected

**Location**: `src/pages/modules/EnterpriseManagement.jsx`

**Access**: Admin only

#### Features:
- Company information management
- Department structure
- Branch/office management
- System configurations
- Organization hierarchy

#### Available Operations:
- View organization structure
- Add/edit departments
- Manage office locations
- Configure system settings
- View organization charts

#### API Endpoints (Future):
```
GET    /api/enterprise
PUT    /api/enterprise
GET    /api/departments
POST   /api/departments
PUT    /api/departments/{id}
DELETE /api/departments/{id}
GET    /api/locations
POST   /api/locations
PUT    /api/locations/{id}
DELETE /api/locations/{id}
```

#### Data Structure:
```javascript
{
  enterprise: {
    id: string,
    name: string,
    registrationNumber: string,
    address: string,
    phone: string,
    email: string,
    website: string,
    taxId: string,
    industry: string,
    employeeCount: number,
    foundedYear: number,
  },
  departments: [
    {
      id: string,
      name: string,
      code: string,
      manager: string,
      location: string,
      employeeCount: number,
      budget: number,
    }
  ],
  locations: [
    {
      id: string,
      name: string,
      country: string,
      city: string,
      address: string,
      phone: string,
      manager: string,
    }
  ]
}
```

### 3. User Management

**Current Status**: ✅ UI Implemented | ❌ API Not Connected

**Location**: `src/pages/modules/UserManagement.jsx`

**Access**: Admin, HR

#### Features:
- Create/edit/delete user accounts
- Assign roles and permissions
- Manage user status (active, inactive)
- User activity logs
- Password reset management
- Bulk user import

#### Available Operations:
- View all users with filters
- Create new user account
- Edit user details and role
- Deactivate/activate accounts
- Reset passwords
- View login history
- Bulk import from CSV

#### API Endpoints (Future):
```
GET    /api/users
POST   /api/users
GET    /api/users/{id}
PUT    /api/users/{id}
DELETE /api/users/{id}
POST   /api/users/bulk-import
GET    /api/users/{id}/activity-log
POST   /api/users/{id}/reset-password
```

#### Data Structure:
```javascript
{
  id: string,
  username: string,
  email: string,
  firstName: string,
  lastName: string,
  role: 'admin' | 'hr' | 'manager' | 'employee',
  department: string,
  status: 'active' | 'inactive' | 'suspended',
  phone: string,
  joinDate: Date,
  lastLogin: Date,
  permissions: string[],
  createdAt: Date,
  updatedAt: Date,
}
```

### 4. Employee Profile

**Current Status**: ✅ UI Implemented | ❌ API Not Connected

**Location**: `src/pages/modules/EmployeeProfile.jsx`

**Access**: All roles (view own, admin/HR view all)

#### Features:
- Personal information management
- Contact details
- Employment history
- Professional certifications
- Skills and competencies
- Profile photograph
- Emergency contacts
- Bank account information

#### Available Operations:
- View profile information
- Edit own information
- Upload profile picture
- Manage emergency contacts
- View employment history
- Update contact information

#### API Endpoints (Future):
```
GET    /api/employees/{id}/profile
PUT    /api/employees/{id}/profile
GET    /api/employees/{id}/employment-history
GET    /api/employees/{id}/certifications
POST   /api/employees/{id}/certifications
DELETE /api/employees/{id}/certifications/{certId}
POST   /api/employees/{id}/profile-picture
```

#### Data Structure:
```javascript
{
  id: string,
  personalInfo: {
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    gender: string,
    nationality: string,
    idNumber: string,
    email: string,
    phone: string,
    address: string,
    city: string,
    state: string,
    zipCode: string,
    profilePicture: string,
  },
  employmentInfo: {
    employeeId: string,
    department: string,
    position: string,
    manager: string,
    joinDate: Date,
    employmentType: string,
    status: string,
  },
  emergencyContacts: [
    {
      name: string,
      relationship: string,
      phone: string,
    }
  ],
  certifications: [
    {
      id: string,
      name: string,
      issuer: string,
      issueDate: Date,
      expirationDate: Date,
    }
  ],
  bankInfo: {
    accountHolder: string,
    accountNumber: string,
    bankName: string,
    routingNumber: string,
  }
}
```

### 5. Attendance Module

**Current Status**: ✅ UI Implemented | ❌ API Not Connected

**Location**: `src/pages/modules/Attendance.jsx`

**Access**: Admin, HR, Manager, Employee

#### Features:
- Clock in/out functionality
- Attendance records
- Monthly/yearly reports
- Leave management
- Late arrival tracking
- Overtime tracking
- Attendance calendar view
- Analytics and trends

#### Available Operations:
- Clock in/out
- View attendance history
- Generate attendance reports
- Request leave/absence
- Manage leave balance
- View team attendance (manager)
- Approve/reject attendance requests

#### API Endpoints (Future):
```
POST   /api/attendance/clock-in
POST   /api/attendance/clock-out
GET    /api/attendance/records
GET    /api/attendance/records/{employeeId}/{date}
GET    /api/attendance/monthly-report/{employeeId}/{month}
GET    /api/attendance/leave-balance/{employeeId}
POST   /api/attendance/leave-request
GET    /api/attendance/leave-requests
PUT    /api/attendance/leave-requests/{id}/approve
PUT    /api/attendance/leave-requests/{id}/reject
```

#### Data Structure:
```javascript
{
  attendanceRecord: {
    id: string,
    employeeId: string,
    date: Date,
    clockIn: DateTime,
    clockOut: DateTime,
    duration: number, // in minutes
    status: 'present' | 'absent' | 'leave' | 'late',
    notes: string,
  },
  leaveRequest: {
    id: string,
    employeeId: string,
    type: 'vacation' | 'sick' | 'personal' | 'unpaid',
    startDate: Date,
    endDate: Date,
    totalDays: number,
    reason: string,
    status: 'pending' | 'approved' | 'rejected',
    approvedBy: string,
    approvedDate: Date,
  },
  leaveBalance: {
    employeeId: string,
    vacationDaysAllocated: number,
    vacationDaysUsed: number,
    vacationDaysRemaining: number,
    sickDaysAllocated: number,
    sickDaysUsed: number,
  }
}
```

### 6. Task & Performance Module

**Current Status**: ✅ UI Implemented | ❌ API Not Connected

**Location**: `src/pages/modules/TaskPerformance/`

**Access**: All roles (different dashboards)

#### Features:
- Task creation and assignment
- Task status tracking
- Progress monitoring
- Performance evaluation
- Employee rating system
- Deadline tracking
- Task comments and collaboration
- Performance analytics

#### Available Operations:
**Employee**:
- View assigned tasks
- Update task status
- Add comments
- View performance metrics

**Manager**:
- Create and assign tasks
- Monitor task progress
- Evaluate employee performance  
- Add performance feedback
- View team analytics

**Admin**:
- Full task management
- Cross-team task oversight
- Performance reports
- System-wide analytics

#### API Endpoints (Future):
```
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/{id}
PUT    /api/tasks/{id}
DELETE /api/tasks/{id}
PUT    /api/tasks/{id}/status
POST   /api/tasks/{id}/comments
GET    /api/performance/employee/{id}
POST   /api/performance/evaluate
GET    /api/performance/analytics/{period}
```

#### Data Structure:
```javascript
{
  task: {
    id: string,
    title: string,
    description: string,
    assignedTo: string,
    assignedBy: string,
    status: 'pending' | 'in-progress' | 'completed' | 'on-hold',
    priority: 'low' | 'medium' | 'high' | 'urgent',
    dueDate: Date,
    progress: number, // 0-100%
    createdAt: Date,
    updatedAt: Date,
    comments: [
      {
        id: string,
        author: string,
        text: string,
        timestamp: Date,
      }
    ],
  },
  performance: {
    id: string,
    employeeId: string,
    period: string,
    overallScore: number,
    ratings: {
      quality: number,
      productivity: number,
      teamwork: number,
      reliability: number,
      communication: number,
    },
    feedback: string,
    goals: string[],
    reviewedBy: string,
    reviewDate: Date,
  }
}
```

### 7. Vacation Request Workflow

**Current Status**: ✅ UI Implemented | ❌ API Not Connected

**Location**: `src/pages/modules/VacationRequest.jsx`

**Access**: All roles

#### Features:
- Submit vacation requests
- Manager approval workflow
- Calendar view of approved leaves
- Balance tracking
- Request history
- Bulk vacation planning
- Conflict checking (ensure coverage)

#### Available Operations:
**Employee**:
- Submit vacation request
- View balance
- View request history
- Cancel pending requests

**Manager**:
- Approve/reject requests
- View team calendar
- See team leave balance

**HR/Admin**:
- Full oversight
- Override decisions
- Manual balance adjustments

#### API Endpoints (Future):
```
GET    /api/vacation/balance/{employeeId}
POST   /api/vacation/request
GET    /api/vacation/requests
GET    /api/vacation/requests/{employeeId}
PUT    /api/vacation/requests/{id}/approve
PUT    /api/vacation/requests/{id}/reject
DELETE /api/vacation/requests/{id}
GET    /api/vacation/calendar/{period}
```

#### Data Structure:
```javascript
{
  vacationRequest: {
    id: string,
    employeeId: string,
    startDate: Date,
    endDate: Date,
    totalDays: number,
    reason: string,
    status: 'pending' | 'approved' | 'rejected' | 'cancelled',
    approvedBy: string,
    approvalDate: Date,
    comments: string,
    createdAt: Date,
  },
  vacationBalance: {
    employeeId: string,
    year: number,
    allocatedDays: number,
    usedDays: number,
    remainingDays: number,
    pendingDays: number, // In pending requests
  }
}
```

### 8. Document Request Workflow

**Current Status**: ✅ UI Implemented | ❌ API Not Connected

**Location**: `src/pages/modules/DocumentRequest.jsx`

**Access**: All roles

#### Features:
- Request work certificates
- Request salary slips
- Request experience letters
- Request confirmation letters
- Request status tracking
- Approval workflow
- Document generation
- Document delivery tracking

#### Available Operations:
**Employee**:
- Submit document request
- Track request status
- Download generated documents
- View request history

**HR**:
- Approve/reject requests
- Generate documents
- Mark as delivered

**Admin**:
- Override decisions
- View all requests

#### API Endpoints (Future):
```
GET    /api/documents/request-types
POST   /api/documents/request
GET    /api/documents/requests/{employeeId}
GET    /api/documents/requests/{id}
PUT    /api/documents/requests/{id}/approve
PUT    /api/documents/requests/{id}/reject
POST   /api/documents/requests/{id}/generate
GET    /api/documents/requests/{id}/download
```

#### Data Structure:
```javascript
{
  documentRequest: {
    id: string,
    employeeId: string,
    documentType: 'certificate' | 'salary-slip' | 'experience-letter' | 'confirmation',
    quantity: number,
    purpose: string,
    status: 'pending' | 'approved' | 'generated' | 'delivered' | 'rejected',
    requestDate: Date,
    approvedDate: Date,
    generatedDate: Date,
    deliveredDate: Date,
    approvedBy: string,
    comments: string,
    documentUrl: string, // For download
  }
}
```

### 9. Payroll Module

**Current Status**: ✅ UI Implemented | ❌ API Not Connected

**Location**: `src/pages/modules/Payroll.jsx`

**Access**: Admin, HR

#### Features:
- Salary structure management
- Payroll processing
- Payslip generation
- Tax calculations
- Deductions management
- Allowances management
- Payroll reports
- Payment history

#### Available Operations:
**HR**:
- View salary information
- Generate payslips
- View payment history
- Generate payroll reports

**Admin**:
- Full payroll management
- Salary structure configuration
- Tax settings
- Deduction rules

#### API Endpoints (Future):
```
GET    /api/payroll/employees
GET    /api/payroll/salary/{employeeId}
PUT    /api/payroll/salary/{employeeId}
GET    /api/payroll/payslip/{employeeId}/{month}
POST   /api/payroll/process-payroll/{month}
GET    /api/payroll/deductions
POST   /api/payroll/deductions
GET    /api/payroll/allowances
POST   /api/payroll/allowances
GET    /api/payroll/reports/{period}
```

#### Data Structure:
```javascript
{
  salaryStructure: {
    employeeId: string,
    basicSalary: number,
    allowances: [
      {
        id: string,
        name: string,
        amount: number,
      }
    ],
    deductions: [
      {
        id: string,
        name: string,
        amount: number,
      }
    ],
    grossSalary: number,
    netSalary: number,
  },
  payslip: {
    id: string,
    employeeId: string,
    month: string,
    year: number,
    basicSalary: number,
    allowances: number,
    grossSalary: number,
    deductions: number,
    taxes: number,
    netSalary: number,
    bankAccount: string,
    paymentDate: Date,
    status: 'draft' | 'processed' | 'paid',
  }
}
```

### 10. Recruitment Module

**Current Status**: ✅ UI Implemented | ❌ API Not Connected

**Location**: `src/pages/modules/Recruitment.jsx`

**Access**: Admin, HR

#### Features:
- Job posting management
- Candidate management
- Application tracking
- Interview scheduling
- Interview feedback
- Offer management
- Candidate pipeline
- Recruitment analytics

#### Available Operations:
**HR**:
- Post job openings
- Manage candidates
- Track applications
- Schedule interviews
- Generate offers
- View recruitment pipeline
- Generate reports

**Admin**:
- Full recruitment management
- Job posting approval
- Offer approval

#### API Endpoints (Future):
```
GET    /api/recruitment/jobs
POST   /api/recruitment/jobs
PUT    /api/recruitment/jobs/{id}
DELETE /api/recruitment/jobs/{id}
GET    /api/recruitment/candidates
POST   /api/recruitment/candidates
GET    /api/recruitment/applications
PUT    /api/recruitment/applications/{id}/status
GET    /api/recruitment/interviews
POST   /api/recruitment/interviews
PUT    /api/recruitment/interviews/{id}/feedback
POST   /api/recruitment/offers
```

#### Data Structure:
```javascript
{
  jobPosting: {
    id: string,
    title: string,
    department: string,
    description: string,
    requirements: string[],
    salary: {
      min: number,
      max: number,
    },
    status: 'open' | 'closed',
    createdDate: Date,
    closingDate: Date,
  },
  candidate: {
    id: string,
    name: string,
    email: string,
    phone: string,
    resume: string,
    appliedFor: string,
    applicationDate: Date,
    status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected',
  },
  interview: {
    id: string,
    candidateId: string,
    interviewRound: number,
    interviewers: string[],
    scheduledDate: Date,
    rating: number,
    feedback: string,
    status: 'scheduled' | 'completed' | 'cancelled',
  },
  offer: {
    id: string,
    candidateId: string,
    position: string,
    salary: number,
    startDate: Date,
    status: 'sent' | 'accepted' | 'rejected',
  }
}
```

---

## Feature Specifications

### Authentication & Authorization

**Status**: ⚠️ Partially Implemented

**Current Implementation**:
- Client-side role switching
- RoleGuard component for route protection
- Role-based sidebar navigation

**Missing for Production**:
- Backend authentication
- JWT token management
- Password hashing
- Session management
- OAuth integration (optional)
- Multi-factor authentication (optional)

**Implementation Guide**:
```javascript
// Future authentication flow
async function login(email, password) {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data;
  
  // Store token
  localStorage.setItem('authToken', token);
  
  // Set role in context
  setRole(user.role);
  
  // Redirect to dashboard
  navigate('/');
}
```

### Notifications System

**Status**: 🔶 Partial

**Current**: Mock notification dropdown in navbar

**Future Requirements**:
- Real-time notifications
- Email notifications
- SMS notifications
- In-app notification center
- Notification preferences
- Notification history

### Search & Filtering

**Status**: 🔶 Partial

**Implemented**:
- Sidebar search
- Table filtering (basic)

**Future**:
- Advanced search
- Full-text search
- Elasticsearch integration
- Saved searches
- Search history

### Audit & Logging

**Status**: ❌ Not Implemented

**Required for Production**:
- User activity logging
- Change tracking
- Action history
- Compliance reporting
- Security audit logs

---

## API Integration Roadmap

### Phase 1: Basic Integration (Week 1-2)

Create API service layer:

```javascript
// src/services/api/client.js
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Add auth token to requests
client.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
```

Create API services:

```javascript
// src/services/api/taskApi.js
import client from './client';

export const taskApi = {
  async getTasks() {
    const response = await client.get('/tasks');
    return response.data;
  },
  
  async getTask(id) {
    const response = await client.get(`/tasks/${id}`);
    return response.data;
  },
  
  async createTask(data) {
    const response = await client.post('/tasks', data);
    return response.data;
  },
  
  async updateTask(id, data) {
    const response = await client.put(`/tasks/${id}`, data);
    return response.data;
  },
  
  async deleteTask(id) {
    const response = await client.delete(`/tasks/${id}`);
    return response.data;
  },
};

export default taskApi;
```

### Phase 2: Controller Update (Week 2-3)

Replace mock data with API calls:

```javascript
// src/controllers/TaskController.js - Updated
import taskApi from '../services/api/taskApi';

export const TaskController = {
  async getTasks() {
    try {
      const tasks = await taskApi.getTasks(); // API call
      return { success: true, data: tasks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  async createTask(taskData) {
    try {
      const newTask = await taskApi.createTask(taskData);
      return { success: true, data: newTask };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  // ...other methods
};
```

### Phase 3: Component Integration (Week 3-4)

Update components to use API:

```javascript
// src/pages/modules/TaskPerformance/index.jsx
function TaskModule() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchTasks() {
      const result = await TaskController.getTasks();
      if (result.success) {
        setTasks(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
    
    fetchTasks();
  }, []);
  
  if (loading) return <Skeleton />;
  if (error) return <Error message={error} />;
  
  return <TaskList tasks={tasks} />;
}
```

### Phase 4: Error Handling & Optimization (Week 4)

Add comprehensive error handling and optimization.

---

## Database Schema Example

### SQL Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'employee',
  status VARCHAR(50) DEFAULT 'active',
  department_id UUID REFERENCES departments(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  assigned_by UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance records
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  clock_in TIMESTAMP,
  clock_out TIMESTAMP,
  status VARCHAR(50) DEFAULT 'absent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave requests
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Testing Workflows

### Testing Each Module

#### Dashboard Testing

1. **Admin Dashboard**:
   - [] View system overview
   - [] Check all stats display correctly
   - [] Verify charts render

2. **HR Dashboard**:
   - [] View recruitment metrics
   - [] Check employee statistics
   - [] Verify payroll status

3. **Manager Dashboard**:
   - [] View team performance
   - [] Check task metrics
   - [] Verify team attendance

4. **Employee Dashboard**:
   - [] View assigned tasks
   - [] Check personal attendance
   - [] Verify leave balance

#### User Management Testing

```javascript
Test Cases:
□ Create new user
  - Verify form validation
  - Check user created in database
  - Verify email sent

□ Edit user
  - Update all fields
  - Verify changes saved
  - Check activity log

□ Delete user
  - Deactivate account
  - Verify access revoked
  - Check cascading deletes

□ Role assignment
  - Assign different roles
  - Verify permissions updated
  - Test access to protected routes
```

#### Task Management Testing

```javascript
Test Cases:
□ Create task
  - Fill all required fields
  - Verify task created
  - Check notifications sent

□ Assign task
  - Assign to employee
  - Verify employee notified
  - Check task appears in their list

□ Update status
  - Change from pending to in-progress
  - Move to completed
  - Verify history tracked

□ Performance tracking
  - Verify metrics calculated
  - Check reports generated
  - Validate scoring logic
```

#### Workflow Testing (Vacation, Documents, etc.)

```javascript
Test Cases:
□ Request submission
  - Submit vacation request
  - Verify stored correctly

□ Approval workflow
  - Manager approves request
  - Verify employee notified
  - Check calendar updated

□ Rejection workflow
  - Manager rejects request
  - Verify employee notified
  - Check reason provided
```

---

## Data Export & Reporting

### Export Formats

#### CSV Export

```javascript
function exportToCSV(data, filename) {
  const csv = convertToCSV(data);
  downloadFile(csv, `${filename}.csv`, 'text/csv');
}

function convertToCSV(data) {
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => item[header]).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}
```

#### PDF Export

```javascript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function exportToPDF(data, title) {
  const doc = new jsPDF();
  doc.text(title, 10, 10);
  
  autoTable(doc, {
    head: [Object.keys(data[0])],
    body: data.map(item => Object.values(item)),
  });
  
  doc.save(`${title}.pdf`);
}
```

### Report Templates

#### Monthly Attendance Report

```javascript
Report Fields:
- Employee Name
- Department
- Days Present
- Days Absent
- Days Late
- Leave Taken
- Overtime Hours
- Report Date
```

#### Performance Report

```javascript
Report Fields:
- Employee Name
- Rating Period
- Performance Score
- Category Ratings (Quality, Productivity, etc.)
- Goals Achieved
- Areas for Improvement
- Manager Comments
```

#### Payroll Summary

```javascript
Report Fields:
- Pay Period
- Gross Salary
- Deductions (Tax, Insurance, etc.)
- Net Salary
- YTD Totals
- Payment Status
```

---

**Last Updated**: February 19, 2026
**Version**: 1.0
