# Metasys Pipeline QA

A client-side data-pipeline quality tool for Metasys-style data engineering workflows. Paste order records as JSON or CSV and the tool flags missing required fields, duplicate business keys, invalid amounts and malformed timestamps before warehouse loading. It runs entirely in the browser and stores no data.

## Run

Open `index.html` in a browser. No server, dependency, or API key is required.

## Test

```bash
node test.js
```
