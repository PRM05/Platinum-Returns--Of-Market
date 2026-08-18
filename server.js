const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;

function loadEnvFile() {
  const envPath = path.join(ROOT_DIR, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const fileContents = fs.readFileSync(envPath, 'utf8');
  for (const line of fileContents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const API_KEY = process.env.TWELVEDATA_API_KEY;
const API_BASE = 'https://api.twelvedata.com';
const SYMBOLS = ['XAU/USD', 'EUR/USD', 'GBP/USD', 'BTC/USD', 'ETH/USD'];

async function fetchQuote(symbol) {
  if (!API_KEY) {
    throw new Error('TWELVEDATA_API_KEY is not configured. Set it in a local .env file before starting the server.');
  }

  const url = `${API_BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(API_KEY)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const payload = await response.json();

  if (!response.ok || payload?.status === 'error' || payload?.code) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function parseNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function makeMarketStatus(payload) {
  if (payload?.is_market_open === false) {
    return 'Market closed';
  }
  if (payload?.delay !== undefined && payload.delay > 0) {
    return 'Delayed';
  }
  return 'Live';
}

function formatTimestamp(value) {
  if (!value) {
    return new Date().toISOString();
  }

  const dateValue = new Date(value);
  if (!Number.isNaN(dateValue.getTime())) {
    return dateValue.toISOString();
  }

  return new Date().toISOString();
}

async function getMarketData() {
  const results = await Promise.allSettled(
    SYMBOLS.map(async (symbol) => {
      const payload = await fetchQuote(symbol);
      const price = parseNumber(payload.close ?? payload.last_price ?? payload.price ?? payload.value);
      const change = parseNumber(payload.change ?? 0);
      const pct = parseNumber(payload.percent_change ?? 0);
      const updatedAt = payload.last_quote_at ? new Date(payload.last_quote_at * 1000).toISOString() : new Date().toISOString();

      return {
        symbol,
        name: payload.name || symbol,
        price,
        change,
        pct,
        status: makeMarketStatus(payload),
        marketOpen: payload.is_market_open !== false,
        updatedAt: formatTimestamp(updatedAt),
        source: 'Twelve Data'
      };
    })
  );

  const items = results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    return {
      symbol: 'Unavailable',
      name: 'Unavailable',
      price: null,
      change: null,
      pct: null,
      status: 'Market data unavailable',
      marketOpen: false,
      updatedAt: new Date().toISOString(),
      source: 'Twelve Data',
      error: result.reason?.message || 'Unknown fetch error'
    };
  });

  return {
    lastUpdated: new Date().toISOString(),
    items
  };
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function ensureUploadDir() {
  const uploadDir = path.join(ROOT_DIR, 'assets', 'img');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

async function handleFileUpload(req, res) {
  return new Promise((resolve) => {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    
    if (!boundaryMatch) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Invalid multipart form data' }));
      resolve();
      return;
    }

    const boundary = boundaryMatch[1].trim();
    let fileData = Buffer.alloc(0);

    req.on('data', (chunk) => {
      fileData = Buffer.concat([fileData, chunk]);
    });

    req.on('end', () => {
      try {
        const boundaryBuffer = Buffer.from(`--${boundary}`);
        const parts = fileData.toString('binary').split(`--${boundary}`);
        
        let uploadSuccess = false;
        
        for (const part of parts) {
          if (part.includes('filename=')) {
            const filenameMatch = part.match(/filename="([^"]+)"/);
            if (!filenameMatch) continue;
            
            const headerEndIndex = part.indexOf('\r\n\r\n');
            if (headerEndIndex === -1) continue;
            
            const fileContent = part.slice(headerEndIndex + 4);
            const fileEndIndex = fileContent.lastIndexOf('\r\n');
            
            const uploadDir = ensureUploadDir();
            const filePath = path.join(uploadDir, 'ceo-photo.jpg');
            
            fs.writeFileSync(filePath, fileContent.slice(0, fileEndIndex), 'binary');
            uploadSuccess = true;
            break;
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        if (uploadSuccess) {
          res.end(JSON.stringify({ success: true, message: 'CEO photo uploaded successfully' }));
        } else {
          res.end(JSON.stringify({ success: false, error: 'No file found in upload' }));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
      resolve();
    });

    req.on('error', (error) => {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: error.message }));
      resolve();
    });
  });
}

function serveStaticFile(requestPath, response) {
  const safePath = path.normalize(requestPath).replace(/^\/+/, '');
  const resolvedPath = path.join(ROOT_DIR, safePath);

  if (!resolvedPath.startsWith(ROOT_DIR)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  let filePath = resolvedPath;
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(ROOT_DIR, 'index.html');
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Server error');
      return;
    }

    response.writeHead(200, { 'Content-Type': contentType });
    response.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/upload-ceo-photo' && req.method === 'POST') {
    await handleFileUpload(req, res);
    return;
  }

  if (url.pathname === '/api/market-data') {
    try {
      const data = await getMarketData();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
      return;
    } catch (error) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        lastUpdated: new Date().toISOString(),
        items: SYMBOLS.map((symbol) => ({
          symbol,
          name: symbol,
          price: null,
          change: null,
          pct: null,
          status: 'Market data unavailable',
          marketOpen: false,
          updatedAt: new Date().toISOString(),
          source: 'Twelve Data',
          error: error.message
        }))
      }));
      return;
    }
  }

  serveStaticFile(url.pathname, res);
});

server.listen(PORT, () => {
  console.log(`Market data server running on http://localhost:${PORT}`);
  console.log(API_KEY ? 'Twelve Data API key is configured from environment.' : 'Twelve Data API key missing. Add TWELVEDATA_API_KEY to a local .env file.');
});
