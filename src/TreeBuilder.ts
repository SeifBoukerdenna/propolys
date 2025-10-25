/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Edge, Node } from "./data";

export function buildTreeStructure(
  nodes: Node[],
  edges: Edge[],
  rootId: string = "org_mtl"
) {
  const root = nodes.find((n) => n.id === rootId);

  if (!root) return null;

  // Build adjacency list
  const childrenMap = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
  });

  // Build tree recursively
  const buildNode = (nodeId: string, visited = new Set<string>()): any => {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const children = childrenMap.get(nodeId) || [];
    return {
      ...node,
      children: children
        .map((childId) => buildNode(childId, visited))
        .filter((child) => child !== null),
    };
  };

  return buildNode(rootId);
}
