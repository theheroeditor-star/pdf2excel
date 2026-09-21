# PDF2Excel

A small Next.js and TypeScript application for turning invoice PDFs into structured Excel spreadsheets.

> **Current behavior:** this first version is a frontend demo. It validates that both files are selected, shows a loading state, and creates a sample downloadable Excel workbook in the browser. It does not yet read PDF contents or modify the uploaded template.

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

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Select one PDF and one `.xlsx` or `.xls` template, then click **Convert to Excel**. After the simulated processing state finishes, click **Download Excel file**.

## Production build

To verify the production build locally:

```bash
npm run build
npm run start
```

The app uses Tailwind CSS for styling and the `xlsx` package to generate the sample workbook in the browser. No authentication, database, payment, AI, or external service is required.
