# Demo Statement Rule

## Purpose
Declare what the user will observe when a task is complete.

## Format

Demo statements follow the format: `ds-{YYYYMMDD}-{sequence}`

Example: `ds-20260326-01`

## How to Declare

1. **Before starting a task**, create a statement file:

```bash
# Create statement file
echo "{
  \"id\": \"ds-20260326-01\",
  \"statement\": \"When I complete this task, you will see a working login form\",
  \"created\": \"2026-03-26T10:00:00Z\",
  \"status\": \"pending\",
  \"deliverable_type\": \"code\",
  \"expected_artifacts\": [\"screenshot\", \"test_result\"]
}" > .infogen/statements/ds-20260326-01.json
```

2. **After completing**, update status:

```bash
# Update to verified
echo "{
  ...
  \"status\": \"verified\",
  \"artifacts\": [\".infogen/artifacts/ds-20260326-01-screenshot.png\"]
}" > .infogen/statements/ds-20260326-01.json
```

## Statement Status

- `pending` - Task not yet started
- `in_progress` - Task being worked on
- `verified` - Task complete, artifacts collected
- `failed` - Task failed verification

## Deliverable Types

- `code` - Code/framework changes → video demo, runtime visualization
- `methodology` - Methodology/skill → usage demo, executable docs
- `test` - Test/quality → coverage visualization, test results
- `change` - Change/refactor → before/after comparison, impact diagram
