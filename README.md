# PDF2Excel

PDF2Excel is a focused AI micro-SaaS MVP: upload supplier invoice PDFs, upload the Excel spreadsheet you already maintain, add optional business rules, review the extracted rows, and download the completed workbook.

## Workflow

1. Upload one or more text-based invoice PDFs.
2. Optionally upload scanned image files (JPG/PNG) if the PDFs do not contain selectable text.
3. Upload your existing `.xlsx` or `.xls` spreadsheet.
4. Add optional rules, such as: `Use the supplier SKU, format dates as YYYY-MM-DD, and leave Job # blank when missing.`
5. Click **Extract and review**.
6. Correct any values in the review table, add or delete rows, and export the final spreadsheet.
7. Click **Download completed Excel**.

The app uses OpenAI on the server to map invoice text to the column headers in your spreadsheet. It does not add authentication, teams, payments, subscriptions, dashboards, a database, or persistent file storage.

## Set up in VS Code

The project root is the folder that contains `package.json`.

1. Open the project folder in VS Code.
2. Create a file named `.env.local` beside `package.json`.
3. Add your new OpenAI key:

   ```env
   OPENAI_API_KEY=your_new_openai_key_here
   ```

   Never commit or share this value. The key must be server-side only.

4. Open the VS Code terminal and run:

   ```powershell
   npm install
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Production build

```powershell
npm run build
npm run start
```

## Spreadsheet templates

PDF2Excel uses the first worksheet and treats the row with the most populated cells as the header row. Common header examples include:

```text
Date | Supplier | SKU | Description | Qty | Unit Cost | Total | Job #
```

The AI returns one row per PDF using those exact headers. The downloaded workbook preserves the uploaded workbook and appends the reviewed rows below the original sheet content.

## OCR support

If a PDF does not contain selectable text, upload a scanned JPG or PNG version in the **Scanned files (optional)** section. The application uses Tesseract OCR to read those images and extract text before mapping the result into the spreadsheet.

## Limitations of this MVP

- Text-based PDFs work best.
- Scanned/image-only PDFs are supported only when an image version is uploaded alongside the PDF.
- The application processes up to 20 PDFs per request, with a 10 MB limit per file.
- The AI call uses `gpt-4o-mini`; usage may incur OpenAI API charges.
- The current app processes files in memory and does not save job history.
