import { useMemo } from 'react';
import type { Edge, Node } from '../data';


interface InsightsPanelProps {
    nodes: Node[];
    edges: Edge[];
    propagationActive: boolean;
    affectedCount?: number;
    impactLevel?: string;
}

export function InsightsPanel({ nodes, edges, propagationActive, affectedCount, impactLevel }: InsightsPanelProps) {
    const insights = useMemo(() => {
        const criticalNodes = nodes.filter(n => n.severity === 'critical');
        const highRiskNodes = nodes.filter(n => n.risk_score >= 70);
        const vulnerabilities = nodes.filter(n => n.type === 'vulnerability');

        // Find critical dependency chains (paths longer than 2 hops)
        const chains: string[] = [];
        const visited = new Set<string>();

        const findChains = (nodeId: string, path: string[] = [], depth = 0) => {
            if (depth > 3 || visited.has(nodeId)) return;
            visited.add(nodeId);

            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;

            const newPath = [...path, node.name];

            const outgoing = edges.filter(e => e.source === nodeId);
            if (outgoing.length === 0 && newPath.length >= 3) {
                chains.push(newPath.join(' → '));
            }

            outgoing.forEach(edge => findChains(edge.target, newPath, depth + 1));
        };

        const orgs = nodes.filter(n => n.type === 'organization');
        orgs.forEach(org => {
            visited.clear();
            findChains(org.id);
        });

        return {
            criticalCount: criticalNodes.length,
            highRiskCount: highRiskNodes.length,
            vulnCount: vulnerabilities.length,
            totalNodes: nodes.length,
            totalEdges: edges.length,
            avgRisk: Math.round(nodes.reduce((sum, n) => sum + n.risk_score, 0) / nodes.length),
            criticalChains: chains.slice(0, 3),
            hasHighExposure: highRiskNodes.length > 3 || criticalNodes.length > 0,
            hasCascadeRisk: vulnerabilities.some(v => {
                const affected = edges.filter(e => e.source === v.id && e.relation === 'affected_by');
                return affected.length > 2;
            })
        };
    }, [nodes, edges]);

    const getExposureLevel = () => {
        if (insights.criticalCount > 0) return 'critical';
        if (insights.highRiskCount > 5) return 'high';
        if (insights.highRiskCount > 2) return 'medium';
        return 'low';
    };

    const exposureLevel = getExposureLevel();

    return (
        <div className="insights-panel">
            <div className="insights-header">
                <div className="insights-title">
                    <span className="insights-icon">🧠</span>
                    <h3>Risk Intelligence</h3>
                </div>
                <div className={`exposure-badge ${exposureLevel}`}>
                    {exposureLevel.toUpperCase()} EXPOSURE
                </div>
            </div>

            {propagationActive && affectedCount !== undefined && (
                <div className={`propagation-alert ${impactLevel}`}>
                    <div className="alert-icon">⚠️</div>
                    <div className="alert-content">
                        <strong>Active Propagation Simulation</strong>
                        <p>{affectedCount} {affectedCount === 1 ? 'entity' : 'entities'} affected • {impactLevel} impact</p>
                    </div>
                </div>
            )}

            <div className="insights-summary">
                <p>
                    Your ecosystem contains <strong>{insights.totalNodes} entities</strong> with{' '}
                    <strong>{insights.totalEdges} dependencies</strong>.
                </p>

                {insights.criticalCount > 0 && (
                    <p className="insight-warning">
                        🚨 <strong>{insights.criticalCount}</strong> critical {insights.criticalCount === 1 ? 'vulnerability' : 'vulnerabilities'} detected
                    </p>
                )}

                {insights.hasHighExposure && (
                    <p className="insight-warning">
                        ⚠️ High systemic exposure detected across <strong>{insights.highRiskCount}</strong> high-risk nodes
                    </p>
                )}

                {insights.hasCascadeRisk && (
                    <p className="insight-warning">
                        🔗 Cascade risk scenario likely — vulnerabilities affect multiple organizations
                    </p>
                )}

                <p className="insight-metric">
                    Average risk score: <strong>{insights.avgRisk}/100</strong>
                </p>
            </div>

            {insights.criticalChains.length > 0 && (
                <div className="critical-chains">
                    <h4>Critical Dependency Chains</h4>
                    {insights.criticalChains.map((chain, idx) => (
                        <div key={idx} className="chain-item">
                            <span className="chain-icon">🔗</span>
                            <span className="chain-path">{chain}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="insights-recommendations">
                <h4>Recommended Actions</h4>
                <ul>
                    {insights.criticalCount > 0 && (
                        <li>🎯 Prioritize patching {insights.criticalCount} critical {insights.criticalCount === 1 ? 'vulnerability' : 'vulnerabilities'}</li>
                    )}
                    {insights.hasHighExposure && (
                        <li>📊 Conduct deep-dive audit on high-risk suppliers</li>
                    )}
                    {insights.hasCascadeRisk && (
                        <li>🛡️ Implement additional controls for cascade scenarios</li>
                    )}
                    <li>🔍 Review supply chain contracts for security clauses</li>
                </ul>
            </div>
        </div>
    );
}