import ConversionForm from '@/components/conversion-form';

export default function HomePage() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              P2E
            </div>
            <span className="text-sm font-bold tracking-tight text-ink">PDF2Excel</span>
          </div>
          <span className="text-xs font-medium text-muted">Simple invoice conversion</span>
        </header>

        <section className="mx-auto max-w-3xl py-16 text-center sm:py-24">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-brand">PDF to spreadsheet</p>
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-6xl">PDF2Excel</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted">
            Turn invoice PDFs into structured Excel spreadsheets
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-8" aria-labelledby="conversion-heading">
          <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 id="conversion-heading" className="text-xl font-semibold text-ink">
                Upload your files
              </h2>
              <p className="mt-1 text-sm text-muted">Add an invoice and the Excel format you want to use.</p>
            </div>
            <span className="text-xs font-medium text-slate-400">PDF + XLSX required</span>
          </div>
          <ConversionForm />
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">No account required · No files are stored in this demo</p>
      </div>
    </main>
  );
}
