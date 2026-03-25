import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

let sdk: NodeSDK | null = null;

export interface TracingConfig {
  serviceName?: string;
  serviceVersion?: string;
  tracesEndpoint?: string;
  authToken?: string;
  timeoutMillis?: number;
  samplingRate?: number;
}

export async function initializeTracing(config: TracingConfig = {}): Promise<NodeSDK> {
  if (sdk) {
    console.warn('[InfoGen Tracing] SDK already initialized, returning existing instance');
    return sdk;
  }

  const {
    serviceName = process.env.OTEL_SERVICE_NAME || 'infogen-agent',
    serviceVersion = process.env.OTEL_SERVICE_VERSION || '1.0.0',
    tracesEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
    authToken = process.env.OTEL_AUTH_TOKEN,
    timeoutMillis = parseInt(process.env.OTEL_EXPORTER_OTLP_TIMEOUT || '10000', 10),
    samplingRate = parseFloat(process.env.OTEL_SAMPLING_RATE || '1.0'),
  } = config;

  const traceExporter = new OTLPTraceExporter({
    url: tracesEndpoint,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    timeoutMillis,
  });

  const resource = resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
    'infogen.project.name': 'infogen',
    'infogen.trace.version': '1.0.0',
  });

  sdk = new NodeSDK({
    resource,
    traceExporter,
    spanProcessor: new BatchSpanProcessor(traceExporter),
  });

  await sdk.start();
  console.log(`[InfoGen Tracing] SDK initialized: ${serviceName} v${serviceVersion}`);
  console.log(`[InfoGen Tracing] Exporting to: ${tracesEndpoint}`);

  registerShutdown(sdk);

  return sdk;
}

export function isTracingInitialized(): boolean {
  return sdk !== null;
}

export async function shutdownTracing(): Promise<void> {
  if (!sdk) {
    console.warn('[InfoGen Tracing] SDK not initialized, nothing to shutdown');
    return;
  }

  await sdk.shutdown();
  console.log('[InfoGen Tracing] SDK shut down');
  sdk = null;
}

function registerShutdown(sdkInstance: NodeSDK): void {
  const shutdownHandler = async (signal: string) => {
    console.log(`[InfoGen Tracing] Received ${signal}, shutting down...`);
    await sdkInstance.shutdown();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
}

export function resetSDKForTesting(): void {
  sdk = null;
}
