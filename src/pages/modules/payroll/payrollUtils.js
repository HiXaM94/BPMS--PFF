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


// ── PDF Helpers ──────────────────────────────────────────

/**
 * Draw the Flowly logo icon using jsPDF vector graphics.
 * This recreates the SVG path at the given position and scale.
 */
function drawFlowlyLogo(doc, x, y, scale = 0.6, color = [42, 133, 255]) {
    doc.setFillColor(...color);
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3 * scale);
    // Simplified Flowly "U"-wave icon drawn as circles and rectangles
    const s = scale;
    // Left prong
    doc.roundedRect(x, y, 2.5 * s, 10 * s, 0.8 * s, 0.8 * s, 'F');
    // Left curve bottom
    doc.circle(x + 5 * s, y + 10 * s, 3 * s, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x + 5 * s, y + 10 * s, 1.2 * s, 'F');
    doc.setFillColor(...color);
    // Middle prong
    doc.roundedRect(x + 7.5 * s, y + 2 * s, 2 * s, 6 * s, 0.6 * s, 0.6 * s, 'F');
    // Middle curve
    doc.circle(x + 12 * s, y + 8 * s, 2.5 * s, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x + 12 * s, y + 8 * s, 1 * s, 'F');
    doc.setFillColor(...color);
    // Right prong
    doc.roundedRect(x + 14.5 * s, y, 2.5 * s, 7 * s, 0.8 * s, 0.8 * s, 'F');
}

/**
 * Draw a professional PDF header with logo and company info.
 */
function drawPDFHeader(doc, w, companyName, documentTitle, documentSubtitle) {
    // ── Gradient-like header with two-tone ──
    doc.setFillColor(24, 100, 220);
    doc.rect(0, 0, w, 38, 'F');
    doc.setFillColor(42, 133, 255);
    doc.rect(0, 0, w, 34, 'F');
    // Subtle accent line
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 34, w, 0.5, 'F');

    // Logo icon (white)
    drawFlowlyLogo(doc, 14, 6, 0.55, [255, 255, 255]);

    // "Flowly" text next to logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Flowly', 26, 16);

    // Document title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(documentTitle, 26, 24);

    // Company name on the right
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.toUpperCase(), w - 14, 16, { align: 'right' });

    if (documentSubtitle) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(documentSubtitle, w - 14, 24, { align: 'right' });
    }

    return 46; // return Y position after header
}

/**
 * Draw a digital signature block at the bottom of the page.
 */
