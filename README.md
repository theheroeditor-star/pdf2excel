# PDF2Excel

PDF2Excel is a focused AI micro-SaaS MVP: upload supplier invoice PDFs, upload the Excel spreadsheet you already maintain, review the extracted rows, and download the completed workbook.

## Workflow

1. Upload one or more text-based invoice PDFs.
2. Upload your existing `.xlsx` or `.xls` spreadsheet.
3. Add optional rules, such as: `Use the supplier SKU, format dates as YYYY-MM-DD, and leave Job # blank when missing.`
4. Click **Extract and review**.
5. Correct any cells in the review table.
6. Click **Download completed Excel**.

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

PDF2Excel uses the first worksheet and treats the row with the most populated cells near the top as the header row. Examples of useful headers include:

```text
Date | Supplier | SKU | Description | Qty | Unit Cost | Total | Job #
```

The AI returns one row per PDF using those exact headers. The downloaded workbook preserves the uploaded workbook and appends the reviewed rows beneath its existing content.

## Limitations of this MVP

- Text-based PDFs work best. Scanned/image-only PDFs need OCR.
- The application processes up to 20 PDFs per request, with a 10 MB limit per file.
- The AI call uses `gpt-4o-mini`; usage may incur OpenAI API charges.
- The current app processes files in memory and does not save job history. A production SaaS would later need authentication, billing, storage controls, rate limiting, monitoring, and stronger privacy/compliance controls.
