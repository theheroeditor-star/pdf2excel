import * as XLSX from 'xlsx';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';

export type InvoiceRow = Record<string, string>;

export type ConversionResult = {
  headers: string[];
  rows: InvoiceRow[];
  warnings: string[];
  usedAi: boolean;
};

const DEFAULT_HEADERS = ['Invoice Number', 'Supplier', 'Invoice Date', 'Due Date', 'Description', 'Quantity', 'Unit Cost', 'Total', 'Job Number'];

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeDate(value: string) {
  const trimmed = clean(value);
  if (!trimmed) return '';
  const match = trimmed.match(/(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})/);
  if (!match) return trimmed;

  const [, first, second, third] = match;
  const year = third.length === 2 ? `20${third}` : third;
  const dayFirst = Number(first) > 12;
  const day = dayFirst ? first : third.length === 4 ? second : first;
  const month = dayFirst ? second : third.length === 4 ? first : second;
  return `${year.length === 4 ? year : third}-${String(Number(month)).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
}

function normalizeMoney(value: string) {
  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d{1,2})?/);
  return match ? Number(match[0]).toFixed(2) : clean(value);
}

function findValue(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return '';
}

function fallbackRow(text: string, headers: string[]): InvoiceRow {
  const values: Record<string, string> = {
    invoicenumber: findValue(text, [/invoice\s*(?:number|no\.?|#)?\s*[:#-]\s*([A-Z0-9][A-Z0-9-]*)/i, /invoice\s+([A-Z0-9][A-Z0-9-]*)/i]),
    supplier: findValue(text, [/(?:supplier|vendor|from)\s*[:#-]\s*([^|;]+)/i]),
    customer: findValue(text, [/(?:customer|client|bill\s*to)\s*[:#-]\s*([^|;]+)/i]),
    invoicedate: normalizeDate(findValue(text, [/(?:invoice\s*)?date\s*[:#-]\s*([0-9]{1,4}[./-][0-9]{1,2}[./-][0-9]{1,4})/i])),
    duedate: normalizeDate(findValue(text, [/due\s*date\s*[:#-]\s*([0-9]{1,4}[./-][0-9]{1,2}[./-][0-9]{1,4})/i])),
    total: normalizeMoney(findValue(text, [/(?:total|amount\s*due|balance\s*due)\s*[:#-]?\s*([$€£]?\s*[0-9,]+(?:\.\d{1,2})?)/i])),
  };

  return Object.fromEntries(headers.map((header) => {
    const key = normalizeKey(header);
    return [header, values[key] ?? ''];
  }));
}

function parseTemplate(templateBuffer: Buffer) {
  const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error('The Excel template does not contain a worksheet.');

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as unknown[][];
  let headerRowIndex = 0;
  let bestHeaderCount = 0;

  rows.slice(0, 40).forEach((row, index) => {
    const count = row.filter((cell) => String(cell ?? '').trim()).length;
    if (count > bestHeaderCount) {
      bestHeaderCount = count;
      headerRowIndex = index;
    }
  });

  const candidateHeaders = (rows[headerRowIndex] ?? []).map((cell) => String(cell ?? '').trim());
  const headers = candidateHeaders.filter(Boolean).length >= 2 ? candidateHeaders.filter(Boolean) : DEFAULT_HEADERS;

  return { workbook, sheet, sheetName, rows, headerRowIndex, headers };
}

export function getTemplateHeaders(templateBuffer: Buffer) {
  return parseTemplate(templateBuffer).headers.slice(0, 50);
}

async function extractWithOpenAI(pdfText: string, headers: string[], rules: string): Promise<InvoiceRow> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured.');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You extract invoice data for a spreadsheet. Return one JSON object whose keys exactly match the provided spreadsheet headers. Use strings for values, empty strings for missing values, and never invent data. Normalize dates to YYYY-MM-DD and money to decimal numbers without currency symbols.',
      },
      {
        role: 'user',
        content: `Spreadsheet headers:\n${headers.map((header) => `- ${header}`).join('\n')}\n\nCustomer rules:\n${rules || 'No extra rules.'}\n\nInvoice text:\n${pdfText.slice(0, 24000)}`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}') as Record<string, unknown>;
  return Object.fromEntries(headers.map((header) => [header, String(parsed[header] ?? '').trim()]));
}

export async function convertPdfFiles(pdfBuffers: Buffer[], templateBuffer: Buffer, rules: string): Promise<ConversionResult> {
  const headers = getTemplateHeaders(templateBuffer);
  const rows: InvoiceRow[] = [];
  const warnings: string[] = [];
  let usedAi = Boolean(process.env.OPENAI_API_KEY);

  for (let index = 0; index < pdfBuffers.length; index += 1) {
    const parsed = await pdfParse(pdfBuffers[index]);
    const text = clean(parsed.text || '');

    if (!text) {
      warnings.push(`Invoice ${index + 1} has no selectable text. OCR is needed for scanned PDFs.`);
      rows.push(fallbackRow('', headers));
      usedAi = false;
      continue;
    }

    try {
      rows.push(await extractWithOpenAI(text, headers, rules));
    } catch (error) {
      console.warn('OpenAI extraction failed; using fallback parser.', error);
      warnings.push(`Invoice ${index + 1} used the basic fallback parser.`);
      rows.push(fallbackRow(text, headers));
      usedAi = false;
    }
  }

  return { headers, rows, warnings, usedAi };
}

export function populateTemplate(templateBuffer: Buffer, headers: string[], rows: InvoiceRow[]) {
  const parsed = parseTemplate(templateBuffer);
  const { workbook, sheet, headerRowIndex } = parsed;
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const headerColumns = headers.map((header) => normalizeKey(header));
  const startRow = Math.max(range.e.r + 1, headerRowIndex + 1);

  rows.forEach((row, rowIndex) => {
    headers.forEach((header, columnIndex) => {
      const value = row[header] ?? '';
      const address = XLSX.utils.encode_cell({ r: startRow + rowIndex, c: columnIndex });
      sheet[address] = { t: 's', v: value };
    });
  });

  if (!sheet['!ref']) {
    sheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: startRow + rows.length, c: headerColumns.length - 1 } });
  } else {
    sheet['!ref'] = XLSX.utils.encode_range({ s: range.s, e: { r: Math.max(range.e.r, startRow + rows.length - 1), c: Math.max(range.e.c, headerColumns.length - 1) } });
  }

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}