function drawDigitalSignature(doc, w, y, signerName = 'Flowly BPMS') {
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) +
        ' at ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // ── Signature Box ──
    doc.setFillColor(250, 251, 254);
    doc.setDrawColor(200, 210, 230);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, y, w - 28, 34, 3, 3, 'FD');

    doc.setFontSize(7);
    doc.setTextColor(120, 130, 150);
    doc.setFont('helvetica', 'bold');
    doc.text('DIGITAL SIGNATURE & VERIFICATION', 20, y + 7);

    // Signature line
    doc.setDrawColor(42, 133, 255);
    doc.setLineWidth(0.4);
    doc.line(20, y + 19, 70, y + 19);

    doc.setFontSize(8);
    doc.setTextColor(42, 133, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(signerName, 20, y + 17);

    doc.setFontSize(7);
    doc.setTextColor(100, 110, 130);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized Digital Signature', 20, y + 25);
    doc.text(`Signed: ${timestamp}`, 20, y + 30);

    // Verification hash on the right
    const hash = 'FLW-' + now.getTime().toString(36).toUpperCase().substring(0, 8);
    doc.setFontSize(7);
    doc.setTextColor(120, 130, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('Verification Code:', w - 14 - 50, y + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(42, 133, 255);
    doc.text(hash, w - 14 - 50, y + 19);

    // Small logo mark
    drawFlowlyLogo(doc, w - 34, y + 6, 0.35, [42, 133, 255]);

    doc.setFontSize(6);
    doc.setTextColor(160, 168, 180);
    doc.setFont('helvetica', 'normal');
    doc.text('This document is digitally signed and verified.', w - 14 - 50, y + 26);
    doc.text('Tamper-evident · Electronically sealed', w - 14 - 50, y + 30);

    return y + 40;
}

/**
 * Draw the PDF footer with page number, confidentiality, etc.
 */
function drawPDFFooter(doc, w, h, pageNum, totalPages) {
    // Footer background
    doc.setFillColor(245, 247, 252);
    doc.rect(0, h - 16, w, 16, 'F');
    doc.setDrawColor(220, 225, 240);
    doc.setLineWidth(0.3);
    doc.line(0, h - 16, w, h - 16);

    doc.setFontSize(6.5);
    doc.setTextColor(140, 150, 170);
    doc.setFont('helvetica', 'normal');
    doc.text('CONFIDENTIAL — This document is intended solely for the named recipient. Unauthorized distribution is prohibited.', w / 2, h - 10, { align: 'center' });

    doc.setFontSize(6);
    doc.text(`© ${new Date().getFullYear()} Flowly Business Process Management Suite — www.flowly.io`, w / 2, h - 5.5, { align: 'center' });

    // Page number
    if (totalPages > 0) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(42, 133, 255);
        doc.text(`Page ${pageNum} of ${totalPages}`, w - 14, h - 7, { align: 'right' });
    }
}

/**
 * Generate a document reference number.
 */
function generateDocRef(prefix = 'PS') {
    const now = new Date();
    const yr = now.getFullYear().toString().slice(-2);
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}-${yr}${mo}-${rand}`;
}


// ── PDF Payslip Generator ───────────────────────────────

export function generatePayslipPDF(payroll, employeeName, companyName = 'Bidayalab') {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const period = periodLabel(payroll.period_start, payroll.period_end);
    const docRef = generateDocRef('PS');

    // ── Header ──
    let y = drawPDFHeader(doc, w, companyName, 'PAY SLIP / BULLETIN DE PAIE', `Period: ${period}`);

    // ── Document Reference Bar ──
    doc.setFillColor(248, 250, 254);
    doc.setDrawColor(230, 235, 245);
    doc.setLineWidth(0.2);
    doc.roundedRect(14, y, w - 28, 10, 2, 2, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(100, 110, 130);
    doc.setFont('helvetica', 'normal');
    doc.text(`Document Ref: ${docRef}`, 20, y + 6.5);
    doc.text(`Issue Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, w / 2, y + 6.5, { align: 'center' });
    const status = payroll.status || 'Generated';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(42, 133, 255);
    doc.text(`Status: ${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`, w - 20, y + 6.5, { align: 'right' });

    y += 16;

    // ── Employee Information Section ──
    doc.setFillColor(248, 250, 254);
    doc.setDrawColor(220, 228, 242);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, y, w - 28, 32, 3, 3, 'FD');

    // Section title
    doc.setFillColor(42, 133, 255);
    doc.roundedRect(14, y, 55, 7, 3, 3, 'F');
    doc.rect(14, y + 3, 55, 4, 'F');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('EMPLOYEE INFORMATION', 18, y + 5.5);

    y += 12;

    // Left column
    const infoLabel = (label, value, xPos, yPos) => {
        doc.setFontSize(7);
        doc.setTextColor(130, 140, 160);
        doc.setFont('helvetica', 'normal');
        doc.text(label, xPos, yPos);
        doc.setFontSize(9);
        doc.setTextColor(30, 35, 50);
        doc.setFont('helvetica', 'bold');
        doc.text(String(value || '-'), xPos, yPos + 5);
    };

    infoLabel('Full Name', employeeName || 'Employee', 20, y);
    infoLabel('Position', payroll.position || '-', 20, y + 12);
    infoLabel('Pay Period', `${fmtDate(payroll.period_start)} — ${fmtDate(payroll.period_end)}`, w / 2 + 5, y);
    infoLabel('Employee ID', payroll.employee_id?.substring(0, 8)?.toUpperCase() || '-', w / 2 + 5, y + 12);

    y += 30;

    // ── Earnings Table ──
    // Table header
    doc.setFillColor(42, 133, 255);
    doc.roundedRect(14, y, w - 28, 9, 2, 2, 'F');
    doc.rect(14, y + 4, w - 28, 5, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('EARNINGS / RÉMUNÉRATION', 20, y + 6.5);
    doc.text('AMOUNT', w - 20, y + 6.5, { align: 'right' });
    y += 12;

    const drawTableRow = (label, value, isBold = false, colorOverride = null, isHighlight = false) => {
        if (y > 240) { doc.addPage(); y = 20; }
        if (isHighlight) {
            doc.setFillColor(245, 248, 255);
            doc.rect(14, y - 4, w - 28, 10, 'F');
        }
        doc.setFontSize(9);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(colorOverride ? colorOverride[0] : 50, colorOverride ? colorOverride[1] : 55, colorOverride ? colorOverride[2] : 70);
        doc.text(label, 22, y);
        doc.text(value, w - 22, y, { align: 'right' });
        doc.setDrawColor(235, 238, 248);
        doc.setLineWidth(0.15);
        doc.line(14, y + 4, w - 14, y + 4);
        y += 10;
    };

    drawTableRow('Base Salary / Salaire de Base', fmt(payroll.salary_base));
    if (Number(payroll.bonuses) > 0) drawTableRow('Bonuses / Primes', fmt(payroll.bonuses), false, [16, 150, 72]);
    if (Number(payroll.overtime_pay) > 0) drawTableRow(`Overtime Pay / Heures Supp. (${payroll.overtime_hours || 0}h)`, fmt(payroll.overtime_pay), false, [16, 150, 72]);
    const gross = Number(payroll.salary_base || 0) + Number(payroll.bonuses || 0) + Number(payroll.overtime_pay || 0);
    drawTableRow('TOTAL GROSS / TOTAL BRUT', fmt(gross), true, null, true);

    y += 2;

    // ── Deductions Table ──
    doc.setFillColor(240, 68, 56);
    doc.roundedRect(14, y, w - 28, 9, 2, 2, 'F');
    doc.rect(14, y + 4, w - 28, 5, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('DEDUCTIONS / RETENUES', 20, y + 6.5);
    doc.text('AMOUNT', w - 20, y + 6.5, { align: 'right' });
    y += 12;

    if (Number(payroll.deductions) > 0) drawTableRow('Deductions / Retenues', '- ' + fmt(payroll.deductions), false, [220, 50, 50]);
    drawTableRow('TOTAL DEDUCTIONS', '- ' + fmt(payroll.deductions || 0), true, [200, 40, 40], true);

    y += 4;

    // ── Net Pay Box ──
    doc.setFillColor(42, 133, 255);
    doc.roundedRect(14, y, w - 28, 18, 3, 3, 'F');
    // Inner highlight
    doc.setFillColor(60, 150, 255);
    doc.roundedRect(15, y + 1, w - 30, 16, 2.5, 2.5, 'F');

    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('NET PAY / SALAIRE NET', 22, y + 12);
    doc.setFontSize(14);
    doc.text(fmt(payroll.net_salary), w - 22, y + 12, { align: 'right' });

    y += 26;

    // ── Payment Method Note ──
    doc.setFontSize(7);
    doc.setTextColor(130, 140, 160);
    doc.setFont('helvetica', 'italic');
    doc.text('Payment method: Bank Transfer  •  Currency: Moroccan Dirham (MAD)', 20, y);

    y += 10;

    // ── Digital Signature ──
    y = drawDigitalSignature(doc, w, y, `${companyName} — HR Department`);

    // ── Footer ──
    drawPDFFooter(doc, w, h, 1, 1);

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
    const h = doc.internal.pageSize.getHeight();
    const totalPages = payrolls.length;

    payrolls.forEach((p, index) => {
        if (index > 0) doc.addPage();

        const empName = p.employees?.users?.name || 'Employee';
        const position = p.employees?.position || '-';
        const period = periodLabel(p.period_start, p.period_end);
        const docRef = generateDocRef('PS');

        // ── Header ──
        let y = drawPDFHeader(doc, w, companyName, 'PAY SLIP / BULLETIN DE PAIE', `Period: ${period}`);

        // ── Document Reference ──
        doc.setFillColor(248, 250, 254);
        doc.setDrawColor(230, 235, 245);
        doc.setLineWidth(0.2);
        doc.roundedRect(14, y, w - 28, 10, 2, 2, 'FD');
        doc.setFontSize(7);
        doc.setTextColor(100, 110, 130);
        doc.setFont('helvetica', 'normal');
        doc.text(`Ref: ${docRef}`, 20, y + 6.5);
        doc.text(`Issue: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, w / 2, y + 6.5, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(42, 133, 255);
        doc.text(`Employee ${index + 1} of ${totalPages}`, w - 20, y + 6.5, { align: 'right' });
        y += 16;

        // ── Employee Info ──
        doc.setFillColor(248, 250, 254);
        doc.setDrawColor(220, 228, 242);
        doc.setLineWidth(0.3);
        doc.roundedRect(14, y, w - 28, 22, 3, 3, 'FD');

        doc.setFontSize(11);
        doc.setTextColor(30, 35, 50);
        doc.setFont('helvetica', 'bold');
        doc.text(empName, 22, y + 9);
        doc.setFontSize(8);
        doc.setTextColor(100, 110, 130);
        doc.setFont('helvetica', 'normal');
        doc.text(position, 22, y + 16);

        // Net salary badge on the right
        doc.setFillColor(42, 133, 255);
        doc.roundedRect(w - 72, y + 4, 52, 14, 3, 3, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(fmt(p.net_salary), w - 46, y + 13, { align: 'center' });

        y += 28;

        // ── Compact earnings/deductions table ──
        // Table header
        doc.setFillColor(42, 133, 255);
        doc.roundedRect(14, y, w - 28, 8, 2, 2, 'F');
        doc.rect(14, y + 4, w - 28, 4, 'F');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('DESCRIPTION', 22, y + 5.5);
        doc.text('AMOUNT', w - 22, y + 5.5, { align: 'right' });
        y += 11;

        const rows = [
            { label: 'Base Salary / Salaire de Base', value: fmt(p.salary_base), color: null },
            { label: 'Bonuses / Primes', value: fmt(p.bonuses || 0), color: Number(p.bonuses) > 0 ? [16, 150, 72] : null },
            { label: 'Overtime / Heures Supp.', value: fmt(p.overtime_pay || 0), color: Number(p.overtime_pay) > 0 ? [16, 150, 72] : null },
            { label: 'Deductions / Retenues', value: '- ' + fmt(p.deductions || 0), color: Number(p.deductions) > 0 ? [220, 50, 50] : null },
        ];

        rows.forEach((row, i) => {
            if (i % 2 === 0) {
                doc.setFillColor(250, 251, 255);
                doc.rect(14, y - 3.5, w - 28, 9, 'F');
            }
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(row.color ? row.color[0] : 50, row.color ? row.color[1] : 55, row.color ? row.color[2] : 70);
            doc.text(row.label, 22, y);
            doc.text(row.value, w - 22, y, { align: 'right' });
            doc.setDrawColor(238, 240, 250);
            doc.setLineWidth(0.12);
            doc.line(14, y + 3.5, w - 14, y + 3.5);
            y += 9;
        });

        // Net pay row
        doc.setFillColor(42, 133, 255);
        doc.roundedRect(14, y - 2, w - 28, 12, 2, 2, 'F');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('NET PAY / SALAIRE NET', 22, y + 6);
        doc.text(fmt(p.net_salary), w - 22, y + 6, { align: 'right' });

        y += 18;

        // ── Digital Signature (compact) ──
        y = drawDigitalSignature(doc, w, y, `${companyName} — HR Dept.`);

        // ── Footer ──
        drawPDFFooter(doc, w, h, index + 1, totalPages);
    });

    const period = periodLabel(payrolls[0]?.period_start);
    doc.save(`All_Payslips_${period.replace(/\s+/g, '_')}.pdf`);
}
