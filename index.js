#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const services = [
  {
    name: 'News Scraper',
    color: '\x1b[36m', // Cyan
    cwd: join(__dirname, 'services', 'scraper'),
    command: 'node',
    args: ['src/server.js'],
    port: process.env.SCRAPER_PORT || 5000
  },
  {
    name: 'Pipeline',
    color: '\x1b[33m', // Yellow
    cwd: join(__dirname, 'services', 'pipeline'),
    command: 'node',
    args: ['server.js'],
    port: process.env.PIPELINE_PORT || 3000
  },
  {
    name: 'Backend',
    color: '\x1b[32m', // Green
    cwd: join(__dirname, 'services', 'backend'),
    command: 'node',
    args: ['dist/index.js'],
    port: process.env.BACKEND_PORT || 4000
  }
];

const reset = '\x1b[0m';
const bold = '\x1b[1m';

console.log(`\n${bold}🚀 Starting Satya Services...${reset}\n`);

// Track running processes
const processes = [];

// Start each service
services.forEach((service) => {
  console.log(`${service.color}[${service.name}]${reset} Starting on port ${service.port}...`);
  
  const proc = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: service.port }
  });

  processes.push(proc);

  // Prefix output with service name and color
  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      console.log(`${service.color}[${service.name}]${reset} ${line}`);
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      console.log(`${service.color}[${service.name}]${reset} ${line}`);
    });
  });

  proc.on('error', (error) => {
    console.error(`${service.color}[${service.name}]${reset} Error:`, error);
  });

  proc.on('exit', (code, signal) => {
    if (code !== null) {
      console.log(`${service.color}[${service.name}]${reset} Exited with code ${code}`);
    }
    if (signal !== null) {
      console.log(`${service.color}[${service.name}]${reset} Killed with signal ${signal}`);
    }
  });
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${bold}🛑 Shutting down all services...${reset}\n`);
  
  processes.forEach((proc) => {
    if (!proc.killed) {
      proc.kill(signal);
    }
  });

  // Force exit after 5 seconds
  setTimeout(() => {
    console.log('Force exit');
    process.exit(0);
  }, 5000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Keep the process running
process.stdin.resume();

console.log(`\n${bold}✅ All services started!${reset}`);
console.log(`\n${bold}Service URLs:${reset}`);
console.log(`  • News Scraper: http://localhost:${services[0].port}`);
console.log(`  • Pipeline:     http://localhost:${services[1].port}`);
console.log(`  • Backend:      http://localhost:${services[2].port}`);
console.log(`\n${bold}Press Ctrl+C to stop all services${reset}\n`);
