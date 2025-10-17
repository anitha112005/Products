const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const child_process = require('child_process');
const app = express();
app.use(express.json());

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

const DATA_FILE = path.join(__dirname, 'products.json');
const PORT = process.env.PORT || 3000;

async function readProducts() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeProducts(products) {
  await fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
}

function validateProductPayload(payload, partial = false) {
  const errors = [];
  if (!partial || payload.hasOwnProperty('name')) {
    if (typeof payload.name !== 'string' || payload.name.trim() === '') errors.push('name must be a non-empty string');
  }
  if (!partial || payload.hasOwnProperty('price')) {
    if (typeof payload.price !== 'number' || Number.isNaN(payload.price)) errors.push('price must be a number');
  }
  if (!partial || payload.hasOwnProperty('inStock')) {
    if (typeof payload.inStock !== 'boolean') errors.push('inStock must be a boolean');
  }
  return errors;
}


app.get('/products', async (req, res) => {
  try {
    const products = await readProducts();
    return res.json(products);
  } catch (err) {
    console.error('Read error', err);
    return res.status(500).json({ error: 'Failed to read products' });
  }
});


app.post('/products', async (req, res) => {
  const payload = req.body;
  const errors = validateProductPayload(payload, false);
  if (errors.length) return res.status(400).json({ errors });

  try {
    const products = await readProducts();
    const maxId = products.reduce((m, p) => Math.max(m, p.id || 0), 0);
    const newId = maxId + 1;
    const newProduct = { id: newId, name: payload.name, price: payload.price, inStock: payload.inStock };
    products.push(newProduct);
    await writeProducts(products);
    return res.status(201).json(newProduct);
  } catch (err) {
    console.error('Write error', err);
    return res.status(500).json({ error: 'Failed to save product' });
  }
});

app.put('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const payload = req.body;
  const errors = validateProductPayload(payload, true);
  if (errors.length) return res.status(400).json({ errors });

  try {
    const products = await readProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const existing = products[idx];
    const updated = Object.assign({}, existing, payload, { id: existing.id });
    products[idx] = updated;
    await writeProducts(products);
    return res.json(updated);
  } catch (err) {
    console.error('Update error', err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const products = await readProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    products.splice(idx, 1);
    await writeProducts(products);
    return res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete error', err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.get('/products/instock', async (req, res) => {
  try {
    const products = await readProducts();
    const instock = products.filter(p => p && p.inStock === true);
    return res.json(instock);
  } catch (err) {
    console.error('Read instock error', err);
    return res.status(500).json({ error: 'Failed to read products' });
  }
});

app.listen(PORT, () => {
  console.log(`Products API listening on port ${PORT}`);
  if (process.platform === 'win32') {
    try { child_process.execSync(`start http://localhost:${PORT}`); } catch (e) { /* ignore */ }
  }
});
