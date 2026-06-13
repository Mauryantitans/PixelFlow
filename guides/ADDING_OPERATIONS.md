# Adding Custom Operations to PixelFlow

Learn how to extend PixelFlow with your own image processing operations.

---

> ## ⚠️ This guide is being updated
>
> Operations are now defined **entirely in the backend** by a declarative registry —
> there are **no frontend config files to edit** (the old `types/index.ts`
> `*_OPERATION_CONFIGS` were removed). The UI renders each operation's controls
> dynamically from its parameter schema served by `GET /api/processing/operations`.
>
> **To add an operation today:**
> 1. Write a function `fn(image: PIL.Image, **params) -> PIL.Image` (see
>    `backend/app/processing/operations/extras.py` for examples).
> 2. Register it with typed params:
>    ```python
>    from app.processing.registry import OperationSpec, registry
>    from app.processing.param_specs import IntParam, EnumParam, BoolParam, ColorParam, PointParam, RectParam
>
>    registry.register(OperationSpec(
>        id="my_op", label="My Op", category="Basic", subcategory="Effects",
>        description="…", fn=my_fn,
>        params=[IntParam(name="amount", label="Amount", default=0, min=-100, max=100)],
>    ))
>    ```
>    (import your module in `registry.ensure_registered`).
>
> Param types: `int`, `float`, `odd_kernel`, `angle`, `enum`, `bool`, `color`, and the
> image-coordinate types `point` / `points` / `rect` (picked on the preview). The
> executor validates/coerces params and maps normalized coordinates to pixels; the UI
> needs **no changes**. The step-by-step below is the older two-file approach and is
> retained only for historical context.

---

## 🎯 **Overview (legacy approach — superseded by the registry above)**

PixelFlow makes it easy to add new operations. You only need to:

1. Define the operation configuration (frontend)
2. Implement the processing logic (backend)

That's it! PixelFlow handles UI generation, parameter controls, and pipeline integration automatically.

---

## 📝 **Step-by-Step Guide**

### **Step 1: Choose Your Operation Details**

Before coding, decide:
- **Name**: What users will see (e.g., "Vintage Filter")
- **Category**: Where it appears (e.g., "Effects")
- **Library**: Basic, OpenCV, or Scikit-Image
- **Parameters**: What users can adjust (e.g., intensity, strength)

---

### **Step 2: Add Frontend Configuration**

Edit: `frontend/src/types/index.ts`

Find the appropriate operation config object and add your operation:

```typescript
// For Basic Operations
export const BASIC_OPERATION_CONFIGS: Record<string, OperationConfig> = {
  // ... existing operations ...
  
  'Vintage Filter': {
    name: 'Vintage Filter',
    category: 'Effects',
    description: 'Applies a vintage/retro effect to images',
    params: [
      {
        name: 'intensity',
        type: 'range',
        min: 0,
        max: 100,
        default: 50,
        step: 1,
        label: 'Intensity'
      },
      {
        name: 'sepia_strength',
        type: 'range',
        min: 0,
        max: 1,
        default: 0.5,
        step: 0.1,
        label: 'Sepia Strength'
      }
    ]
  },
};

// For OpenCV Operations
export const OPENCV_OPERATION_CONFIGS: Record<string, Record<string, Record<string, OperationConfig>>> = {
  'Filtering': {
    'Custom Filter': {
      'My Custom Operation': {
        name: 'My Custom Operation',
        category: 'Custom Filter',
        description: 'Your custom operation description',
        params: [
          // ... your parameters ...
        ]
      }
    }
  }
};
```

---

### **Step 3: Implement Backend Processing**

Edit: `backend/app/utils/image_processing.py`

Add your processing function:

```python
def process_vintage_filter(self, params: dict) -> PILImage.Image:
    """Apply vintage/retro filter effect"""
    intensity = params.get('intensity', 50) / 100.0  # Normalize to 0-1
    sepia_strength = params.get('sepia_strength', 0.5)
    
    # Convert to numpy array
    img_array = np.array(self.current_image)
    
    # Apply sepia tone
    sepia_filter = np.array([
        [0.393, 0.769, 0.189],
        [0.349, 0.686, 0.168],
        [0.272, 0.534, 0.131]
    ])
    
    # Apply filter with strength control
    sepia_img = cv2.transform(img_array, sepia_filter)
    sepia_img = np.clip(sepia_img, 0, 255).astype(np.uint8)
    
    # Blend with original based on strength
    result = cv2.addWeighted(
        img_array, 1 - sepia_strength,
        sepia_img, sepia_strength,
        0
    )
    
    # Apply intensity
    result = cv2.convertScaleAbs(result, alpha=1.0, beta=intensity * 20)
    
    # Convert back to PIL
    return PILImage.fromarray(result)
```

