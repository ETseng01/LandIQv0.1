import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface PermitOverlayControlsProps {
  opacity: number;
  setOpacity: (value: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  showComparison: boolean;
  setShowComparison: (show: boolean) => void;
  permitType: string;
  setPermitType: (type: string) => void;
}

export const PermitOverlayControls: React.FC<PermitOverlayControlsProps> = ({
  opacity,
  setOpacity,
  selectedYear,
  setSelectedYear,
  showComparison,
  setShowComparison,
  permitType,
  setPermitType
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-emerald-800 text-white hover:bg-emerald-900 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <span className="text-sm font-medium">Map Controls</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Collapsible Content */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}
        >
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Transparency</label>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity * 100}
                onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-800"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              >
                {[2020, 2021, 2022, 2023, 2024].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Permit Type</label>
              <select
                value={permitType}
                onChange={(e) => setPermitType(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">All Permits</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Compare Years</span>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  showComparison 
                    ? 'bg-emerald-800 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {showComparison ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PermitLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg overflow-hidden z-10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between bg-emerald-800 text-white hover:bg-emerald-900 transition-colors"
      >
        <span className="text-sm font-medium">Legend</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="p-4 space-y-4">
          {/* Property Types */}
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-2">Property Types</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-emerald-800" />
                <span className="text-xs text-gray-600">Residential</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-neutral-700" />
                <span className="text-xs text-gray-600">Commercial</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-xs text-gray-600">Search Location</span>
              </div>
            </div>
          </div>

          {/* Regulatory Overlay */}
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-2">Regulatory Overlay</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-sm opacity-70" />
                <span className="text-xs text-gray-600">Less Restrictive</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-sm opacity-70" />
                <span className="text-xs text-gray-600">More Restrictive</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-400 rounded-sm" />
                <span className="text-xs text-gray-600">Municipality Boundary</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};