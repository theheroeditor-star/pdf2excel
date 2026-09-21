import * as XLSX from 'xlsx';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';

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
  const month = String(Number(second)).padStart(2, '0');
  const day = String(Number(first)).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeMoney(value: string) {
  const cleaned = value.replace(/,/g, '').replace(/[^0-9.\-]/g, '');
  if (!cleaned) return clean(value);
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : clean(value);
}

function findValue(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return '';
}

function fallbackRow(text: string, headers: string[]): InvoiceRow {
  const extracted: Record<string, string> = {
    invoicenumber: findValue(text, [/invoice\s*(?:number|no\.?|#)?\s*[:#-]\s*([A-Z0-9][A-Z0-9-]*)/i, /invoice\s+([A-Z0-9][A-Z0-9-]*)/i]),
    supplier: findValue(text, [/(?:supplier|vendor|from)\s*[:#-]\s*([^|;]+)/i]),
    customer: findValue(text, [/(?:customer|client|bill\s*to)\s*[:#-]\s*([^|;]+)/i]),
    invoicedate: normalizeDate(findValue(text, [/(?:invoice\s*)?date\s*[:#-]\s*([0-9]{1,4}[./-][0-9]{1,2}[./-][0-9]{1,4})/i])),
    duedate: normalizeDate(findValue(text, [/due\s*date\s*[:#-]\s*([0-9]{1,4}[./-][0-9]{1,2}[./-][0-9]{1,4})/i])),
    total: normalizeMoney(findValue(text, [/(?:total|amount\s*due|balance\s*due)\s*[:#-]?\s*([$€£]?\s*[0-9,]+(?:\.\d{1,2})?)/i])),
    description: findValue(text, [/description\s*[:#-]\s*([^\n]+)/i]),
    quantity: findValue(text, [/qty\s*[:#-]\s*([0-9]+(?:\.[0-9]+)?)/i, /quantity\s*[:#-]\s*([0-9]+(?:\.[0-9]+)?)/i]),
    unitcost: normalizeMoney(findValue(text, [/unit\s*cost\s*[:#-]\s*([$€£]?\s*[0-9,]+(?:\.\d{1,2})?)/i, /rate\s*[:#-]\s*([$€£]?\s*[0-9,]+(?:\.\d{1,2})?)/i])),
    jobnumber: findValue(text, [/job\s*#?\s*[:#-]\s*([A-Z0-9-]+)/i, /job\s*number\s*[:#-]\s*([A-Z0-9-]+)/i])
  };

  return Object.fromEntries(headers.map((header) => {
    const key = normalizeKey(header);
    return [header, extracted[key] ?? ''];
  }));
}

function parseTemplate(templateBuffer: Buffer) {
  const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error('The Excel template does not contain a worksheet.');
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as unknown[][];
  let bestHeaderIndex = 0;
  let bestCount = 0;

  rows.forEach((row, index) => {
    const count = row.filter((cell) => String(cell ?? '').trim()).length;
    if (count > bestCount) {
      bestCount = count;
      bestHeaderIndex = index;
    }
  });

  const candidateHeaders = (rows[bestHeaderIndex] ?? []).map((cell) => String(cell ?? '').trim()).filter(Boolean);
  const headers = candidateHeaders.length >= 2 ? candidateHeaders : DEFAULT_HEADERS;

  return { workbook, sheet, sheetName, headers };
}

export function getTemplateHeaders(templateBuffer: Buffer) {
  return parseTemplate(templateBuffer).headers.slice(0, 50);
}

async function extractWithOpenAI(pdfText: string, headers: string[], rules: string): Promise<InvoiceRow> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are extracting invoice data into a spreadsheet. Return valid JSON only. Keys must match the exact spreadsheet headers. Use empty strings for missing values. Normalize dates to YYYY-MM-DD and money to numeric strings with 2 decimal places.'
      },
      {
        role: 'user',
        content: `Spreadsheet headers:\n${headers.map((header) => `- ${header}`).join('\n')}\n\nBusiness rules:\n${rules || 'No extra rules.'}\n\nInvoice text:\n${pdfText.slice(0, 24000)}`
      }
    ]
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as Record<string, unknown>;
  return Object.fromEntries(headers.map((header) => [header, String(parsed[header] ?? '').trim()]));
}

async function ocrImage(buffer: Buffer) {
  const result = await Tesseract.recognize(buffer, 'eng');
  return clean(result.data.text || '');
}

export async function convertPdfFiles(pdfBuffers: Buffer[], scanBuffers: Buffer[], templateBuffer: Buffer, rules: string): Promise<ConversionResult> {
  const headers = getTemplateHeaders(templateBuffer);
  const rows: InvoiceRow[] = [];
  const warnings: string[] = [];
  let usedAi = Boolean(process.env.OPENAI_API_KEY);

  for (let index = 0; index < pdfBuffers.length; index += 1) {
    const pdfBuffer = pdfBuffers[index];
    const scanBuffer = scanBuffers[index];
    const parsedPdf = await pdfParse(pdfBuffer);
    let extractedText = clean(parsedPdf.text || '');

    if (!extractedText && scanBuffer) {
      try {
        extractedText = await ocrImage(scanBuffer);
        warnings.push(`Invoice ${index + 1} was read with OCR because the PDF did not include selectable text.`);
      } catch (ocrError) {
        console.warn('OCR failed:', ocrError);
      }
    }

    if (!extractedText) {
      warnings.push(`Invoice ${index + 1} has no readable text. Try uploading a scanned JPG/PNG version.`);
      rows.push(fallbackRow('', headers));
      usedAi = false;
      continue;
    }

    try {
      rows.push(await extractWithOpenAI(extractedText, headers, rules));
    } catch (error) {
      console.warn('AI extraction failed, using fallback parser.', error);
      warnings.push(`Invoice ${index + 1} used the fallback parser.`);
      rows.push(fallbackRow(extractedText, headers));
      usedAi = false;
    }
  }

  return { headers, rows, warnings, usedAi };
}

export function populateTemplate(templateBuffer: Buffer, headers: string[], rows: InvoiceRow[]) {
  const { workbook, sheet } = parseTemplate(templateBuffer);
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const startRow = range.e.r + 1;

  rows.forEach((row, rowIndex) => {
    headers.forEach((header, columnIndex) => {
      const value = row[header] ?? '';
      const address = XLSX.utils.encode_cell({ r: startRow + rowIndex, c: columnIndex });
      sheet[address] = { t: 's', v: value };
    });
  });

  const endRow = startRow + rows.length;
  const endColumn = Math.max(headers.length - 1, range.e.c);
  sheet['!ref'] = XLSX.utils.encode_range({
    s: { r: range.s.r, c: range.s.c },
    e: { r: endRow, c: endColumn }
  });

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}
