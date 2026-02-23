# BPMS - Business Process Management System
## Complete Project Documentation

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [Running the Project](#running-the-project)
6. [Architecture Overview](#architecture-overview)
7. [Features & Modules](#features--modules)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Components Guide](#components-guide)
10. [Controllers & Services](#controllers--services)
11. [State Management](#state-management)
12. [Data Models](#data-models)
13. [Configuration](#configuration)
14. [Styling & Theme](#styling--theme)
15. [Development Workflow](#development-workflow)
16. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What is BPMS?

BPMS (Business Process Management System) is a comprehensive web application designed to manage organizational processes, employee workflows, and HR operations. It provides different dashboards and features based on user roles (Admin, HR, Manager, Employee).

### Key Objectives

- **Streamline HR Operations**: Manage employees, attendance, payroll, and recruitment
- **Task Management**: Track task assignments and performance metrics
- **Workflow Automation**: Handle vacation requests, document requests, and other business processes
- **Role-Based Access**: Ensure proper access control based on user roles
- **Real-time Data**: Display live data through interactive dashboards
- **Professional UI/UX**: Modern, responsive interface with theme support

### Target Users

- **Admins**: Full system access, manage enterprise settings
- **HR Managers**: Manage employees, recruitment, payroll
- **Managers**: Monitor team tasks and performance
- **Employees**: View profile, request vacation/documents, manage tasks

---

## Technology Stack

### Frontend Framework
- **React 19.2.0**: UI library for building interactive components
- **React Router DOM 7.13.0**: Client-side routing
- **React DOM 19.2.0**: React rendering for web

### Build Tools
- **Vite 7.3.1**: Fast build tool and dev server
- **Vite Tailwind CSS Plugin 4.1.18**: Tailwind CSS integration

### Styling
- **Tailwind CSS 4.1.18**: Utility-first CSS framework
- **Lucide React 0.564.0**: Icon library (600+ icons)

### Development Tools
- **ESLint 9.39.1**: Code linting and formatting
- **ESLint Plugins**: React hooks and refresh plugins
- **Babel Components**: Via Vite plugin for fast refresh

### Type Checking (Development)
- **@types/react & @types/react-dom**: TypeScript definitions

---

## Project Structure

```
pfe-main/
├── public/                          # Static assets
├── src/
│   ├── components/                  # Reusable React components
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx      # Main application layout wrapper
│   │   │   ├── Navbar.jsx          # Top navigation bar
│   │   │   └── Sidebar.jsx         # Side navigation menu
│   │   └── ui/
│   │       ├── AIAssistant.jsx     # AI chat assistant component
│   │       ├── Breadcrumb.jsx      # Breadcrumb navigation
│   │       ├── DataTable.jsx       # Reusable data table component
│   │       ├── MiniChart.jsx       # Mini chart for statistics
│   │       ├── Modal.jsx           # Modal dialog component
│   │       ├── NotificationDropdown.jsx  # Notifications menu
│   │       ├── PageHeader.jsx      # Page header with title
│   │       ├── PageTransition.jsx  # Page transition animations
│   │       ├── RoleGuard.jsx       # Role-based access control wrapper
│   │       ├── RoleSwitcher.jsx    # Switch between user roles
│   │       ├── Skeleton.jsx        # Loading skeleton component
│   │       ├── StatCard.jsx        # Statistics card component
│   │       ├── StatusBadge.jsx     # Status indicator badge
│   │       └── ThemeToggle.jsx     # Light/Dark theme toggle
│   │
│   ├── config/
│   │   └── navigation.js           # Sidebar navigation configuration
│   │
│   ├── contexts/                   # React Context providers
│   │   ├── RoleContext.jsx         # User role state management
│   │   ├── SidebarContext.jsx      # Sidebar visibility state
│   │   └── ThemeContext.jsx        # Dark/Light theme state
│   │
│   ├── controllers/                # Business logic & data handling
│   │   ├── AIController.js         # AI assistant logic
│   │   ├── NotificationController.js # Notification management
│   │   ├── PerformanceController.js # Performance metrics
│   │   ├── ProjectController.js    # Project management logic
│   │   ├── TaskController.js       # Task management logic
│   │   ├── useController.js        # Custom hook for controllers
│   │   └── ValidationController.js # Form validation logic
│   │
│   ├── data/
│   │   └── mockData.js            # Mock/sample data for development
│   │
│   ├── models/                    # Data model definitions
│   │   ├── Notification.js        # Notification data structure
│   │   ├── Performance.js         # Performance metrics structure
│   │   ├── Project.js             # Project data structure
│   │   └── Task.js                # Task data structure
│   │
│   ├── pages/                     # Page components
│   │   ├── Dashboard.jsx          # Main dashboard page
│   │   ├── PlaceholderPage.jsx    # Placeholder for future pages
│   │   ├── dashboards/            # Role-specific dashboards
│   │   │   ├── AdminDashboard.jsx    # Admin dashboard view
│   │   │   ├── EmployeeDashboard.jsx # Employee dashboard view
│   │   │   ├── HRDashboard.jsx       # HR dashboard view
│   │   │   └── ManagerDashboard.jsx  # Manager dashboard view
│   │   │
│   │   └── modules/               # Feature modules
│   │       ├── Attendance.jsx           # Attendance tracking
│   │       ├── DocumentRequest.jsx      # Document request workflow
│   │       ├── EmployeeProfile.jsx      # Employee profile management
│   │       ├── EnterpriseManagement.jsx # Enterprise settings
│   │       ├── Payroll.jsx              # Payroll management
│   │       ├── Recruitment.jsx          # Recruitment & hiring
│   │       ├── UserManagement.jsx       # User account management
│   │       ├── VacationRequest.jsx      # Vacation/leave request workflow
│   │       └── TaskPerformance/         # Task management subsystem
│   │           ├── EmployeeDashboard.jsx # Employee task dashboard
│   │           ├── ManagerDashboard.jsx  # Manager task dashboard
│   │           └── index.jsx             # Task module entry point
│   │
│   ├── router/
│   │   └── index.jsx              # Application routing configuration
│   │
│   ├── services/
│   │   └── StorageService.js      # Local storage management
│   │
│   ├── App.jsx                    # Root component
│   ├── main.jsx                   # Application entry point
│   └── index.css                  # Global styles
│
├── index.html                     # HTML entry point
├── package.json                   # Project dependencies
├── package-lock.json              # Locked dependency versions
├── vite.config.js                 # Vite configuration
├── eslint.config.js               # ESLint configuration
├── .gitignore                     # Git ignore rules
└── README.md                      # Project readme
```

---

## Setup & Installation

### Prerequisites

Ensure you have the following installed:
- **Node.js**: Version 16 or higher
- **npm**: Version 7 or higher (comes with Node.js)
- **Git**: For version control

### Step 1: Clone the Repository

```bash
git clone https://github.com/HiXaM94/BPMS--PFF.git
cd pfe-main
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies listed in `package.json`:
- React and React DOM
- React Router for navigation
- Tailwind CSS for styling
- Lucide React for icons
- Development dependencies for ESLint, Vite plugins, etc.

### Step 3: Verify Installation

Check that all dependencies are installed correctly:

```bash
npm list
```

---

## Running the Project

### Development Server

Start the development server with hot module replacement (HMR):

```bash
npm run dev
```

The application will be available at:
```
http://localhost:5173
```

### Production Build

Create an optimized production build:

```bash
npm run build
```

Output files will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Linting & Code Quality

Check code for linting errors:

```bash
npm run lint
```

Fix auto-fixable linting issues:

```bash
npm run lint -- --fix
```

---

## Architecture Overview

### Component Hierarchy

```
App (Root)
├── ThemeProvider (Theme Context)
├── SidebarProvider (Sidebar State)
└── RoleProvider (User Role State)
    └── RouterProvider (React Router)
        └── MainLayout (Layout Wrapper)
            ├── Navbar
            ├── Sidebar
            └── <Page Component>
                └── <Dashboard or Module>
```

### Data Flow

1. **User Action** → Component event handler
2. **Controller** → Business logic and data processing
3. **Context Update** → State management via React Context
4. **Component Re-render** → UI updates
5. **Storage Service** → Persist data to localStorage

### State Management Layers

```
Global State (Context)
├── ThemeContext (dark/light mode)
├── SidebarContext (sidebar visibility)
└── RoleContext (current user role)

Local State (useState)
└── Component-specific state

Persistent State (localStorage)
└── Theme, role, user preferences
```

---

## Features & Modules

### 1. Dashboard Module
**Location**: `src/pages/Dashboard.jsx`

Displays overview information based on user role. Includes:
- Role-specific dashboard content
- Quick stats and metrics
- Recent activities
- Key performance indicators

**Access**: All roles

### 2. Enterprise Management
**Location**: `src/pages/modules/EnterpriseManagement.jsx`

Manage organizational settings and structure:
- Company information
- Department management
- Branch/office management
- System settings

**Access**: Admin only

### 3. User Management
**Location**: `src/pages/modules/UserManagement.jsx`

Manage user accounts and access:
- Create/edit/delete users
- Assign roles and permissions
- User status management
- Activity logs

**Access**: Admin, HR

### 4. Employee Profile
**Location**: `src/pages/modules/EmployeeProfile.jsx`

View and manage employee information:
- Personal details
- Contact information
- Employment history
- Professional certifications
- Profile photo

**Access**: All roles (view own profile, admin/HR can view all)

### 5. Attendance Module
**Location**: `src/pages/modules/Attendance.jsx`

Track employee attendance:
- Clock in/out functionality
- Attendance records
- Monthly reports
- Absent/leave records
- Analytics dashboard

**Access**: Admin, HR, Manager, Employee

### 6. Task & Performance Module
**Location**: `src/pages/modules/TaskPerformance/`

Manage tasks and performance:
- **Employee Dashboard**: View assigned tasks, track progress
- **Manager Dashboard**: Assign tasks, monitor progress, evaluate performance
- Task status tracking (pending, in-progress, completed)
- Performance metrics

**Access**: Admin, HR, Manager, Employee

### 7. Vacation Request Workflow
**Location**: `src/pages/modules/VacationRequest.jsx`

Handle leave and vacation requests:
- Submit vacation requests
- Manager approval workflow
- Calendar view of approved leaves
- Balance tracking
- History

**Access**: Admin, HR, Manager, Employee

### 8. Document Request Workflow
**Location**: `src/pages/modules/DocumentRequest.jsx`

Manage document requests:
- Request work certificates
- Request salary slips
- Request experience letters
- Request status tracking
- Approval workflow

**Access**: Admin, HR, Manager, Employee

### 9. Payroll Module
**Location**: `src/pages/modules/Payroll.jsx`

Manage payroll and compensation:
- View salary information
- Process payroll
- Generate payslips
- Tax calculations
- Deductions management

**Access**: Admin, HR

### 10. Recruitment Module
**Location**: `src/pages/modules/Recruitment.jsx`

Manage hiring and recruitment:
- Job postings
- Candidate management
- Application tracking
- Interview scheduling
- Offer management

**Access**: Admin, HR

---

## User Roles & Permissions

### Role Definition

The system implements Role-Based Access Control (RBAC) with 4 primary roles:

#### 1. **Admin**
- **Full system access**
- **Permissions**:
  - Manage all users
  - Configure enterprise settings
  - Access all modules
  - Manage system permissions
  - View all analytics

#### 2. **HR**
- **Human Resources Manager**
- **Permissions**:
  - Manage users
  - Recruitment management
  - Payroll management
  - Attendance tracking
  - Employee documents
  - Approval workflows

#### 3. **Manager**
- **Department/Team Manager**
- **Permissions**:
  - View team tasks
  - Assign tasks
  - Monitor performance
  - Approve requests (vacation, documents)
  - View attendance of team members
  - Access analytics

#### 4. **Employee**
- **Individual Employee**
- **Permissions**:
  - View own profile
  - Request vacation
  - Request documents
  - View assigned tasks
  - Track attendance
  - View own performance metrics

### Role Switching (Development)

For testing, use the **Role Switcher** component in the navbar to switch between roles:

```jsx
<RoleSwitcher />  // Click avatar to switch roles
```

### Implementing Role-Based Access

Use the `RoleGuard` component to protect routes:

```jsx
<RoleGuard allowedRoles={['admin', 'hr']}>
  <UserManagement />
</RoleGuard>
```

---

## Components Guide

### Layout Components

#### MainLayout
**File**: `src/components/layout/MainLayout.jsx`

Wrapper component providing the main application layout.

**Features**:
- Contains navbar and sidebar
- Handles page transitions
- Responsive design
- Theme application

**Usage**:
```jsx
<MainLayout>
  <Dashboard />
</MainLayout>
```

#### Navbar
**File**: `src/components/layout/Navbar.jsx`

Top navigation bar with:
- Application logo/title
- Search functionality
- Notifications dropdown
- Theme toggle
- Role switcher
- User menu

#### Sidebar
**File**: `src/components/layout/Sidebar.jsx`

Left navigation menu with:
- Navigation items based on role
- Collapsible sections
- Active route highlighting
- Responsive mobile menu

---

### UI Components

#### RoleGuard
**File**: `src/components/ui/RoleGuard.jsx`

Protects components based on user role.

**Props**:
- `allowedRoles` (array): Roles permitted to view component
- `children` (JSX): Protected component

**Example**:
```jsx
<RoleGuard allowedRoles={['admin']}>
  <AdminPanel />
</RoleGuard>
```

#### PageHeader
**File**: `src/components/ui/PageHeader.jsx`

Page title and breadcrumb section.

**Props**:
- `title` (string): Page title
- `breadcrumb` (array): Breadcrumb items
- `subtitle` (string, optional): Additional context

#### DataTable
**File**: `src/components/ui/DataTable.jsx`

Reusable table component for displaying data.

**Props**:
- `data` (array): Table data
- `columns` (array): Column definitions
- `sorting` (boolean): Enable sorting
- `pagination` (boolean): Enable pagination

#### StatCard
**File**: `src/components/ui/StatCard.jsx`

Card displaying statistical information.

**Props**:
- `title` (string): Metric title
- `value` (number/string): Current value
- `icon` (JSX): Icon component
- `trend` (object): Trend data (optional)
- `color` (string): Card color theme

#### Modal
**File**: `src/components/ui/Modal.jsx`

Dialog/modal component.

**Props**:
- `isOpen` (boolean): Modal visibility
- `onClose` (function): Close handler
- `title` (string): Modal title
- `children` (JSX): Modal content

#### Skeleton
**File**: `src/components/ui/Skeleton.jsx`

Loading skeleton component for content placeholders.

**Props**:
- `count` (number): Number of skeleton lines
- `height` (string): Skeleton height
- `className` (string): Additional classes

#### ThemeToggle
**File**: `src/components/ui/ThemeToggle.jsx`

Dark/Light theme switcher button.

**Features**:
- Toggle dark mode
- Persist preference
- Smooth transitions
- System preference detection

#### RoleSwitcher
**File**: `src/components/ui/RoleSwitcher.jsx`

Switch between user roles (development feature).

**Available Roles**:
- admin
- hr
- manager
- employee

#### AIAssistant
**File**: `src/components/ui/AIAssistant.jsx`

AI chat assistant component.

**Features**:
- Chat interface
- Message history
- AI responses
- Floating chat window

---

## Controllers & Services

### Controllers

Controllers implement business logic and data handling. Each controller follows a consistent pattern.

#### TaskController
**File**: `src/controllers/TaskController.js`

Manages task-related operations:
- Create tasks
- Update task status
- Assign tasks
- Get task metrics
- Filter and search

**Key Methods**:
```javascript
createTask(taskData)        // Create new task
updateTask(id, data)        // Update existing task
getTaskMetrics()            // Get performance metrics
filterTasks(criteria)       // Filter tasks
```

#### PerformanceController
**File**: `src/controllers/PerformanceController.js`

Track and analyze performance:
- Calculate scores
- Generate reports
- Track metrics
- Compare performance

#### ProjectController
**File**: `src/controllers/ProjectController.js`

Manage projects:
- Create projects
- Assign team members
- Track progress
- Generate reports

#### NotificationController
**File**: `src/controllers/NotificationController.js`

Handle notifications:
- Create notifications
- Mark as read
- Filter notifications
- Delete notifications

#### AIController
**File**: `src/controllers/AIController.js`

AI assistant logic:
- Process user messages
- Generate responses
- Store conversation history
- Integration with AI services

#### ValidationController
**File**: `src/controllers/ValidationController.js`

Form and data validation:
- Validate user input
- Email validation
- Password strength
- Custom validation rules

#### Custom Hook: useController
**File**: `src/controllers/useController.js`

Custom React hook for using controllers in components.

**Usage**:
```javascript
const { data, loading, error } = useController('task');
```

### Services

#### StorageService
**File**: `src/services/StorageService.js`

Local storage management:

**Key Methods**:
```javascript
setItem(key, value)         // Store data
getItem(key)                // Retrieve data
removeItem(key)             // Delete data
clear()                     // Clear all storage
```

**Usage**:
```javascript
StorageService.setItem('theme', 'dark');
const theme = StorageService.getItem('theme');
```

---

## State Management

### Context API Structure

#### ThemeContext
**File**: `src/contexts/ThemeContext.jsx`

Manages application theme state.

**Provider**: `<ThemeProvider>`

**Hook**: `useTheme()`

**Values**:
- `theme` (string): 'light' or 'dark'
- `toggleTheme()` (function): Switch theme

**Usage**:
```javascript
const { theme, toggleTheme } = useTheme();
```

#### RoleContext
**File**: `src/contexts/RoleContext.jsx`

Manages current user role.

**Provider**: `<RoleProvider>`

**Hook**: `useRole()`

**Values**:
- `role` (string): Current user role
- `setRole(role)` (function): Change role
- `hasAccess(roles)` (function): Check access

**Usage**:
```javascript
const { role, setRole, hasAccess } = useRole();
```

#### SidebarContext
**File**: `src/contexts/SidebarContext.jsx`

Manages sidebar visibility.

**Provider**: `<SidebarProvider>`

**Hook**: `useSidebar()`

**Values**:
- `isOpen` (boolean): Sidebar visibility
- `toggleSidebar()` (function): Toggle sidebar

**Usage**:
```javascript
const { isOpen, toggleSidebar } = useSidebar();
```

---

## Data Models

### Task Model
**File**: `src/models/Task.js`

Represents a task in the system.

**Properties**:
```javascript
{
  id: string,              // Unique identifier
  title: string,           // Task title
  description: string,     // Task description
  assignedTo: string,      // Employee ID
  assignedBy: string,      // Manager ID
  status: string,          // 'pending' | 'in-progress' | 'completed'
  priority: string,        // 'low' | 'medium' | 'high'
  dueDate: Date,          // Due date
  createdAt: Date,        // Creation timestamp
  updatedAt: Date,        // Last update timestamp
  attachments: array,      // File attachments
}
```

### Performance Model
**File**: `src/models/Performance.js`

Tracks employee performance metrics.

**Properties**:
```javascript
{
  id: string,              // Unique identifier
  employeeId: string,      // Employee reference
  period: string,          // Evaluation period (month/quarter/year)
  score: number,           // Performance score (0-100)
  ratings: object,         // Category ratings
  feedback: string,        // Manager feedback
  goals: array,            // Performance goals
  createdAt: Date,        // Creation date
  updatedAt: Date,        // Update date
}
```

### Project Model
**File**: `src/models/Project.js`

Represents a project.

**Properties**:
```javascript
{
  id: string,              // Unique identifier
  name: string,            // Project name
  description: string,     // Description
  owner: string,           // Owner ID
  members: array,          // Team member IDs
  status: string,          // 'planning' | 'active' | 'completed'
  startDate: Date,        // Start date
  endDate: Date,          // End date
  budget: number,         // Budget amount
  progress: number,       // Progress percentage (0-100)
  createdAt: Date,        // Creation date
  updatedAt: Date,        // Update date
}
```

### Notification Model
**File**: `src/models/Notification.js`

Represents a notification.

**Properties**:
```javascript
{
  id: string,              // Unique identifier
  type: string,            // 'info' | 'warning' | 'error' | 'success'
  title: string,           // Notification title
  message: string,         // Notification message
  read: boolean,           // Read status
  recipient: string,       // Recipient user ID
  createdAt: Date,        // Creation timestamp
  expiresAt: Date,        // Expiration date
}
```

---

## Configuration

### Navigation Configuration
**File**: `src/config/navigation.js`

Defines sidebar navigation items.

**Structure**:
```javascript
{
  section: string,         // Section title
  items: [
    {
      id: string,          // Unique identifier
      label: string,       // Display label
      icon: Component,     // Icon from Lucide
      path: string,        // Route path
      roles: array,        // Allowed roles
    }
  ]
}
```

**Example**:
```javascript
{
  section: 'HR & People',
  items: [
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      path: '/users',
      roles: ['admin', 'hr']
    }
  ]
}
```

### Router Configuration
**File**: `src/router/index.jsx`

Defines application routes using React Router v7.

**Route Structure**:
```jsx
{
  element: <MainLayout />,
  children: [
    { index: true, element: <Dashboard /> },
    { path: 'users', element: <RoleGuard allowedRoles={['admin']}><Users /></RoleGuard> },
    // ... more routes
  ]
}
```

### Mock Data
**File**: `src/data/mockData.js`

Sample data for development and testing.

**Exports**:
- Mock users
- Mock tasks
- Mock projects
- Mock performance data
- Mock notifications

---

## Styling & Theme

### Tailwind CSS
- **Utility-first CSS framework**
- **Configuration**: `tailwind.config.js`
- **Global styles**: `src/index.css`

### Theme System

Dark and light mode support:

```jsx
// Toggle theme
const { theme, toggleTheme } = useTheme();
toggleTheme();

// Apply theme-specific styles
<div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
```

### Color Palette

**Primary Colors**:
- Blue: #3B82F6
- Indigo: #6366F1
- Purple: #A855F7

**Neutral Colors**:
- Gray-50 to Gray-900

**Semantic Colors**:
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444
- Info: #3B82F6

### Responsive Design

Mobile-first approach using Tailwind breakpoints:

```
sm: 640px   (tablets)
md: 768px   (small desktops)
lg: 1024px  (desktops)
xl: 1280px  (large desktops)
2xl: 1536px (extra large screens)
```

---

## Development Workflow

### Version Control

The project uses Git for version control and is hosted on GitHub.

**Repository**: `https://github.com/HiXaM94/BPMS--PFF.git`

**Main Branch**: `main`

### Branching Strategy

Recommended branch naming:
- `feature/feature-name` - New features
- `bugfix/bug-name` - Bug fixes
- `enhancement/enhancement-name` - Enhancements
- `docs/doc-name` - Documentation

### Commit Messages

Use descriptive commit messages:

```
feat: Add user management module
fix: Resolve theme toggle bug
docs: Update installation guide
refactor: Simplify component props
test: Add unit tests for controllers
```

### Code Quality

**ESLint Configuration**: `eslint.config.js`

Run linting:
```bash
npm run lint
```

**Key Rules**:
- React hooks validation
- React refresh rules
- ES6+ best practices

### Pull Request Process

1. Create feature branch from `main`
2. Make changes and commit
3. Push to remote
4. Create pull request
5. Code review
6. Merge to `main`

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Port Already in Use
**Problem**: Port 5173 is in use
**Solution**:
```bash
# Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or specify different port
npm run dev -- --port 3000
```

#### 2. Dependencies Installation Fails
**Problem**: npm install fails
**Solution**:
```bash
# Clear cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -r node_modules package-lock.json

# Reinstall
npm install
```

#### 3. Hot Module Replacement (HMR) Not Working
**Problem**: Changes don't reflect immediately
**Solution**:
- Check browser console for errors
- Clear browser cache
- Restart dev server
- Check vite.config.js configuration

#### 4. Build Errors
**Problem**: `npm run build` fails
**Solution**:
```bash
# Check for linting errors
npm run lint -- --fix

# Check console errors
npm run build 2>&1

# Check previous build logs
cat build-error.txt
cat build-log.txt
```

#### 5. Role Guard Not Working
**Problem**: Users can access protected pages
**Solution**:
- Check RoleContext is properly wrapped
- Verify role is set correctly
- Check RoleGuard component props
- Verify navigation configuration

#### 6. Styling Issues
**Problem**: Tailwind classes not applying
**Solution**:
- Ensure Tailwind configuration is correct
- Check if class names are in allow list (dynamic classes)
- Restart dev server
- Clear browser cache

#### 7. localStorage Issues
**Problem**: Theme/preferences not persisting
**Solution**:
- Check browser storage is enabled
- Clear localStorage: `localStorage.clear()`
- Check StorageService implementation
- Verify context providers are at root level

### Log Files

Check build logs for errors:
- `build-error.txt` - Build errors
- `build-log.txt` - Full build log

### Getting Help

1. Check the documentation
2. Review code comments
3. Check browser console for errors
4. Review GitHub issues
5. Contact development team

---

## Performance Optimization

### Code Splitting

Routes are automatically split at page level for faster initial load.

### Image Optimization

- Use Lucide React icons (SVG)
- Optimize images in public folder
- Consider lazy loading for images

### Bundle Analysis

```bash
# Build and check bundle size
npm run build
```

### Development Performance

- Use React DevTools profiler
- Monitor component re-renders
- Check Context usage (avoid unnecessary re-renders)

---

## Security Considerations

### Authentication

Currently, the app uses mock role switching for development. In production:
- Implement proper authentication (JWT tokens, OAuth, etc.)
- Secure API endpoints
- Validate user sessions
- Implement CSRF protection

### Authorization

- Verify roles on backend
- Never trust client-side role information
- Implement permission matrices
- Log access attempts

### Data Protection

- Encrypt sensitive data
- Use HTTPS in production
- Implement rate limiting
- Validate all user input

---

## Future Enhancements

### Planned Features

1. **API Integration**
   - Connect to backend API
   - Replace mock data with real data
   - Implement real-time updates

2. **Advanced Features**
   - Calendar view for tasks/vacation
   - Gantt charts for projects
   - Advanced reporting
   - Data export (CSV, PDF)

3. **Improvements**
   - Offline support
   - Progressive Web App (PWA)
   - Mobile app version
   - Advanced analytics

4. **Integration**
   - Email notifications
   - SMS alerts
   - Third-party integrations
   - API webhooks

---

## Contact & Support

For questions, issues, or contributions:
- **GitHub Repository**: https://github.com/HiXaM94/BPMS--PFF.git
- **Issue Tracker**: GitHub Issues
- **Development Team**: Contact project maintainers

---

## License

[Specify License]

---

**Last Updated**: February 19, 2026
**Documentation Version**: 1.0
