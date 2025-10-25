import type { Edge, Node } from "../data";

export interface PropagationResult {
  affectedNodes: Set<string>;
  propagationPaths: Map<string, string[]>;
  impactLevel: "low" | "medium" | "high" | "critical";
  affectedCount: number;
}

export function calculateRiskPropagation(
  sourceNodeId: string,
  nodes: Node[],
  edges: Edge[],
  maxDepth: number = 3
): PropagationResult {
  const affectedNodes = new Set<string>([sourceNodeId]);
  const propagationPaths = new Map<string, string[]>();
  const queue: Array<{ nodeId: string; path: string[]; depth: number }> = [
    { nodeId: sourceNodeId, path: [sourceNodeId], depth: 0 },
  ];

  // Build adjacency map for faster lookups
  const outgoingMap = new Map<string, Edge[]>();
  const incomingMap = new Map<string, Edge[]>();

  edges.forEach((edge) => {
    if (!outgoingMap.has(edge.source)) outgoingMap.set(edge.source, []);
    if (!incomingMap.has(edge.target)) incomingMap.set(edge.target, []);
    outgoingMap.get(edge.source)!.push(edge);
    incomingMap.get(edge.target)!.push(edge);
  });

  // BFS propagation
  while (queue.length > 0) {
    const { nodeId, path, depth } = queue.shift()!;

    if (depth >= maxDepth) continue;

    // Propagate through dependencies (things that depend on this node)
    const incoming = incomingMap.get(nodeId) || [];
    incoming.forEach((edge) => {
      if (!affectedNodes.has(edge.source)) {
        affectedNodes.add(edge.source);
        const newPath = [...path, edge.source];
        propagationPaths.set(edge.source, newPath);
        queue.push({ nodeId: edge.source, path: newPath, depth: depth + 1 });
      }
    });

    // Propagate through affected_by relations
    const outgoing = outgoingMap.get(nodeId) || [];
    outgoing.forEach((edge) => {
      if (edge.relation === "affected_by" && !affectedNodes.has(edge.target)) {
        affectedNodes.add(edge.target);
        const newPath = [...path, edge.target];
        propagationPaths.set(edge.target, newPath);
        queue.push({ nodeId: edge.target, path: newPath, depth: depth + 1 });
      }
    });
  }

  // Calculate impact level based on affected count and risk scores
  const sourceNode = nodes.find((n) => n.id === sourceNodeId);
  const affectedCount = affectedNodes.size - 1; // Exclude source
  const avgRisk =
    Array.from(affectedNodes)
      .map((id) => nodes.find((n) => n.id === id)?.risk_score || 0)
      .reduce((sum, r) => sum + r, 0) / affectedNodes.size;

  let impactLevel: "low" | "medium" | "high" | "critical" = "low";
  if (affectedCount === 0) impactLevel = "low";
  else if (affectedCount < 3 && avgRisk < 50) impactLevel = "low";
  else if (affectedCount < 5 && avgRisk < 70) impactLevel = "medium";
  else if (affectedCount < 10 || avgRisk < 80) impactLevel = "high";
  else impactLevel = "critical";

  // Override based on source node severity
  if (sourceNode?.severity === "critical" && affectedCount > 0) {
    impactLevel = "critical";
  }

  return {
    affectedNodes,
    propagationPaths,
    impactLevel,
    affectedCount,
  };
}

export function calculateCentrality(
  nodes: Node[],
  edges: Edge[]
): Map<string, number> {
  const centrality = new Map<string, number>();

  // Initialize
  nodes.forEach((node) => centrality.set(node.id, 0));

  // Count connections
  edges.forEach((edge) => {
    centrality.set(edge.source, (centrality.get(edge.source) || 0) + 1);
    centrality.set(edge.target, (centrality.get(edge.target) || 0) + 1);
  });

  return centrality;
}

export function calculateRiskWeightedCentrality(
  nodes: Node[],
  edges: Edge[]
): Map<string, number> {
  const riskCentrality = new Map<string, number>();

  nodes.forEach((node) => {
    // Get all neighbors
    const neighbors = new Set<string>();
    edges.forEach((edge) => {
      if (edge.source === node.id) neighbors.add(edge.target);
      if (edge.target === node.id) neighbors.add(edge.source);
    });

    // Calculate risk-weighted score
    const neighborRisks = Array.from(neighbors).map(
      (nId) => nodes.find((n) => n.id === nId)?.risk_score || 0
    );

    const avgNeighborRisk =
      neighborRisks.length > 0
        ? neighborRisks.reduce((sum, r) => sum + r, 0) / neighborRisks.length
        : 0;

    const score = neighbors.size * (1 + avgNeighborRisk / 100);
    riskCentrality.set(node.id, score);
  });

  return riskCentrality;
}
