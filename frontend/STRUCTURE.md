# Frontend Structure Documentation

This document explains the organized structure of the frontend code after refactoring for better maintainability and readability.

## Directory Structure

```
frontend/
├── css/
│   ├── main.css                 # Main CSS entry point (imports all modules)
│   ├── base/
│   │   └── reset.css           # Base styles and resets
│   ├── components/
│   │   ├── scrollbar.css       # Custom scrollbar styles
│   │   ├── forms.css           # Form controls (sliders, selects, toggles)
│   │   └── buttons.css         # Button styles and interactions
│   ├── layout/
│   │   ├── sidebar.css         # Sidebar layout and animations
│   │   └── grid.css            # Grid layouts and masonry
│   └── features/
│       ├── image-viewer.css    # Image viewing and comparison features
│       ├── gallery.css         # Gallery and thumbnail overlays
│       └── modal.css           # Modal and overlay animations
├── script/
│   ├── main.js                 # Main JavaScript entry point
│   ├── core/
│   │   └── app.js              # Core application initialization
│   ├── ui/
│   │   ├── theme.js            # Theme management
│   │   ├── status.js           # Status message management
│   │   ├── sidebar.js          # Sidebar toggle functionality
│   │   ├── lightbox.js         # Lightbox functionality
│   │   └── zoom-pan.js         # Zoom and pan functionality
│   ├── features/
│   │   └── pipeline.js         # Pipeline management
│   └── utils/
│       └── layout.js           # Layout utilities (masonry, etc.)
└── index.html                  # Main HTML file
```

## CSS Organization

### Base Layer (`css/base/`)
- **reset.css**: Contains fundamental styles, body defaults, and dark mode base styles

### Components Layer (`css/components/`)
- **scrollbar.css**: Custom webkit scrollbar styling for both light and dark modes
- **forms.css**: All form-related styles including sliders, selects, and toggle switches
- **buttons.css**: Button interactions, hover states, and specialized button types

### Layout Layer (`css/layout/`)
- **sidebar.css**: Sidebar collapse/expand animations and responsive behavior
- **grid.css**: Masonry grid layouts, thumbnail positioning, and selection states

### Features Layer (`css/features/`)
- **image-viewer.css**: Zoom/pan functionality, image comparison sliders, and viewer controls
- **gallery.css**: Gallery-specific styles like thumbnail overlays
- **modal.css**: Modal and lightbox transition animations

## JavaScript Organization

### Core Layer (`script/core/`)
- **app.js**: Main application initialization, element caching, state management, and module coordination

### UI Layer (`script/ui/`)
- **theme.js**: Light/dark theme switching functionality
- **status.js**: Status message display and management
- **sidebar.js**: Sidebar collapse/expand behavior
- **lightbox.js**: Image lightbox modal functionality
- **zoom-pan.js**: Image zoom and pan interactions

### Features Layer (`script/features/`)
- **pipeline.js**: Complete pipeline management including rendering, parameter handling, and step operations

### Utils Layer (`script/utils/`)
- **layout.js**: Utility functions for masonry grid layouts and responsive design

## Module Communication

### Global Objects
- **window.AppElements**: Contains references to all DOM elements
- **window.AppState**: Contains all application state variables
- **window.[ModuleName]**: Each module exposes its functionality through a global object

### Initialization Order
1. Utilities (no dependencies)
2. UI components (minimal dependencies)
3. Features (depend on UI components)
4. Core app (depends on all modules)

## Benefits of This Structure

1. **Separation of Concerns**: Each file has a single, clear responsibility
2. **Easy Maintenance**: Changes to specific functionality are isolated to relevant files
3. **Better Readability**: Smaller, focused files are easier to understand
4. **Modular Loading**: Files can be loaded independently or conditionally
5. **Scalability**: New features can be added without affecting existing code
6. **Debugging**: Issues can be traced to specific modules more easily

## Usage

The main HTML file loads all modules in the correct dependency order. The CSS uses `@import` statements to combine all stylesheets, while JavaScript modules communicate through global objects and initialization callbacks.

To add new functionality:
1. Create new files in the appropriate category folder
2. Follow the existing naming and structure patterns
3. Update the main files to include the new modules
4. Document any new global objects or dependencies