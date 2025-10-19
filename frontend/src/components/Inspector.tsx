import React, { useState, useEffect } from 'react';
import * as LucideReact from 'lucide-react';
import { ProcessedResult } from '../types';
import { downloadImage, downloadAllIntermediates } from '../utils/download';
import { ImageAnalytics } from './ImageAnalytics';

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
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 = final result
  const [analyticsImageUrl, setAnalyticsImageUrl] = useState('');
  const [analyticsImageName, setAnalyticsImageName] = useState('');

  // Reset step when result changes
  useEffect(() => {
    setCurrentStepIndex(-1);
  }, [result.id]);

  // Update analytics image when step changes
  useEffect(() => {
    // Inline updateAnalyticsImage logic
    if (currentStepIndex === -1) {
      // Final result
      setAnalyticsImageUrl(result.processedUrl);
      setAnalyticsImageName('Final Result');
    } else if (result.intermediateResults && currentStepIndex < result.intermediateResults.length) {
      // Intermediate step
      setAnalyticsImageUrl(result.intermediateResults[currentStepIndex]);
      setAnalyticsImageName(`Step ${currentStepIndex + 1}`);
    }
  }, [currentStepIndex, result]);

  const updateAnalyticsImage = () => {
    if (currentStepIndex === -1) {
      // Final result
      setAnalyticsImageUrl(result.processedUrl);
      setAnalyticsImageName('Final Result');
    } else if (result.intermediateResults && currentStepIndex < result.intermediateResults.length) {
      // Intermediate step
      setAnalyticsImageUrl(result.intermediateResults[currentStepIndex]);
      setAnalyticsImageName(`Step ${currentStepIndex + 1}`);
    }
  };

  const hasIntermediates = result.intermediateResults && result.intermediateResults.length > 0;
  const totalSteps = hasIntermediates ? (result.intermediateResults?.length || 0) : 0;
  const maxStepIndex = totalSteps - 1;

  const getCurrentImageUrl = () => {
    if (currentStepIndex === -1) {
      return result.processedUrl;
    }
    if (hasIntermediates && currentStepIndex >= 0 && currentStepIndex < result.intermediateResults!.length) {
      return result.intermediateResults![currentStepIndex];
    }
    return result.processedUrl;
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > -1) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < maxStepIndex) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleDownload = () => {
    const imageUrl = getCurrentImageUrl();
    const filename = currentStepIndex === -1 
      ? `pixelflow_result_${result.id}.jpg`
      : `pixelflow_result_${result.id}_step_${currentStepIndex + 1}.jpg`;
    
    downloadImage(imageUrl, filename);
  };

  const handleDownloadAllSteps = async () => {
    await downloadAllIntermediates(result, `result-${result.id}`);
  };

  const handleShowAnalytics = () => {
    updateAnalyticsImage();
    setShowAnalytics(true);
  };

  const getStepLabel = () => {
    if (currentStepIndex === -1) {
      return 'Final Result';
    }
    return `Step ${currentStepIndex + 1}${totalSteps > 0 ? ` of ${totalSteps}` : ''}`;
  };

  return (
    <>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="btn-sm" title="Back to results grid">
              <LucideReact.ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Inspector</h3>
          </div>
          
          {/* Step Navigation - Center */}
          {hasIntermediates && view !== 'side-by-side' && (
            <div className="flex items-center space-x-3 bg-gray-100 dark:bg-zinc-800 px-4 py-2 rounded-lg">
              <button
                onClick={handlePreviousStep}
                disabled={currentStepIndex <= -1}
                className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous step"
              >
                <LucideReact.ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              
              <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[120px] text-center">
                {getStepLabel()}
              </span>
              
              <button
                onClick={handleNextStep}
                disabled={currentStepIndex >= maxStepIndex}
                className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next step"
              >
                <LucideReact.ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          )}
          
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
            
            {/* Action Buttons */}
            <button 
              onClick={handleShowAnalytics} 
              className="btn-sm" 
              title="View Analytics"
            >
              <LucideReact.BarChart3 className="w-5 h-5" />
            </button>

            {hasIntermediates && (
              <button 
                onClick={handleDownloadAllSteps} 
                className="btn-sm" 
                title="Download All Steps"
              >
                <LucideReact.FolderDown className="w-5 h-5" />
              </button>
            )}
            
            <button 
              onClick={handleDownload} 
              className="btn-sm" 
              title={`Download ${getStepLabel()}`}
            >
              <LucideReact.Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {view === 'normal' && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <img
                src={getCurrentImageUrl()}
                alt={getStepLabel()}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
              
              {/* Step indicator below image */}
              {hasIntermediates && (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  {getStepLabel()}
                </div>
              )}
            </div>
          )}

          {view === 'side-by-side' && (
            <div className="w-full h-full grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Original</h4>
                  <button
                    onClick={() => {
                      setAnalyticsImageUrl(result.originalUrl);
                      setAnalyticsImageName('Original');
                      setShowAnalytics(true);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                  >
                    <LucideReact.BarChart3 size={12} />
                    <span>Analytics</span>
                  </button>
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                  <img
                    src={result.originalUrl}
                    alt="Original"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Processed</h4>
                  <button
                    onClick={() => {
                      setAnalyticsImageUrl(result.processedUrl);
                      setAnalyticsImageName('Processed');
                      setShowAnalytics(true);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                  >
                    <LucideReact.BarChart3 size={12} />
                    <span>Analytics</span>
                  </button>
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                  <img
                    src={result.processedUrl}
                    alt="Processed"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Modal - Dynamic based on current step */}
      <ImageAnalytics
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        imageUrl={analyticsImageUrl}
        imageName={analyticsImageName}
      />
    </>
  );
};

export default Inspector;
