/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { graphData, type Node } from './data';
import './App.css';

function App() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [minRisk, setMinRisk] = useState<number>(0);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight - 80;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const filteredNodes = graphData.nodes.filter(n =>
      (filterType === 'all' || n.type === filterType) &&
      n.risk_score >= minRisk
    );
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graphData.edges.filter(e =>
      nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    const colorMap = {
      organization: '#60a5fa',
      product: '#34d399',
      software: '#fbbf24',
      vulnerability: '#f87171'
    };

    const g = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom as any);

    // Defs for gradients and glows
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('height', '300%')
      .attr('width', '300%')
      .attr('x', '-100%')
      .attr('y', '-100%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow markers
    defs.selectAll('marker')
      .data(['normal', 'highlighted'])
      .join('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', d => d === 'highlighted' ? '#fff' : '#64748b');

    const simulation = d3.forceSimulation(filteredNodes as any)
      .force('link', d3.forceLink(filteredEdges)
        .id((d: any) => d.id)
        .distance(150)
        .strength(1))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    const link = g.append('g')
      .selectAll('line')
      .data(filteredEdges)
      .join('line')
      .attr('stroke', '#475569')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow-normal)');

    const nodeGroup = g.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag<any, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    nodeGroup.append('circle')
      .attr('r', (d: Node) => 10 + (d.risk_score / 7))
      .attr('fill', (d: Node) => colorMap[d.type])
      .attr('stroke', (d: Node) => {
        const colors = {
          organization: '#3b82f6',
          product: '#10b981',
          software: '#f59e0b',
          vulnerability: '#ef4444'
        };
        return colors[d.type];
      })
      .attr('stroke-width', 3)
      .style('filter', 'url(#glow)');

    nodeGroup.append('text')
      .text((d: Node) => d.name)
      .attr('font-size', 12)
      .attr('dx', (d: Node) => 12 + (d.risk_score / 7))
      .attr('dy', 4)
      .attr('fill', '#cbd5e1')
      .attr('font-weight', 500)
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    nodeGroup.on('click', (event: MouseEvent, d: Node) => {
      event.stopPropagation();
      setSelectedNode(d.id);

      const connectedNodes = new Set<string>([d.id]);
      const connectedEdges = new Set();

      filteredEdges.forEach(e => {
        if (e.source === d.id || (e.source as any).id === d.id) {
          connectedNodes.add(typeof e.target === 'string' ? e.target : (e.target as any).id);
          connectedEdges.add(e);
        }
        if (e.target === d.id || (e.target as any).id === d.id) {
          connectedNodes.add(typeof e.source === 'string' ? e.source : (e.source as any).id);
          connectedEdges.add(e);
        }
      });

      nodeGroup
        .attr('opacity', (n: Node) => connectedNodes.has(n.id) ? 1 : 0.15);

      nodeGroup.select('circle')
        .attr('stroke-width', (n: Node) => n.id === d.id ? 5 : 3);

      link
        .attr('stroke', (e: any) => connectedEdges.has(e) ? '#94a3b8' : '#475569')
        .attr('stroke-opacity', (e: any) => connectedEdges.has(e) ? 0.9 : 0.1)
        .attr('stroke-width', (e: any) => connectedEdges.has(e) ? 4 : 2)
        .attr('marker-end', (e: any) =>
          connectedEdges.has(e) ? 'url(#arrow-highlighted)' : 'url(#arrow-normal)'
        );
    });

    svg.on('click', () => {
      setSelectedNode(null);
      nodeGroup.attr('opacity', 1);
      nodeGroup.select('circle').attr('stroke-width', 3);
      link
        .attr('stroke', '#475569')
        .attr('stroke-opacity', 0.5)
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrow-normal)');
    });

    nodeGroup
      .on('mouseenter', (event: MouseEvent, d: Node) => {
        const connections = filteredEdges.filter(e =>
          e.source === d.id || (e.source as any).id === d.id ||
          e.target === d.id || (e.target as any).id === d.id
        ).length;

        tooltip.transition().duration(150).style('opacity', 1);
        tooltip.html(`
          <div class="tooltip-title">${d.name}</div>
          <div class="tooltip-row"><span>Type:</span> <strong>${d.type}</strong></div>
          <div class="tooltip-row"><span>Risk:</span> <strong>${d.risk_score}/100</strong></div>
          <div class="tooltip-row"><span>Connections:</span> <strong>${connections}</strong></div>
        `)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 15) + 'px');

        d3.select(event.currentTarget as Element)
          .select('circle')
          .transition()
          .duration(150)
          .attr('r', (d: any) => 12 + (d.risk_score / 7));
      })
      .on('mousemove', (event: MouseEvent) => {
        tooltip
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 15) + 'px');
      })
      .on('mouseleave', (event: MouseEvent) => {
        tooltip.transition().duration(150).style('opacity', 0);

        d3.select(event.currentTarget as Element)
          .select('circle')
          .transition()
          .duration(150)
          .attr('r', (d: any) => 10 + (d.risk_score / 7));
      });

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      tooltip.remove();
    };
  }, [filterType, minRisk]);

  return (
    <div className="app">
      <div className="header">
        <div className="header-left">
          <h1>SecureChain MVP</h1>
          <div className="stats">
            {graphData.nodes.length} nodes • {graphData.edges.length} edges
          </div>
        </div>

        <div className="controls">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
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
              onChange={(e) => setMinRisk(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="legend">
          <span className="legend-item"><span className="dot org"></span> Organization</span>
          <span className="legend-item"><span className="dot prod"></span> Product</span>
          <span className="legend-item"><span className="dot soft"></span> Software</span>
          <span className="legend-item"><span className="dot vuln"></span> Vulnerability</span>
        </div>
      </div>

      <div className="hint">Click node to highlight • Drag to move • Scroll to zoom</div>

      <svg ref={svgRef}></svg>
    </div>
  );
}

export default App;