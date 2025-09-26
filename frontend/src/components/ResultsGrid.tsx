import React, { useEffect, useRef } from 'react';
import * as LucideReact from 'lucide-react';
import { ProcessedResult } from '../types';
import { MasonryUtils } from '../utils/index';

interface ResultsGridProps {
  results: ProcessedResult[];
  loading: boolean;
  onResultSelect: (result: ProcessedResult) => void;
}

const ResultsGridComponent: React.FC<ResultsGridProps> = ({
  results,
  loading,
  onResultSelect
}) => {
  const gridRef = useRef<HTMLDivElement>(null);

  // Apply masonry layout when results change
  useEffect(() => {
    if (gridRef.current && results.length > 0) {
      const images = Array.from(gridRef.current.querySelectorAll('.result-thumb')) as HTMLElement[];
      
      // Wait for images to load before applying layout
      let loadedCount = 0;
      const totalImages = images.length;

      if (totalImages === 0) return;

      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          MasonryUtils.applyLayout(gridRef.current!, images, 120, 16);
        }
      };

      images.forEach((thumb) => {
        const img = thumb.querySelector('img');
        if (img) {
          if (img.complete) {
            onImageLoad();
          } else {
            img.addEventListener('load', onImageLoad);
          }
        }
      });

      // Cleanup event listeners
      return () => {
        images.forEach((thumb) => {
          const img = thumb.querySelector('img');
          if (img) {
            img.removeEventListener('load', onImageLoad);
          }
        });
      };
    }
  }, [results]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gridRef.current && results.length > 0) {
        const images = Array.from(gridRef.current.querySelectorAll('.result-thumb')) as HTMLElement[];
        MasonryUtils.applyLayout(gridRef.current, images, 120, 16);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [results]);

  if (loading) {
    // Remove the loading animation entirely - just show empty state
    return (
        <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400 dark:text-gray-500">
            <LucideReact.Image className="w-16 h-16 mx-auto mb-4" />
            <p className="font-semibold text-lg mb-2">Processing...</p>
            <p className="text-sm">Results will appear when ready</p>
        </div>
        </div>
    );
    }

  if (results.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400 dark:text-gray-500">
          <LucideReact.Image className="w-16 h-16 mx-auto mb-4" />
          <p className="font-semibold text-lg mb-2">Processed results will appear here</p>
          <p className="text-sm">Apply a pipeline to your selected images</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
          Results ({results.length})
        </h3>
      </div>
      
      <div 
        ref={gridRef}
        className="flex-1 p-4 overflow-y-auto relative"
        style={{ minHeight: '300px' }}
      >
        {results.map((result, index) => (
          <div
            key={result.id}
            className="result-thumb rounded-md overflow-hidden cursor-pointer bg-white dark:bg-zinc-800 shadow-sm hover:shadow-md transition-all duration-200"
            onClick={() => onResultSelect(result)}
            data-id={result.id}
          >
            <img
              src={result.processedUrl}
              alt={`Processed result ${index + 1}`}
              className="w-full h-auto block"
              loading="lazy"
            />
            <div className="p-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Result {index + 1}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default ResultsGridComponent;
