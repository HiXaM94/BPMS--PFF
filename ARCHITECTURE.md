# BPMS Architecture Guide
## Technical Design Documentation

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Application Layers](#application-layers)
3. [Component Architecture](#component-architecture)
4. [Data Flow Patterns](#data-flow-patterns)
5. [State Management Architecture](#state-management-architecture)
6. [Routing Architecture](#routing-architecture)
7. [Request/Response Cycle](#requestresponse-cycle)
8. [Error Handling](#error-handling)
9. [Performance Architecture](#performance-architecture)
10. [Security Architecture](#security-architecture)
11. [Deployment Architecture](#deployment-architecture)

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Browser / Client Application            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ▲                                   │
│                           │                                   │
│           ┌───────────────┼───────────────┐                  │
│           │               │               │                  │
│           ▼               ▼               ▼                  │
│  ┌──────────────┐ ┌──────────────┐  ┌──────────────┐       │
│  │   Contexts   │ │  Controllers │  │   Services   │       │
│  │              │ │              │  │              │       │
│  │ • Theme      │ │ • Task       │  │ • Storage    │       │
│  │ • Role       │ │ • Project    │  │ • Validation │       │
│  │ • Sidebar    │ │ • AI         │  │ • Notification       │
│  └──────────────┘ └──────────────┘  └──────────────┘       │
│           ▲               ▲               ▲                  │
│           └─────────┬─────┴───────────────┘                 │
│                     │                                        │
│           ┌─────────┴─────────┐                             │
│           │                   │                             │
│           ▼                   ▼                             │
│  ┌──────────────────┐ ┌──────────────────┐                │
│  │   Components     │ │    Pages         │                │
│  │                  │ │                  │                │
│  │ • Layout         │ │ • Dashboard      │                │
│  │ • UI             │ │ • Modules        │                │
│  │ • Reusable       │ │ • Role-specific  │                │
│  └──────────────────┘ └──────────────────┘                │
│           ▲                   ▲                             │
│           │                   │                             │
│           └─────────┬─────────┘                             │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────┐                  │
│  │        React Router (Navigation)     │                  │
│  └──────────────────────────────────────┘                  │
│                     ▲                                        │
│                     │ (In Production)                       │
│                     ▼                                        │
│  ┌──────────────────────────────────────┐                  │
│  │        API Endpoints / Backend       │                  │
│  └──────────────────────────────────────┘                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│             Client Storage & Persistence                     │
├─────────────────────────────────────────────────────────────┤
│  • localStorage (Theme, Role, Preferences)                   │
│  • Memory (React State, Context)                            │
│  • Session Storage (Temporary Data)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Application Layers

### Presentation Layer
**Responsibility**: Render UI and handle user interactions

**Components**:
- Layout components (MainLayout, Navbar, Sidebar)
- Page components (Dashboard, Modules)
- UI components (Buttons, Cards, Tables, Modals)
- Theme and styling

**Technologies**:
- React 19
- Tailwind CSS
- Lucide Icons

### Business Logic Layer
**Responsibility**: Handle application logic and data processing

**Components**:
- Controllers (Task, Project, Performance, etc.)
- Validators
- Calculations and transformations
- Data models

**Pattern**: MVC (Model-View-Controller)

### State Management Layer
**Responsibility**: Manage application state

**Components**:
- React Context (Theme, Role, Sidebar)
- React Hooks (useState, useEffect)
- localStorage (Persistence)

**Storage Hierarchy**:
1. Local State (Component)
2. Context State (Global)
3. localStorage (Persistent)

### Data Access Layer
**Responsibility**: Manage data sources and persistence

**Components**:
- StorageService (localStorage wrapper)
- Controllers (data retrieval)
- Mock data (development)

---

## Component Architecture

### Component Classification

#### Container Components (Smart)
- Manage state
- Connect to contexts
- Handle business logic
- Examples: Dashboard, Module pages

```jsx
// Container Component
function UserManagement() {
  const [users, setUsers] = useState([]);
  const { role } = useRole();
  
  useEffect(() => {
    // Fetch users
  }, []);
  
  return <UserTable users={users} />;
}
```

#### Presentation Components (Dumb)
- Receive data via props
- No business logic
- Reusable across app
- Examples: StatCard, DataTable, Modal

```jsx
// Presentation Component
function StatCard({ title, value, icon, color }) {
  return (
    <div className={`p-4 rounded-lg bg-${color}-50`}>
      {icon}
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}
```

### Component Composition

#### Composition over Inheritance

```jsx
// Good: Composition
<Card>
  <CardHeader title="Title" />
  <CardBody>Content</CardBody>
  <CardFooter>Footer</CardFooter>
</Card>

// Avoid: Props drilling
<Card 
  headerTitle="Title" 
  bodyContent="Content" 
  footerText="Footer" 
/>
```

#### Custom Hooks Pattern

```jsx
// Extract common logic into hooks
function useTaskData() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Load tasks
  }, []);
  
  return { tasks, loading, setTasks };
}

// Usage in multiple components
function TaskDashboard() {
  const { tasks, loading } = useTaskData();
  return <TaskList tasks={tasks} />;
}
```

---

## Data Flow Patterns

### Unidirectional Data Flow

```
User Action
    ↓
Event Handler
    ↓
Controller/Business Logic
    ↓
State Update (Context/setState)
    ↓
Component Re-render
    ↓
UI Update
```

### Example: Task Assignment

```jsx
// 1. User clicks "Assign" button
<button onClick={() => assignTask(taskId, userId)}>
  Assign
</button>

// 2. Event handler calls controller
function assignTask(taskId, userId) {
  const result = TaskController.assignTask(taskId, userId);
  
  // 3. Update state
  dispatch({ type: 'TASK_ASSIGNED', payload: result });
}

// 4. Context updates and notifies subscribers
// 5. All components using context re-render
// 6. UI updates to show assigned status
```

### Props Down, Events Up

```jsx
// Parent passes state and handler
<EmployeeList 
  employees={employees}
  onSelectEmployee={handleSelectEmployee}
/>

// Child triggers event
function EmployeeList({ employees, onSelectEmployee }) {
  return (
    <ul>
      {employees.map(emp => (
        <li key={emp.id} onClick={() => onSelectEmployee(emp)}>
          {emp.name}
        </li>
      ))}
    </ul>
  );
}
```

---

## State Management Architecture

### Context Hierarchy

```
RootComponent
│
├── ThemeProvider
│   └── theme, toggleTheme
│
├── SidebarProvider
│   └── isOpen, toggleSidebar
│
└── RoleProvider
    └── role, setRole, hasAccess
    
    └── RouterProvider
        └── <App Routes>
```

### State Flow Diagram

```
┌──────────────────────────────┐
│    Global State (Context)    │
├──────────────────────────────┤
│  • theme: 'dark' | 'light'   │
│  • role: 'admin' | ...       │
│  • isOpen: true | false      │
└──────────────────────────────┘
         ▲         │
         │         ▼
   useContext()  useContext()
         │         │
┌─────────┴─────────┴──────────┐
│    Component Local State     │
├──────────────────────────────┤
│  • formData                  │
│  • isLoading                 │
│  • selectedItem              │
└──────────────────────────────┘
         ▲         │
         │         ▼
useEffect()    useState()
         │         │
┌─────────┴─────────┴──────────┐
│  Persistent State (Storage)  │
├──────────────────────────────┤
│  • localStorage              │
│  • sessionStorage            │
└──────────────────────────────┘
```

### Context Usage Guidelines

**Use Context for**:
- Global settings (theme, language)
- User authentication/authorization
- Navigation state
- UI state (sidebar, modals)

**Avoid Context for**:
- Frequently changing data
- Large data structures
- Performance-sensitive state

**Alternative for Complex State**:
- Consider Redux or Zustand
- Use local state + prop drilling
- Separate API state from UI state

---

## Routing Architecture

### Route Structure

```jsx
const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      // Public routes (all roles)
      { index: true, element: <Dashboard /> },
      { path: 'profile', element: <EmployeeProfile /> },
      
      // Protected routes (role-based)
      { 
        path: 'users',
        element: (
          <RoleGuard allowedRoles={['admin', 'hr']}>
            <UserManagement />
          </RoleGuard>
        )
      },
      
      // Nested routes
      { 
        path: 'tasks',
        element: <TaskModule />,
        children: [
          { index: true, element: <TaskDashboard /> },
          { path: ':id', element: <TaskDetail /> },
        ]
      },
      
      // Fallback
      { path: '*', element: <NotFound /> },
    ],
  },
]);
```

### Route Types

1. **Index Routes** (default route)
   ```jsx
   { index: true, element: <Dashboard /> }  // matches "/"
   ```

2. **Nested Routes**
   ```jsx
   {
     path: 'tasks',
     children: [
       { index: true, element: <TaskList /> },
       { path: ':id', element: <TaskDetail /> }
     ]
   }
   ```

3. **Protected Routes**
   ```jsx
   <RoleGuard allowedRoles={['admin']}>
     <AdminPanel />
   </RoleGuard>
   ```

4. **Fallback Routes**
   ```jsx
   { path: '*', element: <NotFound /> }
   ```

### Navigation Pattern

```jsx
import { useNavigate } from 'react-router-dom';

function UserManagement() {
  const navigate = useNavigate();
  
  const handleUserSelect = (userId) => {
    navigate(`/users/${userId}`);
  };
  
  return <UserList onSelect={handleUserSelect} />;
}
```

---

## Request/Response Cycle

### Current Cycle (Mock Data)

```
User Action
    ↓
Event Handler
    ↓
Controller (TaskController, etc.)
    ↓
mockData.js (In-memory data)
    ↓
State Update
    ↓
Re-render
    ↓
UI Update
```

### Future Cycle (API Integration)

```
User Action
    ↓
Event Handler
    ↓
API Service
    ↓
HTTP Request (Fetch/Axios)
    ↓
Backend Server
    ↓
Database
    ↓
HTTP Response
    ↓
Data Transformation
    ↓
State Update
    ↓
Re-render
    ↓
UI Update
```

### Error Handling in Request

```jsx
async function fetchData() {
  try {
    setLoading(true);
    const data = await apiService.get('/endpoint');
    setData(data);
  } catch (error) {
    setError(error.message);
    notificationService.error('Failed to load data');
  } finally {
    setLoading(false);
  }
}
```

---

## Error Handling

### Error Types

1. **Validation Errors**
   - User input validation
   - Form field errors
   - Client-side validation

2. **Runtime Errors**
   - Component errors
   - Logic errors
   - State errors

3. **API Errors**
   - Network errors
   - Server errors (5xx)
   - Client errors (4xx)

### Error Handling Strategy

```jsx
// Controller level
function createUser(userData) {
  try {
    const errors = ValidationController.validateUser(userData);
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    const user = UserController.create(userData);
    return { success: true, data: user };
  } catch (error) {
    console.error('User creation failed:', error);
    return { success: false, error: error.message };
  }
}

// Component level
function UserForm() {
  const [errors, setErrors] = useState({});
  
  const handleSubmit = (formData) => {
    const result = createUser(formData);
    
    if (!result.success) {
      if (result.errors) {
        setErrors(mapErrors(result.errors));
      } else {
        showErrorMessage(result.error);
      }
    } else {
      showSuccessMessage('User created');
    }
  };
  
  return <Form onSubmit={handleSubmit} errors={errors} />;
}
```

### Error Boundaries (Future)

```jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Log to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

---

## Performance Architecture

### Optimization Strategies

#### 1. Code Splitting

```jsx
// Route-based code splitting (automatic with Vite)
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const EmployeeDashboard = lazy(() => import('./EmployeeDashboard'));

// Wrapped with Suspense
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="admin" element={<AdminDashboard />} />
    <Route path="employee" element={<EmployeeDashboard />} />
  </Routes>
</Suspense>
```

#### 2. Memoization

```jsx
// Memoize expensive components
const StatCard = React.memo(function StatCard({ title, value }) {
  return <div>{title}: {value}</div>;
});

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);

// Memoize values
const memoizedValue = useMemo(() => {
  return expensiveCalculation();
}, [dependency]);
```

#### 3. Lazy Loading

```jsx
// React Router lazy loading
const Dashboard = lazy(() => import('./Dashboard'));

// Image lazy loading
<img loading="lazy" src="image.jpg" />
```

#### 4. Bundle Optimization

**Current Bundle**:
- React + React-DOM
- React Router
- Tailwind CSS
- Lucide icons (tree-shaken)

**Vite optimizations**:
- Tree-shaking unused code
- CSS purging with Tailwind
- Icon tree-shaking
- Minification in production

### Performance Monitoring

```jsx
// Measure component render time
useEffect(() => {
  const start = performance.now();
  return () => {
    const end = performance.now();
    console.log(`Component rendered in ${end - start}ms`);
  };
}, []);
```

---

## Security Architecture

### Authentication Flow

```
┌─────────────────┐
│   Login Page    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Credential      │
│ Validation      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate JWT    │
│ (Backend)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Store Token     │
│ (localStorage)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Set Auth Header │
│ (All requests)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Protected Route │
│ Access Granted  │
└─────────────────┘
```

### Authorization Matrix

```
┌──────────────┬────────┬────────┬─────────┬──────────┐
│ Feature      │ Admin  │ HR     │ Manager │ Employee │
├──────────────┼────────┼────────┼─────────┼──────────┤
│ Dashboard    │   ✓    │   ✓    │    ✓    │    ✓     │
│ Users        │   ✓    │   ✓    │    ✗    │    ✗     │
│ Tasks        │   ✓    │   ✓    │    ✓    │    ✓     │
│ Payroll      │   ✓    │   ✓    │    ✗    │    ✗     │
│ Own Profile  │   ✓    │   ✓    │    ✓    │    ✓     │
└──────────────┴────────┴────────┴─────────┴──────────┘
```

### Input Validation

```jsx
// Client-side validation
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Note: Always validate on server as well!
function validateForm(formData) {
  const errors = {};
  
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }
  
  return errors;
}
```

### XSS Prevention

```jsx
// Safe: JSX escapes values
<div>{userInput}</div>  // Safe - escaped

// Unsafe: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // Avoid!

// Safe: For user-generated HTML content
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(userInput) 
}} />
```

---

## Deployment Architecture

### Development Environment
```
npm run dev
  → Vite dev server (localhost:5173)
  → Hot Module Replacement (HMR)
  → Source maps enabled
  → Full error reporting
```

### Production Build
```
npm run build
  → Optimized bundle
  → Code minification
  → Tree-shaking
  → Source maps (optional)
  → Output: dist/ folder
```

### Deployment Targets

#### Static Hosting (Recommended)
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

**Deployment Steps**:
```bash
npm run build
# Deploy dist/ folder
```

#### Traditional Server
- Node.js server with express
- Docker container
- Kubernetes cluster

**Build Output**:
- `dist/index.html` - Entry point
- `dist/assets/*` - JS, CSS bundle
- `dist/assets/images/*` - Assets

### Environment Configuration

```jsx
// Development
const API_URL = 'http://localhost:3000/api';

// Production
const API_URL = 'https://api.example.com/api';

// Load from env variables
const API_URL = import.meta.env.VITE_API_URL;
```

---

## Technology Decisions

### Why React?
- Component-based architecture
- Virtual DOM for performance
- Large ecosystem
- Great developer tools
- Excellent documentation

### Why Vite?
- Fast development server
- Quick build times
- Native ES modules
- Superior HMR experience
- Perfect for React projects

### Why Tailwind CSS?
- Utility-first approach
- Highly customizable
- Small production bundle
- Great for rapid development
- Built-in responsive design

### Why React Router v7?
- Modern API
- Nested routing
- Better data loading
- TypeScript support
- Active maintenance

---

## Future Architecture Improvements

### 1. API Integration Layer
```jsx
// Create API service layer
services/
  ├── api/
  │   ├── client.js (axios/fetch instance)
  │   ├── taskApi.js
  │   ├── userApi.js
  │   └── projectApi.js
```

### 2. State Management (If needed)
```jsx
// Consider Redux or Zustand for complex state
store/
  ├── slices/
  │   ├── taskSlice.js
  │   ├── userSlice.js
  │   └── projectSlice.js
  └── store.js
```

### 3. Testing Infrastructure
```jsx
tests/
  ├── unit/
  ├── integration/
  └── e2e/
```

### 4. Type Safety
```jsx
// Add TypeScript for better type safety
src/
  ├── types/
  │   ├── models.ts
  │   └── api.ts
```

---

**Architecture Document Version**: 1.0
**Last Updated**: February 19, 2026
