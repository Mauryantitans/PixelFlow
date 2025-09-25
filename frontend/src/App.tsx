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
  DEFAULT_OPERATION_CONFIGS,
  OPENCV_OPERATION_CONFIGS,
  SCIKIT_OPERATION_CONFIGS,
  ALL_OPERATION_CONFIGS,
  StatusMessage
} from './types';
import { ApiService } from './services/api';
import PipelineStepComponent from './components/PipelineStep';
import ResultsGridComponent from './components/ResultsGrid';
import Inspector from './components/Inspector';
import GalleryModal from './components/GalleryModal';
import './index.css';
import MethodDetailsModal from './components/MethodDetailsModal';

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
    resetPipeline,
    undo,
    redo,
    canUndo,
    canRedo
  } = usePipeline();
  
  const {
    results: liveResults,
    loading: liveLoading,
    timingData: liveTimingData,
    processLive,
    clearResults: clearLiveResults
  } = useLiveProcessing();
  
  const {
    results: batchResults,
    loading: batchLoading,
    timingData: batchTimingData,
    processBatch,
    setResultsManually,
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
  const methodDetailsModal = useModal();
  const [selectedMethodName, setSelectedMethodName] = useState<string>('');
  
  // State for search functionality
  const [operationSearch, setOperationSearch] = useState('');
  
  // State for selected result in batch mode
 const [selectedResult, setSelectedResult] = useState<ProcessedResult | null>(null);

  // State for processing progress in batch mode
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

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
        'Basic Operations': {
          'Adjustments': ['Brightness', 'Contrast', 'Saturation', 'Exposure'],
          'Filters': ['Grayscale', 'Sepia', 'Invert', 'Solarize', 'Posterize'],
          'Blur & Sharpen': ['Sharpen', 'Gaussian Blur'],
          'Effects': ['Vignette', 'Grain']
        },
        'OpenCV': OPENCV_OPERATION_CONFIGS,
        'Scikit-Image': SCIKIT_OPERATION_CONFIGS
      };
    }
    
    const searchTerm = operationSearch.toLowerCase();
    const filteredOps: string[] = [];
    
    // Search in all operation configs
    Object.keys(ALL_OPERATION_CONFIGS).forEach(op => {
      if (op.toLowerCase().includes(searchTerm)) {
        filteredOps.push(op);
      }
    });
    
    return {
      'Search Results': {
        'Found Operations': filteredOps
      }
    };
  };
  // Enhanced file upload with feedback
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    
    try {
      const newImages = await addImages(Array.from(files));
      // Success feedback - temporary
      updateStatus(`Successfully uploaded ${newImages.length} image(s)`, 'success');
    } catch (error: any) {
      updateStatus(`Upload failed: ${error.message}`, 'error');
    }
    
    event.target.value = '';
  };
  
  // Enhanced live toggle with feedback
  const handleLiveToggle = (enabled: boolean) => {
    if (enabled && selectedCount !== 1) {
      updateStatus('Live processing requires exactly one selected image', 'error');
      return;
    }
    
    setLiveProcessingEnabled(enabled);
    setLiveProcessing(enabled);
    setCurrentView(enabled ? 'live' : 'grid');
    
    if (enabled) {
      clearBatchResults();
      setSelectedResult(null);
      // The status will be updated by the useEffect to "Live mode enabled"
      if (selectedImages.length === 1 && pipeline.length > 0) {
        setTimeout(() => handleLiveProcess(), 100); // Small delay to let UI update
      }
    } else {
      clearLiveResults();
      setViewingStep(-1);
      // The status will be updated by the useEffect based on current state
    }
  };
  
  // Enhanced live processing with feedback
  const handleLiveProcess = async () => {
    if (selectedImages.length !== 1 || !liveProcessingEnabled) return;
    
    try {
      // Action State - Live processing
      updateStatus('Processing...', 'processing', true);
      
      await processLive(selectedImages[0].id, pipeline);
      
      // Success State - Live updated
      updateStatus('Live preview updated', 'success');
      
    } catch (error: any) {
      updateStatus(`Live processing failed: ${error.message}`, 'error');
    }
  };

  // Enhanced batch processing with detailed feedback
  const handleBatchProcess = async () => {
    if (selectedCount === 0) {
      updateStatus('Please upload and select at least one image', 'error');
      return;
    }
    
    if (pipeline.length === 0) {
      updateStatus('Please add at least one operation', 'error');
      return;
    }
    
    try {
      // Show initial processing status
      updateStatus('Processing images...', 'processing', true);
      
      // Use the actual batch processing endpoint which has timing
      const results = await processBatch(selectedImages.map(img => img.id), pipeline);
      
      // Map original URLs to results
      const resultsWithOriginals = results.map(result => {
        const originalImage = selectedImages.find(img => img.id === result.id);
        return {
          ...result,
          originalUrl: originalImage?.dataUrl || originalImage?.thumbnailDataUrl || ''
        };
      });
      
      // Set results and switch to grid view
      setResultsManually(resultsWithOriginals);
      setCurrentView('grid');
      
      updateStatus(`Successfully processed ${results.length} image(s). Click a result to inspect.`, 'success');
      
    } catch (error: any) {
      updateStatus(`Batch processing failed: ${error.message}`, 'error');
    }
  };
  
  // Handle adding operation to pipeline
  const handleAddOperation = (operationName: string) => {
    const config = ALL_OPERATION_CONFIGS[operationName];
    const params: Record<string, any> = {};
    
    if (config && config.params) {
      config.params.forEach(param => {
        params[param.name] = param.default;
      });
    }
    
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

  // Show method details in modal
  const handleShowMethodDetails = (operationName: string) => {
    setSelectedMethodName(operationName);
    methodDetailsModal.openModal();
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
    'ctrl+z': () => canUndo && undo(),
    'ctrl+y': () => canRedo && redo(),
    'escape': () => {
      if (galleryModal.isOpen) galleryModal.closeModal();
    }
  });

  {/* Method Details Modal */}
  <MethodDetailsModal
    isOpen={methodDetailsModal.isOpen}
    operationName={selectedMethodName}
    config={ALL_OPERATION_CONFIGS[selectedMethodName]}
    onClose={methodDetailsModal.closeModal}
  />

  // Helper function for status colors (using string literals instead of StatusMessage type)
  const getStatusTextColor = (type: 'info' | 'processing' | 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'processing':
        return 'text-blue-600 dark:text-blue-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-500';
      case 'info':
      default:
        return 'text-zinc-800 dark:text-gray-300';
    }
  };
  
  // Update status based on current state
  useEffect(() => {
    // User Guidance States (Default/Persistent)
    if (liveProcessingEnabled) {
      updateStatus('Live mode enabled', 'info', true);
    } else if (images.length === 0) {
      updateStatus('Upload an image to start', 'info', true);
    } else if (selectedCount === 0) {
      updateStatus('Select images from the gallery to process', 'warning', true);
    } else if (pipeline.length === 0) {
      updateStatus('Add an operation to build your pipeline', 'info', true);
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

  useEffect(() => {
    const handleDetailsToggle = () => {
      const allDetails = document.querySelectorAll('details');
      allDetails.forEach(details => {
        if (details.open) {
          details.classList.add('details-open');
        } else {
          details.classList.remove('details-open');
        }
      });
    };

    // Listen for details toggle events
    const allDetails = document.querySelectorAll('details');
    allDetails.forEach(details => {
      details.addEventListener('toggle', handleDetailsToggle);
    });

    // Initial setup
    handleDetailsToggle();

    return () => {
      allDetails.forEach(details => {
        details.removeEventListener('toggle', handleDetailsToggle);
      });
    };
  }, []);

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
            
            {/* Enhanced Operations List */}
              <div className="flex-grow overflow-y-auto space-y-1 pr-1">
                {Object.entries(getFilteredOperations()).map(([libraryName, libraryCategories], libraryIndex) => (
                  <div key={libraryName} className={`library-container ${
                    libraryName === 'OpenCV' ? 'library-opencv' : 
                    libraryName === 'Scikit-Image' ? 'library-scikit' : 
                    'library-basic'
                  }`}>
                    <details open={libraryIndex < 1} className="operation-group">
                      <summary className="library-header">
                        <div className="flex items-center">
                          {libraryName === 'OpenCV' && <LucideReact.Camera className="library-icon" />}
                          {libraryName === 'Scikit-Image' && <LucideReact.Microscope className="library-icon" />}
                          {libraryName === 'Basic Operations' && <LucideReact.Sliders className="library-icon" />}
                          {libraryName === 'Search Results' && <LucideReact.Search className="library-icon" />}
                          {libraryName}
                        </div>
                        <LucideReact.ChevronDown className="chevron-icon" />
                      </summary>
                      
                      <div className="space-y-2 mt-2">
                        {Object.entries(libraryCategories as Record<string, any>).map(([categoryName, operations], categoryIndex) => (
                          <div key={categoryName} className="category-container">
                            <details open={categoryIndex < 2} className="operation-group">
                              <summary className="category-header">
                                <div className="flex items-center">
                                  {/* Category icons based on name */}
                                  {categoryName === 'Adjustments' && <LucideReact.SlidersHorizontal className="w-3 h-3 mr-1" />}
                                  {categoryName === 'Filters' && <LucideReact.Filter className="w-3 h-3 mr-1" />}
                                  {categoryName === 'Blur & Sharpen' && <LucideReact.Focus className="w-3 h-3 mr-1" />}
                                  {categoryName === 'Effects' && <LucideReact.Sparkles className="w-3 h-3 mr-1" />}
                                  {categoryName === 'Filtering' && <LucideReact.Grid className="w-3 h-3 mr-1" />}
                                  {categoryName === 'Edge Detection' && <LucideReact.Scan className="w-3 h-3 mr-1" />}
                                  {categoryName === 'Enhancement' && <LucideReact.Sun className="w-3 h-3 mr-1" />}
                                  {categoryName === 'Restoration' && <LucideReact.Wrench className="w-3 h-3 mr-1" />}
                                  {categoryName === 'Found Operations' && <LucideReact.Search className="w-3 h-3 mr-1" />}
                                  {!['Adjustments', 'Filters', 'Blur & Sharpen', 'Effects', 'Filtering', 'Edge Detection', 'Enhancement', 'Restoration', 'Found Operations'].includes(categoryName) && 
                                  <LucideReact.Folder className="w-3 h-3 mr-1" />}
                                  <span className="text-gray-700 dark:text-gray-300">{categoryName}</span>
                                </div>
                                <LucideReact.ChevronDown className="w-3 h-3 chevron-icon" />
                              </summary>
                              
                              <div className="grid grid-cols-2 gap-1.5 mt-2">
                                {(Array.isArray(operations) 
                                  ? operations 
                                  : Object.keys(operations as Record<string, any>)
                                ).map((op: string) => (
                                  <button
                                    key={op}
                                    onClick={() => handleAddOperation(op)}
                                    className="operation-btn-enhanced group"
                                  >
                                    {op}
                                    {ALL_OPERATION_CONFIGS[op]?.description && (
                                      <div className="operation-tooltip">
                                        {ALL_OPERATION_CONFIGS[op].description}
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </details>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
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

          {/* Status Display */}
          <div className="flex-1 text-center px-4">
            {status.text && (
              <span className={`text-sm flex items-center justify-center gap-2 transition-colors duration-200 font-medium ${getStatusTextColor(status.type)}`}>
                {status.type === 'processing' && <LucideReact.Loader2 className="w-4 h-4 animate-spin" />}
                {status.type === 'success' && <LucideReact.CheckCircle className="w-4 h-4" />}
                {status.type === 'error' && <LucideReact.AlertTriangle className="w-4 h-4" />}
                {status.type === 'warning' && <LucideReact.AlertCircle className="w-4 h-4" />}
                {status.type === 'info' && status.text.includes('Live mode') && <LucideReact.Zap className="w-4 h-4" />}
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
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Pipeline ({pipeline.length} steps)
                  </h3>
                  {/* Timing Display */}
                  {((liveProcessingEnabled && liveTimingData.total_time > 0) || (!liveProcessingEnabled && batchTimingData.total_time > 0)) && (
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <LucideReact.Clock className="w-3 h-3" />
                      {liveProcessingEnabled 
                        ? `${(liveTimingData.total_time * 1000).toFixed(0)}ms`
                        : `${(batchTimingData.total_time).toFixed(2)}s total`
                      }
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-zinc-800 dark:hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Undo (Ctrl+Z)"
                  >
                    <LucideReact.Undo2 className="w-3 h-3" />
                    Undo
                  </button>
                  <button
                    onClick={redo}
                    disabled={!canRedo}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-zinc-800 dark:hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Redo (Ctrl+Y)"
                  >
                    <LucideReact.Redo2 className="w-3 h-3" />
                    Redo
                  </button>
                  <div className="w-px h-4 bg-gray-300 dark:bg-zinc-700"></div>
                  <button
                    onClick={resetPipeline}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-zinc-800 dark:hover:text-white transition-colors flex items-center gap-1"
                  >
                    <LucideReact.RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                {pipeline.length === 0 ? (
                  <p className="text-sm text-center py-4 text-gray-500">
                    Add operations from the left panel
                  </p>
                ) : (
                  pipeline.map((step, index) => {
                    // Calculate step timing
                    let stepTiming: { duration: number; isAverage?: boolean } | undefined;
                    
                    if (liveProcessingEnabled && liveTimingData.step_timings.length > 0) {
                      const timing = liveTimingData.step_timings.find(t => t.step_index === index);
                      if (timing) {
                        stepTiming = { duration: timing.duration };
                      }
                    } else if (!liveProcessingEnabled && batchTimingData.step_timings.length > 0) {
                      // Calculate average for batch processing
                      const stepTimings = batchTimingData.step_timings.filter(t => t.step_name === step.name);
                      if (stepTimings.length > 0) {
                        const avgDuration = stepTimings.reduce((sum, t) => sum + t.duration, 0) / stepTimings.length;
                        stepTiming = { duration: avgDuration, isAverage: stepTimings.length > 1 };
                      }
                    }
                    
                    return (
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
                            if (ui.viewingStepIndex !== index) {
                              handleLiveProcess();
                            }
                          } else {
                            updateStatus('Enable live processing to preview individual steps', 'info');
                          }
                        }}
                        isViewing={ui.viewingStepIndex === index}
                        stepTiming={stepTiming}
                        onShowDetails={() => handleShowMethodDetails(step.name)}
                      />
                    );
                  })
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

          {/* Method Details Modal */}
          <MethodDetailsModal
            isOpen={methodDetailsModal.isOpen}
            operationName={selectedMethodName}
            config={ALL_OPERATION_CONFIGS[selectedMethodName]}
            onClose={methodDetailsModal.closeModal}
          />

      </div>  // <-- This is still the closing div for the main app container
  );
};

export default App;
