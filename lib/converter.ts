import * as XLSX from 'xlsx';
import OpenAI from 'openai';
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

function normalizeDate(value: string) {
  if (!value) return '';

  const trimmed = value.trim();
  const match = trimmed.match(/(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})/);
  if (!match) return trimmed;

  const [, first, second, third] = match;
  const year = third.length === 2 ? `20${third}` : third;
  const month = String(Number(second)).padStart(2, '0');
  const day = String(Number(first)).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeMoney(value: string) {
  if (!value) return '';

  const match = value.match(/\$?\s*([0-9,]+(?:\.\d{1,2})?)/);
  if (!match) return value;

  return Number(match[1].replace(/,/g, '')).toFixed(2);
}

function findValue(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return '';
}

function fallbackExtractInvoice(text: string): ExtractedInvoice {
  const invoiceNumber = findValue(text, [
    /invoice\s*(?:number|no\.?|#)?\s*[:#-]\s*([A-Z0-9][A-Z0-9-]*)/i,
    /invoice\s+([A-Z0-9][A-Z0-9-]*)/i,
  ]);

  const customer = findValue(text, [
    /(?:customer|client|bill\s*to|supplier)\s*[:#-]\s*([^|;]+)/i,
  ]);

  const invoiceDate = normalizeDate(
    findValue(text, [
      /(?:invoice\s*)?date\s*[:#-]\s*([0-9]{1,4}[./-][0-9]{1,2}[./-][0-9]{1,4})/i,
    ]),
  );

  const dueDate = normalizeDate(
    findValue(text, [
      /due\s*date\s*[:#-]\s*([0-9]{1,4}[./-][0-9]{1,2}[./-][0-9]{1,4})/i,
    ]),
  );

  const total = normalizeMoney(
    findValue(text, [
      /(?:total|amount\s*due|balance\s*due)\s*[:#-]?\s*([$€£]?\s*[0-9,]+(?:\.\d{1,2})?)/i,
    ]),
  );

  return {
    invoiceNumber,
    customer,
    invoiceDate,
    dueDate,
    total,
  };
}

export function getTemplateHeaders(templateBuffer: Buffer) {
  const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  if (!sheet) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
  }) as unknown[][];

  const headers: string[] = [];

  rows.forEach((row) => {
    row.forEach((cell) => {
      const value = String(cell ?? '').trim();
      if (value) headers.push(value);
    });
  });

  return headers.slice(0, 40);
}

async function extractWithOpenAI(pdfText: string, headers: string[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are an invoice extraction assistant. Extract values from a PDF invoice and map them to the requested spreadsheet columns. Return valid JSON only. Use empty strings for missing values.',
      },
      {
        role: 'user',
        content: `Template headers:\n${headers.join('\n')}\n\nInvoice PDF text:\n${pdfText.slice(0, 18000)}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content);

  return {
    invoiceNumber: String(parsed.invoiceNumber ?? parsed.invoice_no ?? parsed['Invoice Number'] ?? '').trim(),
    customer: String(parsed.customer ?? parsed.supplier ?? parsed.client ?? parsed['Customer'] ?? '').trim(),
    invoiceDate: normalizeDate(String(parsed.invoiceDate ?? parsed['Invoice Date'] ?? '').trim()),
    dueDate: normalizeDate(String(parsed.dueDate ?? parsed['Due Date'] ?? '').trim()),
    total: normalizeMoney(String(parsed.total ?? parsed.totalAmount ?? parsed['Total'] ?? '').trim()),
  } satisfies ExtractedInvoice;
}

export async function extractInvoice(pdfBuffer: Buffer, templateHeaders: string[] = []): Promise<ExtractedInvoice> {
  const parsedPDF = await pdfParse(pdfBuffer);
  const rawText = clean(parsedPDF.text || '');

  if (!rawText) {
    return fallbackExtractInvoice('');
  }

  const headers = templateHeaders.length > 0 ? templateHeaders : ['Invoice Number', 'Customer', 'Invoice Date', 'Due Date', 'Total'];

  try {
    return await extractWithOpenAI(rawText, headers);
  } catch (error) {
    console.warn('OpenAI extraction failed, using regex fallback:', error);
    return fallbackExtractInvoice(rawText);
  }
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
    { aliases: ['invoicenumber', 'invoiceno', 'invoice', 'invoicenumberlabel'], value: invoice.invoiceNumber },
    { aliases: ['customer', 'customername', 'client', 'supplier', 'billto'], value: invoice.customer },
    { aliases: ['date', 'invoicedate', 'issuedate'], value: invoice.invoiceDate },
    { aliases: ['duedate', 'paymentdue', 'paymentduedate'], value: invoice.dueDate },
    { aliases: ['total', 'totalamount', 'amountdue', 'balancedue'], value: invoice.total },
  ];

  let matched = 0;

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      const label = normalizedLabel(sheet[address]?.v);
      const field = values.find((item) => item.aliases.includes(label) && item.value);

      if (field) {
        setCellValue(sheet, row, column + 1, field.value);
        matched += 1;
      }
    }
  }

  if (matched === 0) {
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
