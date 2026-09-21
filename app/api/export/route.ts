import { NextResponse } from 'next/server';
import { populateTemplate, type InvoiceRow } from '@/lib/converter';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const template = formData.get('template');
    const headers = JSON.parse(String(formData.get('headers') ?? '[]')) as string[];
    const rows = JSON.parse(String(formData.get('rows') ?? '[]')) as InvoiceRow[];

    if (!(template instanceof File) || template.size === 0 || template.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'Upload a valid Excel template.' }, { status: 400 });
    }
    if (!Array.isArray(headers) || !Array.isArray(rows) || headers.length === 0) {
      return NextResponse.json({ message: 'There is no spreadsheet data to export.' }, { status: 400 });
    }

    const output = populateTemplate(Buffer.from(await template.arrayBuffer()), headers, rows);
    return new NextResponse(output, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="pdf2excel-result.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF2Excel export failed:', error);
    return NextResponse.json({ message: 'Unable to create the Excel file.' }, { status: 500 });
  }
}
