import { useState, useMemo } from 'react';
import './App.css';
import { graphData } from './data';
import { EnhancedHeader } from './Header';
import { EnhancedGraphVisualization } from './GaphVisualization';
import { NodeDetailsSidebar } from './NodeDetailsSidebar';

function App() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [minRisk, setMinRisk] = useState<number>(0);

  const filteredData = useMemo(() => {
    const filteredNodes = graphData.nodes.filter(n =>
      (filterType === 'all' || n.type === filterType) &&
      n.risk_score >= minRisk
    );

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graphData.edges.filter(e =>
      nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [filterType, minRisk]);

  const selectedNode = useMemo(() =>
    selectedNodeId ? graphData.nodes.find(n => n.id === selectedNodeId) || null : null,
    [selectedNodeId]
  );

  const connections = useMemo(() => {
    if (!selectedNodeId) return { incoming: [], outgoing: [] };

    return {
      incoming: graphData.edges.filter(e => e.target === selectedNodeId),
      outgoing: graphData.edges.filter(e => e.source === selectedNodeId)
    };
  }, [selectedNodeId]);

  return (
    <div className="app">
      <EnhancedHeader
        nodes={filteredData.nodes}
        selectedNode={selectedNode}
        filterType={filterType}
        minRisk={minRisk}
        onFilterChange={setFilterType}
        onRiskChange={setMinRisk}
        onNodeSelect={setSelectedNodeId}
      />

      <div className="main-content">
        <EnhancedGraphVisualization
          nodes={filteredData.nodes}
          edges={filteredData.edges}
          selectedNode={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
        />

        <NodeDetailsSidebar
          node={selectedNode}
          connections={connections}
          onClose={() => setSelectedNodeId(null)}
        />
      </div>
    </div>
  );
}

export default App;