import ConversionForm from '@/components/conversion-form';

export default function HomePage() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">P2E</div><span className="text-sm font-bold tracking-tight text-ink">PDF2Excel</span></div>
          <span className="text-xs font-medium text-muted">Your spreadsheet. Filled automatically.</span>
        </header>

        <section className="mx-auto max-w-3xl py-14 text-center sm:py-20">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-brand">Invoice data entry, automated</p>
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-6xl">Stop typing invoices into Excel.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted">Upload supplier PDFs and the spreadsheet you already maintain. PDF2Excel extracts the data, applies your rules, and gives you a ready-to-send workbook.</p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-8" aria-labelledby="conversion-heading">
          <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 id="conversion-heading" className="text-xl font-semibold text-ink">Build your spreadsheet</h2><p className="mt-1 text-sm text-muted">Upload invoices, add your template, and review the extracted rows.</p></div><span className="text-xs font-medium text-slate-400">AI-powered · no account required</span></div>
          <ConversionForm />
        </section>

        <div className="grid gap-4 py-10 text-center text-sm text-muted sm:grid-cols-3"><div><p className="font-semibold text-ink">1. Upload</p><p className="mt-1">Your invoices and existing Excel layout.</p></div><div><p className="font-semibold text-ink">2. Review</p><p className="mt-1">Correct any values before exporting.</p></div><div><p className="font-semibold text-ink">3. Send</p><p className="mt-1">Download the completed workbook.</p></div></div>
        <p className="text-center text-xs text-slate-400">Files are processed in memory and are not stored by this application.</p>
      </div>
    </main>
  );
}
