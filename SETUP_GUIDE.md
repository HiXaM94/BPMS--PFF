# BPMS Setup & Getting Started Guide

---

## Quick Start (5 minutes)

### Prerequisites
- Node.js v16+ 
- npm v7+
- Git

### Installation

```bash
# 1. Clone repository
git clone https://github.com/HiXaM94/BPMS--PFF.git
cd pfe-main

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open browser
# Navigate to http://localhost:5173
```

**Done!** The application is running.

---

## Detailed Setup Guide

### Step 1: Environment Setup

#### Windows Setup

```powershell
# Check Node.js version
node --version  # Should be v16 or higher
npm --version   # Should be v7 or higher

# If not installed, download from nodejs.org
# Then verify installation
node -v
npm -v
```

#### macOS/Linux Setup

```bash
# Using Homebrew (macOS)
brew install node@18

# Using package manager (Linux)
sudo apt update
sudo apt install nodejs npm

# Verify installation
node --version
npm --version
```

### Step 2: Clone the Repository

```bash
# Clone HTTPS (recommended for first time)
git clone https://github.com/HiXaM94/BPMS--PFF.git

# Or clone SSH (if SSH key is configured)
git clone git@github.com:HiXaM94/BPMS--PFF.git

# Navigate to project
cd pfe-main
```

### Step 3: Install Dependencies

```bash
# Install dependencies from package.json
npm install

# This installs:
# - react and react-dom
# - react-router-dom
# - tailwindcss
# - lucide-react
# - vite and plugins
# - eslint and tools
```

**Troubleshooting**:

If installation fails:
```bash
# Clear npm cache
npm cache clean --force

# Delete lock file and node_modules
rm -r node_modules package-lock.json

# Reinstall
npm install
```

### Step 4: Verify Installation

```bash
# Check that node_modules exists and is populated
ls node_modules | head -20

# Run linter to check setup
npm run lint

# If no errors, setup is successful!
```

---

## Development Server

### Starting the Dev Server

```bash
npm run dev
```

**Output**:
```
  VITE v7.3.1  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: [IP]:5173/

  press h + enter to show help
```

### Accessing the Application

Open your browser and navigate to:
```
http://localhost:5173
```

### Features in Development Mode

- **Hot Module Replacement (HMR)**: Changes auto-reflect without page reload
- **Source Maps**: Full debugging capabilities
- **Fast Refresh**: React component state preserved on changes
- **Error Overlay**: Clear error messages in browser

### Stopping the Server

Press `Ctrl + C` in the terminal to stop the server.

---

## Available Commands

### Development

```bash
# Start development server with HMR
npm run dev
```

### Building

```bash
# Create production build
npm run build

# Output in dist/ folder
# Optimized and minified
```

### Preview Production Build

```bash
# Preview production build locally
npm run preview
```

### Code Quality

```bash
# Run ESLint to check code quality
npm run lint

# Automatically fix fixable issues
npm run lint -- --fix
```

---

## Project Navigation

### Understanding the File Structure

**Key Directories:**

```
src/
├── pages/          # Page components (Dashboard, modules)
├── components/     # Reusable components (UI, Layout)
├── contexts/       # Global state (Theme, Role, Sidebar)
├── controllers/    # Business logic
├── services/       # Utilities (Storage, etc.)
├── config/         # Configuration files
├── data/          # Mock data and samples
└── router/        # Routing configuration
```

### Finding Your Way Around

**To modify dashboard**:
→ `src/pages/Dashboard.jsx`
→ `src/pages/dashboards/AdminDashboard.jsx` (role-specific)

**To add new page**:
→ Create file in `src/pages/`
→ Add route in `src/router/index.jsx`
→ Add navigation item in `src/config/navigation.js`

**To create new component**:
→ Create folder in `src/components/ui/`
→ Build component with props
→ Use in pages

**To add business logic**:
→ Create controller in `src/controllers/`
→ Implement specific functionality
→ Use in components via useController hook

---

## Working with Different User Roles

### Role Switching (Development)

The application has 4 user roles. Switch roles for testing:

