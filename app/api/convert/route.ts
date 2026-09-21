import { NextResponse } from 'next/server';
import { convertPdfFiles, getTemplateHeaders } from '@/lib/converter';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PDFS = 20;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const template = formData.get('template');
    const pdfEntries = formData.getAll('pdfs');
    const pdfs = pdfEntries.filter((entry): entry is File => entry instanceof File);
    const rules = String(formData.get('rules') ?? '').slice(0, 4000);

    if (!(template instanceof File) || pdfs.length === 0) {
      return NextResponse.json({ message: 'Upload at least one PDF and an Excel template.' }, { status: 400 });
    }

    if (pdfs.length > MAX_PDFS) {
      return NextResponse.json({ message: `Upload up to ${MAX_PDFS} PDFs at a time.` }, { status: 400 });
    }

    const files = [...pdfs, template];
    if (files.some((file) => file.size === 0)) {
      return NextResponse.json({ message: 'Uploaded files cannot be empty.' }, { status: 400 });
    }
    if (files.some((file) => file.size > MAX_FILE_SIZE)) {
      return NextResponse.json({ message: 'Each file must be smaller than 10 MB.' }, { status: 413 });
    }

    const templateBuffer = Buffer.from(await template.arrayBuffer());
    const pdfBuffers = await Promise.all(pdfs.map(async (file) => Buffer.from(await file.arrayBuffer())));
    const result = await convertPdfFiles(pdfBuffers, templateBuffer, rules);

    return NextResponse.json({ ...result, templateHeaders: getTemplateHeaders(templateBuffer) });
  } catch (error) {
    console.error('PDF2Excel conversion failed:', error);
    return NextResponse.json({ message: 'Conversion failed. Check that the PDFs contain text and the template is a valid Excel workbook.' }, { status: 500 });
  }
}
