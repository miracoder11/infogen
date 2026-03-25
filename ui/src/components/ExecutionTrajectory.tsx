import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ExecutionTrajectory,
  TrajectoryStep,
  transformToTrajectory,
  flattenSteps,
  getStepAtTime,
} from '../utils/trajectoryTransform';
import { SerializedTrace, formatDuration } from '../utils/traceTransform';
import './ExecutionTrajectory.css';

interface ExecutionTrajectoryProps {
  traceId: string;
  onStepSelect?: (stepId: string) => void;
  selectedStepId?: string | null;
}

type PlaybackSpeed = 0.5 | 1 | 2;

export function ExecutionTrajectory({
  traceId,
  onStepSelect,
  selectedStepId,
}: ExecutionTrajectoryProps) {
  const [trace, setTrace] = useState<SerializedTrace | null>(null);
  const [trajectory, setTrajectory] = useState<ExecutionTrajectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flatSteps, setFlatSteps] = useState<TrajectoryStep[]>([]);
  const [collapsedSteps, setCollapsedSteps] = useState<Set<string>>(new Set());

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const playbackRef = useRef<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/traces/${traceId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch trace');
        return res.json();
      })
      .then((data: SerializedTrace) => {
        setTrace(data);
        const traj = transformToTrajectory(data);
        setTrajectory(traj);
        setFlatSteps(flattenSteps(traj.steps));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [traceId]);

  // Playback animation
  useEffect(() => {
    if (isPlaying && trajectory) {
      const totalDuration = trajectory.totalDuration;
      const interval = 50; // Update every 50ms
      const increment = (interval * playbackSpeed);

      playbackRef.current = window.setInterval(() => {
        setPlaybackTime((prev) => {
          const next = prev + increment;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
      }, interval);
    }

    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, trajectory]);

  const handleStepClick = useCallback(
    (stepId: string) => {
      onStepSelect?.(stepId);
    },
    [onStepSelect]
  );

  const toggleCollapse = useCallback((stepId: string) => {
    setCollapsedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (playbackTime >= (trajectory?.totalDuration || 0)) {
        setPlaybackTime(0);
      }
      setIsPlaying(true);
    }
  };

  const handleStepForward = () => {
    if (!trajectory) return;
    const currentStep = getStepAtTime(trajectory, playbackTime);
    if (currentStep) {
      const nextTime = currentStep.startTime + currentStep.duration + 1;
      setPlaybackTime(Math.min(nextTime, trajectory.totalDuration));
    }
  };

  const handleStepBackward = () => {
    if (!trajectory) return;
    const newTime = Math.max(0, playbackTime - 100);
    setPlaybackTime(newTime);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPlaybackTime(0);
  };

  const handleSpeedChange = (speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaybackTime(Number(e.target.value));
  };

  if (loading) return <div className="trajectory-loading">Loading trajectory...</div>;
  if (error) return <div className="trajectory-error">Error: {error}</div>;
  if (!trajectory || flatSteps.length === 0)
    return <div className="trajectory-empty">No execution data</div>;

  const currentStep = getStepAtTime(trajectory, playbackTime);

  return (
    <div className="trajectory-container">
      <div className="trajectory-header">
        <h3>Execution Trajectory</h3>
        <div className="trajectory-stats">
          <span>{flatSteps.length} steps</span>
          <span>{formatDuration(trajectory.totalDuration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="playback-controls">
        <div className="playback-buttons">
          <button onClick={handleReset} title="Reset">
            Reset
          </button>
          <button onClick={handleStepBackward} title="Step Back">
            Prev
          </button>
          <button onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={handleStepForward} title="Step Forward">
            Next
          </button>
        </div>

        <div className="playback-speed">
          <span>Speed:</span>
          {[0.5, 1, 2].map((speed) => (
            <button
              key={speed}
              className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
              onClick={() => handleSpeedChange(speed as PlaybackSpeed)}
            >
              {speed}x
            </button>
          ))}
        </div>

        <div className="playback-progress">
          <input
            type="range"
            min={0}
            max={trajectory.totalDuration}
            value={playbackTime}
            onChange={handleSliderChange}
            className="progress-slider"
          />
          <div className="progress-time">
            {formatDuration(playbackTime)} / {formatDuration(trajectory.totalDuration)}
          </div>
        </div>
      </div>

      {/* Timeline Progress Bar */}
      <div className="timeline-progress">
        <div
          className="timeline-progress-fill"
          style={{ width: `${(playbackTime / trajectory.totalDuration) * 100}%` }}
        />
      </div>

      {/* Step List */}
      <div className="step-list">
        {flatSteps.map((step) => (
          <StepCard
            key={step.spanId}
            step={step}
            isCurrent={currentStep?.spanId === step.spanId}
            isSelected={selectedStepId === step.spanId}
            isCollapsed={collapsedSteps.has(step.spanId)}
            hasChildren={step.children.length > 0}
            onClick={() => handleStepClick(step.spanId)}
            onToggleCollapse={() => toggleCollapse(step.spanId)}
            playbackTime={playbackTime}
          />
        ))}
      </div>

      {/* Current Step Info */}
      {currentStep && (
        <div className="current-step-info">
          <span className="current-label">Current:</span>
          <span className="current-name">{currentStep.label}</span>
          <span className="current-duration">{formatDuration(currentStep.duration)}</span>
        </div>
      )}
    </div>
  );
}

interface StepCardProps {
  step: TrajectoryStep;
  isCurrent: boolean;
  isSelected: boolean;
  isCollapsed: boolean;
  hasChildren: boolean;
  onClick: () => void;
  onToggleCollapse: () => void;
  playbackTime: number;
}

function StepCard({
  step,
  isCurrent,
  isSelected,
  isCollapsed,
  hasChildren,
  onClick,
  onToggleCollapse,
  playbackTime,
}: StepCardProps) {
  const stepEnd = step.startTime + step.duration;
  const isActive = playbackTime >= step.startTime && playbackTime < stepEnd;
  const isCompleted = playbackTime >= stepEnd;

  return (
    <div
      className={`step-card branch-${step.branch} ${isCurrent ? 'current' : ''} ${
        isSelected ? 'selected' : ''
      } ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
      style={{ paddingLeft: `${step.depth * 20 + 12}px` }}
    >
      <div className="step-content" onClick={onClick}>
        {hasChildren && (
          <button
            className="collapse-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
          >
            {isCollapsed ? '+' : '-'}
          </button>
        )}

        <div className="step-indicator">
          <span className={`status-dot ${step.status}`} />
          <span className="step-order">{step.order + 1}</span>
        </div>

        <div className="step-info">
          <span className="step-label">{step.label}</span>
          <span className="step-duration">{formatDuration(step.duration)}</span>
        </div>

        <div className="step-timing">
          <span className="step-start">{formatDuration(step.startTime)}</span>
        </div>
      </div>

      {/* Progress indicator for active step */}
      {isActive && (
        <div className="step-progress">
          <div
            className="step-progress-fill"
            style={{
              width: `${((playbackTime - step.startTime) / step.duration) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
