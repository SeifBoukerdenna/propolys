import { useState, useMemo } from 'react';
import './App.css';
import { graphData } from './data';
import { EnhancedHeader } from './Header';
import { EnhancedGraphVisualization } from './GaphVisualization';
import { NodeDetailsSidebar } from './NodeDetailsSidebar';
import { calculateRiskPropagation } from './utils/riskPropagation';
import { PropagationControls } from './components/PropagationControls';
import { InsightsPanel } from './components/InsightsPanel';

function App() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [minRisk, setMinRisk] = useState<number>(0);
  const [propagationDepth, setPropagationDepth] = useState<number>(2);
  const [showInsights, setShowInsights] = useState<boolean>(true);

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

  // Calculate risk propagation
  const propagationResult = useMemo(() => {
    if (!selectedNodeId || !selectedNode) return null;

    // Only propagate for vulnerabilities or high-risk nodes
    if (selectedNode.type !== 'vulnerability' && selectedNode.risk_score < 60) return null;

    return calculateRiskPropagation(
      selectedNodeId,
      graphData.nodes,
      graphData.edges,
      propagationDepth
    );
  }, [selectedNodeId, selectedNode, propagationDepth]);

  const handleResetPropagation = () => {
    setSelectedNodeId(null);
  };

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

      <div className="controls-bar">
        <PropagationControls
          propagationDepth={propagationDepth}
          onDepthChange={setPropagationDepth}
          isPropagating={!!propagationResult}
          affectedCount={propagationResult?.affectedCount || 0}
          onReset={handleResetPropagation}
        />

        <button
          className="toggle-insights-btn"
          onClick={() => setShowInsights(!showInsights)}
        >
          {showInsights ? '📊 Hide' : '📊 Show'} Insights
        </button>
      </div>

      <div className="main-content">
        {showInsights && (
          <InsightsPanel
            nodes={filteredData.nodes}
            edges={filteredData.edges}
            propagationActive={!!propagationResult}
            affectedCount={propagationResult?.affectedCount}
            impactLevel={propagationResult?.impactLevel}
          />
        )}

        <EnhancedGraphVisualization
          nodes={filteredData.nodes}
          edges={filteredData.edges}
          selectedNode={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
          affectedNodes={propagationResult?.affectedNodes}
          propagationPaths={propagationResult?.propagationPaths}
        />

        <NodeDetailsSidebar
          node={selectedNode}
          connections={connections}
          onClose={() => setSelectedNodeId(null)}
          propagationResult={propagationResult}
        />
      </div>
    </div>
  );
}

export default App;