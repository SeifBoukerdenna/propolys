export const NODE_COLORS = {
  organization: "#60a5fa",
  product: "#34d399",
  software: "#fbbf24",
  vulnerability: "#f87171",
} as const;

export const NODE_STROKE_COLORS = {
  organization: "#3b82f6",
  product: "#10b981",
  software: "#f59e0b",
  vulnerability: "#ef4444",
} as const;

export const GRAPH_CONFIG = {
  nodeBaseRadius: 10,
  nodeRadiusScale: 7,
  linkStrokeWidth: 2,
  highlightedLinkWidth: 4,
  nodeStrokeWidth: 3,
  selectedStrokeWidth: 5,
  glowStdDeviation: 4,
  zoomExtent: [0.1, 4] as [number, number],
  treeSeparation: 1.5,
  transitionDuration: 150,
};
