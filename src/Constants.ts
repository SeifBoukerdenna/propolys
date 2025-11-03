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
  nodeBaseRadius: 12, // Increased from 10
  nodeRadiusScale: 6, // Adjusted from 7
  linkStrokeWidth: 2,
  highlightedLinkWidth: 4,
  nodeStrokeWidth: 2.5, // Reduced from 3
  selectedStrokeWidth: 5,
  glowStdDeviation: 3, // Reduced from 4
  zoomExtent: [0.1, 4] as [number, number],
  treeSeparation: 2.8, // Increased from 1.5
  transitionDuration: 150,
};
