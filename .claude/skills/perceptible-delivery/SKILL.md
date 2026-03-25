# Perceptible Delivery Skill

Enable Claude Code to create observable, verifiable agent outputs.

## Overview

This skill provides tools for:
- Declaring demo statements ("when I complete, you will see...")
- Triggering video recordings of browser interactions
- Collecting verification artifacts (screenshots, logs, test results)

## When to Use

- Before starting a significant task, declare what the user will observe
- When performing browser interactions, record a demo video
- After completing tasks, collect verification artifacts

## Rules

1. **demo-statement.md** - How to declare demo statements
2. **video-recording.md** - How to trigger video recordings
3. **artifact-collection.md** - How to collect verification artifacts

## Quick Reference

```bash
# Declare a demo statement
.ds-20260326-01 "When I complete this task, you will see a working login form"

# Start video recording
/record-start "login-demo"

# Stop video recording
/record-stop

# Collect artifacts
/collect-artifacts
```

## Directory Structure

```
.infogen/
├── statements/     # Demo statement declarations
├── artifacts/      # Collected verification artifacts
└── videos/         # Recorded demo videos
```
