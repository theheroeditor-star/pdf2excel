'use client';

import { useEffect, useState } from 'react';

type FileUploadCardProps = {
  label: string;
  description: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  icon: string;
};

function FileUploadCard({ label, description, accept, file, onChange, icon }: FileUploadCardProps) {
  return (
    <label className="group flex min-h-52 cursor-pointer flex-col justify-between rounded-2xl border border-dashed border-slate-300 bg-white p-5 transition hover:border-brand hover:bg-indigo-50/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold text-ink">{label}</p>
          <p className="text-sm leading-6 text-muted">{description}</p>
        </div>
        <span className="rounded-xl bg-indigo-50 px-3 py-2 text-xl" aria-hidden="true">{icon}</span>
      </div>
      <div className="mt-6">
        <input
          className="w-full text-sm text-muted file:cursor-pointer"
          type="file"
          accept={accept}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
        <p className="mt-3 truncate text-xs text-slate-500">{file ? `Selected: ${file.name}` : 'No file selected'}</p>
      </div>
    </label>
  );
}

export default function ConversionForm() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  async function handleConvert() {
    if (!pdfFile || !templateFile) {
      setError('Please select both an invoice PDF and an Excel template.');
      return;
    }

    setError(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('template', templateFile);

      const response = await fetch('/api/convert', { method: 'POST', body: formData });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Conversion failed.');
      }

      const outputBlob = await response.blob();
      setDownloadUrl(URL.createObjectURL(outputBlob));
    } catch (conversionError) {
      setError(conversionError instanceof Error ? conversionError.message : 'Conversion failed.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <FileUploadCard label="Invoice PDF" description="Upload a text-based invoice PDF." accept="application/pdf" file={pdfFile} onChange={setPdfFile} icon="📄" />
        <FileUploadCard label="Excel template" description="Choose the spreadsheet layout to populate." accept=".xlsx,.xls" file={templateFile} onChange={setTemplateFile} icon="📊" />
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}

      <button type="button" onClick={handleConvert} disabled={isProcessing} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70">
        {isProcessing ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Processing invoice...</> : 'Convert to Excel'}
      </button>

      {downloadUrl ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="status">
          <p className="font-semibold text-emerald-900">Your Excel file is ready.</p>
          <p className="mt-1 text-sm text-emerald-800">The server extracted common invoice fields and populated the template.</p>
          <a href={downloadUrl} download="pdf2excel-result.xlsx" className="mt-4 inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800">Download Excel file</a>
        </div>
      ) : null}
    </div>
  );
}
