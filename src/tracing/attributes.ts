import { Span } from '@opentelemetry/api';

export const CUSTOM_ATTRIBUTES = {
  /** Demo statement ID from Phase 1 methodology */
  STATEMENT_ID: 'infogen.statement_id',
  /** Deliverable type (code, methodology, test, change) */
  DELIVERABLE_TYPE: 'infogen.deliverable_type',
  /** Log level (DEBUG, INFO, WARN, ERROR, PASS, FAIL) */
  LOG_LEVEL: 'infogen.log_level',
  /** Agent action name */
  AGENT_ACTION: 'infogen.agent_action',
  /** Agent execution status */
  AGENT_STATUS: 'infogen.agent_status',
  /** Tool name */
  TOOL_NAME: 'infogen.tool.name',
  /** Tool call arguments */
  TOOL_ARGUMENTS: 'infogen.tool.arguments',
  /** Tool execution result */
  TOOL_RESULT: 'infogen.tool.result',
  /** LLM provider */
  LLM_PROVIDER: 'infogen.llm.provider',
  /** LLM model identifier */
  LLM_MODEL: 'infogen.llm.model',
  /** LLM input token count */
  LLM_INPUT_TOKENS: 'infogen.llm.input_tokens',
  /** LLM output token count */
  LLM_OUTPUT_TOKENS: 'infogen.llm.output_tokens',
} as const;

export const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  PASS: 'PASS',
  FAIL: 'FAIL',
} as const;

export const AGENT_STATUS = {
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

export const DELIVERABLE_TYPES = {
  CODE_FRAMEWORK: 'code/framework',
  METHODOLOGY_SKILL: 'methodology/skill',
  TEST_QUALITY: 'test/quality',
  CHANGE_REFACTOR: 'change/refactor',
} as const;

export function addTraceability(
  span: Span,
  statementId: string,
  metadata?: {
    deliverableType?: string;
    logLevel?: string;
  }
): void {
  span.setAttributes({
    [CUSTOM_ATTRIBUTES.STATEMENT_ID]: statementId,
  });

  if (metadata?.deliverableType) {
    span.setAttribute(CUSTOM_ATTRIBUTES.DELIVERABLE_TYPE, metadata.deliverableType);
  }

  if (metadata?.logLevel) {
    span.setAttribute(CUSTOM_ATTRIBUTES.LOG_LEVEL, metadata.logLevel);
  }
}
