import { supabase, isSupabaseReady } from './supabase';

class CompanyDataService {
    async getFullCompanyReport(entrepriseId = null) {
        if (!isSupabaseReady) return { error: 'Database not ready' };
        if (!entrepriseId) return { error: 'No entreprise_id provided' };

        try {
            // All queries filtered by entreprise_id for accurate multitenant data
            const [
                usersRes,
                employeesRes,
                departmentsRes,
                projectsRes,
                tasksRes,
                leavesRes,
                candidatesRes,
                jobsRes,
                presencesRes,
                payrollsRes
            ] = await Promise.all([
                supabase.from('users').select('id, role').eq('entreprise_id', entrepriseId),
                supabase.from('employees').select('id, department_id, salary_base').eq('entreprise_id', entrepriseId),
                supabase.from('departments').select('id, name').eq('entreprise_id', entrepriseId),
                supabase.from('projects').select('id, status').eq('entreprise_id', entrepriseId),
                supabase.from('tasks').select('id, status, priority').eq('entreprise_id', entrepriseId),
                supabase.from('vacances').select('id, status, days_count').eq('entreprise_id', entrepriseId),
                supabase.from('candidates').select('id, status, stage').eq('entreprise_id', entrepriseId),
                supabase.from('recrutements').select('id, status').eq('entreprise_id', entrepriseId),
                supabase.from('presences').select('id, status, date').eq('entreprise_id', entrepriseId),
                supabase.from('payrolls').select('id, net_salary, overtime_pay, status').eq('entreprise_id', entrepriseId)
            ]);

            const users = usersRes.data || [];
            const employees = employeesRes.data || [];
            const departments = departmentsRes.data || [];
            const projects = projectsRes.data || [];
            const tasks = tasksRes.data || [];
            const leaves = leavesRes.data || [];
            const candidates = candidatesRes.data || [];
            const jobs = jobsRes.data || [];
            const presences = presencesRes.data || [];
            const payrolls = payrollsRes.data || [];

            // Today's presences only
            const today = new Date().toISOString().split('T')[0];
            const todayPresences = presences.filter(p => p.date === today);

            // Filter out HR and ADMIN from the base employee count for attendance purposes
            // First map employee to their user role
            const eligibleEmployees = employees.filter(emp => {
                const user = users.find(u => u.id === emp.user_id || u.id === emp.id); // Assuming emp.id or emp.user_id matches users.id
                return user && user.role !== 'ADMIN' && user.role !== 'HR';
            });

            const totalEligibleCount = eligibleEmployees.length > 0 ? eligibleEmployees.length : employees.length; // Fallback if mapping fails

            const overview = {
                workforce: {
                    totalUsers: users.length,
                    totalEmployees: totalEligibleCount, // Only counts those who check in (excludes HR/Admin)
                    breakdown: {
                        admins: users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length,
                        hr: users.filter(u => u.role === 'HR').length,
                        managers: users.filter(u => u.role === 'MANAGER').length,
                        regularEmployees: users.filter(u => u.role === 'EMPLOYEE').length,
                    },
                    departmentsCount: departments.length,
                },
                projects: {
                    active: projects.filter(p => p.status === 'in_progress').length,
                    total: projects.length,
                },
                tasks: {
                    todo: tasks.filter(t => t.status === 'todo').length,
                    inProgress: tasks.filter(t => t.status === 'in_progress').length,
                    completed: tasks.filter(t => t.status === 'completed').length,
                },
                hr: {
                    pendingLeaves: leaves.filter(l => l.status === 'pending').length,
                    openJobs: jobs.filter(j => j.status === 'open').length,
                    activeCandidates: candidates.filter(c => !['rejected', 'hired'].includes(c.status)).length,
                },
                analytics: {
                    attendanceRate: todayPresences.length ? Math.round((todayPresences.filter(p => p.status === 'present').length / totalEligibleCount) * 100) : 0,
                    lateRate: todayPresences.length ? Math.round((todayPresences.filter(p => p.status === 'late').length / totalEligibleCount) * 100) : 0,
                    presentToday: todayPresences.filter(p => p.status === 'present').length,
                    lateToday: todayPresences.filter(p => p.status === 'late').length,
                    absentToday: Math.max(0, totalEligibleCount - todayPresences.length),
                    totalPayrollCost: payrolls.reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0),
                    leaveUtilization: leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.days_count || 0), 0)
                }
            };

            return overview;
        } catch (err) {
            console.error('Failed to generate company report:', err);
            return { error: 'Failed to fetch data' };
        }
    }
}

export const companyDataService = new CompanyDataService();

