# Getting Started with PixelFlow

A beginner's guide to using PixelFlow for image processing.

---

## 🎯 **What is PixelFlow?**

PixelFlow is a visual image processing pipeline builder that lets you:
- Upload multiple images
- Apply various filters and operations
- Build complex processing pipelines
- See results in real-time or batch mode
- Save and reuse your favorite pipelines

---

## 🚀 **Your First Pipeline (5 Minutes)**

### **Step 1: Upload Images**

1. Go to `http://localhost:3000/app`
2. Click **"Upload Image(s)"** button
3. Select one or more images from your computer
4. Images appear in the gallery

### **Step 2: Select Images**

- Click on images in the gallery to select them (blue border = selected)
- You can select multiple images for batch processing
- Or select just one image for live preview mode

### **Step 3: Build Your Pipeline**

The left sidebar shows all available operations organized by category:

**Try these beginner-friendly operations:**

1. **Basic Operations → Adjustments → Brightness**
   - Click "Brightness"
   - Adjust the slider to make image brighter/darker
   
2. **Basic Operations → Filters → Grayscale**
   - Click "Grayscale"
   - Converts image to black & white

3. **OpenCV → Filtering → Gaussian Blur**
   - Click "Gaussian Blur"
   - Adjust kernel size to control blur amount

### **Step 4: Process Images**

**Batch Mode (Multiple Images):**
1. Select multiple images
2. Build your pipeline
3. Click **"Apply Pipeline"**
4. Wait for processing to complete
5. Click on results to inspect them

**Live Mode (Single Image):**
1. Select **exactly one** image
2. Toggle **"Live Processing"** ON
3. Build your pipeline - see results update instantly!
4. Adjust parameters in real-time

---

## 🎨 **Understanding the Interface**

### **Main Sections**

```
┌─────────────────────────────────────────────────────────┐
│  [Logo] [Nav] [Session Status] [Theme] [User]          │  ← Header
├─────────┬──────────────────────────────────────────────┤
│ SIDEBAR │  MAIN CONTENT AREA                           │
│         │                                               │
│ Opera-  │  📤 Upload | Gallery | Apply Pipeline       │
│ tions   │                                               │
│ Library │  🔧 Pipeline (Your Operations)               │
│         │                                               │
│ Search  │  🖼️ Results Grid / Inspector                 │
│ Filter  │                                               │
│         │                                               │
└─────────┴──────────────────────────────────────────────┘
```

### **Operations Sidebar**
- **Search bar** at top - quickly find operations
- **Three main libraries:**
  - **Basic Operations** - Simple adjustments and filters
  - **OpenCV** - Professional computer vision operations
  - **Scikit-Image** - Scientific image processing
- **Expandable categories** - click to open/close

### **Pipeline Section**
- Shows your current pipeline steps in order
- **Drag to reorder** steps
- **Adjust parameters** for each operation
- **Undo/Redo** buttons for easy experimentation
- **Reset** button to clear pipeline

### **Results Area**
- **Grid view**: Shows all processed results
- **Inspector view**: Compare before/after, zoom, pan
- **Step-by-step view**: See intermediate results

---

## 💡 **Pro Tips**

### **1. Use Live Processing for Experimentation**
- Select one image
- Enable "Live Processing"
- Adjust parameters and see instant results
- Much faster than batch processing for testing!

### **2. Save Your Pipelines**
- Built something great? Save it!
- Click user menu → **"Save"**
- Give it a name and description
- Load it later with **"Load"** button

### **3. Keyboard Shortcuts**
- **Ctrl+K** or **Ctrl+/** - Focus search bar
- **Ctrl+Z** - Undo last pipeline change
- **Ctrl+Y** - Redo pipeline change
- **Escape** - Close modals/lightbox

### **4. Gallery Features**
- Click **"Gallery"** to see all uploaded images
- Select/deselect images in bulk
- Delete images you don't need
- View full-resolution images

### **5. Inspector Mode**
- Click any processed result to inspect it
- **Normal view**: Side-by-side comparison
- **Slider view**: Interactive before/after slider
- **Zoom/Pan**: Mouse wheel to zoom, drag to pan

---

## 🔨 **Common Workflows**

### **Workflow 1: Basic Photo Enhancement**

1. Upload portrait photo
2. Add operations:
   - Brightness (+10)
   - Contrast (+15)
   - Sharpen (amount: 1.5)
3. Apply Pipeline
4. Save result!

### **Workflow 2: Artistic Effects**

1. Upload landscape photo
2. Add operations:
   - Saturation (+30)
   - Vignette (strength: 0.5)
   - Gaussian Blur (kernel: 3) on edges
3. Experiment with parameters in Live mode
4. Save your custom pipeline for reuse

### **Workflow 3: Batch Processing**

1. Upload 20 product photos
2. Build consistent pipeline:
   - Resize to 1024x1024
   - Brightness (+5)
   - Sharpen (amount: 1.2)
3. Select all images
4. Apply Pipeline
5. Download all results!

---

## 📊 **Understanding Processing Modes**

### **Batch Processing**
- Process multiple images with same pipeline
- Shows progress bar
- Can cancel anytime
- Results appear in grid
- Good for: Processing many images at once

### **Live Processing**
- Real-time preview of single image
- Instant parameter updates
- See each pipeline step individually
- Perfect for: Experimenting and fine-tuning

---

## 🎓 **Learning Path**

### **Beginner (Week 1)**
1. Upload images ✅
2. Try basic operations (Brightness, Contrast, Grayscale)
3. Learn live processing mode
4. Save your first pipeline

### **Intermediate (Week 2)**
1. Explore OpenCV operations
2. Build multi-step pipelines
3. Use batch processing
4. Create an account and save pipelines

### **Advanced (Week 3+)**
1. Use advanced operations (Edge Detection, Morphology)
2. Combine operations creatively
3. Build reusable pipeline templates
4. Share pipelines with others

---

## 📚 **Next Steps**

- **[Adding Custom Operations](ADDING_OPERATIONS.md)** - Extend PixelFlow with your own operations
- **[Admin Panel Guide](ADMIN_PANEL.md)** - Manage users, quotas, and settings
- **[API Reference](API_REFERENCE.md)** - Use PixelFlow via API
- **[Deployment Guide](DEPLOYMENT.md)** - Deploy to production

---

## 🆘 **Need Help?**

- Check [Troubleshooting](../INSTALLATION.md#troubleshooting) section
- Read [API Documentation](API_REFERENCE.md)
- Visit [GitHub Issues](https://github.com/Mauryantitans/PixelFlow/issues)

---

**Happy image processing! 🎨**