**Steps:**
1. Click on avatar/user icon in navbar
2. Select role from dropdown (Admin, HR, Manager, Employee)
3. Page content updates based on role

**Available Roles:**
- **Admin**: Full access to all features
- **HR**: HR management features
- **Manager**: Team management features
- **Employee**: Limited personal features

### Role-Specific Content

Different dashboards appear based on role:

```
/                → Role-appropriate dashboard
/users           → Only Admin, HR (see RoleGuard)
/enterprise      → Only Admin
/tasks           → All roles (different dashboards)
/attendance      → All roles
```

### Testing Role Permissions

1. Switch to Admin role
   - Can access all pages
   - Can manage users
   - Can access enterprise settings

2. Switch to HR role
   - Can access most features
   - Cannot access enterprise settings
   - Can manage recruitment and payroll

3. Switch to Manager role
   - Can view team tasks
   - Can approve requests
   - Cannot manage payroll

4. Switch to Employee role
   - Limited to personal features
   - Can view own profile
   - Can request vacation/documents

---

## Project Configuration

### Vite Configuration

**File**: `vite.config.js`

Contains:
- React plugin setup
- Dev server configuration
- Build optimization

**Usually doesn't need changes** unless customizing build process.

### Tailwind CSS Configuration

**File**: `tailwind.config.js`

Customize:
- Color palette
- Typography
- Spacing
- Breakpoints

### ESLint Configuration

**File**: `eslint.config.js`

Defines:
- Code style rules
- React hooks validation
- ES6+ requirements

Fix violations:
```bash
npm run lint -- --fix
```

### Environment Variables

Create `.env.local` for local overrides:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=BPMS
```

Access in components:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## Common Development Tasks

### Adding a New Page

1. **Create page component**:
   ```jsx
   // src/pages/NewPage.jsx
   export default function NewPage() {
     return <div>New Page Content</div>;
   }
   ```

2. **Add route**:
   ```jsx
   // src/router/index.jsx
   import NewPage from '../pages/NewPage';
   
   { path: 'new-page', element: <NewPage /> }
   ```

3. **Add navigation item** (optional):
   ```javascript
   // src/config/navigation.js
   {
     id: 'newpage',
     label: 'New Page',
     icon: Icon,
     path: '/new-page',
     roles: ['admin', 'hr']
   }
   ```

### Adding a Reusable Component

1. **Create component**:
   ```jsx
   // src/components/ui/NewComponent.jsx
   export default function NewComponent({ title, children }) {
     return (
       <div className="p-4 border rounded">
         <h2>{title}</h2>
         {children}
       </div>
     );
   }
   ```

2. **Use in pages**:
   ```jsx
   import NewComponent from '../components/ui/NewComponent';
   
   <NewComponent title="Hello">
     Content here
   </NewComponent>
   ```

### Adding Business Logic

1. **Create controller**:
   ```javascript
   // src/controllers/NewController.js
   export const NewController = {
     process(data) {
       // Business logic here
       return result;
     }
   };
   ```

2. **Use in component**:
   ```jsx
   import { NewController } from '../controllers/NewController';
   
   const result = NewController.process(data);
   ```

### Modifying Styles

Use Tailwind CSS classes:

```jsx
<div className="bg-blue-500 text-white p-4 rounded-lg">
  Styled with Tailwind
</div>
```

Key classes:
- **Spacing**: `p-4` (padding), `m-4` (margin)
- **Colors**: `bg-blue-500` (background), `text-white` (text)
- **Sizing**: `w-full` (width), `h-screen` (height)
- **Responsive**: `md:text-lg` (medium screens and up)
- **Flexbox**: `flex justify-between items-center`
- **Grid**: `grid grid-cols-2 gap-4`

---

## Debugging

### Browser DevTools

1. **Open DevTools**: `F12` or `Right-click → Inspect`
2. **Console Tab**: Check for error messages
3. **Network Tab**: Monitor API calls (when integrated)
4. **Elements Tab**: Inspect HTML and CSS

### React Developer Tools

Install React DevTools extension (Chrome/Firefox):
- Inspect component hierarchy
- View props and state
- Trace component updates
- Profile performance

### Common Issues & Solutions

#### Issue: Port 5173 Already in Use

```bash
# Solution 1: Use different port
npm run dev -- --port 3000

