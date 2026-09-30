import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';

interface TimeSliderProps {
  onTimeChange: (startDate?: string, endDate?: string) => void;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({ onTimeChange }) => {
  const dates = [
    '2024-01-01',
    '2024-01-15',
    '2024-02-01',
    '2024-02-15',
    '2024-03-01',
    '2024-03-15',
    '2024-03-31',
  ];

  const [currentIndex, setCurrentIndex] = useState(dates.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    onTimeChange('2024-01-01', dates[currentIndex]);
  }, [currentIndex]);

  // Automated playback
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= dates.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const handleMax = () => {
    setIsPlaying(false);
    setCurrentIndex(dates.length - 1);
  };

  return (
    <div className="h-14 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between z-20 select-none">
      {/* Title */}
      <div className="flex items-center space-x-2 text-xs">
        <Clock className="w-4 h-4 text-cyan-400" />
        <span className="font-semibold text-white tracking-wide">NETWORK TIME MACHINE</span>
        <span className="text-[10px] text-slate-400 hidden sm:inline">Temporal Syndicate Replay</span>
      </div>

      {/* Scrubber Controls */}
      <div className="flex items-center space-x-3 flex-1 max-w-xl mx-4">
        <button
          onClick={handleReset}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
          title="Start of Investigation"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full transition shadow-md shadow-cyan-950 cursor-pointer"
          title={isPlaying ? 'Pause Replay' : 'Play Syndicate Evolution'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
        </button>

        <button
          onClick={handleMax}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
          title="Present Day"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Range Slider */}
        <div className="flex-1 flex flex-col justify-center">
          <input
            type="range"
            min={0}
            max={dates.length - 1}
            value={currentIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentIndex(parseInt(e.target.value));
            }}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
            <span>01 Jan 2024</span>
            <span>15 Feb 2024</span>
            <span>31 Mar 2024</span>
          </div>
        </div>
      </div>

      {/* Active Time Window Display */}
      <div className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-cyan-300">
        Active Until: <span className="font-bold text-white">{dates[currentIndex]}</span>
      </div>
    </div>
  );
};
