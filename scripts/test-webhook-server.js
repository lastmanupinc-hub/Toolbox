#!/usr/bin/env node

/**
 * Test Webhook Server - Demonstrates posting Axis' Iliad content
 * Run this first, then run the poster with GENERIC_WEBHOOK_URL set
 */

import http from 'node:http';

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('📨 Received webhook post:');
        console.log(JSON.stringify(data, null, 2));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'received', timestamp: new Date().toISOString() }));
      } catch (error) {
        console.error('❌ Error parsing webhook data:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`🪝 Test webhook server running on http://localhost:${PORT}/webhook`);
  console.log('💡 Run this command in another terminal to test posting:');
  console.log(`   GENERIC_WEBHOOK_URL=http://localhost:${PORT}/webhook pnpm run post-content`);
  console.log('🛑 Press Ctrl+C to stop the server');
});