---

### **Step 4: Register the Operation**

In the same file, find the `apply_operation` method and add your operation:

```python
def apply_operation(self, operation_name: str, params: dict) -> PILImage.Image:
    """Apply an operation to the current image"""
    
    # ... existing operations ...
    
    # YOUR NEW OPERATION
    elif operation_name == 'Vintage Filter':
        return self.process_vintage_filter(params)
    
    else:
        raise ValueError(f"Unknown operation: {operation_name}")
```

---

### **Step 5: Test Your Operation**

1. **Restart backend** (Ctrl+C, then `python run.py`)
2. **Refresh frontend** (Ctrl+Shift+R)
3. **Find your operation** in the sidebar
4. **Click it** to add to pipeline
5. **Adjust parameters** and test!

---

## 🔧 **Operation Types & Examples**

### **1. Simple Filter (No Parameters)**

```typescript
// Frontend
'Sepia': {
  name: 'Sepia',
  category: 'Filters',
  description: 'Classic sepia tone effect',
  params: []  // No parameters!
}
```

```python
# Backend
def process_sepia(self, params: dict) -> PILImage.Image:
    """Apply sepia tone"""
    img_array = np.array(self.current_image)
    sepia_filter = np.array([[0.393, 0.769, 0.189],
                              [0.349, 0.686, 0.168],
                              [0.272, 0.534, 0.131]])
    result = cv2.transform(img_array, sepia_filter)
    return PILImage.fromarray(np.clip(result, 0, 255).astype(np.uint8))
```

### **2. Adjustable Filter (Range Parameter)**

```typescript
// Frontend
'Blur': {
  name: 'Blur',
  category: 'Blur & Sharpen',
  params: [{
    name: 'kernel_size',
    type: 'range',
    min: 1,
    max: 21,
    default: 5,
    step: 2,
    label: 'Blur Amount'
  }]
}
```

```python
# Backend
def process_blur(self, params: dict) -> PILImage.Image:
    kernel_size = params.get('kernel_size', 5)
    # Ensure odd number
    if kernel_size % 2 == 0:
        kernel_size += 1
    
    img_array = np.array(self.current_image)
    result = cv2.GaussianBlur(img_array, (kernel_size, kernel_size), 0)
    return PILImage.fromarray(result)
```

### **3. Multiple Parameters**

```typescript
// Frontend
'Advanced Effect': {
  name: 'Advanced Effect',
  params: [
    {
      name: 'strength',
      type: 'range',
      min: 0,
      max: 100,
      default: 50,
      step: 1,
      label: 'Strength'
    },
    {
      name: 'mode',
      type: 'select',
      options: ['soft', 'medium', 'hard'],
      default: 'medium',
      label: 'Mode'
    },
    {
      name: 'enable_edge_preserve',
      type: 'checkbox',
      default: true,
      label: 'Preserve Edges'
    }
  ]
}
```

```python
# Backend
def process_advanced_effect(self, params: dict) -> PILImage.Image:
    strength = params.get('strength', 50) / 100.0
    mode = params.get('mode', 'medium')
    preserve_edges = params.get('enable_edge_preserve', True)
    
    # Your processing logic here
    # ...
    
    return result_image
```

---

## 📚 **Available Parameter Types**

### **1. Range Slider**
```typescript
{
  name: 'parameter_name',
  type: 'range',
  min: 0,
  max: 100,
  default: 50,
  step: 1,
  label: 'Display Label'
}
```

### **2. Dropdown Select**
```typescript
{
  name: 'parameter_name',
  type: 'select',
  options: ['option1', 'option2', 'option3'],
  default: 'option1',
  label: 'Display Label'
}
```

### **3. Checkbox**
```typescript
{
  name: 'parameter_name',
  type: 'checkbox',
  default: true,
  label: 'Display Label'
}
```

### **4. Number Input**
```typescript
{
  name: 'parameter_name',
  type: 'number',
  min: 0,
  max: 1000,
  default: 100,
  step: 10,
  label: 'Display Label'
}
```

---

## 🎨 **Operation Organization**

### **Basic Operations**
Put here: Simple, user-friendly operations that don't require OpenCV/Scikit knowledge

Categories:
- **Adjustments**: Brightness, Contrast, Saturation, etc.
- **Filters**: Grayscale, Sepia, Invert, etc.
- **Blur & Sharpen**: Gaussian Blur, Sharpen, etc.
- **Effects**: Vignette, Grain, etc.

