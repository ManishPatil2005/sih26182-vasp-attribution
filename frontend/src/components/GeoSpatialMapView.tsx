import React, { useState, useEffect } from 'react';
import { Radio, Navigation, Clock, Layers, RefreshCw } from 'lucide-react';
import { fetchGisMapData, fetchColocations } from '../services/api';
import type { GisMapData, GisTower, ColocationEvent } from '../types/graph';

interface Props {
  onSelectNode?: (nodeId: string) => void;
}

const SUSPECT_COLORS: Record<string, string> = {
  'Krish Sharma': '#f59e0b',     // Amber
  'Manish Patil': '#10b981',     // Emerald
  'Afnan Khan': '#8b5cf6',       // Violet
  'Tanya Verma': '#ef4444',      // Red
  'Kabir Mehta': '#06b6d4',      // Cyan
};

export const GeoSpatialMapView: React.FC<Props> = ({ onSelectNode }) => {
  const [mapData, setMapData] = useState<GisMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTower, setSelectedTower] = useState<GisTower | null>(null);
  const [selectedRendezvous, setSelectedRendezvous] = useState<ColocationEvent | null>(null);
  const [activeSuspects, setActiveSuspects] = useState<Record<string, boolean>>({});
  const [timeWindow, setTimeWindow] = useState<number>(15);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);

  const loadData = async (windowMins: number = timeWindow) => {
    setLoading(true);
    try {
      const data = await fetchGisMapData();
      const colocs = await fetchColocations(windowMins);
      setMapData({ ...data, colocations: colocs });

      // Initialize suspect toggles
      const toggles: Record<string, boolean> = {};
      data.trajectories.forEach((t) => {
        toggles[t.suspect_name] = true;
      });
      setActiveSuspects(toggles);
    } catch (e) {
      console.error('Failed to load GIS data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(timeWindow);
  }, [timeWindow]);

  // Coordinate projection from Lat/Lon to SVG viewBox (Width 900, Height 500)
  // Target Bounds (covering Maharashtra - CSN/Pune/Mumbai)
  const minLat = 18.2;
  const maxLat = 20.2;
  const minLon = 72.5;
  const maxLon = 75.6;

  const projectCoord = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 820 + 40;
    // Invert y because SVG y goes downwards
    const y = 460 - ((lat - minLat) / (maxLat - minLat)) * 420;
    return { x, y };
  };

  const toggleSuspect = (name: string) => {
    setActiveSuspects(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-900/90 border-b border-slate-800 z-10 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                Spatio-Temporal GIS Telemetry & Tower Proximity
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded">
                CHHATRAPATI SAMBHAJINAGAR - PUNE CORRIDOR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cellular Tower Footprints, Pre-Incident Reconnaissance & Proximity Meetings
            </p>
          </div>
        </div>

        {/* Filters and Thresholds */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-slate-300">Co-Location Window:</span>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(Number(e.target.value))}
              className="bg-slate-900 text-xs text-cyan-300 border border-slate-700 rounded px-2 py-0.5 focus:outline-none"
            >
              <option value={5}>≤ 5 Mins (Immediate Meet)</option>
              <option value={15}>≤ 15 Mins (Standard Proximity)</option>
              <option value={30}>≤ 30 Mins (Extended Area)</option>
              <option value={60}>≤ 60 Mins (Loose Recon)</option>
            </select>
          </div>

          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              showRoutes
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Routes: {showRoutes ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => loadData(timeWindow)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            title="Refresh GIS Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* SVG Vector Map Canvas */}
        <div className="flex-1 relative flex items-center justify-center bg-radial from-slate-900 to-slate-950 p-4">
          {/* Subtle Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {loading ? (
            <div className="flex flex-col items-center gap-2 text-cyan-400">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <span className="text-sm font-mono">Synthesizing GIS Cellular Dumps...</span>
            </div>
          ) : (
            <svg
              viewBox="0 0 900 500"
              className="w-full h-full max-h-[700px] select-none"
            >
              <defs>
                {/* Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* District Boundary Guide Lines (Stylized Maharashtra) */}
              <path
                d="M 60,320 Q 200,340 400,280 T 800,180"
                fill="none"
                stroke="#334155"
                strokeWidth="1.5"
                strokeDasharray="4,4"
                opacity="0.4"
              />
              <text x="70" y="310" fill="#475569" fontSize="10" fontFamily="monospace">NH-48 (MUMBAI - PUNE EXP)</text>
              <text x="580" y="170" fill="#475569" fontSize="10" fontFamily="monospace">AURANGABAD EXPRESSWAY</text>

              {/* Suspect Trajectories */}
              {showRoutes && mapData?.trajectories.map((traj) => {
                if (!activeSuspects[traj.suspect_name]) return null;
                const color = SUSPECT_COLORS[traj.suspect_name] || '#94a3b8';

                const points = traj.path.map((pt) => {
                  const c = projectCoord(pt.lat, pt.lon);
                  return `${c.x},${c.y}`;
                }).join(' ');

                return (
                  <g key={traj.suspect_name}>
                    <polyline
                      points={points}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeDasharray="6,3"
                      opacity="0.75"
                    />
                    {traj.path.map((pt, pIdx) => {
                      const c = projectCoord(pt.lat, pt.lon);
                      return (
                        <circle
                          key={pIdx}
                          cx={c.x}
                          cy={c.y}
                          r="3"
                          fill={color}
                          opacity="0.9"
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* Rendezvous Hotspot Areas */}
              {mapData?.colocations.map((coloc) => {
                const c = projectCoord(coloc.latitude, coloc.longitude);
                return (
                  <g key={coloc.event_id} onClick={() => setSelectedRendezvous(coloc)} className="cursor-pointer">
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r="24"
                      fill="#ef4444"
                      opacity="0.15"
                      className="animate-ping"
                      style={{ animationDuration: '3s' }}
                    />
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r="16"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                      opacity="0.8"
                    />
                  </g>
                );
              })}

              {/* Towers */}
              {mapData?.towers.map((tower) => {
                const c = projectCoord(tower.lat, tower.lon);
                const isSelected = selectedTower?.tower_id === tower.tower_id;

                return (
                  <g
                    key={tower.tower_id}
                    onClick={() => {
                      setSelectedTower(tower);
                      const matchingColoc = mapData.colocations.find(cl => cl.tower_id === tower.tower_id);
                      if (matchingColoc) setSelectedRendezvous(matchingColoc);
                      if (onSelectNode) onSelectNode(tower.tower_id);
                    }}
                    className="cursor-pointer transition-transform hover:scale-110"
                  >
                    {/* Pulsing ring for hotspots */}
                    {tower.is_rendezvous_hotspot && (
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r="14"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1"
                        opacity="0.6"
                      />
                    )}

                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={isSelected ? 8 : 5}
                      fill={tower.is_rendezvous_hotspot ? '#ef4444' : '#06b6d4'}
                      stroke="#0f172a"
                      strokeWidth="2"
                      filter={isSelected ? 'url(#glow)' : undefined}
                    />

                    <text
                      x={c.x + 8}
                      y={c.y + 4}
                      fill={tower.is_rendezvous_hotspot ? '#fca5a5' : '#94a3b8'}
                      fontSize="9"
                      fontWeight={tower.is_rendezvous_hotspot ? 'bold' : 'normal'}
                      fontFamily="sans-serif"
                    >
                      {tower.tower_name}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 p-3 rounded-xl backdrop-blur text-xs space-y-2 max-w-xs shadow-xl">
            <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Telemetry Map Legend</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              <span>Standard Cellular Tower</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse" />
              <span>Rendezvous Meeting Hotspot</span>
            </div>

            <div className="border-t border-slate-800 pt-2">
              <p className="text-[10px] text-slate-500 mb-1 font-mono uppercase">Filter Suspect Routes:</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(activeSuspects).map((name) => (
                  <button
                    key={name}
                    onClick={() => toggleSuspect(name)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
                      activeSuspects[name]
                        ? 'border-slate-600 bg-slate-800 text-slate-200'
                        : 'border-slate-800 bg-slate-950/60 text-slate-600'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: SUSPECT_COLORS[name] || '#94a3b8' }}
                    />
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Telemetry Details Inspector Panel */}
        <div className="w-96 border-l border-slate-800 bg-slate-900/95 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Rendezvous & Tower Evidence
            </h3>
            {selectedRendezvous ? (
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {selectedRendezvous.suspicion_level} CO-LOCATION
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedRendezvous.tower_id}
                  </span>
                </div>

                <h4 className="font-semibold text-rose-200 text-sm">
                  {selectedRendezvous.tower_name}
                </h4>

                <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Duration:</span>
                    <span className="font-mono text-amber-300">{selectedRendezvous.duration_observed_minutes} min window</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>First Ping:</span>
                    <span className="font-mono text-slate-400">{selectedRendezvous.first_ping}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Last Ping:</span>
                    <span className="font-mono text-slate-400">{selectedRendezvous.last_ping}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 font-semibold mb-1">Suspects Detected Together:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedRendezvous.suspects_present.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-rose-900/40 border border-rose-700/50 text-[11px] text-rose-200 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                  {selectedRendezvous.evidence_summary}
                </p>
              </div>
            ) : selectedTower ? (
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs space-y-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  CELL TOWER TELEMETRY
                </span>
                <h4 className="font-semibold text-slate-200 text-sm">{selectedTower.tower_name}</h4>
                <div className="text-[11px] space-y-1 text-slate-400">
                  <p>Tower ID: <span className="font-mono text-slate-200">{selectedTower.tower_id}</span></p>
                  <p>Total Pings Logged: <span className="font-mono text-cyan-300">{selectedTower.total_pings}</span></p>
                  <p>Coordinates: <span className="font-mono text-slate-300">{selectedTower.lat.toFixed(4)}, {selectedTower.lon.toFixed(4)}</span></p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold mb-1">Suspects Pinged:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTower.suspects_observed.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-700 text-[11px] text-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-center text-xs text-slate-500">
                Click any cell tower or red rendezvous hotspot on the map to inspect evidence.
              </div>
            )}
          </div>

          {/* Rendezvous Events List */}
          <div className="flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              All Rendezvous Meets ({mapData?.colocations.length || 0})
            </h3>
            <div className="space-y-2">
              {mapData?.colocations.map((coloc) => (
                <div
                  key={coloc.event_id}
                  onClick={() => setSelectedRendezvous(coloc)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition ${
                    selectedRendezvous?.event_id === coloc.event_id
                      ? 'bg-rose-950/40 border-rose-500/60'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-medium text-slate-200">{coloc.tower_name}</span>
                    <span className="text-[10px] font-mono text-rose-400 font-bold">{coloc.suspicion_level}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {coloc.suspects_present.join(' + ')} ({coloc.duration_observed_minutes} min)
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
