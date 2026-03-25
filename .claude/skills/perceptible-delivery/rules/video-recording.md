# Video Recording Rule

## Purpose
Record browser interactions as reproducible demo videos.

## Prerequisites
- Phase 4 video capture must be configured
- Playwright must be installed

## How to Record

### Start Recording

```bash
# Via MCP tool (recommended)
mcp__infogen__start_recording --name "login-demo"

# Or programmatically
node dist/video-recorder.js start --name "login-demo"
```

### Stop Recording

```bash
# Via MCP tool
mcp__infogen__stop_recording

# Or programmatically
node dist/video-recorder.js stop
```

## Automatic Triggers

Video recording automatically starts when:
1. Agent navigates to a URL in browser
2. Agent performs form interactions
3. Agent executes UI workflows

## Output

Recordings are stored as:
- `.infogen/videos/{name}.mp4` - Video file
- `.infogen/videos/{name}.json` - Metadata file

## Metadata Format

```json
{
  "name": "login-demo",
  "created": "2026-03-26T10:00:00Z",
  "duration_ms": 15000,
  "resolution": "1280x720",
  "file_size_bytes": 2500000,
  "statement_id": "ds-20260326-01"
}
```

## Best Practices

1. Name recordings semantically (e.g., "user-registration-flow")
2. Link recordings to demo statements
3. Keep recordings under 2 minutes for easy viewing