### **OpenCV Operations**
Put here: Professional computer vision operations

Categories:
- **Filtering**: Gaussian, Median, Bilateral blur
- **Edge Detection**: Canny, Sobel, Laplacian
- **Morphological**: Erosion, Dilation, Opening, Closing
- **Color Spaces**: RGB↔HSV, RGB↔LAB conversions

### **Scikit-Image Operations**
Put here: Scientific image processing operations

Categories:
- **Enhancement**: Contrast stretching, histogram equalization
- **Restoration**: Denoising, inpainting
- **Feature Detection**: Corner detection, blob detection
- **Segmentation**: Thresholding, watershed

---

## ⚠️ **Best Practices**

### **1. Input Validation**
Always validate parameters:
```python
def process_my_operation(self, params: dict) -> PILImage.Image:
    # Validate and clamp values
    strength = max(0, min(100, params.get('strength', 50)))
    
    # Check for required params
    if 'mode' not in params:
        raise ValueError("Mode parameter is required")
```

### **2. Error Handling**
Handle edge cases gracefully:
```python
try:
    # Your processing logic
    result = process_image(img_array)
except Exception as e:
    logger.error(f"Error in My Operation: {e}")
    # Return original image if processing fails
    return self.current_image
```

### **3. Performance**
- Keep operations fast (< 1 second for 1920x1080 image)
- Use numpy operations instead of loops
- Cache expensive calculations

### **4. Naming**
- Use clear, descriptive names
- Follow existing naming conventions
- Group related operations in categories

---

## 🧪 **Testing Your Operation**

### **Test Checklist**

- [ ] Operation appears in correct category
- [ ] Parameters render correctly
- [ ] Live mode updates in real-time
- [ ] Batch mode processes multiple images
- [ ] No errors in console
- [ ] Timing shows reasonable duration
- [ ] Undo/redo works properly
- [ ] Can save pipeline with your operation

### **Test Different Scenarios**

1. **Edge cases**: Min/max parameter values
2. **Different image sizes**: Small (100x100) and large (4000x3000)
3. **Different formats**: JPEG, PNG, BMP
4. **Grayscale images**: Operations should handle them
5. **RGBA images**: With transparency

---

## 📦 **Using External Libraries**

Want to use additional Python libraries?

### **Step 1: Install Dependency**

```bash
pip install your-library
```

### **Step 2: Add to requirements.txt**

```bash
pip freeze | grep your-library >> requirements.txt
```

### **Step 3: Import in image_processing.py**

```python
import your_library

class ImageProcessor:
    def process_custom_op(self, params):
        result = your_library.process(self.current_image)
        return result
```

---

## 🌟 **Real Examples from PixelFlow**

### **Example 1: Brightness (Simple Adjustment)**

**Frontend Config:**
```typescript
'Brightness': {
  name: 'Brightness',
  category: 'Adjustments',
  description: 'Adjust image brightness',
  params: [{
    name: 'amount',
    type: 'range',
    min: -100,
    max: 100,
    default: 0,
    step: 1,
    label: 'Brightness'
  }]
}
```

**Backend Implementation:**
```python
def process_brightness(self, params: dict) -> PILImage.Image:
    amount = params.get('amount', 0)
    enhancer = ImageEnhance.Brightness(self.current_image)
    return enhancer.enhance(1 + (amount / 100))
```

### **Example 2: Canny Edge Detection (OpenCV)**

**Frontend Config:**
```typescript
'Canny': {
  name: 'Canny',
  category: 'Edge Detection',
  description: 'Detect edges using Canny algorithm',
  params: [
    {
      name: 'threshold1',
      type: 'range',
      min: 0,
      max: 300,
      default: 100,
      step: 1,
      label: 'Lower Threshold'
    },
    {
      name: 'threshold2',
      type: 'range',
      min: 0,
      max: 300,
      default: 200,
      step: 1,
      label: 'Upper Threshold'
    }
  ]
}
```

**Backend Implementation:**
```python
def process_canny(self, params: dict) -> PILImage.Image:
    threshold1 = params.get('threshold1', 100)
    threshold2 = params.get('threshold2', 200)
    
    img_array = np.array(self.current_image.convert('L'))
    edges = cv2.Canny(img_array, threshold1, threshold2)
    
    return PILImage.fromarray(edges)
```

---

## 🚀 **Quick Template**

Use this template for new operations:

