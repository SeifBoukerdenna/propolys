interface PropagationControlsProps {
  propagationDepth: number;
  onDepthChange: (depth: number) => void;
  isPropagating: boolean;
  affectedCount: number;
  onReset: () => void;
}

export function PropagationControls({
  propagationDepth,
  onDepthChange,
  isPropagating,
  affectedCount,
  onReset,
}: PropagationControlsProps) {
  return (
    <div className="propagation-controls">
      <div className="control-group">
        <label>Propagation Depth</label>
        <div className="depth-selector">
          {[1, 2, 3].map((depth) => (
            <button
              key={depth}
              className={`depth-btn ${propagationDepth === depth ? "active" : ""
                }`}
              onClick={() => onDepthChange(depth)}
            >
              {depth} {depth === 1 ? "hop" : "hops"}
            </button>
          ))}
        </div>
      </div>

      {isPropagating && (
        <div className="propagation-status">
          <span className="status-indicator pulsing"></span>
          <span className="status-text">
            {affectedCount} {affectedCount === 1 ? "node" : "nodes"} affected
          </span>
          <button className="reset-btn" onClick={onReset}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
