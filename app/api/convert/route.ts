import { NextResponse } from 'next/server';
import { extractInvoice, getTemplateHeaders, populateTemplate } from '@/lib/converter';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf');
    const templateFile = formData.get('template');

    if (!(pdfFile instanceof File) || !(templateFile instanceof File)) {
      return NextResponse.json({ message: 'Upload both a PDF and an Excel template.' }, { status: 400 });
    }

    if (pdfFile.size === 0 || templateFile.size === 0) {
      return NextResponse.json({ message: 'The uploaded files cannot be empty.' }, { status: 400 });
    }

    if (pdfFile.size > MAX_FILE_SIZE || templateFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'Each file must be smaller than 10 MB.' }, { status: 413 });
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    const templateBuffer = Buffer.from(await templateFile.arrayBuffer());
    const templateHeaders = getTemplateHeaders(templateBuffer);
    const invoice = await extractInvoice(pdfBuffer, templateHeaders);
    const output = populateTemplate(templateBuffer, invoice);

    return new NextResponse(output, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="pdf2excel-result.xlsx"',
        'Cache-Control': 'no-store',
        'X-PDF2Excel-Fields': JSON.stringify(invoice),
      },
    });
  } catch (error) {
    console.error('PDF2Excel conversion failed:', error);
    return NextResponse.json(
      { message: 'Conversion failed. Check the PDF contents and ensure the template is a valid Excel workbook.' },
      { status: 500 },
    );
  }
}
