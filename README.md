# Products

Simple Express API storing data in `products.json` (file-based storage, no external DB).

## Run locally

1. Install dependencies:

```powershell
npm install
```

2. Start the server:

```powershell
npm start
```

3. Open the UI in your browser:

http://localhost:3000/

Or call the API directly:

- GET /products
- POST /products  (JSON: { name, price, inStock })
- PUT /products/:id  (partial updates allowed)
- DELETE /products/:id
- GET /products/instock

## Storage

Data is stored in `products.json` in the repo root. The server reads and writes this file on each request.

## Notes

- This project uses only Node.js built-in `fs` and Express.
- Do not run HTML files with `node index.html` — start the server (`node index.js` or `npm start`) and open the URL instead.
