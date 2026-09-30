import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import type { Core, EventObject } from 'cytoscape';
import type { GraphData, GraphNode } from '../types/graph';
import { Search, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface GraphCanvasProps {
  data: GraphData;
  onSelectNode: (node: GraphNode | null) => void;
  selectedNodeId?: string;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  data,
  onSelectNode,
  selectedNodeId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [layoutName, setLayoutName] = useState<'cose' | 'concentric' | 'circle'>('cose');
  const [searchQuery, setSearchQuery] = useState('');

  // Node color helper for SIH26182 VASP Attribution & Blockchain Forensics
  const getNodeColor = useCallback((node: GraphNode) => {
    switch (node.type) {
      case 'CRYPTO_WALLET': return '#F43F5E'; // Red/Rose: Unhosted Suspect Wallet
      case 'MULE_WALLET': return '#F59E0B'; // Amber: Layer-1 / Layer-2 Mule Wallet
      case 'MIXER_SERVICE': return '#A855F7'; // Purple: Tumbler / Mixer Escrow
      case 'VASP_EXCHANGE': return '#06B6D4'; // Cyan Glowing: Centralized VASP Gateway
      case 'KYC_HOLDER': return '#10B981'; // Emerald: Verified Indian Off-ramp
      default: return '#38BDF8';
    }
  }, []);

  // Node shape helper
  const getNodeShape = useCallback((type: string) => {
    switch (type) {
      case 'CRYPTO_WALLET': return 'ellipse';
      case 'MULE_WALLET': return 'diamond';
      case 'MIXER_SERVICE': return 'octagon';
      case 'VASP_EXCHANGE': return 'round-rectangle';
      case 'KYC_HOLDER': return 'rectangle';
      default: return 'ellipse';
    }
  }, []);

  // 1. Initialize Cytoscape instance once
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      boxSelectionEnabled: false,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'color': '#F8FAFC',
            'font-size': '11px',
            'font-family': 'Inter, sans-serif',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'width': 'data(size)',
            'height': 'data(size)',
            'shape': 'data(shape)' as any,
            'border-width': 2,
            'border-color': '#1E293B',
            'text-outline-color': '#0B0F19',
            'text-outline-width': 2
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#38BDF8',
            'underlay-color': '#38BDF8',
            'underlay-padding': 4,
            'underlay-opacity': 0.35
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'font-size': '9px',
            'color': '#94A3B8',
            'text-outline-color': '#0B0F19',
            'text-outline-width': 1.5
          }
        },
        {
          selector: 'edge[relation = "TRANSFERRED_CRYPTO"]',
          style: {
            'line-color': '#F59E0B',
            'target-arrow-color': '#F59E0B',
            'width': 3,
            'label': 'data(label)'
          }
        },
        {
          selector: 'edge[relation = "DEPOSITED_TO_VASP"]',
          style: {
            'line-color': '#06B6D4',
            'target-arrow-color': '#06B6D4',
            'width': 4,
            'label': 'data(label)'
          }
        },
        {
          selector: 'edge[relation = "SWEEPS_TO_HOT_WALLET"]',
          style: {
            'line-color': '#818CF8',
            'target-arrow-color': '#818CF8',
            'line-style': 'dashed',
            'width': 2.5,
            'label': 'data(label)'
          }
        },
        {
          selector: 'edge[relation = "CASHOUT_P2P"]',
          style: {
            'line-color': '#10B981',
            'target-arrow-color': '#10B981',
            'width': 3.5,
            'label': 'data(label)'
          }
        }
      ]
    });

    cy.on('tap', 'node', (evt: EventObject) => {
      const rawNode = evt.target.data('raw');
      onSelectNode(rawNode);
    });

    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        onSelectNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.stop();
      cy.destroy();
      cyRef.current = null;
    };
  }, [onSelectNode]);

  // 2. Update elements when data or layout changes (without destroying cy instance)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const elements = [
      ...data.nodes.map(n => ({
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          risk: n.risk_score,
          color: getNodeColor(n),
          shape: getNodeShape(n.type),
          size: Math.max(34, Math.min(65, 34 + (n.centrality?.pagerank || 0) * 200)),
          raw: n
        }
      })),
      ...data.edges.map(e => ({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.properties?.amount ? `${e.properties.amount.toLocaleString()} ${e.properties.token || ''}` : e.relation.replace(/_/g, ' '),
          relation: e.relation,
          weight: e.weight
        }
      }))
    ];

    cy.batch(() => {
      cy.elements().remove();
      if (elements.length > 0) {
        cy.add(elements);
      }
    });

    if (elements.length > 0) {
      const layoutOptions: any = {
        name: layoutName,
        animate: false,
        padding: 50
      };

      if (layoutName === 'cose') {
        layoutOptions.componentSpacing = 60;
        layoutOptions.nodeOverlap = 20;
        layoutOptions.idealEdgeLength = () => 100;
      }

      cy.layout(layoutOptions).run();
      cy.fit(undefined, 40);
    }
  }, [data, layoutName, getNodeColor, getNodeShape]);

  // 3. Handle external node selection
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !selectedNodeId) return;

    const node = cy.getElementById(selectedNodeId);
    if (node && node.length > 0) {
      cy.$(':selected').unselect();
      node.select();
      cy.animate({
        center: { eles: node },
        zoom: 1.5,
        duration: 300
      });
    }
  }, [selectedNodeId]);

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cy = cyRef.current;
    if (!cy || !searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    const found = cy.nodes().filter(n => {
      const label = n.data('label') || '';
      return label.toLowerCase().includes(q);
    });

    if (found.length > 0) {
      cy.$(':selected').unselect();
      found.first().select();
      const raw = found.first().data('raw');
      onSelectNode(raw);
      cy.animate({
        center: { eles: found.first() },
        zoom: 1.6,
        duration: 300
      });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Floating Canvas Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search suspect, phone, account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900/90 backdrop-blur border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56 shadow-lg"
            />
          </div>
        </form>

        {/* Layout Switcher */}
        <div className="flex bg-slate-900/90 backdrop-blur border border-slate-700 rounded p-0.5 text-xs shadow-lg">
          <button
            onClick={() => setLayoutName('cose')}
            className={`px-2 py-1 rounded transition cursor-pointer ${
              layoutName === 'cose' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
            title="CoSE Physics Layout"
          >
            Force
          </button>
          <button
            onClick={() => setLayoutName('concentric')}
            className={`px-2 py-1 rounded transition cursor-pointer ${
              layoutName === 'concentric' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
            title="Concentric Hierarchy"
          >
            Hierarchy
          </button>
          <button
            onClick={() => setLayoutName('circle')}
            className={`px-2 py-1 rounded transition cursor-pointer ${
              layoutName === 'circle' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
            title="Circular Cluster"
          >
            Circle
          </button>
        </div>
      </div>

      {/* Viewport Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-1 bg-slate-900/90 backdrop-blur border border-slate-700 rounded p-1 shadow-lg">
        <button
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.25)}
          className="p-1.5 hover:bg-slate-800 text-slate-300 rounded cursor-pointer transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
          className="p-1.5 hover:bg-slate-800 text-slate-300 rounded cursor-pointer transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => cyRef.current?.fit(undefined, 40)}
          className="p-1.5 hover:bg-slate-800 text-slate-300 rounded cursor-pointer transition"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-4 left-4 z-10 hidden lg:flex items-center space-x-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur border border-slate-800 rounded text-[11px] shadow-lg">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="text-slate-300">Mastermind</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span className="text-slate-300">Suspect</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rotate-45 bg-emerald-500"></span>
          <span className="text-slate-300">Phone (CDR)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
          <span className="text-slate-300">Bank Account</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-pink-500"></span>
          <span className="text-slate-300">Vehicle</span>
        </div>
      </div>

      {/* Canvas Element */}
      <div ref={containerRef} className="cytoscape-canvas" />
    </div>
  );
};
