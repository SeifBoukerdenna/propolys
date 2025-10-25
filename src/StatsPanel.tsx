import type { Node } from './data';

interface StatsPanelProps {
    nodes: Node[];
    selectedNode: Node | null;
}

export function StatsPanel({ nodes, selectedNode }: StatsPanelProps) {
    const stats = {
        total: nodes.length,
        organizations: nodes.filter(n => n.type === 'organization').length,
        products: nodes.filter(n => n.type === 'product').length,
        software: nodes.filter(n => n.type === 'software').length,
        vulnerabilities: nodes.filter(n => n.type === 'vulnerability').length,
        critical: nodes.filter(n => n.severity === 'critical').length,
        high: nodes.filter(n => n.severity === 'high').length,
        avgRisk: Math.round(nodes.reduce((sum, n) => sum + n.risk_score, 0) / nodes.length),
    };

    return (
        <div className="stats-panel">
            <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Nodes</div>
            </div>
            <div className="stat-card">
                <div className="stat-value" style={{ color: '#60a5fa' }}>{stats.organizations}</div>
                <div className="stat-label">Organizations</div>
            </div>
            <div className="stat-card">
                <div className="stat-value" style={{ color: '#34d399' }}>{stats.products}</div>
                <div className="stat-label">Products</div>
            </div>
            <div className="stat-card">
                <div className="stat-value" style={{ color: '#fbbf24' }}>{stats.software}</div>
                <div className="stat-label">Software</div>
            </div>
            <div className="stat-card">
                <div className="stat-value" style={{ color: '#f87171' }}>{stats.vulnerabilities}</div>
                <div className="stat-label">Vulnerabilities</div>
            </div>
            <div className="stat-card">
                <div className="stat-value" style={{ color: '#ef4444' }}>{stats.critical}</div>
                <div className="stat-label">Critical</div>
            </div>
            <div className="stat-card">
                <div className="stat-value" style={{ color: '#f97316' }}>{stats.high}</div>
                <div className="stat-label">High Risk</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{stats.avgRisk}</div>
                <div className="stat-label">Avg Risk Score</div>
            </div>
        </div>
    );
}