# Solution 2: Kill process on port
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti :5173 | xargs kill -9
```

#### Issue: Changes Not Reflecting

```bash
# Solution 1: Clear browser cache
# Ctrl + Shift + Delete (or Cmd + Shift + Delete on Mac)

# Solution 2: Restart dev server
# Press Ctrl + C, then npm run dev

# Solution 3: Hard refresh
# Ctrl + F5 (or Cmd + Shift + R on Mac)
```

#### Issue: Module Not Found

```bash
# Solution: Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install
npm run dev
```

#### Issue: Styling Not Applied

```bash
# Solution: Ensure class names are static (not dynamic)
// Bad:
const className = `text-${size}-lg`;

// Good:
const className = size === 'large' ? 'text-lg' : 'text-md';
```

---

## Building for Production

### Create Production Build

```bash
npm run build
```

**Output**: `dist/` folder containing:
- `index.html` - Entry point
- `assets/` - JavaScript, CSS bundles
- Static files optimized and minified

### Preview Production Build

```bash
npm run preview
```

This runs a local server to preview the exact production build.

### Build Checklist

Before deploying:
- [ ] All tests pass
- [ ] Linting passes: `npm run lint`
- [ ] No console errors
- [ ] Build succeeds: `npm run build`
- [ ] Production preview works: `npm run preview`
- [ ] All features tested
- [ ] Responsive design tested on mobile

### Deployment Options

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify
```bash
# Via Netlify CLI
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

#### GitHub Pages
```bash
# Update package.json
"homepage": "https://yourusername.github.io/repo"

# Deploy
npm run build
# Push dist folder to gh-pages branch
```

---

## Performance Tips

### During Development

1. **Use React DevTools Profiler**
   - Check which components re-render
   - Identify performance bottlenecks
   - Measure render times

2. **Monitor Bundle Size**
   ```bash
   npm run build
   # Check dist folder size
   ```

3. **Test Different Roles**
   - Switch roles frequently
   - Test different user scenarios
   - Verify permissions work

### Code Quality

1. **Run linter regularly**:
   ```bash
   npm run lint -- --fix
   ```

2. **Remove unused imports**:
   - Vite shows unused files in console
   - ESLint flags unused variables

3. **Optimize images**:
   - Use Lucide icons instead of images
   - Compress images before adding

---

## Getting Help

### Documentation Files

1. **DOCUMENTATION.md** - Complete project documentation
2. **ARCHITECTURE.md** - Technical architecture details
3. **This file** - Setup and getting started guide

### Common Questions

**Q: How do I change the theme?**
A: Click theme toggle in navbar. Or use `ThemeContext` hook in components.

**Q: How do I add a new role?**
A: Modify `RoleContext.jsx` to add role, update RoleGuard permissions, add in RoleSwitcher.

**Q: How do I connect to a real API?**
A: Create API service layer in `src/services/api/`, replace controller mock data calls.

**Q: How do I add authentication?**
A: Implement in `src/contexts/RoleContext.jsx`, add login page, store JWT token.

**Q: Where is the mock data?**
A: `src/data/mockData.js` - Replace with API calls when ready.

### Useful Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [Lucide Icons](https://lucide.dev)

---

## Next Steps

1. ✅ Installation complete - Run the dev server
2. 📖 Read DOCUMENTATION.md for feature overview
3. 🎨 Explore pages/modules to understand structure
4. 👤 Test different user roles
5. 📝 Start building your features
6. 🚀 Deploy when ready

---

## Reporting Issues

Found a bug or have a suggestion?

1. Check existing GitHub issues
2. Create detailed bug report
3. Include steps to reproduce
4. Attach screenshots if applicable

**GitHub**: https://github.com/HiXaM94/BPMS--PFF

---

**Last Updated**: February 19, 2026
**Version**: 1.0
