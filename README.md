# PDF2Excel

A small Next.js and TypeScript app that turns invoice PDFs into structured Excel spreadsheets using OpenAI-powered extraction and a matching Excel template.

## What this version does

- Upload a text-based invoice PDF.
- Upload an Excel template with headers like `Invoice Number`, `Customer`, `Invoice Date`, `Due Date`, and `Total`.
- The PDF content is extracted and normalized.
- OpenAI reads the PDF text and the template headers, then returns structured invoice data.
- The app writes those values into the Excel template and downloads the result.

This is intentionally simple and does not include authentication, teams, payments, dashboards, or a database.

## Required environment variable

Create a local environment file:

```bash
cp .env.example .env.local
```

Then add your OpenAI key:

```env
OPENAI_API_KEY=your_openai_key_here
```

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Visit [http://localhost:3000](http://localhost:3000).

4. Upload the invoice PDF and the Excel template, then click **Convert to Excel**.

## Production build

```bash
npm run build
npm run start
```

## Notes

- Best results come from text-based PDFs.
- If the PDF is scanned or image-only, OCR would be needed before extraction.
- The app uses `pdf-parse` for text extraction, then OpenAI to normalize and map the data into the spreadsheet.
- If OpenAI is unavailable, the app automatically falls back to a regex-based extractor.
