import React, { useState } from 'react';
import {
    Bot, FileText, UploadCloud, CheckCircle2,
    Download, Loader2, FileCheck, FileOutput
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, ShadingType, TableRow, TableCell, Table, WidthType, Header, ImageRun } from 'docx';
import ExcelJS from 'exceljs';
import * as pdfjsLib from 'pdfjs-dist';
import PageHeader from '../../../components/ui/PageHeader';
import { openRouterService } from '../../../services/OpenRouterService';

// Set up pdfjs worker (using unpkg CDN for simplicity in this React setup)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function AIRecruitmentAssistant() {
    // Step 1 State
    const [position, setPosition] = useState('');
    const [checklist, setChecklist] = useState('');
    const [generatingChecklist, setGeneratingChecklist] = useState(false);

    // Step 3 State
    const [file, setFile] = useState(null);
    const [extractingPdf, setExtractingPdf] = useState(false);
    const [extractedText, setExtractedText] = useState('');

    // Step 4 State
    const [analyzingCandidates, setAnalyzingCandidates] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    // --- Step 1: Generate & Download Checklist ---
    const handleGenerateChecklist = async () => {
        if (!position.trim()) return;
        setGeneratingChecklist(true);
        try {
            const result = await openRouterService.generateChecklist(position);
            setChecklist(result);
        } catch (error) {
            console.error(error);
            alert('Failed to generate checklist. Please try again.');
        } finally {
            setGeneratingChecklist(false);
        }
    };

    const downloadDocx = async () => {
        if (!checklist) return;

        const lines = checklist.split('\n').filter(l => l.trim() !== '');
        const BRAND_COLOR = '4F46E5'; // Indigo
        const LIGHT_GRAY = 'F3F4F6';
        const DARK = '111827';

        const children = [];

        // ─── Title Block ───────────────────────────────────────
        children.push(new Paragraph({
            children: [
                new TextRun({ text: '  BPMS — HR Recruitment  ', bold: true, size: 28, color: 'FFFFFF', font: 'Calibri' })
            ],
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: BRAND_COLOR },
            spacing: { before: 0, after: 0 },
            border: { bottom: { style: BorderStyle.THICK, size: 6, color: BRAND_COLOR } }
        }));

        children.push(new Paragraph({
            children: [
                new TextRun({ text: `Interview Checklist — ${position}`, bold: true, size: 36, color: DARK, font: 'Calibri' })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 120 },
        }));

        children.push(new Paragraph({
            children: [
                new TextRun({ text: `Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, size: 18, color: '6B7280', font: 'Calibri', italics: true })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 400 },
        }));

        // ─── Separator ─────────────────────────────────────────
        children.push(new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR } },
            spacing: { before: 0, after: 300 },
        }));

        // ─── Parse checklist content ───────────────────────────
        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith('Candidate Name:')) {
                // Candidate name field
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: 'Candidate Name: ', bold: true, size: 24, color: BRAND_COLOR, font: 'Calibri' }),
                        new TextRun({ text: trimmed.replace('Candidate Name:', '').trim() || '__________________________________', size: 24, color: DARK, font: 'Calibri' })
                    ],
                    spacing: { before: 160, after: 300 },
                    shading: { type: ShadingType.SOLID, color: 'EEF2FF' }
                }));

            } else if (trimmed.startsWith('Checklist:')) {
                // Section header
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: '✦  EVALUATION CHECKLIST', bold: true, size: 22, color: 'FFFFFF', font: 'Calibri' })
                    ],
                    shading: { type: ShadingType.SOLID, color: BRAND_COLOR },
                    spacing: { before: 300, after: 160 },
                    alignment: AlignmentType.LEFT,
                }));

            } else if (trimmed.startsWith('[ ]') || trimmed.startsWith('☐')) {
                // Checklist row
                const itemText = trimmed.replace(/^\[\s*\]\s*|^☐\s*/, '');
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: '  ☐  ', size: 22, color: BRAND_COLOR, bold: true }),
                        new TextRun({ text: itemText, size: 22, color: DARK, font: 'Calibri' })
                    ],
                    spacing: { before: 80, after: 80 },
                    shading: { type: ShadingType.SOLID, color: LIGHT_GRAY },
                    border: { left: { style: BorderStyle.THICK, size: 8, color: BRAND_COLOR } }
                }));

            } else if (trimmed.startsWith('Questionnaire:')) {
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: '✦  DETAILED INTERVIEW QUESTIONNAIRE', bold: true, size: 22, color: 'FFFFFF', font: 'Calibri' })
                    ],
                    shading: { type: ShadingType.SOLID, color: '10B981' }, // Emerald
                    spacing: { before: 300, after: 160 },
                }));

            } else if (trimmed.match(/^Q\d+:/i)) {
                // Question row
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: '  ' + trimmed, bold: true, size: 22, color: DARK, font: 'Calibri' })
                    ],
                    spacing: { before: 120, after: 60 },
                    shading: { type: ShadingType.SOLID, color: 'F0FDF4' }, // Light emerald
                    border: { left: { style: BorderStyle.THICK, size: 8, color: '10B981' } }
                }));

            } else if (trimmed.match(/^A\d+:/i)) {
                // Answer row
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: '      ' + trimmed, size: 20, color: '4B5563', font: 'Calibri', italics: true })
                    ],
                    spacing: { before: 40, after: 120 },
                }));

            } else if (trimmed.startsWith('Remarks:')) {
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: '✦  INTERVIEWER REMARKS', bold: true, size: 22, color: 'FFFFFF', font: 'Calibri' })
                    ],
                    shading: { type: ShadingType.SOLID, color: '6366F1' },
                    spacing: { before: 300, after: 160 },
                }));
                // Remarks lines
                children.push(new Paragraph({
                    children: [new TextRun({ text: '          ', size: 22 })],
                    spacing: { before: 100, after: 100 },
                    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' } }
                }));
                children.push(new Paragraph({
                    children: [new TextRun({ text: '          ', size: 22 })],
                    spacing: { before: 200, after: 100 },
                    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' } }
                }));

            } else if (trimmed.startsWith('Score:')) {
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: '⭐  FINAL SCORE: ', bold: true, size: 26, color: BRAND_COLOR, font: 'Calibri' }),
                        new TextRun({ text: '____  / 10', bold: true, size: 26, color: DARK, font: 'Calibri' })
                    ],
                    shading: { type: ShadingType.SOLID, color: 'EEF2FF' },
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 300, after: 200 },
                    border: { top: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_COLOR } }
                }));
            }
        }

        // ─── Footer ────────────────────────────────────────────
        children.push(new Paragraph({
            children: [
                new TextRun({ text: 'Powered by BPMS AI Recruitment Assistant', size: 16, color: '9CA3AF', font: 'Calibri', italics: true })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 0 },
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB' } }
        }));

        const doc = new Document({ sections: [{ properties: {}, children }] });
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Interview_Checklist_${position.replace(/\s+/g, '_')}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const downloadExcel = async () => {
        if (!checklist) return;

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'BPMS HR Assistant';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Interview Checklist', {
            pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true }
        });

        // Column widths
        sheet.columns = [
            { key: 'status', width: 6 },
            { key: 'item', width: 60 },
            { key: 'score', width: 14 },
        ];

        // ─── Header band ──────────────────────────────────────
        sheet.mergeCells('A1:C1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = `BPMS — Interview Checklist   |   ${position}`;
        titleCell.font = { name: 'Calibri', bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 36;

        sheet.mergeCells('A2:C2');
        const dateCell = sheet.getCell('A2');
        dateCell.value = `Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`;
        dateCell.font = { name: 'Calibri', italic: true, size: 10, color: { argb: 'FF6B7280' } };
        dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
        dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(2).height = 20;

        // ─── Column Headers ───────────────────────────────────
        const headerRow = sheet.addRow(['✓', 'Criterion / Skill', 'Score (0–10)']);
        headerRow.eachCell((cell) => {
            cell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = { bottom: { style: 'medium', color: { argb: 'FF4F46E5' } } };
        });
        headerRow.height = 22;

        // ─── Parse and populate rows ──────────────────────────
        const lines = checklist.split('\n').filter(l => l.trim() !== '');
        let rowIndex = 0;
        let candidateName = '';

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith('Candidate Name:')) {
                candidateName = trimmed.replace('Candidate Name:', '').trim() || '__________________';
                // Candidate name special row
                const merge = sheet.addRow(['', `Candidate: ${candidateName}`, '']);
                sheet.mergeCells(`A${sheet.lastRow.number}:C${sheet.lastRow.number}`);
                const nc = sheet.getCell(`A${sheet.lastRow.number}`);
                nc.value = `👤  Candidate: ${candidateName}`;
                nc.font = { name: 'Calibri', bold: true, size: 12, color: { argb: 'FF4F46E5' } };
                nc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
                nc.alignment = { horizontal: 'left', vertical: 'middle' };
                sheet.lastRow.height = 24;

            } else if (trimmed.startsWith('[ ]') || trimmed.startsWith('☐')) {
                const itemText = trimmed.replace(/^\[\s*\]\s*|^☐\s*/, '');
                const dataRow = sheet.addRow(['☐', itemText, '']);
                dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
                dataRow.getCell(1).font = { name: 'Calibri', size: 14, color: { argb: 'FF4F46E5' } };
                dataRow.getCell(2).font = { name: 'Calibri', size: 11, color: { argb: 'FF111827' } };
                dataRow.getCell(2).alignment = { wrapText: true, vertical: 'middle' };
                dataRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
                dataRow.getCell(3).border = { all: { style: 'thin', color: { argb: 'FFD1D5DB' } } };

                // Alternate row shading
                const bgColor = rowIndex % 2 === 0 ? 'FFF9FAFB' : 'FFFFFFFF';
                dataRow.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                    cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
                });
                dataRow.height = 22;
                rowIndex++;

            } else if (trimmed.startsWith('Score:')) {
                // Score row
                const scoreRow = sheet.addRow(['', '⭐  FINAL SCORE', '__ / 10']);
                sheet.mergeCells(`A${sheet.lastRow.number}:B${sheet.lastRow.number}`);
                const sc = sheet.getCell(`A${sheet.lastRow.number}`);
                sc.value = '⭐  FINAL SCORE';
                sc.font = { name: 'Calibri', bold: true, size: 13, color: { argb: 'FF4F46E5' } };
                sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
                sc.alignment = { horizontal: 'center', vertical: 'middle' };
                const sc2 = sheet.getCell(`C${sheet.lastRow.number}`);
                sc2.value = '___ / 10';
                sc2.font = { name: 'Calibri', bold: true, size: 13, color: { argb: 'FF111827' } };
                sc2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
                sc2.alignment = { horizontal: 'center', vertical: 'middle' };
                sc2.border = { all: { style: 'medium', color: { argb: 'FF4F46E5' } } };
                sheet.lastRow.height = 28;

            } else if (trimmed.startsWith('Questionnaire:')) {
                const qRow = sheet.addRow(['', '✦  DETAILED INTERVIEW QUESTIONNAIRE', '']);
                sheet.mergeCells(`A${sheet.lastRow.number}:C${sheet.lastRow.number}`);
                const qc = sheet.getCell(`A${sheet.lastRow.number}`);
                qc.value = '✦  DETAILED INTERVIEW QUESTIONNAIRE';
                qc.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
                qc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
                qc.alignment = { horizontal: 'left', vertical: 'middle' };
                sheet.lastRow.height = 20;

            } else if (trimmed.match(/^Q\d+:/i)) {
                const qRow = sheet.addRow(['?', trimmed, '']);
                qRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
                qRow.getCell(1).font = { name: 'Calibri', bold: true, size: 12, color: { argb: 'FF10B981' } };
                qRow.getCell(2).font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF111827' } };
                qRow.getCell(2).alignment = { wrapText: true, vertical: 'middle' };
                qRow.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
                });
                qRow.height = 26;

            } else if (trimmed.match(/^A\d+:/i)) {
                const aRow = sheet.addRow(['', '   ' + trimmed, '']);
                sheet.mergeCells(`B${sheet.lastRow.number}:C${sheet.lastRow.number}`);
                aRow.getCell(2).font = { name: 'Calibri', italic: true, size: 10, color: { argb: 'FF4B5563' } };
                aRow.getCell(2).alignment = { wrapText: true, vertical: 'middle' };
                aRow.height = 24;

            } else if (trimmed.startsWith('Remarks:')) {
                const remRow = sheet.addRow(['', '📝  Remarks / Notes', '']);
                sheet.mergeCells(`A${sheet.lastRow.number}:C${sheet.lastRow.number}`);
                const rc = sheet.getCell(`A${sheet.lastRow.number}`);
                rc.value = '📝  Remarks / Notes';
                rc.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
                rc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
                rc.alignment = { horizontal: 'left', vertical: 'middle' };
                sheet.lastRow.height = 20;

                // 3 blank lines for remarks
                for (let i = 0; i < 3; i++) {
                    const blankRow = sheet.addRow(['', '', '']);
                    sheet.mergeCells(`A${blankRow.number}:C${blankRow.number}`);
                    blankRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
                    blankRow.getCell(1).border = { bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
                    blankRow.height = 24;
                }
            }
        }

        // ─── Footer ───────────────────────────────────────────
        const footerRow = sheet.addRow(['', 'Powered by BPMS AI Recruitment Assistant', '']);
        sheet.mergeCells(`A${footerRow.number}:C${footerRow.number}`);
        footerRow.getCell(1).value = 'Powered by BPMS AI Recruitment Assistant';
        footerRow.getCell(1).font = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF9CA3AF' } };
        footerRow.getCell(1).alignment = { horizontal: 'center' };
        footerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        footerRow.height = 18;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Interview_Checklist_${position.replace(/\s+/g, '_')}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // --- Step 3: Handle PDF Upload ---
    const handleFileUpload = async (e) => {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) return;

        const isPdf = uploadedFile.type === 'application/pdf' || uploadedFile.name.endsWith('.pdf');
        const isExcel = uploadedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || uploadedFile.name.endsWith('.xlsx');
        const isCsv = uploadedFile.type === 'text/csv' || uploadedFile.name.endsWith('.csv');

        if (!isPdf && !isExcel && !isCsv) {
            alert('Please upload a valid PDF, Excel, or CSV document.');
            return;
        }

        setFile(uploadedFile);
        setExtractingPdf(true); // Using same loading state for simplicity
        setExtractedText('');
        setAnalysisResult(null);

        try {
            if (isPdf) {
                const arrayBuffer = await uploadedFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }
                setExtractedText(fullText.trim());
            }
            else if (isExcel) {
                const workbook = new ExcelJS.Workbook();
                const arrayBuffer = await uploadedFile.arrayBuffer();
                await workbook.xlsx.load(arrayBuffer);
                let fullText = '';
                workbook.eachSheet((sheet) => {
                    sheet.eachRow((row) => {
                        // Extract row values, skipping the first empty element if present
                        const values = Array.isArray(row.values) ? row.values.filter(v => v !== undefined && v !== null).join(' ') : '';
                        fullText += values + '\n';
                    });
                    fullText += '\n';
                });
                setExtractedText(fullText.trim());
            }
            else if (isCsv) {
                const text = await uploadedFile.text();
                setExtractedText(text.trim());
            }
        } catch (error) {
            console.error('File parsing error:', error);
            alert('Failed to parse the document.');
            setFile(null);
        } finally {
            setExtractingPdf(false);
        }
    };

    // --- Step 4: AI Candidate Analysis ---
    const handleAnalyzeCandidates = async () => {
        if (!extractedText) return;
        setAnalyzingCandidates(true);
        try {
            const result = await openRouterService.analyzeCandidates(position || 'General Candidates', extractedText);
            setAnalysisResult(result);
        } catch (error) {
            console.error(error);
            alert('Failed to analyze candidates.');
        } finally {
            setAnalyzingCandidates(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <PageHeader
                title="AI Recruitment Assistant"
                subtitle="Generate intelligent interview guides and let AI select the best candidates based on your records."
                icon={Bot}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Step 1 & 2: Generate Checklist */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight">Step 1: Create Interview Guide</h2>
                            <p className="text-sm text-text-secondary">Enter a job position to generate a custom evaluation guide and Q&A.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Job Position</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    placeholder="e.g. Senior Social Media Manager..."
                                    className="flex-1 px-4 py-2.5 bg-surface-secondary border border-border-secondary rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleGenerateChecklist}
                                    disabled={!position.trim() || generatingChecklist}
                                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center min-w-[120px]"
                                >
                                    {generatingChecklist ? <Loader2 size={18} className="animate-spin" /> : 'Generate'}
                                </button>
                            </div>
                        </div>

                        {checklist && (
                            <div className="mt-6 animate-fade-in">
                                <div className="p-4 bg-surface-secondary border border-border-secondary rounded-xl font-mono text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto w-full">
                                    {checklist}
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button onClick={downloadDocx} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border-secondary rounded-xl text-sm font-medium hover:bg-surface-secondary transition-colors text-text-primary">
                                        <FileCheck size={16} className="text-blue-500" /> Download Guide (Word)
                                    </button>
                                    <button onClick={downloadExcel} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border-secondary rounded-xl text-sm font-medium hover:bg-surface-secondary transition-colors text-text-primary">
                                        <FileOutput size={16} className="text-emerald-500" /> Download Guide (Excel)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 3 & 4: Upload & AI Analysis */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                            <UploadCloud size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight">Step 2: Upload Evaluations</h2>
                            <p className="text-sm text-text-secondary">Upload your completed evaluations (PDF, Excel, or CSV) for AI analysis.</p>
                        </div>
                    </div>

                    {!file ? (
                        <label className="border-2 border-dashed border-border-secondary rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-all text-center">
                            <input type="file" accept=".pdf,.xlsx,.csv" className="hidden" onChange={handleFileUpload} />
                            <div className="w-12 h-12 bg-surface-secondary rounded-full flex items-center justify-center mb-4 text-text-secondary">
                                <UploadCloud size={24} />
                            </div>
                            <p className="text-sm font-semibold text-text-primary">Click to upload evaluation file</p>
                            <p className="text-xs text-text-tertiary mt-1">Supports PDF, Excel (.xlsx), and CSV files.</p>
                        </label>
                    ) : (
                        <div className="p-4 border border-border-secondary rounded-xl bg-surface-secondary flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                                    <FileText size={16} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-text-primary truncate max-w-[200px]">{file.name}</p>
                                    <p className="text-xs text-text-tertiary">
                                        {extractingPdf ? 'Extracting text...' : 'Ready for analysis'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setFile(null)} className="text-xs text-brand-600 font-medium hover:underline">
                                Replace
                            </button>
                        </div>
                    )}

                    {extractedText && !analysisResult && (
                        <div className="mt-6">
                            <button
                                onClick={handleAnalyzeCandidates}
                                disabled={analyzingCandidates}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-700 hover:to-brand-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                {analyzingCandidates ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
                                {analyzingCandidates ? 'AI is analyzing candidates...' : 'Select Best Candidate'}
                            </button>
                        </div>
                    )}

                    {analysisResult && (
                        <div className="mt-6 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            <div className="relative z-10">
                                <div className="flex flex-col mb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 size={18} className="text-emerald-500" />
                                        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">AI Recommendation</h3>
                                    </div>
                                </div>

                                <div className="bg-white/60 rounded-xl p-4 text-sm text-indigo-950 whitespace-pre-wrap leading-relaxed border border-white/50 shadow-sm font-medium">
                                    {analysisResult}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
