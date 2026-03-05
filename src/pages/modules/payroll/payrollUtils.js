import { supabase, isSupabaseReady } from '../../../services/supabase';
import jsPDF from 'jspdf';

// ── Currency & Date Formatters ──────────────────────────

export function fmt(n) {
    if (n == null) return '0 MAD';
    return Number(n).toLocaleString('fr-MA') + ' MAD';
}

export function fmtDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function periodLabel(start, end) {
    if (!start) return 'Unknown';
    const d = new Date(start);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ── Supabase Queries ────────────────────────────────────

/**
 * Fetch payrolls for a given period range, optionally filtered by enterprise.
 * Joins the employees table to get name & position.
 */
export async function fetchPayrollsByPeriod(startDate, endDate, entrepriseId = null) {
    if (!isSupabaseReady) return [];

    let query = supabase
        .from('payrolls')
        .select(`
      *,
      employees!inner (
        id,
        user_id,
        position,
        entreprise_id,
        users!inner ( name, email )
      )
    `)
        .gte('period_start', startDate)
        .lte('period_end', endDate);

    if (entrepriseId) {
        query = query.eq('employees.entreprise_id', entrepriseId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('fetchPayrollsByPeriod error:', error.message);
        return [];
    }
    return data || [];
}

/**
 * Fetch a single employee's payroll history (last N records).
 */
export async function fetchEmployeePayrolls(userId, limit = 6) {
    if (!isSupabaseReady || !userId) return [];

    // First find the employee ID for this user
    const { data: emp } = await supabase
        .from('employees')
        .select('id, position, entreprise_id')
        .eq('user_id', userId)
        .single();

    if (!emp) return [];

    const { data, error } = await supabase
        .from('payrolls')
        .select('*')
        .eq('employee_id', emp.id)
        .order('period_start', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('fetchEmployeePayrolls error:', error.message);
        return [];
    }
    return (data || []).map(p => ({ ...p, position: emp.position }));
}

/**
 * Fetch employees managed by a given manager employee_id.
 */
export async function fetchTeamPayrolls(managerUserId, startDate, endDate) {
    if (!isSupabaseReady || !managerUserId) return [];

    // Find the manager's employee record
    const { data: mgrEmp } = await supabase
        .from('employees')
        .select('id, entreprise_id')
        .eq('user_id', managerUserId)
        .single();

    if (!mgrEmp) {
        // Fallback: fetch all payrolls for the company (for demo/testing)
        return fetchPayrollsByPeriod(startDate, endDate);
    }

    // Fetch team members managed by this manager
    const { data: teamMembers } = await supabase
        .from('employees')
        .select('id')
        .eq('manager_id', mgrEmp.id);

    if (!teamMembers || teamMembers.length === 0) {
        // No direct reports — fetch all in the same enterprise for demo
        return fetchPayrollsByPeriod(startDate, endDate, mgrEmp.entreprise_id);
    }

    const teamIds = teamMembers.map(t => t.id);
    const { data, error } = await supabase
        .from('payrolls')
        .select(`
      *,
      employees!inner (
        id,
        user_id,
        position,
        entreprise_id,
        users!inner ( name, email )
      )
    `)
        .in('employee_id', teamIds)
        .gte('period_start', startDate)
        .lte('period_end', endDate);

    if (error) {
        console.error('fetchTeamPayrolls error:', error.message);
        return [];
    }
    return data || [];
}


// ── PDF Payslip Generator ───────────────────────────────

export function generatePayslipPDF(payroll, employeeName, companyName = 'Bidayalab') {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    let y = 20;

    // ── Header Accent Bar ──
    doc.setFillColor(42, 133, 255); // brand-500
    doc.rect(0, 0, w, 12, 'F');

    // ── Company Info ──
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.toUpperCase(), 14, y + 8);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Pay Slip / Bulletin de Paie', 14, y + 16);

    // ── Period Badge ──
    const period = periodLabel(payroll.period_start, payroll.period_end);
    doc.setFillColor(240, 245, 255);
    doc.roundedRect(w - 80, y, 66, 18, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(42, 133, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(period, w - 47, y + 11, { align: 'center' });

    y += 30;

    // ── Employee Details Box ──
    doc.setFillColor(248, 249, 252);
    doc.roundedRect(14, y, w - 28, 28, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee:', 20, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(employeeName || 'Employee', 55, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.text('Position:', 20, y + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(payroll.position || '-', 55, y + 20);

    // Dates on the right side
    doc.setFont('helvetica', 'bold');
    doc.text('Period:', w / 2 + 10, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${fmtDate(payroll.period_start)} - ${fmtDate(payroll.period_end)}`, w / 2 + 35, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', w / 2 + 10, y + 20);
    doc.setFont('helvetica', 'normal');
    const status = payroll.status || 'Generated';
    doc.text(status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(), w / 2 + 35, y + 20);

    y += 38;

    // ── Table Header ──
    const drawTableHeader = (label) => {
        doc.setFillColor(42, 133, 255);
        doc.rect(14, y, w - 28, 9, 'F');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, y + 6.5);
        y += 12;
    };

    const drawRow = (label, value, isBold = false, color = null) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.text(label, 20, y);
        if (color) doc.setTextColor(...color);
        doc.text(value, w - 20, y, { align: 'right' });
        doc.setDrawColor(230, 230, 230);
        doc.line(14, y + 3, w - 14, y + 3);
        y += 8;
    };

    // ── Earnings Section ──
    drawTableHeader('EARNINGS / RÉMUNÉRATION');
    drawRow('Base Salary / Salaire de Base', fmt(payroll.salary_base));
    if (Number(payroll.bonuses) > 0) drawRow('Bonuses / Primes', fmt(payroll.bonuses), false, [0, 150, 80]);
    if (Number(payroll.overtime_pay) > 0) drawRow(`Overtime Pay (${payroll.overtime_hours || 0}h)`, fmt(payroll.overtime_pay), false, [0, 150, 80]);
    const gross = Number(payroll.salary_base || 0) + Number(payroll.bonuses || 0) + Number(payroll.overtime_pay || 0);
    drawRow('TOTAL GROSS / TOTAL BRUT', fmt(gross), true);

    y += 4;

    // ── Deductions Section ──
    drawTableHeader('DEDUCTIONS / RETENUES');
    if (Number(payroll.deductions) > 0) drawRow('Total Deductions', '- ' + fmt(payroll.deductions), false, [200, 50, 50]);
    drawRow('TOTAL DEDUCTIONS', '- ' + fmt(payroll.deductions || 0), true, [200, 50, 50]);

    y += 6;

    // ── Net Pay Box ──
    doc.setFillColor(42, 133, 255);
    doc.roundedRect(14, y, w - 28, 16, 3, 3, 'F');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('NET PAY / SALAIRE NET', 20, y + 11);
    doc.text(fmt(payroll.net_salary), w - 20, y + 11, { align: 'right' });

    y += 28;

    // ── Footer ──
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.setFont('helvetica', 'normal');
    doc.text('This is a computer-generated payslip. No signature required.', w / 2, y, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} by Flowly BPMS`, w / 2, y + 6, { align: 'center' });

    // Save
    const filename = `Payslip_${employeeName?.replace(/\s+/g, '_') || 'Employee'}_${period.replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
}

/**
 * Generate a batch PDF with all payslips on separate pages.
 */
export function generateBatchPayslipsPDF(payrolls, companyName = 'Bidayalab') {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();

    payrolls.forEach((p, index) => {
        if (index > 0) doc.addPage();
        let y = 20;

        const empName = p.employees?.users?.name || 'Employee';
        const position = p.employees?.position || '-';

        // Header
        doc.setFillColor(42, 133, 255);
        doc.rect(0, 0, w, 12, 'F');

        doc.setFontSize(18);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName.toUpperCase(), 14, y + 8);

        const period = periodLabel(p.period_start, p.period_end);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Pay Slip — ${period}`, 14, y + 16);

        y += 30;

        // Employee Box
        doc.setFillColor(248, 249, 252);
        doc.roundedRect(14, y, w - 28, 20, 3, 3, 'F');
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.text(empName, 20, y + 9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(position, 20, y + 16);
        doc.setTextColor(42, 133, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(fmt(p.net_salary), w - 20, y + 12, { align: 'right' });

        y += 30;

        // Compact table
        const rows = [
            ['Base Salary', fmt(p.salary_base)],
            ['Bonuses', fmt(p.bonuses || 0)],
            ['Overtime', fmt(p.overtime_pay || 0)],
            ['Deductions', '- ' + fmt(p.deductions || 0)],
            ['NET PAY', fmt(p.net_salary)],
        ];

        rows.forEach(([label, val], i) => {
            const isBold = i === rows.length - 1;
            doc.setFontSize(9);
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            doc.setTextColor(isBold ? 42 : 60, isBold ? 133 : 60, isBold ? 255 : 60);
            doc.text(label, 20, y);
            doc.text(val, w - 20, y, { align: 'right' });
            if (!isBold) {
                doc.setDrawColor(230, 230, 230);
                doc.line(14, y + 3, w - 14, y + 3);
            }
            y += 8;
        });

        // Footer
        y += 10;
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${index + 1} of ${payrolls.length} — Generated by Flowly BPMS`, w / 2, y, { align: 'center' });
    });

    const period = periodLabel(payrolls[0]?.period_start);
    doc.save(`All_Payslips_${period.replace(/\s+/g, '_')}.pdf`);
}
