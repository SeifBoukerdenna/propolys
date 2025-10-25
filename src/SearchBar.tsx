import { useState } from 'react';
import type { Node } from './data';

interface SearchBarProps {
    nodes: Node[];
    onNodeSelect: (nodeId: string) => void;
}

export function SearchBar({ nodes, onNodeSelect }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Node[]>([]);
    const [showResults, setShowResults] = useState(false);

    const handleSearch = (value: string) => {
        setQuery(value);
        if (value.trim().length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        const filtered = nodes.filter(n =>
            n.name.toLowerCase().includes(value.toLowerCase()) ||
            n.description?.toLowerCase().includes(value.toLowerCase()) ||
            n.vendor?.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 8);

        setResults(filtered);
        setShowResults(true);
    };

    const selectNode = (nodeId: string) => {
        onNodeSelect(nodeId);
        setShowResults(false);
        setQuery('');
    };

    return (
        <div className="search-container">
            <input
                type="text"
                className="search-input"
                placeholder="Search nodes..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
            {showResults && results.length > 0 && (
                <div className="search-results">
                    {results.map(node => (
                        <div
                            key={node.id}
                            className="search-result-item"
                            onClick={() => selectNode(node.id)}
                        >
                            <div className="result-name">{node.name}</div>
                            <div className="result-type">{node.type}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}