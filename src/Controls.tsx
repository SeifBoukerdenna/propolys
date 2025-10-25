interface ControlsProps {
    filterType: string;
    minRisk: number;
    onFilterChange: (type: string) => void;
    onRiskChange: (risk: number) => void;
}

export function Controls({ filterType, minRisk, onFilterChange, onRiskChange }: ControlsProps) {
    return (
        <div className="controls">
            <select value={filterType} onChange={(e) => onFilterChange(e.target.value)}>
                <option value="all">All Types</option>
                <option value="organization">Organizations</option>
                <option value="product">Products</option>
                <option value="software">Software</option>
                <option value="vulnerability">Vulnerabilities</option>
            </select>

            <div className="risk-control">
                <label>Min Risk: {minRisk}</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={minRisk}
                    onChange={(e) => onRiskChange(Number(e.target.value))}
                />
            </div>
        </div>
    );
}