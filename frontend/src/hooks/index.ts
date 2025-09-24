import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  ImageData, 
  PipelineStep, 
  StatusMessage, 
  ProcessedResult, 
  UIState,
  ProcessingCache,
  DEBOUNCE_DELAY 
} from '../types';
import { ApiService } from '../services/api';
import { SessionUtils, ThemeUtils, debounce } from '../utils';

/**
 * Session management hook
 */
export function useSession() {
  const [sessionId] = useState(() => SessionUtils.getSessionId());
  
  const cleanup = useCallback(() => {
    ApiService.sendCleanupBeacon(sessionId);
  }, [sessionId]);
  
  useEffect(() => {
    const handleBeforeUnload = () => cleanup();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') cleanup();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      cleanup();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cleanup]);
  
  return { sessionId, cleanup };
}

/**
 * Theme management hook
 */
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => ThemeUtils.getTheme());
  
  const toggleTheme = useCallback(() => {
    const newTheme = ThemeUtils.toggleTheme();
    setTheme(newTheme);
  }, []);
  
  useEffect(() => {
    ThemeUtils.setTheme(theme);
  }, [theme]);
  
  return { theme, toggleTheme, setTheme };
}

/**
 * Status message management hook
 */
export function useStatus() {
  const [status, setStatus] = useState<StatusMessage>({ text: '', type: 'info' });
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const updateStatus = useCallback((text: string, type: StatusMessage['type'] = 'info', persistent = false) => {
    clearTimeout(timeoutRef.current);
    setStatus({ text, type, persistent });
    
    if (!persistent && ['success', 'error', 'warning'].includes(type)) {
      timeoutRef.current = setTimeout(() => {
        setStatus({ text: '', type: 'info' });
      }, 4000);
    }
  }, []);
  
  const clearStatus = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setStatus({ text: '', type: 'info' });
  }, []);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return { status, updateStatus, clearStatus };
}

/**
 * Image management hook
 */
export function useImages() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const { sessionId } = useSession();
  
  const addImages = useCallback(async (files: File[]) => {
    setLoading(true);
    try {
      const uploadPromises = files.map(file => ApiService.uploadImage(file, sessionId));
      const responses = await Promise.allSettled(uploadPromises);
      
      const newImages: ImageData[] = [];
      const fileReadPromises: Promise<void>[] = [];
      
      responses.forEach((response, index) => {
        if (response.status === 'fulfilled' && response.value.success && response.value.image) {
          const imageData: ImageData = {
            ...response.value.image,
            selected: true,
            file: files[index],
            thumbnailDataUrl: response.value.thumbnail,
            dataUrl: '' // Initialize as empty, will be filled by FileReader
          };
          
          // Create a promise for the FileReader
          const fileReadPromise = new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                imageData.dataUrl = e.target.result as string;
                console.log('Full dataUrl created for:', files[index].name, 'Size:', imageData.dataUrl.length);
              }
              resolve();
            };
            reader.onerror = () => {
              console.error('FileReader error for:', files[index].name);
              resolve(); // Resolve anyway to not block
            };
            reader.readAsDataURL(files[index]);
          });
          
          fileReadPromises.push(fileReadPromise);
          newImages.push(imageData);
        }
      });
      
      // Wait for all FileReaders to complete
      await Promise.all(fileReadPromises);
      
      console.log('All images processed:', newImages.map(img => ({
        filename: img.filename,
        hasThumbnail: !!img.thumbnailDataUrl,
        hasFullImage: !!img.dataUrl,
        fullImageSize: img.dataUrl?.length || 0
      })));
      
      setImages(prev => [...prev, ...newImages]);
      return newImages;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);
  
  const removeImage = useCallback((imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  }, []);
  
  const toggleImageSelection = useCallback((imageId: string) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, selected: !img.selected } : img
    ));
  }, []);
  
  const selectAllImages = useCallback(() => {
    setImages(prev => prev.map(img => ({ ...img, selected: true })));
  }, []);
  
  const deselectAllImages = useCallback(() => {
    setImages(prev => prev.map(img => ({ ...img, selected: false })));
  }, []);
  
  const selectedImages = useMemo(() => images.filter(img => img.selected), [images]);
  const selectedCount = selectedImages.length;
  
  return {
    images,
    selectedImages,
    selectedCount,
    loading,
    addImages,
    removeImage,
    toggleImageSelection,
    selectAllImages,
    deselectAllImages
  };
}

/**
 * Pipeline management hook
 */
