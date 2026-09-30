import React from 'react';
import { Radio, Zap, ShieldAlert } from 'lucide-react';
import type { LiveStreamEvent } from '../types/graph';

interface LiveStreamTickerProps {
  latestEvent: LiveStreamEvent | null;
  streaming: boolean;
  onToggleStreaming: () => void;
  onSimulateEvent: () => void;
  loading: boolean;
}

export const LiveStreamTicker: React.FC<LiveStreamTickerProps> = ({
  latestEvent,
  streaming,
  onToggleStreaming,
  onSimulateEvent,
  loading
}) => {
  return (
    <div className="bg-slate-950/95 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs z-20 backdrop-blur select-none">
      {/* Left: Stream Status Indicator */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleStreaming}
          className={`flex items-center space-x-2 px-2.5 py-1 rounded border transition cursor-pointer ${
            streaming
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              streaming ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'
            }`}
          />
          <Radio className="w-3.5 h-3.5" />
          <span className="font-mono font-semibold tracking-wider text-[11px]">
            {streaming ? 'RTA LIVE STREAM: ACTIVE' : 'RTA STREAM: PAUSED'}
          </span>
        </button>

        <span className="text-slate-500 hidden sm:inline">|</span>
        <span className="text-slate-400 font-mono text-[10px] hidden md:inline">
          CHANNEL: STATE_POLICE_TELECOM_RADAR
        </span>
      </div>

      {/* Center: Latest Intercept Pulse Ticker */}
      <div className="flex-1 max-w-2xl mx-4 overflow-hidden">
        {latestEvent && latestEvent.type === 'NEW_INTERCEPTED_CALL' ? (
          <div className="flex items-center space-x-2 animate-fadeIn bg-red-950/30 border border-red-800/40 rounded px-3 py-1">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            <span className="text-red-400 font-bold font-mono text-[11px] shrink-0">
              [INTERCEPT {latestEvent.event_id}]
            </span>
            <span className="text-slate-200 font-semibold truncate">
              {latestEvent.caller} ➔ {latestEvent.receiver}
            </span>
            <span className="text-slate-400 text-[10px] hidden lg:inline truncate">
              ({latestEvent.tower_id}) - {latestEvent.notes}
            </span>
            <span className="px-1.5 py-0.2 bg-red-900 text-red-200 rounded text-[9px] font-bold uppercase shrink-0">
              {latestEvent.risk_level || 'ALERT'}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Telemetry online. Monitoring active telecom cells across Aur / Deogiri / MGM sectors...</span>
          </div>
        )}
      </div>

      {/* Right: Quick Pulse Simulation Button */}
      <div className="flex items-center space-x-2 mt-1 sm:mt-0">
        <button
          onClick={onSimulateEvent}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1 rounded bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-medium text-[11px] shadow-md shadow-red-950/50 transition cursor-pointer disabled:opacity-50"
          title="Simulate incoming live telecom interception event"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{loading ? 'Pulsing...' : 'Pulse Live Intercept'}</span>
        </button>
      </div>
    </div>
  );
};
