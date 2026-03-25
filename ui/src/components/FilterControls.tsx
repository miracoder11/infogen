import { useState, useEffect } from 'react';
import './FilterControls.css';

export interface Filters {
  statementId?: string;
  timeRange?: 'all' | '1h' | '24h' | '7d';
  status?: 'all' | 'ok' | 'error';
}

interface FilterControlsProps {
  projects: string[];
  onChange: (filters: Filters) => void;
}

export function FilterControls({ projects, onChange }: FilterControlsProps) {
  const [filters, setFilters] = useState<Filters>({
    timeRange: 'all',
    status: 'all',
  });

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onChange(newFilters);
  };

  return (
    <div className="filter-controls">
      <div className="filter-group">
        <label htmlFor="project-filter">Project</label>
        <select
          id="project-filter"
          value={filters.statementId || ''}
          onChange={(e) => updateFilter('statementId', e.target.value || undefined)}
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="time-filter">Time Range</label>
        <select
          id="time-filter"
          value={filters.timeRange}
          onChange={(e) => updateFilter('timeRange', e.target.value as Filters['timeRange'])}
        >
          <option value="all">All Time</option>
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="status-filter">Status</label>
        <select
          id="status-filter"
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value as Filters['status'])}
        >
          <option value="all">All Status</option>
          <option value="ok">Success</option>
          <option value="error">Errors</option>
        </select>
      </div>
    </div>
  );
}
