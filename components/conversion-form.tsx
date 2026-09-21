'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

type FileUploadCardProps = {
  label: string;
  description: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  icon: string;
};

function FileUploadCard({
  label,
  description,
  accept,
  file,
  onChange,
  icon,
}: FileUploadCardProps) {
  return (
    <label className="group flex min-h-52 cursor-pointer flex-col justify-between rounded-2xl border border-dashed border-slate-300 bg-white p-5 transition hover:border-brand hover:bg-indigo-50/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold text-ink">{label}</p>
          <p className="text-sm leading-6 text-muted">{description}</p>
        </div>
        <span className="rounded-xl bg-indigo-50 px-3 py-2 text-xl" aria-hidden="true">
          {icon}
        </span>
      </div>

      <div className="mt-6">
        <input
          className="w-full text-sm text-muted file:cursor-pointer"
          type="file"
          accept={accept}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
        <p className="mt-3 truncate text-xs text-slate-500">
          {file ? `Selected: ${file.name}` : 'No file selected'}
        </p>
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

  function createSampleWorkbook() {
    const rows = [
      {
        Invoice: 'INV-1001',
        Customer: 'Sample Customer',
        Date: new Date().toISOString().slice(0, 10),
        Description: 'Sample invoice item',
        Amount: 1250,
      },
    ];
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  }

  function handleConvert() {
    if (!pdfFile || !templateFile) {
      setError('Please select both an invoice PDF and an Excel template.');
      return;
    }

    setError(null);
    setDownloadUrl(null);
    setIsProcessing(true);

    window.setTimeout(() => {
      const workbook = createSampleWorkbook();
      const blob = new Blob([workbook], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      setDownloadUrl(URL.createObjectURL(blob));
      setIsProcessing(false);
    }, 1200);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <FileUploadCard
          label="Invoice PDF"
          description="Upload the PDF containing the invoice details."
          accept="application/pdf"
          file={pdfFile}
          onChange={setPdfFile}
          icon="📄"
        />
        <FileUploadCard
          label="Excel template"
          description="Choose the spreadsheet layout to use."
          accept=".xlsx,.xls"
          file={templateFile}
          onChange={setTemplateFile}
          icon="📊"
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleConvert}
        disabled={isProcessing}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isProcessing ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Preparing your spreadsheet...
          </>
        ) : (
          'Convert to Excel'
        )}
      </button>

      {downloadUrl ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="status">
          <p className="font-semibold text-emerald-900">Your Excel file is ready.</p>
          <p className="mt-1 text-sm text-emerald-800">
            This first version creates a sample workbook from your uploaded files.
          </p>
          <a
            href={downloadUrl}
            download="pdf2excel-sample.xlsx"
            className="mt-4 inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Download Excel file
          </a>
        </div>
      ) : null}
    </div>
  );
}
