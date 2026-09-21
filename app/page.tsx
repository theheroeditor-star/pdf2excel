import ConversionForm from '@/components/conversion-form';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f9ff] text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200">P2E</div>
            <div>
              <div className="text-lg font-bold tracking-tight text-slate-900">PDF2Excel</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">invoice workflow</div>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">Pricing</a>
          </div>
        </header>

        <section className="grid items-center gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">zero manual entry</div>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">Turn supplier invoices into your spreadsheet in minutes.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Upload your invoice PDFs, match your existing Excel template, and download a clean workbook with the right values already filled in.</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#tool" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700">Try the tool</a>
              <a href="#pricing" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">View pricing</a>
            </div>

            <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-500">
              <span>✔ PDF + Excel workflow</span>
              <span>✔ AI extraction</span>
              <span>✔ No login required</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Example workflow</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs font-medium text-slate-500">Supplier invoice</div>
                  <div className="mt-1 font-semibold text-slate-800">Tru Plumbing Supply</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs font-medium text-slate-500">Template</div>
                  <div className="mt-1 font-semibold text-slate-800">Date • Supplier • SKU • Qty • Total</div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="text-xs font-medium text-emerald-700">Ready output</div>
                  <div className="mt-1 font-semibold text-emerald-900">Downloaded workbook</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-8 sm:py-12">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Built for businesses that live in spreadsheets</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { title: 'Invoice capture', text: 'Extract values from supplier PDFs and scanned invoice images.' },
              { title: 'Template matching', text: 'Map extracted values into the columns you already use in Excel.' },
              { title: 'Review before export', text: 'Correct any row before downloading the final spreadsheet.' }
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-700">✓</div>
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="py-12">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Simple, boring, useful</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            {['Upload invoices', 'Add spreadsheet template', 'Review extracted rows', 'Download workbook'].map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{index + 1}</div>
                <p className="text-lg font-semibold text-slate-900">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="tool" className="py-12">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="mb-5 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Try the tool</h2>
            </div>
            <ConversionForm />
          </div>
        </section>

        <section id="pricing" className="py-14">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Keep it simple</h2>
          </div>

          <div className="mx-auto max-w-md rounded-3xl border border-indigo-200 bg-indigo-50 p-8 text-center shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Starter</div>
            <div className="mt-4 text-5xl font-black text-slate-900">$19<span className="text-lg font-medium text-slate-500">/mo</span></div>
            <p className="mt-3 text-slate-600">For small teams who want to stop retyping supplier invoices.</p>
            <ul className="mt-6 space-y-3 text-left text-sm text-slate-700">
              <li>✔ Up to 500 invoice rows/month</li>
              <li>✔ AI extraction</li>
              <li>✔ Excel export</li>
              <li>✔ Basic review workflow</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
