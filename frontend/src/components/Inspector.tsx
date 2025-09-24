import React from 'react';
import * as LucideReact from 'lucide-react';
import { ProcessedResult } from '../types';

interface InspectorProps {
  result: ProcessedResult;
  view: 'normal' | 'side-by-side' | 'slider';
  onViewChange: (view: 'normal' | 'side-by-side' | 'slider') => void;
  onBack: () => void;
}

const Inspector: React.FC<InspectorProps> = ({
  result,
  view,
  onViewChange,
  onBack
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = result.processedUrl;
    link.download = `pixelflow_result_${result.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="btn-sm" title="Back to results grid">
            <LucideReact.ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Inspector</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Controls */}
          <button
            onClick={() => onViewChange('normal')}
            className={`btn-sm ${view === 'normal' ? 'active' : ''}`}
            title="Normal View"
          >
            <LucideReact.Image className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewChange('side-by-side')}
            className={`btn-sm ${view === 'side-by-side' ? 'active' : ''}`}
            title="Side-by-side View"
          >
            <LucideReact.Columns className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-zinc-700"></div>
          
          <button onClick={handleDownload} className="btn-sm ml-2" title="Download Processed Image">
            <LucideReact.Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {view === 'normal' && (
          <div className="w-full h-full flex justify-center items-center">
            <img
              src={result.processedUrl}
              alt="Processed result"
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        )}

        {view === 'side-by-side' && (
            <div className="w-full h-full grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Original</h4>
                <div className="flex-1 w-full flex items-center justify-center">
                    <img
                    src={result.originalUrl}
                    alt="Original"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    style={{ minHeight: '200px' }}
                    />
                </div>
                </div>
                <div className="flex flex-col items-center">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Processed</h4>
                <div className="flex-1 w-full flex items-center justify-center">
                    <img
                    src={result.processedUrl}
                    alt="Processed"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    style={{ minHeight: '200px' }}
                    />
                </div>
                </div>
            </div>
            )}
      </div>
    </div>
  );
};

export default Inspector;