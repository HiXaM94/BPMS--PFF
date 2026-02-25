import { useState } from 'react';
import { 
  Upload, Download, FileText, CheckCircle2, AlertCircle, 
  Loader2, X, FileSpreadsheet, FileJson, File
} from 'lucide-react';
import { fileUploadService } from '../../services/FileUploadService';
import { auditService } from '../../services/AuditService';
import { cacheService } from '../../services/CacheService';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DocumentImportExport({ 
  entityType = 'documents',
  data = [],
  onImportComplete,
  onExportComplete 
}) {
  const { t } = useLanguage();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  const handleExport = async (format) => {
    setExporting(true);
    setError(null);

    try {
      const filename = `${entityType}_export_${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        fileUploadService.exportToCSV(data, filename);
      } else if (format === 'json') {
        fileUploadService.exportToJSON(data, filename);
      }

      // Log audit trail
      await auditService.logDataExport(entityType, data.length, format);

      if (onExportComplete) {
        onExportComplete(format, data.length);
      }
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      let importedData = [];

      if (file.name.endsWith('.csv')) {
        importedData = await fileUploadService.importFromCSV(file);
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        importedData = JSON.parse(text);
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON.');
      }

      // Validate imported data
      if (!Array.isArray(importedData) || importedData.length === 0) {
        throw new Error('No valid data found in file');
      }

      setImportResult({
        success: true,
        recordCount: importedData.length,
        data: importedData
      });

      // Log audit trail
      await auditService.logDataImport(entityType, importedData.length);

      cacheService.invalidatePattern('^documents:');
      if (onImportComplete) {
        onImportComplete(importedData);
      }
    } catch (err) {
      setError(err.message || 'Import failed');
      setImportResult({ success: false, error: err.message });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Create a template with sample data
    const template = [
      {
        // Add template fields based on entity type
        name: 'Sample Name',
        email: 'sample@example.com',
        status: 'active',
        // Add more fields as needed
      }
    ];

    fileUploadService.exportToCSV(template, `${entityType}_template`);
  };

  return (
    <div className="space-y-4">
      {/* Export Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Download className="text-brand-600" size={20} />
            <h3 className="font-semibold text-gray-900">{t('common.export')} Data</h3>
          </div>
          <span className="text-sm text-gray-600">{data.length} records</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting || data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={18} />
            )}
            {t('common.export')} CSV
          </button>

          <button
            onClick={() => handleExport('json')}
            disabled={exporting || data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileJson size={18} />
            )}
            {t('common.export')} JSON
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="text-brand-600" size={20} />
          <h3 className="font-semibold text-gray-900">{t('common.import')} Data</h3>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors cursor-pointer">
              {importing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Choose File
                </>
              )}
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleImport}
                disabled={importing}
                className="hidden"
              />
            </label>

            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
            >
              <File size={18} />
              Download Template
            </button>
          </div>

          <p className="text-sm text-gray-600">
            Supported formats: CSV, JSON • Max file size: 10MB
          </p>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`rounded-lg border p-4 ${
          importResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {importResult.success ? (
              <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
            ) : (
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            )}
            <div className="flex-1">
              <p className={`font-medium ${
                importResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {importResult.success 
                  ? `Successfully imported ${importResult.recordCount} records`
                  : 'Import failed'
                }
              </p>
              {importResult.error && (
                <p className="text-sm text-red-700 mt-1">{importResult.error}</p>
              )}
            </div>
            <button
              onClick={() => setImportResult(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
