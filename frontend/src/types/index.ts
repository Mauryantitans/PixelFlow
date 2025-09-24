// Image related types
export interface ImageData {
  id: string;
  filename: string;
  file_path: string;
  thumbnail_path?: string;
  session_id: string;
  size_bytes: number;
  width: number;
  height: number;
  format: string;
  selected?: boolean;
  file?: File;
  dataUrl?: string;
  thumbnailDataUrl?: string;
}

// Pipeline related types
export interface PipelineStep {
  id: string;
  name: string;
  params: Record<string, number | string | boolean>;
}

export interface OperationParam {
  name: string;
  type: 'slider' | 'select' | 'checkbox';
  min?: number;
  max?: number;
  default: number | string | boolean;
  options?: string[];
  description?: string;
}

export interface OperationConfig {
  description: string;
  params: OperationParam[];
}

// API request/response types
export interface ProcessRequest {
  image_ids: string[];
  pipeline: Array<{
    name: string;
    params: Record<string, number | string | boolean>;
  }>;
  session_id: string;
}

export interface LiveProcessRequest {
  image_id: string;
  pipeline: Array<{
    name: string;
    params: Record<string, number | string | boolean>;
  }>;
  session_id: string;
}

export interface ProcessResponse {
  success: boolean;
  processed_images: string[];
  intermediate_results?: string[][];
  message: string;
}

export interface LiveProcessResponse {
  success: boolean;
  results: string[];
  message: string;
}

export interface UploadResponse {
  success: boolean;
  image?: ImageData;
  thumbnail?: string;
  message: string;
}

export interface MultipleUploadResponse {
  success: boolean;
  uploaded_count: number;
  failed_count: number;
  uploaded_images: Array<{
    image: ImageData;
    thumbnail: string;
  }>;
  failed_uploads: Array<{
    filename: string;
    error: string;
  }>;
  message: string;
}

// UI State types
export interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  liveProcessingEnabled: boolean;
  currentView: 'grid' | 'inspector' | 'live';
  inspectorView: 'normal' | 'side-by-side' | 'slider';
  selectedImages: string[];
  selectedResult: ProcessedResult | null;
  viewingStepIndex: number; // -1 for final result
}

export interface ProcessedResult {
  id: string;
  originalUrl: string;
  processedUrl: string;
  intermediateResults?: string[];
}

// Status types
export type StatusType = 'info' | 'processing' | 'success' | 'error' | 'warning';

export interface StatusMessage {
  text: string;
  type: StatusType;
  persistent?: boolean;
}

// Modal types
export interface ModalState {
  galleryOpen: boolean;
  lightboxOpen: boolean;
  lightboxImages: string[];
  lightboxIndex: number;
}

// Zoom/Pan types
export interface ZoomState {
  scale: number;
  x: number;
  y: number;
  isDragging: boolean;
}

// Session types
export interface SessionInfo {
  id: string;
  createdAt: Date;
  lastActivity: Date;
}

// API Error types
export interface APIError {
  success: false;
  error: string;
  message: string;
}

// Masonry layout types
export interface MasonryItem {
  id: string;
  element: HTMLElement;
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface MasonryOptions {
  columnWidth: number;
  gap: number;
  containerWidth: number;
}

// Event types for custom hooks
export interface ImageUploadEvent {
  files: FileList;
  sessionId: string;
}

export interface PipelineChangeEvent {
  pipeline: PipelineStep[];
  sessionId: string;
}

export interface ParameterChangeEvent {
  stepId: string;
  paramName: string;
  value: number | string | boolean;
}

// Component props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'sm';
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface SliderProps {
  min: number;
  max: number;
  value: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

export interface SelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// File validation types
export interface FileValidation {
  maxSize: number; // in bytes
  allowedTypes: string[];
  maxFiles: number;
}

// Cache types for live processing
export interface ProcessingCache {
  pipelineHash: string;
  results: string[];
  timestamp: number;
}

// Constants
export const SUPPORTED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_FILES = 20;
export const THUMBNAIL_SIZE = { width: 150, height: 150 };
export const MASONRY_COLUMN_WIDTH = 150;
export const MASONRY_GAP = 16;
export const DEBOUNCE_DELAY = 500;
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
export const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

// Default operation configurations
export const DEFAULT_OPERATION_CONFIGS: Record<string, OperationConfig> = {
  'Brightness': {
    description: 'Adjust image brightness',
    params: [
      {
        name: 'amount',
        type: 'slider',
        min: -100,
        max: 100,
        default: 0,
        description: 'Brightness adjustment amount'
      }
    ]
  },
  'Contrast': {
    description: 'Adjust image contrast',
    params: [
      {
        name: 'amount',
        type: 'slider',
        min: -100,
        max: 100,
        default: 0,
        description: 'Contrast adjustment amount'
      }
    ]
  },
  'Saturation': {
    description: 'Adjust color saturation',
    params: [
      {
        name: 'amount',
        type: 'slider',
        min: -100,
        max: 100,
        default: 0,
        description: 'Saturation adjustment amount'
      }
    ]
  },
  'Exposure': {
    description: 'Adjust image exposure',
    params: [
      {
        name: 'amount',
        type: 'slider',
        min: -100,
        max: 100,
        default: 0,
        description: 'Exposure adjustment amount'
      }
    ]
  },
  'Gaussian Blur': {
    description: 'Apply Gaussian blur effect',
    params: [
      {
        name: 'radius',
        type: 'slider',
        min: 0,
        max: 50,
        default: 5,
        description: 'Blur radius'
      }
    ]
  },
  'Sharpen': {
    description: 'Sharpen image details',
    params: [
      {
        name: 'level',
        type: 'select',
        options: ['Low', 'Medium', 'High'],
        default: 'Medium',
        description: 'Sharpening intensity'
      }
    ]
  },
  'Vignette': {
    description: 'Add vignette effect',
    params: [
      {
        name: 'strength',
        type: 'slider',
        min: 0,
        max: 100,
        default: 50,
        description: 'Vignette strength'
      }
    ]
  },
  'Grayscale': {
    description: 'Convert to grayscale',
    params: []
  },
  'Sepia': {
    description: 'Apply sepia tone effect',
    params: []
  },
  'Invert': {
    description: 'Invert image colors',
    params: []
  },
  'Solarize': {
    description: 'Apply solarization effect',
    params: []
  },
  'Posterize': {
    description: 'Reduce number of colors',
    params: []
  },
  'Grain': {
    description: 'Add film grain effect',
    params: []
  }
};