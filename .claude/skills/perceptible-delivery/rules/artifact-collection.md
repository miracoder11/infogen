# Artifact Collection Rule

## Purpose
Automatically collect verification artifacts during agent execution.

## Artifact Types

1. **Screenshots** - PNG images of key UI states
2. **Logs** - Execution logs with timestamps
3. **Test Results** - JUnit XML format

## Automatic Collection

Artifacts are collected automatically when:
1. Tests pass/fail
2. UI state changes significantly
3. Errors occur

## Manual Collection

```bash
# Collect screenshot
mcp__infogen__collect_artifact --type screenshot --name "login-success"

# Collect test results
mcp__infogen__collect_artifact --type test_result --path "test-results/junit.xml"
```

## Storage Structure

```
.infogen/artifacts/
├── ds-20260326-01-screenshot-01.png
├── ds-20260326-01-screenshot-02.png
├── ds-20260326-01-test-result.xml
└── ds-20260326-01-execution.log
```

## Linking to Statements

Artifacts are automatically linked to active demo statements:

```json
{
  "id": "ds-20260326-01",
  "artifacts": [
    ".infogen/artifacts/ds-20260326-01-screenshot-01.png",
    ".infogen/artifacts/ds-20260326-01-test-result.xml"
  ]
}
```

## Verification Checklist

After collection, verify:
- [ ] Screenshots show expected UI state
- [ ] Logs contain no unexpected errors
- [ ] Test results show all tests passing
