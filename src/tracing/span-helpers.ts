import { context, trace, Span, SpanStatusCode } from '@opentelemetry/api';
import { getTracer } from '@opentelemetry/api';
import { CUSTOM_ATTRIBUTES } from './attributes.js';
import { AGENT_STATUS } from './attributes.js';

export interface AgentSpanOptions {
  statementId: string;
  actionName: string;
  deliverableType?: string;
  attributes?: Record<string, string | number | boolean>;
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
  }, async (span) => {
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
  const parentContext = context.active();
  const parentSpan = trace.getSpan(parentContext);

  return tracer.startActiveSpan('llm.inference', {
    parent: parentSpan,
    attributes: {
    [CUSTOM_ATTRIBUTES.LLM_PROVIDER]: provider,
    [CUSTOM_ATTRIBUTES.LLM_MODEL]: model,
  },
  }, async (span) => {
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
  const parentContext = context.active();
  const parentSpan = trace.getSpan(parentContext);

  return tracer.startActiveSpan(`tool.${toolName}`, {
    parent: parentSpan,
    attributes: {
    [CUSTOM_ATTRIBUTES.TOOL_NAME]: toolName,
    [CUSTOM_ATTRIBUTES.TOOL_ARGUMENTS]: JSON.stringify(args),
  },
  }, async (span) => {
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

export function createChildSpan(name: string, attributes?: Record<string, unknown>): Span {
  const tracer = getTracer('infogen-custom');
  const parentContext = context.active();
  const parentSpan = trace.getSpan(parentContext);
  return tracer.startSpan(name, { parent: parentSpan, attributes });
}
