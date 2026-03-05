# 🏢 BPMS - Business Process Management System

A modern, role-based business process management and HR operations platform built with React, Vite, and Tailwind CSS.

[![GitHub](https://img.shields.io/badge/GitHub-HiXaM94%2FBPMS--PFF-blue?style=flat-square&logo=github)](https://github.com/HiXaM94/BPMS--PFF)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.3.1-646cff?style=flat-square&logo=vite)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.18-06b6d4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Contributing](#contributing)
- [License](#license)

---

## 🚀 Quick Start

Get up and running in 5 minutes:

```bash
# Clone the repository
git clone https://github.com/HiXaM94/BPMS--PFF.git
cd pfe-main

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

> **New to the project?** Start with [SETUP_GUIDE.md](./SETUP_GUIDE.md) for a comprehensive walkthrough.

---

## 📚 Documentation

This project includes comprehensive documentation covering every aspect:

### 📖 Main Documentation Files

| Document | Purpose | Audience |
|----------|---------|----------|
| **[PRESENTATION_GUIDE.md](./PRESENTATION_GUIDE.md)** | Complete jury presentation package (slides, demo script, team roles) | Team preparing defense |
| **[KIMI_PPT_PROMPT.md](./KIMI_PPT_PROMPT.md)** | Copy-paste prompt for Kimi AI to generate PowerPoint | Team preparing slides |
| **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** | Quick start and development environment setup | Everyone |
| **[DOCUMENTATION.md](./DOCUMENTATION.md)** | Complete project documentation and feature guide | Developers, Users |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Technical architecture and design patterns | Developers, Architects |
| **[FEATURES_AND_API.md](./FEATURES_AND_API.md)** | Feature specifications and API integration guide | Developers, API Team |

### 📄 Quick Reference

- **Getting Started**: Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) first
- **Feature Overview**: Check [DOCUMENTATION.md](./DOCUMENTATION.md#features--modules)
- **API Integration**: See [FEATURES_AND_API.md](./FEATURES_AND_API.md#api-integration-roadmap)
- **Architecture**: Review [ARCHITECTURE.md](./ARCHITECTURE.md) for design patterns
- **Troubleshooting**: Find solutions in [DOCUMENTATION.md](./DOCUMENTATION.md#troubleshooting)

---

## ✨ Features

### User Roles & Access Control
- **Admin**: Full system access and management
- **HR Manager**: Employee and payroll management
- **Manager**: Team task and performance management
- **Employee**: Personal profile and request submission

### Core Modules

#### 📊 Dashboard
- Role-specific dashboard views
- Real-time statistics and metrics
- Quick access to key features
- Recent activity feed

#### 👥 User & Enterprise Management
- User account management
- Role assignment and permissions
- Department and location management
- Organizational hierarchy

#### 📋 HR Operations
- **Attendance Tracking**: Clock in/out, reports, leave management
- **Task Management**: Task assignment, progress tracking, performance evaluation
- **Vacation Requests**: Request submission, manager approval workflow
- **Document Requests**: Work certificates, salary slips, experience letters
- **Employee Profile**: Personal information, employment history, certifications

#### 💰 Payroll & Recruitment
- **Payroll**: Salary management, payslip generation, tax calculations
- **Recruitment**: Job postings, candidate management, interview scheduling

---

## 📦 Installation

### Prerequisites
- Node.js v16 or higher
- npm v7 or higher
- Git

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/HiXaM94/BPMS--PFF.git
   cd pfe-main
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open your browser to `http://localhost:5173`

> 📖 For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md#detailed-setup-guide)

---

## 🎯 Usage

### Development Commands

```bash
# Start dev server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter and fix issues
npm run lint
npm run lint -- --fix
```

### Testing Different User Roles

1. Click the avatar/user icon in the navbar
2. Select a role from the dropdown (Admin, HR, Manager, Employee)
3. Page content updates based on role permissions

### Key Features to Explore

- **Dashboard**: View role-specific overview
- **User Management** (Admin/HR): Create and manage user accounts
- **Tasks** (All roles): Assign tasks and track performance
- **Attendance** (All roles): Track attendance and manage leaves
- **Vacation Requests** (All roles): Submit and approve vacation
- **Payroll** (Admin/HR): Manage salaries and generate payslips

> 📖 For detailed feature information, see [FEATURES_AND_API.md](./FEATURES_AND_API.md#module-by-module-guide)

---

## 📁 Project Structure

```
pfe-main/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── layout/         # Main layout components
│   │   └── ui/             # UI components (cards, buttons, etc.)
│   ├── pages/              # Page components
│   │   ├── dashboards/     # Role-specific dashboards
│   │   └── modules/        # Feature modules (HR, Tasks, etc.)
│   ├── contexts/           # React Context providers (Theme, Role, etc.)
│   ├── controllers/        # Business logic and data handling
│   ├── services/           # Utilities and services
│   ├── config/             # Configuration files
│   ├── data/              # Mock data for development
│   ├── router/            # Routing configuration
│   ├── App.jsx            # Root component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── public/                 # Static assets
├── documentation files     # Complete project documentation
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
└── README.md              # This file
```

> 📖 For more details, see [DOCUMENTATION.md#project-structure](./DOCUMENTATION.md#project-structure)

---

## 🛠️ Technology Stack

### Frontend Framework
- **React 19.2.0** - UI library
- **React Router 7.13.0** - Client-side routing
- **React DOM 19.2.0** - React rendering

### Build Tools & Styling
- **Vite 7.3.1** - Fast build tool and dev server
- **Tailwind CSS 4.1.18** - Utility-first CSS framework
- **Lucide React 0.564.0** - Icon library (600+ icons)

### Development Tools
- **ESLint 9.39.1** - Code linting
- **Babel/SWC** - JavaScript transformation

### Package Management
- **npm** - Dependency management

> 📖 For more technical details, see [ARCHITECTURE.md#technology-stack](./ARCHITECTURE.md#technology-stack)

---

## 🏗️ Architecture

The application follows a modern, layered architecture:

```
Presentation Layer (Components & Pages)
         ↓
State Management Layer (Context & Hooks)
         ↓
Business Logic Layer (Controllers)
         ↓
Data Access Layer (Services & Storage)
```

Key architectural patterns:
- **Component-based architecture**: Reusable, composable components
- **Context API**: Global state management
- **Custom Hooks**: Logic extraction and reuse
- **Role-Based Access Control**: Route and feature protection
- **MVC Pattern**: Models, Controllers, and Views separation

> 📖 For comprehensive architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🔐 Security Features

- **Role-Based Access Control (RBAC)**: Route and feature-level protection
- **Input Validation**: Client-side form validation
- **Protected Routes**: RoleGuard component prevents unauthorized access
- **Secure State Management**: Context providers at application root

> ⚠️ **Note**: Current implementation uses mock data. For production, implement:
> - Backend authentication (JWT, OAuth)
> - Server-side authorization
> - API security
> - Data encryption
> - Audit logging

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized `dist/` folder ready for deployment.

### Deployment Targets

- **Vercel** (Recommended)
- **Netlify**
- **GitHub Pages**
- **Traditional servers** (with Node.js or static hosting)

> 📖 For deployment instructions, see [DOCUMENTATION.md#deployment-architecture](./DOCUMENTATION.md#deployment-architecture)

---

## 📖 Further Reading

- **Getting Started**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Complete Documentation**: [DOCUMENTATION.md](./DOCUMENTATION.md)
- **Architecture & Design**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Features & API**: [FEATURES_AND_API.md](./FEATURES_AND_API.md)
- **Troubleshooting**: [DOCUMENTATION.md#troubleshooting](./DOCUMENTATION.md#troubleshooting)

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Code passes linting: `npm run lint`
- Features are documented
- Changes follow the project structure

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Support & Contact

For questions, issues, or suggestions:

- **GitHub Issues**: [Report an issue](https://github.com/HiXaM94/BPMS--PFF/issues)
- **Documentation**: Check [DOCUMENTATION.md](./DOCUMENTATION.md) and other docs
- **Discord/Community**: [Join our community](https://link-to-community)

---

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com)
- [Lucide Icons](https://lucide.dev)

---

## 📊 Project Statistics

- **React Components**: 20+
- **Pages/Modules**: 10+
- **Routes**: 15+
- **Controllers**: 7+
- **Context Providers**: 3
- **Responsive Design**: Full mobile support

---

## ✅ Checklist for New Developers

- [ ] Read [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- [ ] Run `npm install` and `npm run dev`
- [ ] Explore the project structure
- [ ] Test different user roles
- [ ] Review [DOCUMENTATION.md](./DOCUMENTATION.md)
- [ ] Check [ARCHITECTURE.md](./ARCHITECTURE.md) for design patterns
- [ ] Read contributing guidelines

---

<div align="center">

### Made with ❤️ by Flowly Team 

**Star ⭐ the repository if you find it helpful!**

</div> 