**Frontend (types/index.ts):**
```typescript
'YOUR_OPERATION_NAME': {
  name: 'YOUR_OPERATION_NAME',
  category: 'YOUR_CATEGORY',
  description: 'Brief description of what it does',
  params: [
    {
      name: 'param1',
      type: 'range',
      min: 0,
      max: 100,
      default: 50,
      step: 1,
      label: 'Parameter 1'
    }
  ]
},
```

**Backend (utils/image_processing.py):**
```python
def process_your_operation_name(self, params: dict) -> PILImage.Image:
    """YOUR_OPERATION_NAME implementation"""
    # Get parameters
    param1 = params.get('param1', 50)
    
    # Convert to numpy if needed
    img_array = np.array(self.current_image)
    
    # YOUR PROCESSING LOGIC HERE
    # result = ...
    
    # Convert back to PIL
    return PILImage.fromarray(result)

# Don't forget to register in apply_operation():
elif operation_name == 'YOUR_OPERATION_NAME':
    return self.process_your_operation_name(params)
```

---

## 🎓 **Advanced Topics**

### **Multi-Channel Operations**

Handle RGB, RGBA, and grayscale:

```python
def process_advanced(self, params: dict) -> PILImage.Image:
    # Ensure RGB mode
    if self.current_image.mode != 'RGB':
        img = self.current_image.convert('RGB')
    else:
        img = self.current_image
    
    # Process...
    
    return result
```

### **Preserving Alpha Channel**

```python
def process_with_alpha(self, params: dict) -> PILImage.Image:
    if self.current_image.mode == 'RGBA':
        # Split channels
        r, g, b, a = self.current_image.split()
        rgb = PILImage.merge('RGB', (r, g, b))
        
        # Process RGB only
        processed_rgb = self.your_processing(rgb, params)
        
        # Merge back with alpha
        r2, g2, b2 = processed_rgb.split()
        return PILImage.merge('RGBA', (r2, g2, b2, a))
    else:
        return self.your_processing(self.current_image, params)
```

### **Conditional Parameters**

Parameters can depend on other parameters:

```python
# Frontend
params: [
  {
    name: 'mode',
    type: 'select',
    options: ['auto', 'manual'],
    default: 'auto'
  },
  {
    name: 'threshold',
    type: 'range',
    min: 0,
    max: 255,
    default: 128,
    label: 'Threshold (manual mode only)'
    // Show only when mode='manual'
  }
]

# Backend
def process_adaptive(self, params: dict):
    mode = params.get('mode', 'auto')
    
    if mode == 'auto':
        # Auto threshold
        threshold = cv2.threshold(img, 0, 255, cv2.THRESH_OTSU)[0]
    else:
        # Manual threshold
        threshold = params.get('threshold', 128)
    
    # Use threshold...
```

---

## 📊 **Common Image Processing Patterns**

### **Pattern 1: Simple PIL Enhancement**
```python
from PIL import ImageEnhance

enhancer = ImageEnhance.Contrast(self.current_image)
return enhancer.enhance(factor)
```

### **Pattern 2: OpenCV Filter**
```python
img_array = np.array(self.current_image)
result = cv2.filter2D(img_array, -1, kernel)
return PILImage.fromarray(result)
```

### **Pattern 3: Scikit-Image Processing**
```python
from skimage import filters, exposure

img_array = np.array(self.current_image)
result = filters.gaussian(img_array, sigma=2)
result = (result * 255).astype(np.uint8)
return PILImage.fromarray(result)
```

---

## ✅ **Checklist for New Operations**

Before submitting/using a new operation:

- [ ] Configuration added to frontend types
- [ ] Backend function implemented
- [ ] Registered in `apply_operation` method
- [ ] Tested with various images
- [ ] Parameters validated
- [ ] Error handling added
- [ ] Works in both live and batch modes
- [ ] Reasonable performance (< 1s per image)
- [ ] Documentation/description provided

---

## 🆘 **Common Issues**

### **Operation doesn't appear in sidebar**
- Check frontend config syntax
- Refresh browser (Ctrl+Shift+R)
- Check browser console for errors

### **"Unknown operation" error**
- Check `apply_operation` registration
- Restart backend
- Check function name matches exactly

### **Parameters not working**
- Check parameter names match frontend ↔ backend
- Check default values are valid
- Validate parameter types

---

## 🌟 **Contribute Your Operations**

Created something awesome? Share it!

1. Test thoroughly
2. Add documentation
3. Create pull request to GitHub
4. Help others enhance their images!

---

**Happy coding! 🎨 Build amazing image processing operations!**
