import * as XLSX from 'xlsx';
import pdfParse from 'pdf-parse';

export type ExtractedInvoice = {
  invoiceNumber: string;
  customer: string;
  invoiceDate: string;
  dueDate: string;
  total: string;
};

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function findValue(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return '';
}

function formatMoney(value: string) {
  const numericValue = value.replace(/[^0-9.-]/g, '');
  if (!numericValue) return '';

  const amount = Number(numericValue);
  return Number.isFinite(amount) ? amount.toFixed(2) : value;
}

export async function extractInvoice(pdfBuffer: Buffer): Promise<ExtractedInvoice> {
  const parsedPdf = await pdfParse(pdfBuffer);
  const text = clean(parsedPdf.text || '');

  return {
    invoiceNumber: findValue(text, [
      /invoice\s*(?:number|no\.?|#)?\s*[:#-]\s*([A-Z0-9][A-Z0-9-]*)/i,
      /invoice\s+([A-Z0-9][A-Z0-9-]*)/i,
    ]),
    customer: findValue(text, [
      /(?:customer|client|bill\s*to)\s*[:#-]\s*([^|;]+)/i,
    ]),
    invoiceDate: findValue(text, [
      /(?:invoice\s*)?date\s*[:#-]\s*([0-9]{1,4}[./-][0-9]{1,2}[./-][0-9]{1,4})/i,
    ]),
    dueDate: findValue(text, [
      /due\s*date\s*[:#-]\s*([0-9]{1,4}[./-][0-9]{1,2}[./-][0-9]{1,4})/i,
    ]),
    total: formatMoney(
      findValue(text, [
        /(?:total|amount\s*due|balance\s*due)\s*[:#-]?\s*([$€£]?\s*[0-9,]+(?:\.[0-9]{2})?)/i,
      ]),
    ),
  };
}

function normalizedLabel(value: unknown) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function setCellValue(sheet: XLSX.WorkSheet, row: number, column: number, value: string) {
  const address = XLSX.utils.encode_cell({ r: row, c: column });
  sheet[address] = { t: 's', v: value };
}

export function populateTemplate(templateBuffer: Buffer, invoice: ExtractedInvoice) {
  const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) throw new Error('The Excel template does not contain a worksheet.');

  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const values: Array<{ aliases: string[]; value: string }> = [
    { aliases: ['invoicenumber', 'invoiceno', 'invoice'], value: invoice.invoiceNumber },
    { aliases: ['customer', 'customername', 'client', 'billto'], value: invoice.customer },
    { aliases: ['date', 'invoicedate'], value: invoice.invoiceDate },
    { aliases: ['duedate', 'paymentdue'], value: invoice.dueDate },
    { aliases: ['total', 'totalamount', 'amountdue', 'balancedue'], value: invoice.total },
  ];
  const matched = new Set<string>();

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      const label = normalizedLabel(sheet[address]?.v);
      const field = values.find((item) => item.aliases.includes(label) && item.value);

      if (field) {
        setCellValue(sheet, row, column + 1, field.value);
        matched.add(field.aliases[0]);
      }
    }
  }

  if (matched.size === 0) {
    const outputSheet = XLSX.utils.aoa_to_sheet([
      ['Field', 'Value'],
      ['Invoice Number', invoice.invoiceNumber],
      ['Customer', invoice.customer],
      ['Invoice Date', invoice.invoiceDate],
      ['Due Date', invoice.dueDate],
      ['Total', invoice.total],
    ]);
    XLSX.utils.book_append_sheet(workbook, outputSheet, 'PDF2Excel Data');
  }

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}
