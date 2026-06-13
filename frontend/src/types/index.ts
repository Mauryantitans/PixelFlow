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
  lastProcessingTime?: number; // Add individual step timing
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

// ---- Dynamic operation schema (GET /processing/operations, Phase 2/3) ----
// The backend registry is the single source of truth; the frontend renders
// controls from these DTOs rather than the static *_OPERATION_CONFIGS above.
export type ParamType =
  | 'int'
  | 'float'
  | 'odd_kernel'
  | 'angle'
  | 'enum'
  | 'bool'
  | 'color'
  | 'point'
  | 'points'
  | 'rect';

export interface ParamSpecDTO {
  name: string;
  label: string;
  type: ParamType;
  default: any;
  help?: string;
  advanced?: boolean;
  // numeric (int / float / odd_kernel / angle)
  min?: number;
  max?: number;
  step?: number;
  // enum
  options?: Array<{ value: string; label: string }>;
  // coordinate (point / points / rect)
  space?: 'normalized' | 'pixel';
  min_points?: number;
  max_points?: number | null;
}

export interface OperationSpecDTO {
  id: string;
  label: string;
  category: string;
  subcategory: string | null;
  description: string;
  interactive: boolean;
  params: ParamSpecDTO[];
}

export interface OperationSchema {
  version: string;
  categories: Array<{
    name: string;
    subcategories: Array<{ name: string | null; operations: OperationSpecDTO[] }>;
  }>;
}

export interface StepErrorDTO {
  op: string;
  kind: string;
  message: string;
  param_errors: Array<{ param: string; message: string }>;
}

export interface ProcessingTiming {
  step_name: string;
  duration: number; // in seconds
  step_index: number;
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
  total_time: number;
  step_timings: ProcessingTiming[];
  step_errors?: Array<Array<StepErrorDTO | null> | null> | null;
  message: string;
}

