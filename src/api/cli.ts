#!/usr/bin/env node
import { startServer } from './server.js';
import { initializeTracing } from '../tracing/index.js';

// Initialize tracing for the API server itself
initializeTracing({
  serviceName: 'infogen-api',
});

const port = Number(process.env.PORT) || 3001;
startServer(port);