export function usePipeline() {
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  
  const addStep = useCallback((operationName: string, params: Record<string, any> = {}) => {
    const newStep: PipelineStep = {
      id: `step_${Date.now()}`,
      name: operationName,
      params
    };
    setPipeline(prev => [...prev, newStep]);
  }, []);
  
  const removeStep = useCallback((index: number) => {
    setPipeline(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const updateStepParam = useCallback((stepId: string, paramName: string, value: any) => {
    setPipeline(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, params: { ...step.params, [paramName]: value } }
        : step
    ));
  }, []);
  
  const moveStep = useCallback((fromIndex: number, toIndex: number) => {
    setPipeline(prev => {
      const newPipeline = [...prev];
      const [movedStep] = newPipeline.splice(fromIndex, 1);
      newPipeline.splice(toIndex, 0, movedStep);
      return newPipeline;
    });
  }, []);
  
  const resetPipeline = useCallback(() => {
    setPipeline([]);
  }, []);
  
  const generatePipelineHash = useCallback((imageIds: string[]) => {
    return JSON.stringify({
      imageIds: imageIds.sort(),
      pipeline: pipeline.map(step => ({ name: step.name, params: step.params }))
    });
  }, [pipeline]);
  
  return {
    pipeline,
    addStep,
    removeStep,
    updateStepParam,
    moveStep,
    resetPipeline,
    generatePipelineHash
  };
}

/**
 * Live processing hook with caching
 */
export function useLiveProcessing() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState<ProcessingCache | null>(null);
  const { sessionId } = useSession();
  const abortControllerRef = useRef<AbortController>();
  
  const processLive = useCallback(async (imageId: string, pipeline: PipelineStep[]) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    const pipelineHash = JSON.stringify({ imageId, pipeline });
    
    // Check cache
    if (cache && cache.pipelineHash === pipelineHash && 
        Date.now() - cache.timestamp < 10 * 60 * 1000) { // 10 minutes
      setResults(cache.results);
      return cache.results;
    }
    
    setLoading(true);
    try {
      const response = await ApiService.processLive({
        image_id: imageId,
        pipeline: pipeline.map(step => ({ name: step.name, params: step.params })),
        session_id: sessionId
      });
      
      if (response.success) {
        setResults(response.results);
        setCache({
          pipelineHash,
          results: response.results,
          timestamp: Date.now()
        });
        return response.results;
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Live processing request aborted');
        return [];
      }
      console.error('Live processing error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [sessionId, cache]);
  
  const debouncedProcessLive = useMemo(
    () => debounce(processLive, DEBOUNCE_DELAY),
    [processLive]
  );
  
  const clearResults = useCallback(() => {
    setResults([]);
    setCache(null);
  }, []);
  
  const invalidateCache = useCallback(() => {
    setCache(null);
  }, []);
  
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return {
    results,
    loading,
    processLive: debouncedProcessLive,
    clearResults,
    invalidateCache
  };
}

/**
 * Batch processing hook
 */
export function useBatchProcessing() {
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { sessionId } = useSession();
  
  const processBatch = useCallback(async (imageIds: string[], pipeline: PipelineStep[]) => {
    setLoading(true);
    setResults([]); // Clear previous results
    
    try {
      const response = await ApiService.processImages({
        image_ids: imageIds,
        pipeline: pipeline.map(step => ({ name: step.name, params: step.params })),
        session_id: sessionId
      });
      
      if (response.success && response.processed_images) {
        const processedResults: ProcessedResult[] = response.processed_images.map((processedUrl, index) => ({
          id: imageIds[index],
          originalUrl: '', // Will be filled by the component
          processedUrl,
          intermediateResults: response.intermediate_results?.[index]
        }));
        
        setResults(processedResults);
        console.log('Batch processing results:', processedResults); // Debug log
        return processedResults;
      } else {
        throw new Error(response.message || 'Processing failed');
      }
    } catch (error) {
      console.error('Batch processing error:', error);
      setResults([]); // Clear results on error
      throw error;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);
  
  const clearResults = useCallback(() => {
    setResults([]);
  }, []);
  
  return {
    results,
    loading,
    processBatch,
    clearResults
  };
}

/**
 * UI state management hook
 */
export function useUI() {
  const [ui, setUI] = useState<UIState>({
    theme: 'dark',
    sidebarCollapsed: false,
    liveProcessingEnabled: false,
    currentView: 'grid',
    inspectorView: 'normal',
    selectedImages: [],
    selectedResult: null,
    viewingStepIndex: -1
  });
  
  const updateUI = useCallback((updates: Partial<UIState>) => {
    setUI(prev => ({ ...prev, ...updates }));
  }, []);
  
  const toggleSidebar = useCallback(() => {
    setUI(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);
  
  const setLiveProcessing = useCallback((enabled: boolean) => {
    setUI(prev => ({ ...prev, liveProcessingEnabled: enabled }));
  }, []);
  
  const setCurrentView = useCallback((view: UIState['currentView']) => {
    setUI(prev => ({ ...prev, currentView: view }));
  }, []);
  
  const setInspectorView = useCallback((view: UIState['inspectorView']) => {
    setUI(prev => ({ ...prev, inspectorView: view }));
  }, []);
  
  const setViewingStep = useCallback((stepIndex: number) => {
    setUI(prev => ({ ...prev, viewingStepIndex: stepIndex }));
  }, []);
  
  return {
    ui,
    updateUI,
    toggleSidebar,
    setLiveProcessing,
    setCurrentView,
    setInspectorView,
    setViewingStep
  };
}

/**
 * Modal management hook
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  
  const openModal = useCallback((modalData?: any) => {
    setData(modalData || null);
    setIsOpen(true);
  }, []);
  
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);
  
  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  return {
    isOpen,
    data,
    openModal,
    closeModal,
    toggleModal
  };
}

/**
 * Keyboard shortcuts hook
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const ctrlKey = event.ctrlKey || event.metaKey;
      
      let shortcutKey = '';
      if (ctrlKey) shortcutKey += 'ctrl+';
      if (event.shiftKey) shortcutKey += 'shift+';
      if (event.altKey) shortcutKey += 'alt+';
      shortcutKey += key;
      
      if (shortcuts[shortcutKey]) {
        event.preventDefault();
        shortcuts[shortcutKey]();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Resize observer hook
 */
export function useResizeObserver(callback: (entry: ResizeObserverEntry) => void) {
  const elementRef = useRef<HTMLElement>();
  
  useEffect(() => {
    if (!elementRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) callback(entries[0]);
    });
    
    observer.observe(elementRef.current);
    
    return () => observer.disconnect();
  }, [callback]);
  
  return elementRef;
}