export interface LiveProcessResponse {
  success: boolean;
  results: string[];
  total_time: number;
  step_timings: ProcessingTiming[];
  step_errors?: Array<StepErrorDTO | null> | null;
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
  totalTime?: number; // Add timing
  stepTimings?: ProcessingTiming[]; // Add step timings
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

// Updated OpenCV operation configurations
export const OPENCV_OPERATION_CONFIGS: Record<string, Record<string, OperationConfig>> = {
  'Filtering': {
    'Bilateral Filter': {
      description: 'Edge-preserving smoothing filter',
      params: [
        { name: 'd', type: 'slider', min: 5, max: 25, default: 9, description: 'Diameter of pixel neighborhood' },
        { name: 'sigmaColor', type: 'slider', min: 10, max: 150, default: 75, description: 'Filter sigma in color space' },
        { name: 'sigmaSpace', type: 'slider', min: 10, max: 150, default: 75, description: 'Filter sigma in coordinate space' }
      ]
    },
    'Median Filter': {
      description: 'Median filtering for noise reduction',
      params: [
        { name: 'ksize', type: 'slider', min: 3, max: 15, default: 5, description: 'Kernel size (odd numbers only)' }
      ]
    },
    'Box Filter': {
      description: 'Simple box blur filter',
      params: [
        { name: 'ksize', type: 'slider', min: 3, max: 15, default: 5, description: 'Kernel size' }
      ]
    },
    'Non-Local Means Denoising': {
      description: 'Advanced noise reduction using non-local means',
      params: [
        { name: 'h', type: 'slider', min: 3, max: 20, default: 10, description: 'Filter strength' },
        { name: 'template_window_size', type: 'slider', min: 7, max: 21, default: 7, description: 'Template patch size' },
        { name: 'search_window_size', type: 'slider', min: 15, max: 35, default: 21, description: 'Search window size' }
      ]
    }
  },
  'Morphological Operations': {
    'Morphological Opening': {
      description: 'Erosion followed by dilation',
      params: [
        { name: 'kernel_size', type: 'slider', min: 3, max: 15, default: 5, description: 'Kernel size' },
        { name: 'shape', type: 'select', options: ['Rectangle', 'Ellipse', 'Cross'], default: 'Rectangle', description: 'Kernel shape' }
      ]
    },
    'Morphological Closing': {
      description: 'Dilation followed by erosion',
      params: [
        { name: 'kernel_size', type: 'slider', min: 3, max: 15, default: 5, description: 'Kernel size' },
        { name: 'shape', type: 'select', options: ['Rectangle', 'Ellipse', 'Cross'], default: 'Rectangle', description: 'Kernel shape' }
      ]
    },
    'Dilate': {
      description: 'Morphological dilation',
      params: [
        { name: 'kernel_size', type: 'slider', min: 3, max: 15, default: 5, description: 'Kernel size' },
        { name: 'shape', type: 'select', options: ['Rectangle', 'Ellipse', 'Cross'], default: 'Rectangle', description: 'Kernel shape' }
      ]
    },
    'Erode': {
      description: 'Morphological erosion',
      params: [
        { name: 'kernel_size', type: 'slider', min: 3, max: 15, default: 5, description: 'Kernel size' },
        { name: 'shape', type: 'select', options: ['Rectangle', 'Ellipse', 'Cross'], default: 'Rectangle', description: 'Kernel shape' }
      ]
    },
    'Morphological Gradient': {
      description: 'Difference between dilation and erosion',
      params: [
        { name: 'kernel_size', type: 'slider', min: 3, max: 15, default: 5, description: 'Kernel size' },
        { name: 'shape', type: 'select', options: ['Rectangle', 'Ellipse', 'Cross'], default: 'Rectangle', description: 'Kernel shape' }
      ]
    },
    'Top Hat': {
      description: 'Difference between original and opening',
      params: [
        { name: 'kernel_size', type: 'slider', min: 3, max: 15, default: 5, description: 'Kernel size' },
        { name: 'shape', type: 'select', options: ['Rectangle', 'Ellipse', 'Cross'], default: 'Rectangle', description: 'Kernel shape' }
      ]
    },
    'Black Hat': {
      description: 'Difference between closing and original',
      params: [
        { name: 'kernel_size', type: 'slider', min: 3, max: 15, default: 5, description: 'Kernel size' },
        { name: 'shape', type: 'select', options: ['Rectangle', 'Ellipse', 'Cross'], default: 'Rectangle', description: 'Kernel shape' }
      ]
    }
  },
  'Edge Detection': {
    'Canny Edge Detection': {
      description: 'Canny edge detector',
      params: [
        { name: 'threshold1', type: 'slider', min: 50, max: 200, default: 100, description: 'First threshold' },
        { name: 'threshold2', type: 'slider', min: 100, max: 300, default: 200, description: 'Second threshold' }
      ]
    },
    'Sobel X': {
      description: 'Sobel edge detection (X direction)',
      params: [
        { name: 'ksize', type: 'slider', min: 1, max: 7, default: 3, description: 'Kernel size' }
      ]
    },
    'Sobel Y': {
      description: 'Sobel edge detection (Y direction)', 
      params: [
        { name: 'ksize', type: 'slider', min: 1, max: 7, default: 3, description: 'Kernel size' }
      ]
    },
    'Sobel Combined': {
      description: 'Combined Sobel edge detection (magnitude)',
      params: [
        { name: 'ksize', type: 'slider', min: 1, max: 7, default: 3, description: 'Kernel size' }
      ]
    },
    'Laplacian': {
      description: 'Laplacian edge detection',
      params: [
        { name: 'ksize', type: 'slider', min: 1, max: 7, default: 3, description: 'Kernel size' }
      ]
    },
    'Scharr X': {
      description: 'Scharr edge detection (X direction)',
      params: []
    },
    'Scharr Y': {
      description: 'Scharr edge detection (Y direction)',
      params: []
    }
  },
  'Color Space Conversions': {
    'RGB to HSV': {
      description: 'Convert RGB to HSV color space',
      params: []
    },
    'RGB to LAB': {
      description: 'Convert RGB to LAB color space',
      params: []
    },
    'RGB to YUV': {
      description: 'Convert RGB to YUV color space',
      params: []
    }
  },
  'Geometric Transformations': {
    'Resize': {
      description: 'Resize image by scale factor',
      params: [
        { name: 'scale_factor', type: 'slider', min: 0.1, max: 3.0, default: 1.0, description: 'Scale factor' }
      ]
    },
    'Rotation': {
      description: 'Rotate image by specified angle',
      params: [
        { name: 'angle', type: 'slider', min: -180, max: 180, default: 0, description: 'Rotation angle in degrees' }
      ]
    },
    'Flip Horizontal': {
      description: 'Flip image horizontally',
      params: []
    },
    'Flip Vertical': {
      description: 'Flip image vertically',
      params: []
    }
  },
  'Feature Detection': {
    'FAST Corner Detection': {
      description: 'Features from Accelerated Segment Test corner detection',
      params: [
        { name: 'threshold', type: 'slider', min: 10, max: 100, default: 50, description: 'Detection threshold' }
      ]
    },
    'ORB Features': {
      description: 'Oriented FAST and Rotated BRIEF feature detection',
      params: [
        { name: 'n_features', type: 'slider', min: 50, max: 1000, default: 500, description: 'Maximum number of features' }
      ]
    }
  }
};

export const SCIKIT_OPERATION_CONFIGS: Record<string, Record<string, OperationConfig>> = {
  'Enhancement': {
    'Histogram Equalization': {
      description: 'Improve image contrast using histogram equalization',
      params: []
    },
    'Adaptive Histogram Equalization': {
      description: 'Contrast Limited Adaptive Histogram Equalization (CLAHE)',
      params: [
        { name: 'clip_limit', type: 'slider', min: 1, max: 10, default: 3, description: 'Clipping limit' }
      ]
    },
    'Gamma Correction': {
      description: 'Apply gamma correction to adjust brightness',
      params: [
        { name: 'gamma', type: 'slider', min: 0.1, max: 3.0, default: 1.0, description: 'Gamma value' }
      ]
    },
    'Contrast Stretching': {
      description: 'Stretch image contrast to full range',
      params: [
        { name: 'in_range', type: 'select', options: ['image', 'dtype'], default: 'image', description: 'Input range' }
      ]
    },
    'Adjust Log': {
      description: 'Apply logarithmic adjustment',
      params: [
        { name: 'gain', type: 'slider', min: 0.1, max: 3.0, default: 1.0, description: 'Logarithmic gain' }
      ]
    },
    'Adjust Sigmoid': {
      description: 'Apply sigmoid correction',
      params: [
        { name: 'cutoff', type: 'slider', min: 0.1, max: 0.9, default: 0.5, description: 'Cutoff value' },
        { name: 'gain', type: 'slider', min: 5, max: 20, default: 10, description: 'Gain value' }
      ]
    },
    'Rescale Intensity': {
      description: 'Rescale image intensity range',
      params: [
        { name: 'out_range', type: 'select', options: ['uint8', 'uint16', 'dtype'], default: 'uint8', description: 'Output range' }
      ]
    },
    'Logarithmic Correction': {
      description: 'Apply logarithmic correction',
      params: [
        { name: 'gain', type: 'slider', min: 0.1, max: 2.0, default: 1.0, description: 'Correction gain' }
      ]
    }
  },
  'Filters': {
    'Gaussian Filter': {
      description: 'Gaussian filtering using scikit-image',
      params: [
        { name: 'sigma', type: 'slider', min: 0.5, max: 10.0, default: 1.0, description: 'Standard deviation' }
      ]
    },
    'Frangi Filter': {
      description: 'Frangi filter for vessel-like structures',
      params: []
    },
    'Hessian Filter': {
      description: 'Hessian filter for blob detection',
      params: []
    },
    'Farid Filter': {
      description: 'Farid edge filter',
      params: []
    }
  },
  'Restoration': {
    'Denoise Wavelet': {
      description: 'Wavelet denoising',
      params: [
        { name: 'sigma', type: 'slider', min: 0.01, max: 0.3, default: 0.1, description: 'Noise standard deviation' }
      ]
    },
    'Unsharp Mask': {
      description: 'Sharpen image using unsharp masking',
      params: [
        { name: 'radius', type: 'slider', min: 1, max: 10, default: 3, description: 'Blur radius' },
        { name: 'amount', type: 'slider', min: 0.5, max: 3.0, default: 1.0, description: 'Sharpening amount' }
      ]
    }
  },
  'Segmentation': {
    'Threshold Otsu': {
      description: 'Otsu\'s automatic thresholding',
      params: []
    },
    'Threshold Adaptive': {
      description: 'Adaptive thresholding',
      params: [
        { name: 'block_size', type: 'slider', min: 3, max: 21, default: 11, description: 'Block size for threshold calculation' }
      ]
    },
    'Watershed': {
      description: 'Watershed segmentation',
      params: []
    },
    'SLIC Superpixels': {
      description: 'Simple Linear Iterative Clustering superpixels',
      params: [
        { name: 'n_segments', type: 'slider', min: 50, max: 1000, default: 300, description: 'Number of segments' },
        { name: 'compactness', type: 'slider', min: 1, max: 50, default: 10, description: 'Compactness factor' }
      ]
    }
  },
  'Feature Detection': {
    'Harris Corner Detection': {
      description: 'Harris corner detector',
      params: [
        { name: 'threshold', type: 'slider', min: 0.01, max: 0.3, default: 0.1, description: 'Detection threshold' }
      ]
    }
  }
};

// Update the combined lookup to include all operations
export const ALL_OPERATION_CONFIGS: Record<string, OperationConfig> = {
  ...DEFAULT_OPERATION_CONFIGS,
  ...Object.values(OPENCV_OPERATION_CONFIGS).reduce((acc, category) => ({ ...acc, ...category }), {}),
  ...Object.values(SCIKIT_OPERATION_CONFIGS).reduce((acc, category) => ({ ...acc, ...category }), {})
};

// Authentication types
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_admin: boolean;
  profile_picture?: string;  // OAuth profile picture URL
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string) => void;
}

// Saved Pipeline types
export interface SavedPipeline {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  pipeline_data: Array<{
    name: string;
    params: Record<string, any>;
  }>;
  is_public: boolean;
  is_template: boolean;
  category?: string;
  tags?: string[];
  thumbnail_data?: string;
  usage_count: number;
  created_at: string;
  updated_at?: string;
}

export interface CreatePipelineRequest {
  name: string;
  description?: string;
  pipeline_data: Array<{
    name: string;
    params: Record<string, any>;
  }>;
  is_public?: boolean;
  category?: string;
  tags?: string[];
  thumbnail_data?: string;
}
