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
  permitType,
  setPermitType
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-emerald-800 text-white hover:bg-emerald-900 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <span className="text-sm font-medium">Restriction Level</span>
          </div>
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
          <div className="p-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Show Restrictions</label>
              <select
                value={permitType}
                onChange={(e) => setPermitType(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">All Restrictions</option>
                <option value="less">Less Restrictive Areas</option>
                <option value="more">More Restrictive Areas</option>
              </select>
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
          isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-700 rounded-sm opacity-70" />
            <span className="text-xs text-gray-600">Low Restriction Area</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-500 rounded-sm opacity-70" />
            <span className="text-xs text-gray-600">Medium Restriction Area</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-sm opacity-70" />
            <span className="text-xs text-gray-600">High Restriction Area</span>
          </div>
        </div>
      </div>
    </div>
  );
};