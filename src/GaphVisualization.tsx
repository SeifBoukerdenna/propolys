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
    affectedNodes?: Set<string>;
    propagationPaths?: Map<string, string[]>;
}

export function EnhancedGraphVisualization({
    nodes,
    edges,
    selectedNode,
    onNodeSelect,
    affectedNodes,
    propagationPaths
}: EnhancedGraphVisualizationProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || nodes.length === 0) return;

        const width = window.innerWidth - (affectedNodes ? 800 : 400);
        const height = window.innerHeight - 250;

        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g');

        // Zoom ONLY on background/wheel - not on nodes
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent(GRAPH_CONFIG.zoomExtent)
            .wheelDelta((event: any) => -event.deltaY * 0.001)
            .filter((event: any) => {
                // Block ALL node interactions from zoom
                const target = event.target as Element;
                if (target.closest('.node')) return false;
                if (event.type === 'dblclick') return false;
                return true;
            })
            .on('zoom', (event) => g.attr('transform', event.transform));

        svg.call(zoom as any);

        // Reset button
        const resetBtn = svg.append('g')
            .attr('class', 'reset-view-btn')
            .attr('transform', `translate(${width - 60}, 20)`)
            .style('cursor', 'pointer')
            .on('click', function (event) {
                event.stopPropagation();
                svg.transition().duration(750)
                    .call(zoom.transform as any, d3.zoomIdentity.translate(80, 40));
            });

        resetBtn.append('rect')
            .attr('width', 40).attr('height', 40).attr('rx', 8)
            .attr('fill', '#1e293b').attr('stroke', '#334155').attr('stroke-width', 2);

        resetBtn.append('text')
            .attr('x', 20).attr('y', 25).attr('text-anchor', 'middle')
            .attr('fill', '#cbd5e1').attr('font-size', 18).text('⌂');

        resetBtn.on('mouseenter', function () {
            d3.select(this).select('rect').transition().duration(150)
                .attr('fill', '#334155').attr('stroke', '#60a5fa');
        }).on('mouseleave', function () {
            d3.select(this).select('rect').transition().duration(150)
                .attr('fill', '#1e293b').attr('stroke', '#334155');
        });

        // Defs
        const defs = svg.append('defs');

        const filter = defs.append('filter').attr('id', 'glow')
            .attr('height', '300%').attr('width', '300%').attr('x', '-100%').attr('y', '-100%');
        filter.append('feGaussianBlur').attr('stdDeviation', GRAPH_CONFIG.glowStdDeviation).attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        const propFilter = defs.append('filter').attr('id', 'propagation-glow')
            .attr('height', '400%').attr('width', '400%').attr('x', '-150%').attr('y', '-150%');
        propFilter.append('feGaussianBlur').attr('stdDeviation', 8).attr('result', 'coloredBlur');
        const propMerge = propFilter.append('feMerge');
        propMerge.append('feMergeNode').attr('in', 'coloredBlur');
        propMerge.append('feMergeNode').attr('in', 'coloredBlur');
        propMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        defs.selectAll('marker').data([
            { id: 'normal', color: '#64748b' },
            { id: 'highlighted', color: '#94a3b8' },
            { id: 'propagation', color: '#f87171' }
        ]).join('marker')
            .attr('id', d => `arrow-${d.id}`).attr('viewBox', '0 -5 10 10')
            .attr('refX', 20).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
            .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', d => d.color);

        // Tree
        const treeData = buildTreeStructure(nodes, edges);
        if (!treeData) return;

        const treeLayout = d3.tree().size([height - 100, width - 300])
            .separation((a: any, b: any) => (a.parent === b.parent ? 1 : 1.5) * GRAPH_CONFIG.treeSeparation);

        const root = d3.hierarchy(treeData);
        treeLayout(root);
        g.attr('transform', 'translate(80, 40)');

        // Links
        const link = g.selectAll('.link').data(root.links()).join('path').attr('class', 'link')
            .attr('d', (d: any) => `M${d.source.y},${d.source.x}C${(d.source.y + d.target.y) / 2},${d.source.x} ${(d.source.y + d.target.y) / 2},${d.target.x} ${d.target.y},${d.target.x}`)
            .attr('fill', 'none')
            .attr('stroke', (d: any) => {
                if (affectedNodes?.has(d.source.data.id) && affectedNodes?.has(d.target.data.id)) return '#f87171';
                const edge = edges.find(e => e.source === d.source.data.id && e.target === d.target.data.id);
                return d3.interpolateRgb('#475569', '#94a3b8')(edge?.confidence || 0.5);
            })
            .attr('stroke-opacity', (d: any) => affectedNodes?.has(d.source.data.id) && affectedNodes?.has(d.target.data.id) ? 0.8 : 0.6)
            .attr('stroke-width', (d: any) => {
                if (affectedNodes?.has(d.source.data.id) && affectedNodes?.has(d.target.data.id)) return 3;
                const edge = edges.find(e => e.source === d.source.data.id && e.target === d.target.data.id);
                return 1 + ((edge?.impact_score || 50) / 50);
            })
            .attr('stroke-dasharray', (d: any) => {
                const edge = edges.find(e => e.source === d.source.data.id && e.target === d.target.data.id);
                return edge?.relation === 'supplies_to' ? '5,5' : 'none';
            })
            .attr('marker-end', (d: any) =>
                affectedNodes?.has(d.source.data.id) && affectedNodes?.has(d.target.data.id) ? 'url(#arrow-propagation)' : 'url(#arrow-normal)')
            .style('animation', (d: any) =>
                affectedNodes?.has(d.source.data.id) && affectedNodes?.has(d.target.data.id) ? 'pulse-link 2s ease-in-out infinite' : 'none');

        // Nodes
        const nodeGroup = g.selectAll('.node').data(root.descendants()).join('g')
            .attr('class', 'node')
            .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
            .style('cursor', 'pointer');

        // Rings
        nodeGroup.append('circle').attr('class', 'node-ring')
            .attr('r', (d: any) => GRAPH_CONFIG.nodeBaseRadius + (d.data.risk_score / GRAPH_CONFIG.nodeRadiusScale) + 4)
            .attr('fill', 'none')
            .attr('stroke', (d: any) => {
                if (affectedNodes?.has(d.data.id) && d.data.id !== selectedNode) return '#f87171';
                if (d.data.severity === 'critical') return '#ef4444';
                if (d.data.severity === 'high') return '#f97316';
                return 'transparent';
            })
            .attr('stroke-width', (d: any) => affectedNodes?.has(d.data.id) ? 3 : 2)
            .attr('stroke-dasharray', '4,2')
            .style('opacity', (d: any) => affectedNodes?.has(d.data.id) ? 1 : (d.data.severity ? 0.6 : 0))
            .style('animation', (d: any) =>
                affectedNodes?.has(d.data.id) && d.data.id !== selectedNode ? 'pulse-ring 2s ease-in-out infinite' : 'none');

        // Main circles
        nodeGroup.append('circle').attr('class', 'node-main')
            .attr('r', (d: any) => GRAPH_CONFIG.nodeBaseRadius + (d.data.risk_score / GRAPH_CONFIG.nodeRadiusScale))
            .attr('fill', (d: any) => NODE_COLORS[d.data.type as keyof typeof NODE_COLORS])
            .attr('stroke', (d: any) => affectedNodes?.has(d.data.id) ? '#fca5a5' : NODE_STROKE_COLORS[d.data.type as keyof typeof NODE_STROKE_COLORS])
            .attr('stroke-width', (d: any) => affectedNodes?.has(d.data.id) ? 4 : GRAPH_CONFIG.nodeStrokeWidth)
            .style('filter', (d: any) => affectedNodes?.has(d.data.id) ? 'url(#propagation-glow)' : 'url(#glow)');

        // Text
        nodeGroup.append('text').attr('class', 'risk-badge')
            .attr('x', 0).attr('y', 4).attr('text-anchor', 'middle').attr('fill', '#fff')
            .attr('font-size', 10).attr('font-weight', 'bold').style('pointer-events', 'none')
            .text((d: any) => d.data.risk_score);

        nodeGroup.append('text').attr('class', 'node-label')
            .text((d: any) => d.data.name).attr('font-size', 12)
            .attr('dx', (d: any) => 15 + (d.data.risk_score / GRAPH_CONFIG.nodeRadiusScale)).attr('dy', -2)
            .attr('fill', (d: any) => affectedNodes?.has(d.data.id) ? '#fca5a5' : '#cbd5e1')
            .attr('font-weight', (d: any) => affectedNodes?.has(d.data.id) ? 600 : 500)
            .style('pointer-events', 'none').style('user-select', 'none');

        nodeGroup.append('text').attr('class', 'node-sublabel')
            .text((d: any) => d.data.version || d.data.severity?.toUpperCase() || '').attr('font-size', 9)
            .attr('dx', (d: any) => 15 + (d.data.risk_score / GRAPH_CONFIG.nodeRadiusScale)).attr('dy', 10)
            .attr('fill', '#64748b').attr('font-weight', 400)
            .style('pointer-events', 'none').style('user-select', 'none');

        const tooltip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);

        // Focus zoom
        const focusNode = (d: any) => {
            const scale = 1.5, x = -d.y * scale + width / 2, y = -d.x * scale + height / 2;
            svg.transition().duration(750).ease(d3.easeCubicInOut)
                .call(zoom.transform as any, d3.zoomIdentity.translate(x, y).scale(scale));
        };

        // Click - NO AUTO-PAN
        nodeGroup.on('click', function (event: MouseEvent, d: any) {
            event.stopPropagation();
            event.preventDefault();

            onNodeSelect(d.data.id);
            const descendants = d.descendants().map((n: any) => n.data.id);
            const ancestors = d.ancestors().map((n: any) => n.data.id);
            const connectedIds = new Set([...descendants, ...ancestors]);

            nodeGroup.transition().duration(400).ease(d3.easeCubicOut)
                .attr('opacity', (n: any) => affectedNodes?.has(n.data.id) || connectedIds.has(n.data.id) ? 1 : 0.2);

            nodeGroup.selectAll('.node-main').transition().duration(400).ease(d3.easeCubicOut)
                .attr('stroke-width', (n: any) => n.data.id === d.data.id ? GRAPH_CONFIG.selectedStrokeWidth :
                    (affectedNodes?.has(n.data.id) ? 4 : GRAPH_CONFIG.nodeStrokeWidth));

            link.transition().duration(400).ease(d3.easeCubicOut)
                .attr('stroke', (l: any) => {
                    if (affectedNodes?.has(l.source.data.id) && affectedNodes?.has(l.target.data.id)) return '#f87171';
                    if (connectedIds.has(l.source.data.id) && connectedIds.has(l.target.data.id)) return '#94a3b8';
                    return '#475569';
                })
                .attr('stroke-opacity', (l: any) => {
                    if (affectedNodes?.has(l.source.data.id) && affectedNodes?.has(l.target.data.id)) return 0.9;
                    if (connectedIds.has(l.source.data.id) && connectedIds.has(l.target.data.id)) return 0.9;
                    return 0.15;
                })
                .attr('stroke-width', (l: any) => {
                    if (affectedNodes?.has(l.source.data.id) && affectedNodes?.has(l.target.data.id)) return 3;
                    if (connectedIds.has(l.source.data.id) && connectedIds.has(l.target.data.id)) {
                        const edge = edges.find(e => e.source === l.source.data.id && e.target === l.target.data.id);
                        return 2 + ((edge?.impact_score || 50) / 33);
                    }
                    return 1;
                })
                .attr('marker-end', (l: any) => {
                    if (affectedNodes?.has(l.source.data.id) && affectedNodes?.has(l.target.data.id)) return 'url(#arrow-propagation)';
                    if (connectedIds.has(l.source.data.id) && connectedIds.has(l.target.data.id)) return 'url(#arrow-highlighted)';
                    return 'url(#arrow-normal)';
                });
        });

        // Double-click zoom
        nodeGroup.on('dblclick', function (event: MouseEvent, d: any) {
            event.stopPropagation();
            event.preventDefault();
            focusNode(d);
        });

        // Background click
        svg.on('click', function (event) {
            if (event.target === this || event.target.tagName === 'g') {
                onNodeSelect(null);

                nodeGroup.transition().duration(400).ease(d3.easeCubicOut).attr('opacity', 1);
                nodeGroup.selectAll('.node-main').transition().duration(400).ease(d3.easeCubicOut)
                    .attr('stroke-width', (d: any) => affectedNodes?.has(d.data.id) ? 4 : GRAPH_CONFIG.nodeStrokeWidth);

                link.transition().duration(400).ease(d3.easeCubicOut)
                    .attr('stroke', (d: any) => {
                        if (affectedNodes?.has(d.source.data.id) && affectedNodes?.has(d.target.data.id)) return '#f87171';
                        const edge = edges.find(e => e.source === d.source.data.id && e.target === d.target.data.id);
                        return d3.interpolateRgb('#475569', '#94a3b8')(edge?.confidence || 0.5);
                    })
                    .attr('stroke-opacity', (d: any) => affectedNodes?.has(d.source.data.id) && affectedNodes?.has(d.target.data.id) ? 0.8 : 0.6)
                    .attr('stroke-width', (d: any) => {
                        if (affectedNodes?.has(d.source.data.id) && affectedNodes?.has(d.target.data.id)) return 3;
                        const edge = edges.find(e => e.source === d.source.data.id && e.target === d.target.data.id);
                        return 1 + ((edge?.impact_score || 50) / 50);
                    })
                    .attr('marker-end', (d: any) =>
                        affectedNodes?.has(d.source.data.id) && affectedNodes?.has(d.target.data.id) ? 'url(#arrow-propagation)' : 'url(#arrow-normal)');
            }
        });

        // Hover
        nodeGroup.on('mouseenter', function (event: MouseEvent, d: any) {
            const connections = (d.children ? d.children.length : 0) + (d.parent ? 1 : 0);
            tooltip.transition().duration(200).ease(d3.easeCubicOut).style('opacity', 1);
            tooltip.html(`
                <div class="tooltip-title">${d.data.name}</div>
                <div class="tooltip-row"><span>Type:</span> <strong>${d.data.type}</strong></div>
                <div class="tooltip-row"><span>Risk:</span> <strong>${d.data.risk_score}/100</strong></div>
                ${d.data.severity ? `<div class="tooltip-row"><span>Severity:</span> <strong>${d.data.severity.toUpperCase()}</strong></div>` : ''}
                ${d.data.affected_systems ? `<div class="tooltip-row"><span>Affected:</span> <strong>${d.data.affected_systems} systems</strong></div>` : ''}
                ${affectedNodes?.has(d.data.id) ? '<div class="tooltip-row propagation-indicator"><span>⚠️ AFFECTED BY PROPAGATION</span></div>' : ''}
                <div class="tooltip-row"><span>Connections:</span> <strong>${connections}</strong></div>
                <div class="tooltip-hint">Double-click to zoom</div>
            `).style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 15) + 'px');

            d3.select(this).selectAll('.node-main').transition().duration(200).ease(d3.easeCubicOut)
                .attr('r', (d: any) => (GRAPH_CONFIG.nodeBaseRadius + 3) + (d.data.risk_score / GRAPH_CONFIG.nodeRadiusScale));
        })
            .on('mousemove', (event: MouseEvent) => {
                tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 15) + 'px');
            })
            .on('mouseleave', function () {
                tooltip.transition().duration(200).ease(d3.easeCubicOut).style('opacity', 0);
                d3.select(this).selectAll('.node-main').transition().duration(200).ease(d3.easeCubicOut)
                    .attr('r', (d: any) => GRAPH_CONFIG.nodeBaseRadius + (d.data.risk_score / GRAPH_CONFIG.nodeRadiusScale));
            });

        return () => { tooltip.remove(); };
    }, [nodes, edges, selectedNode, onNodeSelect, affectedNodes, propagationPaths]);

    return <svg ref={svgRef}></svg>;
}