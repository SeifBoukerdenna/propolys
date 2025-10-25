import type { Node, Edge } from './data';

interface NodeDetailsSidebarProps {
    node: Node | null;
    connections: { incoming: Edge[]; outgoing: Edge[] };
    onClose: () => void;
}

export function NodeDetailsSidebar({ node, connections, onClose }: NodeDetailsSidebarProps) {
    if (!node) return null;

    const getSeverityColor = (severity?: string) => {
        switch (severity) {
            case 'critical': return '#ef4444';
            case 'high': return '#f97316';
            case 'medium': return '#f59e0b';
            case 'low': return '#84cc16';
            default: return '#64748b';
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 80) return '#ef4444';
        if (score >= 60) return '#f97316';
        if (score >= 40) return '#f59e0b';
        return '#84cc16';
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>Node Details</h2>
                <button onClick={onClose} className="close-btn">✕</button>
            </div>

            <div className="sidebar-content">
                <div className="node-badge" style={{ background: getSeverityColor(node.severity) }}>
                    {node.type.toUpperCase()}
                </div>

                <h3 className="node-name">{node.name}</h3>

                {node.description && (
                    <p className="node-description">{node.description}</p>
                )}

                <div className="risk-section">
                    <div className="risk-header">
                        <span>Risk Score</span>
                        <span className="risk-value" style={{ color: getRiskColor(node.risk_score) }}>
                            {node.risk_score}/100
                        </span>
                    </div>
                    <div className="risk-bar">
                        <div
                            className="risk-fill"
                            style={{
                                width: `${node.risk_score}%`,
                                background: getRiskColor(node.risk_score)
                            }}
                        />
                    </div>
                </div>

                <div className="metadata-grid">
                    {node.version && (
                        <div className="metadata-item">
                            <span className="meta-label">Version</span>
                            <span className="meta-value">{node.version}</span>
                        </div>
                    )}
                    {node.vendor && (
                        <div className="metadata-item">
                            <span className="meta-label">Vendor</span>
                            <span className="meta-value">{node.vendor}</span>
                        </div>
                    )}
                    {node.severity && (
                        <div className="metadata-item">
                            <span className="meta-label">Severity</span>
                            <span className="meta-value severity" style={{ color: getSeverityColor(node.severity) }}>
                                {node.severity.toUpperCase()}
                            </span>
                        </div>
                    )}
                    {node.affected_systems && (
                        <div className="metadata-item">
                            <span className="meta-label">Affected Systems</span>
                            <span className="meta-value">{node.affected_systems}</span>
                        </div>
                    )}
                    {node.last_updated && (
                        <div className="metadata-item">
                            <span className="meta-label">Last Updated</span>
                            <span className="meta-value">{node.last_updated}</span>
                        </div>
                    )}
                </div>

                <div className="connections-section">
                    <h4>Dependencies ({connections.outgoing.length})</h4>
                    {connections.outgoing.length > 0 ? (
                        <div className="connection-list">
                            {connections.outgoing.map((edge, idx) => (
                                <div key={idx} className="connection-item">
                                    <span className="connection-type">{edge.relation}</span>
                                    <div className="connection-meta">
                                        <span>Confidence: {((edge.confidence || 0) * 100).toFixed(0)}%</span>
                                        {edge.impact_score && <span>Impact: {edge.impact_score}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-data">No outgoing dependencies</p>
                    )}
                </div>

                <div className="connections-section">
                    <h4>Used By ({connections.incoming.length})</h4>
                    {connections.incoming.length > 0 ? (
                        <div className="connection-list">
                            {connections.incoming.map((edge, idx) => (
                                <div key={idx} className="connection-item">
                                    <span className="connection-type">{edge.relation}</span>
                                    <div className="connection-meta">
                                        <span>Confidence: {((edge.confidence || 0) * 100).toFixed(0)}%</span>
                                        {edge.impact_score && <span>Impact: {edge.impact_score}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-data">No incoming dependencies</p>
                    )}
                </div>
            </div>
        </div>
    );
}