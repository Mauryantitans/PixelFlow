import React, { useState, useEffect } from 'react';
import * as LucideReact from 'lucide-react';
import {
  useSession,
  useTheme,
  useStatus,
  useImages,
  usePipeline,
  useLiveProcessing,
  useBatchProcessing,
  useUI,
  useModal,
  useKeyboardShortcuts
} from './hooks';
import {
  ProcessedResult,
  DEFAULT_OPERATION_CONFIGS
} from './types';
import { ApiService } from './services/api';
import PipelineStepComponent from './components/PipelineStep';
import ResultsGridComponent from './components/ResultsGrid';
import Inspector from './components/Inspector';
import GalleryModal from './components/GalleryModal';
import './index.css';

const App: React.FC = () => {
  const { sessionId } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { status, updateStatus } = useStatus();
  const {
    images,
    selectedImages,
    selectedCount,
    loading: imagesLoading,
    addImages,
    removeImage,
    toggleImageSelection,
    selectAllImages,
    deselectAllImages
  } = useImages();
  
  const {
    pipeline,
    addStep,
    removeStep,
    updateStepParam,
    moveStep,
    resetPipeline
  } = usePipeline();
  
  const {
    results: liveResults,
    loading: liveLoading,
    processLive,
    clearResults: clearLiveResults
  } = useLiveProcessing();
  
  const {
    results: batchResults,
    loading: batchLoading,
    processBatch,
    clearResults: clearBatchResults
  } = useBatchProcessing();
  
  const {
    ui,
    toggleSidebar,
    setLiveProcessing,
    setCurrentView,
    setInspectorView,
    setViewingStep
  } = useUI();
  
  const galleryModal = useModal();
  
  // State for search functionality
  const [operationSearch, setOperationSearch] = useState('');
  
  // State for selected result in batch mode
 const [selectedResult, setSelectedResult] = useState<ProcessedResult | null>(null);

  // Add this lightbox state here:
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    imageUrl: string;
    filename: string;
  }>({
    isOpen: false,
    imageUrl: '',
    filename: ''
  });
  // State for live processing toggle (separate from UI state for better control)
  const [liveProcessingEnabled, setLiveProcessingEnabled] = useState(false);
  
  // Filter operations based on search - improved logic
  const getFilteredOperations = () => {
    if (!operationSearch.trim()) {
      return {
        'Adjustments': ['Brightness', 'Contrast', 'Saturation', 'Exposure'],
        'Filters': ['Grayscale', 'Sepia', 'Invert', 'Solarize', 'Posterize'],
        'Blur & Sharpen': ['Sharpen', 'Gaussian Blur'],
        'Effects': ['Vignette', 'Grain']
      };
    }
    
    const searchTerm = operationSearch.toLowerCase();
    const allOperations = Object.keys(DEFAULT_OPERATION_CONFIGS);
    const filteredOps = allOperations.filter(op => 
      op.toLowerCase().includes(searchTerm)
    );
    
    return {
      'Search Results': filteredOps
    };
  };
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    
    try {
      // Remove this line: updateStatus('Uploading images...', 'processing');
      const newImages = await addImages(Array.from(files));
      updateStatus(`Successfully uploaded ${newImages.length} image(s)`, 'success');
    } catch (error: any) {
      updateStatus(`Upload failed: ${error.message}`, 'error');
    }
    
    // Clear the input
    event.target.value = '';
  };
  
  // Handle live processing toggle - fixed logic
  const handleLiveToggle = (enabled: boolean) => {
    if (enabled && selectedCount !== 1) {
      updateStatus('Live processing requires exactly one selected image', 'warning');
      return;
    }
    
    setLiveProcessingEnabled(enabled);
    setLiveProcessing(enabled);
    setCurrentView(enabled ? 'live' : 'grid');
    
    if (enabled) {
      clearBatchResults();
      setSelectedResult(null);
      if (selectedImages.length === 1 && pipeline.length > 0) {
        handleLiveProcess();
      }
    } else {
      clearLiveResults();
      setViewingStep(-1);
    }
  };
  
  // Handle live processing
  const handleLiveProcess = async () => {
    if (selectedImages.length !== 1 || !liveProcessingEnabled) return;
    
    try {
      await processLive(selectedImages[0].id, pipeline);
    } catch (error: any) {
      updateStatus(`Live processing failed: ${error.message}`, 'error');
    }
  };

  // Handle batch processing
  const handleBatchProcess = async () => {
    console.log('=== BATCH PROCESSING DEBUG ===');
    console.log('Selected count:', selectedCount);
    console.log('Pipeline length:', pipeline.length);
    console.log('Selected images:', selectedImages);
    
    if (selectedCount === 0) {
      updateStatus('Please select at least one image', 'warning');
      return;
    }
    
    if (pipeline.length === 0) {
      updateStatus('Please add at least one operation', 'warning');
      return;
    }
    
    try {
      // Remove this line: updateStatus(`Processing ${selectedCount} image(s)...`, 'processing');
      console.log('Calling processBatch...');
      
      const results = await processBatch(selectedImages.map(img => img.id), pipeline);
      console.log('processBatch returned:', results);
      
      // Force view update
      setCurrentView('grid');
      console.log('Set current view to grid');
      
      updateStatus(`Successfully processed ${results.length} image(s)`, 'success');
      
      // Log the batch results state
      setTimeout(() => {
        console.log('batchResults state after timeout:', batchResults);
      }, 1000);
      
    } catch (error: any) {
      console.error('Batch processing error:', error);
      updateStatus(`Processing failed: ${error.message}`, 'error');
    }
  };
  
  // Handle adding operation to pipeline
  const handleAddOperation = (operationName: string) => {
    const config = DEFAULT_OPERATION_CONFIGS[operationName];
    const params: Record<string, any> = {};
    
    config.params.forEach(param => {
      params[param.name] = param.default;
    });
    
    addStep(operationName, params);
    
    // Trigger live processing if enabled
    if (liveProcessingEnabled && selectedImages.length === 1) {
      handleLiveProcess();
    }
  };
  
  // Handle parameter changes
  const handleParameterChange = (stepId: string, paramName: string, value: any) => {
    updateStepParam(stepId, paramName, value);
    
    // Trigger live processing if enabled
    if (liveProcessingEnabled && selectedImages.length === 1) {
      handleLiveProcess();
    }
  };
  
  // Handle result selection in batch mode - fixed to pass proper data
    const handleResultSelect = (result: ProcessedResult) => {
      const originalImage = selectedImages.find(img => img.id === result.id);
      
      console.log('Inspector - Original image data:', {
        found: !!originalImage,
        filename: originalImage?.filename,
        hasThumbnail: !!originalImage?.thumbnailDataUrl,
        hasFullImage: !!originalImage?.dataUrl,
        fullImageSize: originalImage?.dataUrl?.length || 0,
        thumbnailSize: originalImage?.thumbnailDataUrl?.length || 0
      });
      
      const resultWithOriginal = {
        ...result,
        originalUrl: originalImage?.dataUrl || originalImage?.thumbnailDataUrl || ''
      };
      
      setSelectedResult(resultWithOriginal);
      setCurrentView('inspector');
    };

    const handleImageView = (imageIndex: number) => {
      const image = images[imageIndex];
      console.log('Lightbox - Image data:', {
        filename: image.filename,
        hasThumbnail: !!image.thumbnailDataUrl,
        hasFullImage: !!image.dataUrl,
        fullImageSize: image.dataUrl?.length || 0,
        thumbnailSize: image.thumbnailDataUrl?.length || 0
      });
      
      setLightboxState({
        isOpen: true,
        imageUrl: image.dataUrl || image.thumbnailDataUrl || '',
        filename: image.filename
      });
    };

  const closeLightbox = () => {
    setLightboxState(prev => ({ ...prev, isOpen: false }));
  };
  
  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+k': () => document.getElementById('operationSearch')?.focus(),
    'ctrl+/': () => document.getElementById('operationSearch')?.focus(),
    'escape': () => {
      if (galleryModal.isOpen) galleryModal.closeModal();
    }
  });
  
  // Update status based on current state
  useEffect(() => {
    if (liveProcessingEnabled) {
      updateStatus('Live mode enabled', 'info', true);
    } else if (images.length === 0) {
      updateStatus('Upload images to start', 'info', true);
    } else if (selectedCount === 0) {
      updateStatus('Select images from the gallery to process', 'warning', true);
    } else if (pipeline.length === 0) {
      updateStatus('Add operations to build your pipeline', 'info', true);
    } else {
      updateStatus(`Ready to process ${selectedCount} image(s)`, 'info', true);
    }
  }, [liveProcessingEnabled, images.length, selectedCount, pipeline.length, updateStatus]);
  
  // Auto-trigger live processing when pipeline changes
  useEffect(() => {
    if (liveProcessingEnabled && selectedImages.length === 1 && pipeline.length > 0) {
      const timeoutId = setTimeout(() => {
        handleLiveProcess();
      }, 500); // Debounced
      
      return () => clearTimeout(timeoutId);
    }
  }, [pipeline, liveProcessingEnabled, selectedImages.length]);
  
  // Add this useEffect near other useEffects in App.tsx
  useEffect(() => {
    if (lightboxState.isOpen) {
      const container = document.querySelector('.zoom-container') as HTMLElement;
      const image = document.querySelector('.zoomable-image') as HTMLElement;
      
      if (container && image) {
        let scale = 1;
        let panning = false;
        let pointX = 0;
        let pointY = 0;
        let start = { x: 0, y: 0 };
        
        const setTransform = () => {
          image.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
          container.style.cursor = scale > 1 ? 'grab' : 'default';
        };
        
        const handleWheel = (e: WheelEvent) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -1 : 1;
          const oldScale = scale;
          scale = Math.min(Math.max(1, scale * (1 + delta * 0.2)), 10);
          
          if (scale !== oldScale) {
            const rect = image.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const scaleRatio = scale / oldScale;
            pointX -= x * (scaleRatio - 1);
            pointY -= y * (scaleRatio - 1);
            
            if (scale === 1) {
              pointX = 0;
              pointY = 0;
            }
            setTransform();
          }
        };
        
        const handleMouseDown = (e: MouseEvent) => {
          if (scale <= 1 || e.button !== 0) return;
          e.preventDefault();
          start = { x: e.clientX - pointX, y: e.clientY - pointY };
          panning = true;
          container.style.cursor = 'grabbing';
        };
        
        const handleMouseMove = (e: MouseEvent) => {
          if (!panning) return;
          e.preventDefault();
          pointX = e.clientX - start.x;
          pointY = e.clientY - start.y;
          setTransform();
        };
        
        const handleMouseUp = () => {
          panning = false;
          container.style.cursor = scale > 1 ? 'grab' : 'default';
        };
        
        container.addEventListener('wheel', handleWheel);
        container.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        return () => {
          container.removeEventListener('wheel', handleWheel);
          container.removeEventListener('mousedown', handleMouseDown);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }
  }, [lightboxState.isOpen]);

  // Update live processing toggle state when selection changes
  useEffect(() => {
    if (selectedCount !== 1 && liveProcessingEnabled) {
      setLiveProcessingEnabled(false);
      setLiveProcessing(false);
      setCurrentView('grid');
      clearLiveResults();
    }
  }, [selectedCount]);

  const filteredOperationGroups = getFilteredOperations();

  return (
    <div className="flex bg-gray-50 dark:bg-black min-h-screen">
      {/* Operations Sidebar */}
      <aside className={`h-screen sticky top-0 bg-white dark:bg-zinc-900/80 p-4 flex flex-col border-r border-gray-200 dark:border-zinc-800 flex-shrink-0 transition-all duration-300 ${
        ui.sidebarCollapsed ? 'w-16' : 'w-80'
      }`}>
        <div className="flex items-center justify-between mb-4">
          {!ui.sidebarCollapsed && (
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Operations</h2>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-gray-300"
          >
            <LucideReact.PanelLeftClose className="w-5 h-5" />
          </button>
        </div>
        
        {!ui.sidebarCollapsed && (
          <div className="flex-grow flex flex-col min-h-0">
            {/* Search Bar */}
            <div className="relative mb-4">
              <input
                type="text"
                id="operationSearch"
                placeholder="Search operations... (Ctrl+K)"
                value={operationSearch}
                onChange={(e) => setOperationSearch(e.target.value)}
                className="input-field pr-10"
              />
              <LucideReact.Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            {/* Operations List */}
              <div className="flex-grow overflow-y-auto space-y-2">
                {Object.entries(filteredOperationGroups).map(([groupName, operations], groupIndex) => (
                  <details 
                    key={groupName} 
                    open={groupIndex < 2} // Only first 2 groups open by default
                    className="operation-group"
                  >
                    <summary className="cursor-pointer font-semibold text-zinc-900 dark:text-white flex justify-between items-center py-2">
                      {groupName}
                      <LucideReact.ChevronDown className="w-5 h-5" />
                    </summary>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {operations.map((op: string) => (
                        <button
                          key={op}
                          onClick={() => handleAddOperation(op)}
                          className="operation-btn"
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
          </div>
        )}
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-black sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <label htmlFor="upload-image" className="btn-primary cursor-pointer">
              Upload Image(s)
            </label>
            <input
              type="file"
              id="upload-image"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
            />
            {images.length > 0 && (
              <button
                onClick={galleryModal.openModal}
                className="btn-secondary"
              >
                Gallery ({images.length})
              </button>
            )}
            <button
              onClick={handleBatchProcess}
              disabled={liveProcessingEnabled || selectedCount === 0 || pipeline.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Pipeline
            </button>
          </div>

          {/* Status Display - Moved here */}
          <div className="flex-1 text-center px-4">
            {status.text && (
              <span className={`text-sm flex items-center justify-center gap-2 status-${status.type}`}>
                {status.type === 'processing' && <LucideReact.Loader2 className="w-4 h-4 animate-spin" />}
                {status.type === 'success' && <LucideReact.CheckCircle className="w-4 h-4" />}
                {status.type === 'error' && <LucideReact.AlertTriangle className="w-4 h-4" />}
                {status.type === 'warning' && <LucideReact.AlertCircle className="w-4 h-4" />}
                {status.text}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Live Processing Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-800 dark:text-white">Live Processing</span>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  type="checkbox"
                  checked={liveProcessingEnabled}
                  onChange={(e) => handleLiveToggle(e.target.checked)}
                  disabled={selectedCount !== 1}
                  className="toggle-checkbox"
                />
                <label className="toggle-label"></label>
              </div>
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-gray-300"
            >
              {theme === 'dark' ? <LucideReact.Sun className="w-5 h-5" /> : <LucideReact.Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="flex-1 p-6 flex flex-col gap-6">
          {/* Pipeline Section */}
          <div className="bg-white dark:bg-zinc-900/80 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Pipeline ({pipeline.length} steps)
              </h3>
              <button
                onClick={resetPipeline}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-zinc-800 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <LucideReact.RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
            
            <div className="space-y-2">
              {pipeline.length === 0 ? (
                <p className="text-sm text-center py-4 text-gray-500">
                  Add operations from the left panel
                </p>
              ) : (
                pipeline.map((step, index) => (
                  <PipelineStepComponent
                    key={step.id}
                    step={step}
                    index={index}
                    totalSteps={pipeline.length}
                    onRemove={() => removeStep(index)}
                    onMove={moveStep}
                    onParameterChange={handleParameterChange}
                    onPreview={() => {
                      if (liveProcessingEnabled) {
                        setViewingStep(ui.viewingStepIndex === index ? -1 : index);
                        // Trigger live processing if not already viewing this step
                        if (ui.viewingStepIndex !== index) {
                          handleLiveProcess();
                        }
                      } else {
                        updateStatus('Enable live processing to preview individual steps', 'info');
                      }
                    }}
                    isViewing={ui.viewingStepIndex === index}
                  />
                ))
              )}
            </div>
          </div>
          
          {/* Results Section */}
          <div className="flex-1 bg-white dark:bg-black rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-700 flex flex-col">
            {ui.currentView === 'grid' && (
              <ResultsGridComponent
                results={batchResults}
                loading={batchLoading}
                onResultSelect={handleResultSelect}
              />
            )}
            
            {ui.currentView === 'inspector' && selectedResult && (
              <Inspector
                result={selectedResult}
                view={ui.inspectorView}
                onViewChange={setInspectorView}
                onBack={() => setCurrentView('grid')}
              />
            )}
            
            {ui.currentView === 'live' && liveProcessingEnabled && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Live Processing
                    {ui.viewingStepIndex >= 0 && pipeline[ui.viewingStepIndex] && (
                      <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        Step {ui.viewingStepIndex + 1}: {pipeline[ui.viewingStepIndex].name}
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex-1 p-4">
                  {liveResults.length > 0 ? (
                    <div className="w-full h-full flex justify-center items-center">
                      <img
                        src={ui.viewingStepIndex >= 0 && ui.viewingStepIndex < liveResults.length 
                          ? liveResults[ui.viewingStepIndex] 
                          : liveResults[liveResults.length - 1]
                        }
                        alt="Live processing result"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400 dark:text-gray-500">
                        <LucideReact.Zap className="w-16 h-16 mx-auto mb-4" />
                        <p className="font-semibold text-lg mb-2">Live Processing Mode</p>
                        <p className="text-sm">
                          {pipeline.length === 0 ? 'Add operations to see live preview' : 'Processing...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Gallery Modal */}
      <GalleryModal
        isOpen={galleryModal.isOpen}
        images={images}
        onClose={galleryModal.closeModal}
        onImageSelect={toggleImageSelection}
        onImageRemove={removeImage}
        onSelectAll={selectAllImages}
        onDeselectAll={deselectAllImages}
        onImageView={handleImageView}
      />

      {/* Enhanced Lightbox with Zoom/Pan */}
        {lightboxState.isOpen && (
          <div 
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <div className="relative w-full h-full flex justify-center items-center">
              <div 
                className="zoom-container w-full h-full flex justify-center items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={lightboxState.imageUrl}
                  alt={lightboxState.filename}
                  className="max-w-full max-h-full object-contain zoomable-image cursor-grab"
                  style={{ transformOrigin: '0px 0px' }}
                />
              </div>
              
              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 bg-gray-900/50 backdrop-blur-sm rounded-lg text-white flex items-center text-xs">
                <button 
                  className="p-3 hover:bg-white/20 rounded-l-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    const container = document.querySelector('.zoom-container');
                    const img = container?.querySelector('.zoomable-image') as HTMLElement;
                    if (img) {
                      const currentScale = parseFloat(img.style.transform.match(/scale\(([^)]+)\)/)?.[1] || '1');
                      const newScale = Math.max(1, currentScale / 1.5);
                      img.style.transform = `scale(${newScale})`;
                      if (newScale === 1) {
                        img.style.transform = 'translate(0px, 0px) scale(1)';
                      }
                    }
                  }}
                >
                  <LucideReact.ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-3 font-mono">Zoom</span>
                <button 
                  className="p-3 hover:bg-white/20 rounded-r-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    const container = document.querySelector('.zoom-container');
                    const img = container?.querySelector('.zoomable-image') as HTMLElement;
                    if (img) {
                      const currentScale = parseFloat(img.style.transform.match(/scale\(([^)]+)\)/)?.[1] || '1');
                      const newScale = Math.min(10, currentScale * 1.5);
                      const rect = img.getBoundingClientRect();
                      const centerX = rect.width / 2;
                      const centerY = rect.height / 2;
                      img.style.transformOrigin = `${centerX}px ${centerY}px`;
                      img.style.transform = `scale(${newScale})`;
                    }
                  }}
                >
                  <LucideReact.ZoomIn className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <LucideReact.X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>  // <-- This is still the closing div for the main app container
  );
};

export default App;