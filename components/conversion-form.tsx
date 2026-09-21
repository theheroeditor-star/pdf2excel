'use client';

import { useEffect, useState } from 'react';

type FileUploadCardProps = {
  label: string;
  description: string;
  accept: string;
  files: File[];
  multiple?: boolean;
  onChange: (files: File[]) => void;
  icon: string;
};

type ConversionResponse = {
  headers: string[];
  rows: Record<string, string>[];
  warnings: string[];
  usedAi: boolean;
};

function FileUploadCard({ label, description, accept, files, multiple, onChange, icon }: FileUploadCardProps) {
  return (
    <label className="group flex min-h-52 cursor-pointer flex-col justify-between rounded-2xl border border-dashed border-slate-300 bg-white p-5 transition hover:border-brand hover:bg-indigo-50/40">
      <div className="flex items-start justify-between gap-4">
        <div><p className="mb-1 text-sm font-semibold text-ink">{label}</p><p className="text-sm leading-6 text-muted">{description}</p></div>
        <span className="rounded-xl bg-indigo-50 px-3 py-2 text-xl" aria-hidden="true">{icon}</span>
      </div>
      <div className="mt-6">
        <input className="w-full text-sm text-muted file:cursor-pointer" type="file" accept={accept} multiple={multiple} onChange={(event) => onChange(Array.from(event.target.files ?? []))} />
        <p className="mt-3 truncate text-xs text-slate-500">{files.length ? `${files.length} file${files.length === 1 ? '' : 's'} selected` : 'No file selected'}</p>
      </div>
    </label>
  );
}

export default function ConversionForm() {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [templateFiles, setTemplateFiles] = useState<File[]>([]);
  const [rules, setRules] = useState('');
  const [result, setResult] = useState<ConversionResponse | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);

  function updateCell(rowIndex: number, header: string, value: string) {
    setResult((current) => current ? { ...current, rows: current.rows.map((row, index) => index === rowIndex ? { ...row, [header]: value } : row) } : current);
  }

  async function handleConvert() {
    if (!pdfFiles.length || !templateFiles[0]) { setError('Select at least one PDF and one Excel template.'); return; }
    setError(null); setResult(null); setDownloadUrl(null); setIsProcessing(true);
    try {
      const formData = new FormData();
      pdfFiles.forEach((file) => formData.append('pdfs', file));
      formData.append('template', templateFiles[0]);
      formData.append('rules', rules);
      const response = await fetch('/api/convert', { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? 'Conversion failed.');
      setResult(payload as ConversionResponse);
    } catch (conversionError) {
      setError(conversionError instanceof Error ? conversionError.message : 'Conversion failed.');
    } finally { setIsProcessing(false); }
  }

  async function handleExport() {
    if (!result || !templateFiles[0]) return;
    setError(null); setIsExporting(true);
    try {
      const formData = new FormData();
      formData.append('template', templateFiles[0]);
      formData.append('headers', JSON.stringify(result.headers));
      formData.append('rows', JSON.stringify(result.rows));
      const response = await fetch('/api/export', { method: 'POST', body: formData });
      if (!response.ok) { const payload = await response.json().catch(() => null); throw new Error(payload?.message ?? 'Export failed.'); }
      const blob = await response.blob();
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Export failed.');
    } finally { setIsExporting(false); }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <FileUploadCard label="Invoice PDFs" description="Upload one or more supplier invoices." accept="application/pdf" files={pdfFiles} multiple onChange={setPdfFiles} icon="📄" />
        <FileUploadCard label="Your spreadsheet" description="Upload the Excel layout you already use." accept=".xlsx,.xls" files={templateFiles} onChange={setTemplateFiles} icon="📊" />
      </div>

      <label className="block"><span className="mb-2 block text-sm font-semibold text-ink">Rules for this spreadsheet <span className="font-normal text-muted">(optional)</span></span><textarea value={rules} onChange={(event) => setRules(event.target.value)} placeholder="Example: use the supplier SKU, format dates as YYYY-MM-DD, and leave Job # blank if missing." className="min-h-24 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-indigo-100" /></label>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}

      <button type="button" onClick={handleConvert} disabled={isProcessing} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70">
        {isProcessing ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Reading invoices...</> : 'Extract and review'}
      </button>

      {result ? <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4" aria-labelledby="review-heading">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h3 id="review-heading" className="font-semibold text-ink">Review extracted rows</h3><p className="mt-1 text-xs text-muted">Click any cell to correct it before export.</p></div><span className="text-xs font-medium text-slate-500">{result.rows.length} invoice{result.rows.length === 1 ? '' : 's'} · {result.usedAi ? 'AI extraction' : 'fallback extraction'}</span></div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="min-w-full text-left text-xs"><thead className="bg-slate-100"><tr>{result.headers.map((header) => <th key={header} className="whitespace-nowrap px-3 py-3 font-semibold text-slate-600">{header}</th>)}</tr></thead><tbody>{result.rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t border-slate-100">{result.headers.map((header) => <td key={header} className="min-w-32 px-2 py-2"><input value={row[header] ?? ''} onChange={(event) => updateCell(rowIndex, header, event.target.value)} className="w-full rounded-md border border-transparent px-2 py-1.5 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-indigo-100" /></td>)}</tr>)}</tbody></table></div>
        {result.warnings.length ? <div className="mt-3 space-y-1 text-xs text-amber-700">{result.warnings.map((warning) => <p key={warning}>• {warning}</p>)}</div> : null}
        <button type="button" onClick={handleExport} disabled={isExporting} className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-70">{isExporting ? 'Creating Excel file...' : 'Download completed Excel'}</button>
      </section> : null}

      {downloadUrl ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="status"><p className="font-semibold text-emerald-900">Your spreadsheet is ready.</p><a href={downloadUrl} download="pdf2excel-result.xlsx" className="mt-3 inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Download again</a></div> : null}
    </div>
  );
}
