import { useState, useEffect, useRef } from 'react';
import {
  generateMermaidFlowchart,
  generateMermaidSequence,
  generateMermaidState,
  generateMermaidLiveUrl,
  validateMermaidSyntax,
} from '../utils/mermaidGenerator';
import { DiagramData } from '../utils/diagramTransform';
import { ExecutionTrajectory } from '../utils/trajectoryTransform';
import { SerializedTrace } from '../utils/traceTransform';
import './MermaidExport.css';

type DiagramType = 'flowchart' | 'sequence' | 'state';

interface MermaidExportProps {
  diagram: DiagramData;
  trajectory: ExecutionTrajectory;
  trace: SerializedTrace;
  onClose?: () => void;
}

export function MermaidExport({ diagram, trajectory, trace, onClose }: MermaidExportProps) {
  const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Generate code based on selected type
  useEffect(() => {
    let generatedCode = '';
    switch (diagramType) {
      case 'flowchart':
        generatedCode = generateMermaidFlowchart(diagram);
        break;
      case 'sequence':
        generatedCode = generateMermaidSequence(trajectory);
        break;
      case 'state':
        generatedCode = generateMermaidState(trace);
        break;
    }
    setCode(generatedCode);
  }, [diagramType, diagram, trajectory, trace]);

  // Render preview with mermaid.js
  useEffect(() => {
    const renderPreview = async () => {
      if (!previewRef.current) return;

      setPreviewError(null);
      previewRef.current.innerHTML = '';

      // Validate syntax
      const validation = validateMermaidSyntax(code);
      if (!validation.valid) {
        setPreviewError(validation.error || 'Invalid syntax');
        return;
      }

      try {
        // Dynamically import mermaid
        const mermaid = await import('mermaid');
        mermaid.default.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        });

        const { svg } = await mermaid.default.render(`mermaid-${Date.now()}`, code);
        previewRef.current.innerHTML = svg;
      } catch (err) {
        setPreviewError(err instanceof Error ? err.message : 'Preview failed');
      }
    };

    renderPreview();
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trace.traceId.substring(0, 8)}-${diagramType}.mmd`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenLive = () => {
    const url = generateMermaidLiveUrl(code);
    window.open(url, '_blank');
  };

  return (
    <div className="mermaid-export-panel">
      <div className="export-header">
        <h3>Export Diagram</h3>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            Close
          </button>
        )}
      </div>

      <div className="export-type-selector">
        <label>Diagram Type:</label>
        <div className="type-buttons">
          <button
            className={`type-btn ${diagramType === 'flowchart' ? 'active' : ''}`}
            onClick={() => setDiagramType('flowchart')}
          >
            Flowchart
          </button>
          <button
            className={`type-btn ${diagramType === 'sequence' ? 'active' : ''}`}
            onClick={() => setDiagramType('sequence')}
          >
            Sequence
          </button>
          <button
            className={`type-btn ${diagramType === 'state' ? 'active' : ''}`}
            onClick={() => setDiagramType('state')}
          >
            State
          </button>
        </div>
      </div>

      <div className="export-preview">
        <div className="preview-label">Preview:</div>
        {previewError ? (
          <div className="preview-error">
            <span>Preview Error:</span>
            <p>{previewError}</p>
          </div>
        ) : (
          <div className="preview-canvas" ref={previewRef}>
            <div className="preview-loading">Loading preview...</div>
          </div>
        )}
      </div>

      <div className="export-code">
        <div className="code-header">
          <span>Mermaid Code:</span>
        </div>
        <pre className="code-block">
          <code>{code}</code>
        </pre>
      </div>

      <div className="export-actions">
        <button className="action-btn copy" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        <button className="action-btn download" onClick={handleDownload}>
          Download .mmd
        </button>
        <button className="action-btn live" onClick={handleOpenLive}>
          Open in Mermaid Live
        </button>
      </div>
    </div>
  );
}
