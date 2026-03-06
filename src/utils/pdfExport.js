import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a PDF for attendance records
 * @param {Object} options 
 * @param {string} options.userName - Name of the employee
 * @param {string} options.title - Document title (e.g., "Attendance History")
 * @param {string} options.period - The month/year (e.g., "March 2026")
 * @param {Array} options.data - Array of attendance records
 */
export const exportAttendancePDF = ({ userName, title, period, data }) => {
    const doc = new jsPDF();
    const now = new Date();

    // Header styling
    doc.setFillColor(59, 130, 246); // Brand color
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), 105, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Employee: ${userName}  |  Period: ${period}`, 105, 28, { align: 'center' });
    doc.text('Official Attendance Report — Flowly Business Suite', 105, 34, { align: 'center' });

    // Body
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    let y = 55;

    // Table Headers
    doc.setFillColor(245, 245, 250);
    doc.rect(15, y - 5, 180, 10, 'F');
    doc.text('Date', 20, y);
    doc.text('In', 60, y);
    doc.text('Out', 95, y);
    doc.text('Hours', 130, y);
    doc.text('Status', 165, y);

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Rows
    data.forEach((row, index) => {
        // Alternating row background
        if (index % 2 === 0) {
            doc.setFillColor(252, 252, 254);
            doc.rect(15, y - 5, 180, 10, 'F');
        }

        const dateStr = new Date(row.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const checkIn = row.check_in_time ? row.check_in_time.substring(0, 5) : '—';
        const checkOut = row.check_out_time ? row.check_out_time.substring(0, 5) : '—';
        const hours = row.hours_worked ? `${row.hours_worked}h` : '—';
        const status = row.status ? row.status.toUpperCase() : 'ABSENT';

        doc.text(dateStr, 20, y);
        doc.text(checkIn, 60, y);
        doc.text(checkOut, 95, y);
        doc.text(hours, 130, y);

        // Status color coding (approximate)
        if (status === 'LATE') doc.setTextColor(245, 158, 11);
        else if (status === 'PRESENT') doc.setTextColor(16, 185, 129);
        else doc.setTextColor(239, 68, 68);

        doc.text(status, 165, y);
        doc.setTextColor(30, 30, 30); // Reset color

        y += 10;

        // New page if needed
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    // Footer
    doc.setDrawColor(230, 230, 230);
    doc.line(15, 275, 195, 275);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    const footerY = 282;
    doc.text(`Generated on: ${now.toLocaleString()}`, 20, footerY);
    doc.text('Confidential Document', 105, footerY, { align: 'center' });
    doc.text(`Page 1`, 190, footerY, { align: 'right' });

    doc.save(`Attendance_${userName.replace(' ', '_')}_${period.replace(' ', '_')}.pdf`);
};
