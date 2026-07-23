# ID Card Generator

A browser-based employee ID card generator with live preview, batch processing, and offline database storage. Works entirely client-side — no server needed.

## Features

- **Single Card Editor** — Step-by-step wizard with live preview, rich text editor for back card, and template library
- **Batch Generator** — Import CSV files, match employee photos, and export as PNG/JPEG/PDF
- **Template Library** — Save, browse, and apply reusable card designs across pages
- **Employee Database** — IndexedDB storage for saving and searching employee records offline
- **Rich Text Editor** — Bold, italic, underline, font sizes, bullet lists, and text colors on card backs
- **Export Formats** — PNG, JPEG, and multi-page PDF at CR80 (85.6 × 54 mm)
- **Static Hosting** — Deploy directly to GitHub Pages or Hostinger (no server required)

## Files

| File | Purpose |
|------|---------|
| `index.html` | Single card generator with step wizard, live preview, template library, and database search |
| `batch.html` | Batch generator with CSV import, photo matching, template integration, and database access |
| `app.js` | JavaScript for single card page (state, rendering, rich text, canvas export, DB integration) |
| `db.js` | IndexedDB wrapper — save, search, update, delete, export, and import employee records |

## Deployment

Upload all four files to your web host:

```
index.html
batch.html
app.js
db.js
```

No build step or dependencies to install. External CDN resources load automatically:
- Tailwind CSS (CDN)
- jsPDF (CDN) — for PDF export
- DM Sans (Google Fonts)

## Usage

### Single Card
1. Open `index.html`
2. Configure Card Design (accent color, size, orientation)
3. Enter Organization details and upload a logo
4. Fill in employee Personal Information and upload a photo
5. Optionally add a Card Background
6. Use the rich text editor for Back of Card notice text
7. Choose format (PNG/JPEG/PDF) and export side, then Generate

### Batch Generation
1. Open `batch.html`
2. Import a CSV file with columns: Name, Title, Department, ID, Issue Date, Expiry Date, Photo
3. Optionally upload a folder of employee photos (matched by filename)
4. Configure organization, backgrounds, and back notice
5. Generate all or export selected cards

### Database
- **Save to database** — Click "Save to database" on single card or "Save all to DB" on batch
- **Search** — Use the Saved Employees section to find and reload records
- **Backup** — Call `EmployeeDB.exportAll()` in the browser console to download a JSON backup

## Tech Stack

- Vanilla HTML/CSS/JS (no frameworks)
- IndexedDB for persistent storage
- HTML5 Canvas for card rendering
- jsPDF for PDF generation
- Design tokens via CSS custom properties
