import { SearchBar } from './SearchBar';
import { StatsPanel } from './StatsPanel';
import { Controls } from './Controls';
import type { Node } from './data';

interface EnhancedHeaderProps {
    nodes: Node[];
    selectedNode: Node | null;
    filterType: string;
    minRisk: number;
    onFilterChange: (type: string) => void;
    onRiskChange: (risk: number) => void;
    onNodeSelect: (nodeId: string) => void;
}

export function EnhancedHeader({
    nodes,
    selectedNode,
    filterType,
    minRisk,
    onFilterChange,
    onRiskChange,
    onNodeSelect
}: EnhancedHeaderProps) {
    return (
        <>
            <div className="header">
                <div className="header-top">
                    <div className="header-left">
                        <h1>🔒 SecureChain</h1>
                        <div className="subtitle">Supply Chain Risk Intelligence Platform</div>
                    </div>

                    <SearchBar nodes={nodes} onNodeSelect={onNodeSelect} />

                    <Controls
                        filterType={filterType}
                        minRisk={minRisk}
                        onFilterChange={onFilterChange}
                        onRiskChange={onRiskChange}
                    />
                </div>

                <StatsPanel nodes={nodes} selectedNode={selectedNode} />

                <div className="legend">
                    <span className="legend-item"><span className="dot org"></span> Organization</span>
                    <span className="legend-item"><span className="dot prod"></span> Product</span>
                    <span className="legend-item"><span className="dot soft"></span> Software</span>
                    <span className="legend-item"><span className="dot vuln"></span> Vulnerability</span>
                </div>
            </div>
        </>
    );
}