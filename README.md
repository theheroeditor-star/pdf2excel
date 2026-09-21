# PDF2Excel

A small Next.js and TypeScript application that extracts common fields from invoice PDFs and writes them into an Excel template.

## What works

- Upload one text-based invoice PDF and one `.xlsx` or `.xls` template.
- The browser sends both files to `POST /api/convert`.
- The server extracts common fields: invoice number, customer, invoice date, due date, and total.
- If the template contains matching labels, values are written into the cell immediately to the right of each label.
- If no labels match, a `PDF2Excel Data` worksheet is added to the workbook.
- The completed workbook is returned as a download.

This version does not use authentication, a database, payments, AI APIs, or persistent file storage. Files are processed in memory by the Next.js server and are not saved by this application.

## Run locally

You need Node.js 18.17 or newer and npm installed.

1. Clone the repository and open the project directory:

   ```bash
   git clone https://github.com/theheroeditor-star/pdf2excel.git
   cd pdf2excel
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

5. Choose a PDF and Excel template, then click **Convert to Excel**.

## Verify a production build

```bash
npm run build
npm run start
```

## Template format

For best results, put labels such as these in one worksheet, with an empty cell immediately to the right:

```text
Invoice Number | value goes here
Customer       | value goes here
Invoice Date   | value goes here
Due Date       | value goes here
Total          | value goes here
```

The parser currently expects text-based PDFs. A scanned/image-only PDF has no selectable text and will need OCR (for example, a future Tesseract or cloud OCR integration) before it can be extracted reliably.

The parser uses simple label matching, so invoice layouts with unusual wording may require adding another regular expression in `lib/converter.ts`.
