import { context, trace, Span, SpanStatusCode, Tracer, Attributes } from '@opentelemetry/api';
import { CUSTOM_ATTRIBUTES, AGENT_STATUS } from './attributes.js';

export interface AgentSpanOptions {
  statementId: string;
  actionName: string;
  deliverableType?: string;
  attributes?: Record<string, string | number | boolean>;
}

function getTracer(name: string): Tracer {
  return trace.getTracer(name, '1.0.0');
}

export async function withAgentSpan<T>(
  statementId: string,
  actionName: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer('infogen-agent');
  return tracer.startActiveSpan(`agent.${actionName}`, {
    attributes: {
      [CUSTOM_ATTRIBUTES.STATEMENT_ID]: statementId,
      [CUSTOM_ATTRIBUTES.AGENT_ACTION]: actionName,
      [CUSTOM_ATTRIBUTES.AGENT_STATUS]: AGENT_STATUS.RUNNING,
    },
  }, async (span: Span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      span.setAttribute(CUSTOM_ATTRIBUTES.AGENT_STATUS, AGENT_STATUS.SUCCESS);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      span.recordException(error instanceof Error ? error : new Error(message));
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      span.setAttribute(CUSTOM_ATTRIBUTES.AGENT_STATUS, AGENT_STATUS.FAILED);
      throw error;
    } finally {
      span.end();
    }
  });
}

export async function withLLMSpan<T>(
  provider: string,
  model: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer('infogen-llm');
  // startActiveSpan automatically uses current context as parent

  return tracer.startActiveSpan('llm.inference', {
    attributes: {
      [CUSTOM_ATTRIBUTES.LLM_PROVIDER]: provider,
      [CUSTOM_ATTRIBUTES.LLM_MODEL]: model,
    },
  }, async (span: Span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      span.recordException(error instanceof Error ? error : new Error(message));
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      throw error;
    } finally {
      span.end();
    }
  });
}

export async function withToolSpan<T>(
  toolName: string,
  args: Record<string, unknown>,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer('infogen-tools');
  // startActiveSpan automatically uses current context as parent

  return tracer.startActiveSpan(`tool.${toolName}`, {
    attributes: {
      [CUSTOM_ATTRIBUTES.TOOL_NAME]: toolName,
      [CUSTOM_ATTRIBUTES.TOOL_ARGUMENTS]: JSON.stringify(args),
    },
  }, async (span: Span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      span.recordException(error instanceof Error ? error : new Error(message));
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function createChildSpan(name: string, attributes?: Attributes): Span {
  const tracer = getTracer('infogen-custom');
  return tracer.startSpan(name, { attributes });
}
