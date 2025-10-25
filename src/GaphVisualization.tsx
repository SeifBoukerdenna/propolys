/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Node, Edge } from './data';
import { GRAPH_CONFIG, NODE_COLORS, NODE_STROKE_COLORS } from './Constants';
import { buildTreeStructure } from './TreeBuilder';



interface EnhancedGraphVisualizationProps {
    nodes: Node[];
    edges: Edge[];
    selectedNode: string | null;
    onNodeSelect: (nodeId: string | null) => void;
}

export function EnhancedGraphVisualization({ nodes, edges, selectedNode, onNodeSelect }: EnhancedGraphVisualizationProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || nodes.length === 0) return;

        const width = window.innerWidth - 400; // Account for sidebar
        const height = window.innerHeight - 200;

        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(80, 40)`);

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent(GRAPH_CONFIG.zoomExtent)
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        svg.call(zoom as any);

        const defs = svg.append('defs');

        // Enhanced glow filter
        const filter = defs.append('filter')
            .attr('id', 'glow')
            .attr('height', '300%')
            .attr('width', '300%')
            .attr('x', '-100%')
            .attr('y', '-100%');

        filter.append('feGaussianBlur')
            .attr('stdDeviation', GRAPH_CONFIG.glowStdDeviation)
            .attr('result', 'coloredBlur');

        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Gradient for links based on confidence
        const gradient = defs.append('linearGradient')
            .attr('id', 'linkGradient')
            .attr('gradientUnits', 'userSpaceOnUse');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#475569');

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#64748b');

        // Arrow markers
        defs.selectAll('marker')
            .data(['normal', 'highlighted'])
            .join('marker')
            .attr('id', d => `arrow-${d}`)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', d => d === 'highlighted' ? '#fff' : '#64748b');

        const treeData = buildTreeStructure(nodes, edges);

        if (!treeData) return;

        const treeLayout = d3.tree()
            .size([height - 100, width - 300])
            .separation((a: any, b: any) => {
                return (a.parent === b.parent ? 1 : 1.5) * GRAPH_CONFIG.treeSeparation;
            });

        const root = d3.hierarchy(treeData);
        treeLayout(root);

        // Draw links with varying thickness based on impact
        const link = g.selectAll('.link')
            .data(root.links())
            .join('path')
            .attr('class', 'link')
            .attr('d', (d: any) => {
                return `M${d.source.y},${d.source.x}
                C${(d.source.y + d.target.y) / 2},${d.source.x}
                 ${(d.source.y + d.target.y) / 2},${d.target.x}
                 ${d.target.y},${d.target.x}`;
            })
            .attr('fill', 'none')
            .attr('stroke', (d: any) => {
                // Find the edge for this link
                const edge = edges.find(e => e.source === d.source.data.id && e.target === d.target.data.id);
                const confidence = edge?.confidence || 0.5;
                return d3.interpolateRgb('#475569', '#94a3b8')(confidence);
            })
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', (d: any) => {
                const edge = edges.find(e => e.source === d.source.data.id && e.target === d.target.data.id);
                const impact = edge?.impact_score || 50;
                return 1 + (impact / 50); // 1-3px based on impact
            })
            .attr('marker-end', 'url(#arrow-normal)');

        // Draw nodes
        const nodeGroup = g.selectAll('.node')
            .data(root.descendants())
            .join('g')
            .attr('class', 'node')
            .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
            .style('cursor', 'pointer');

        // Add outer ring for severity
        nodeGroup.append('circle')
            .attr('r', (d: any) => GRAPH_CONFIG.nodeBaseRadius + (d.data.risk_score / GRAPH_CONFIG.nodeRadiusScale) + 4)
            .attr('fill', 'none')
            .attr('stroke', (d: any) => {
                if (d.data.severity === 'critical') return '#ef4444';
                if (d.data.severity === 'high') return '#f97316';
                return 'transparent';
            })
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,2')
            .style('opacity', (d: any) => d.data.severity ? 0.6 : 0);

        // Main node circle
        nodeGroup.append('circle')
            .attr('r', (d: any) => GRAPH_CONFIG.nodeBaseRadius + (d.data.risk_score / GRAPH_CONFIG.nodeRadiusScale))
            .attr('fill', (d: any) => NODE_COLORS[d.data.type as keyof typeof NODE_COLORS])
            .attr('stroke', (d: any) => NODE_STROKE_COLORS[d.data.type as keyof typeof NODE_STROKE_COLORS])
            .attr('stroke-width', GRAPH_CONFIG.nodeStrokeWidth)
            .style('filter', 'url(#glow)');

        // Risk indicator badge
        nodeGroup.append('text')
            .attr('class', 'risk-badge')
            .attr('x', 0)
            .attr('y', 4)
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', 10)
            .attr('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text((d: any) => d.data.risk_score);

        // Node labels
        nodeGroup.append('text')
            .text((d: any) => d.data.name)
            .attr('font-size', 12)
            .attr('dx', (d: any) => 15 + (d.data.risk_score / GRAPH_CONFIG.nodeRadiusScale))
            .attr('dy', -2)
            .attr('fill', '#cbd5e1')
            .attr('font-weight', 500)
            .style('pointer-events', 'none')
            .style('user-select', 'none');

        // Version/metadata sublabel
        nodeGroup.append('text')
            .text((d: any) => d.data.version || d.data.severity?.toUpperCase() || '')
            .attr('font-size', 9)
            .attr('dx', (d: any) => 15 + (d.data.risk_score / GRAPH_CONFIG.nodeRadiusScale))
            .attr('dy', 10)
            .attr('fill', '#64748b')
            .attr('font-weight', 400)
            .style('pointer-events', 'none')
            .style('user-select', 'none');

        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        nodeGroup.on('click', (event: MouseEvent, d: any) => {
            event.stopPropagation();
            onNodeSelect(d.data.id);

            const descendants = d.descendants().map((n: any) => n.data.id);
            const ancestors = d.ancestors().map((n: any) => n.data.id);
            const connectedIds = new Set([...descendants, ...ancestors]);

            nodeGroup
                .attr('opacity', (n: any) => connectedIds.has(n.data.id) ? 1 : 0.15);

            nodeGroup.selectAll('circle')
                .attr('stroke-width', (n: any) => n.data.id === d.data.id ? GRAPH_CONFIG.selectedStrokeWidth : GRAPH_CONFIG.nodeStrokeWidth);

            link
                .attr('stroke', (l: any) =>
                    (connectedIds.has(l.source.data.id) && connectedIds.has(l.target.data.id)) ? '#94a3b8' : '#475569')
                .attr('stroke-opacity', (l: any) =>
                    (connectedIds.has(l.source.data.id) && connectedIds.has(l.target.data.id)) ? 0.9 : 0.1)
                .attr('stroke-width', (l: any) => {
                    if (connectedIds.has(l.source.data.id) && connectedIds.has(l.target.data.id)) {
                        const edge = edges.find(e => e.source === l.source.data.id && e.target === l.target.data.id);
                        const impact = edge?.impact_score || 50;
                        return 2 + (impact / 33);
                    }
                    return 1;
                })
                .attr('marker-end', (l: any) =>
                    (connectedIds.has(l.source.data.id) && connectedIds.has(l.target.data.id)) ? 'url(#arrow-highlighted)' : 'url(#arrow-normal)');
        });

        svg.on('click', () => {
            onNodeSelect(null);
            nodeGroup.attr('opacity', 1);
            nodeGroup.selectAll('circle').attr('stroke-width', GRAPH_CONFIG.nodeStrokeWidth);
            link
                .attr('stroke', (d: any) => {
                    const edge = edges.find(e => e.source === d.source.data.id && e.target === d.target.data.id);
                    const confidence = edge?.confidence || 0.5;
                    return d3.interpolateRgb('#475569', '#94a3b8')(confidence);
                })
                .attr('stroke-opacity', 0.6)
                .attr('stroke-width', (d: any) => {
                    const edge = edges.find(e => e.source === d.source.data.id && e.target === d.target.data.id);
                    const impact = edge?.impact_score || 50;
                    return 1 + (impact / 50);
                })
                .attr('marker-end', 'url(#arrow-normal)');
        });

        nodeGroup
            .on('mouseenter', (event: MouseEvent, d: any) => {
                const connections = (d.children ? d.children.length : 0) + (d.parent ? 1 : 0);

                tooltip.transition().duration(GRAPH_CONFIG.transitionDuration).style('opacity', 1);
                tooltip.html(`
          <div class="tooltip-title">${d.data.name}</div>
          <div class="tooltip-row"><span>Type:</span> <strong>${d.data.type}</strong></div>
          <div class="tooltip-row"><span>Risk:</span> <strong>${d.data.risk_score}/100</strong></div>
          ${d.data.severity ? `<div class="tooltip-row"><span>Severity:</span> <strong>${d.data.severity.toUpperCase()}</strong></div>` : ''}
          ${d.data.affected_systems ? `<div class="tooltip-row"><span>Affected:</span> <strong>${d.data.affected_systems} systems</strong></div>` : ''}
          <div class="tooltip-row"><span>Connections:</span> <strong>${connections}</strong></div>
        `)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 15) + 'px');

                d3.select(event.currentTarget as Element)
                    .selectAll('circle')
                    .filter((_, i) => i === 1) // Only the main circle
                    .transition()
                    .duration(GRAPH_CONFIG.transitionDuration)
                    .attr('r', (d: any) => (GRAPH_CONFIG.nodeBaseRadius + 2) + (d.data.risk_score / GRAPH_CONFIG.nodeRadiusScale));
            })
            .on('mousemove', (event: MouseEvent) => {
                tooltip
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 15) + 'px');
            })
            .on('mouseleave', (event: MouseEvent) => {
                tooltip.transition().duration(GRAPH_CONFIG.transitionDuration).style('opacity', 0);

                d3.select(event.currentTarget as Element)
                    .selectAll('circle')
                    .filter((_, i) => i === 1)
                    .transition()
                    .duration(GRAPH_CONFIG.transitionDuration)
                    .attr('r', (d: any) => GRAPH_CONFIG.nodeBaseRadius + (d.data.risk_score / GRAPH_CONFIG.nodeRadiusScale));
            });

        return () => {
            tooltip.remove();
        };
    }, [nodes, edges, selectedNode, onNodeSelect]);

    return <svg ref={svgRef}></svg>;
}