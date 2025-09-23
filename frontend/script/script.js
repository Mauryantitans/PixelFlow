
        // Legacy code - will be removed
        document.addEventListener('DOMContentLoaded', () => {
            // --- Elements Cache ---
            const themeToggleBtn = document.getElementById('theme-toggle-btn');
            const pipelineStepsContainer = document.getElementById('pipeline-steps');
            const stepCount = document.getElementById('step-count');
            const operationsList = document.getElementById('operations-list');
            const imageUpload = document.getElementById('upload-image');
            const resetBtn = document.getElementById('reset-pipeline-btn');
            const applyBtn = document.getElementById('apply-pipeline-btn');
            const searchInput = document.getElementById('operationSearch');
            const sidebar = document.getElementById('operations-sidebar');
            const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
            const statusMessage = document.getElementById('status-message');
            const liveProcessingToggle = document.getElementById('live-processing-toggle');
            const galleryBtn = document.getElementById('gallery-btn');
            const galleryCountSpan = document.getElementById('gallery-count');
            const galleryModal = document.getElementById('gallery-modal');
            const closeGalleryBtn = document.getElementById('close-gallery-btn');
            const galleryGrid = document.getElementById('gallery-grid');
            const modalGalleryCount = document.getElementById('modal-gallery-count');
            const selectAllBtn = document.getElementById('select-all-btn');
            const deselectAllBtn = document.getElementById('deselect-all-btn');
            
            // Batch Mode Elements
            const resultsSection = document.getElementById('results-section');
            const resultsHeader = document.getElementById('results-header');
            const resultsPlaceholder = document.getElementById('results-placeholder');
            const resultsGrid = document.getElementById('results-grid');
            const inspectorControls = document.getElementById('inspector-controls');
            const inspectorViewer = document.getElementById('inspector-viewer');
            const backToGridBtn = document.getElementById('back-to-grid-btn');
            const batchViewButtons = document.querySelectorAll('#inspector-controls .control-btn-sm[data-view]');
            const downloadResultBtn = document.getElementById('download-result-btn');

            // Live Mode Elements
            const liveInspectorSection = document.getElementById('live-inspector-section');
            const liveInspectorDisplay = document.getElementById('live-inspector-display');
            const liveInspectorStepBadge = document.getElementById('live-inspector-step-badge');
            const liveViewButtons = document.querySelectorAll('#live-inspector-controls .control-btn-sm[data-view]');
            const liveDownloadBtn = document.getElementById('live-download-btn');
            
            const normalView = document.getElementById('normal-view');
            const sideBySideView = document.getElementById('side-by-side-view');
            const sliderView = document.getElementById('slider-view');
            const normalImage = document.getElementById('normal-image');
            const sbsOriginalImage = document.getElementById('sbs-original-image');
            const sbsProcessedImage = document.getElementById('sbs-processed-image');
            const sliderOriginalImage = document.getElementById('slider-original-image');
            const sliderProcessedImage = document.getElementById('slider-processed-image');
            const topImageContainer = document.getElementById('top-image-container');
            const sliderHandle = document.getElementById('slider-handle');
            
            const lightbox = document.getElementById('lightbox');
            const lightboxImage = document.getElementById('lightbox-image');
            const lightboxClose = document.getElementById('lightbox-close');
            const lightboxPrev = document.getElementById('lightbox-prev');
            const lightboxNext = document.getElementById('lightbox-next');
            
            // --- State and Config ---
            let pipeline = [];
            let uploadedImages = [];
            let processedResults = [];
            let selectedResult = null;
            let statusTimeout;
            let debounceTimeout;
            let viewingStepIndex = -1; // -1 means viewing final result
            let liveInspectorElement = null; // Store reference to live inspector
            let cachedResults = null; // Cache for intermediate results
            let lastPipelineHash = null; // Track pipeline changes for cache invalidation
            let lightboxState = {
                isOpen: false,
                currentIndex: 0,
                sourceArray: [], 
            };

            const operationConfigs = {
                'Brightness': { params: [{ name: 'amount', type: 'slider', min: -100, max: 100, default: 0 }] },
                'Contrast': { params: [{ name: 'amount', type: 'slider', min: -100, max: 100, default: 0 }] },
                'Saturation': { params: [{ name: 'amount', type: 'slider', min: -100, max: 100, default: 0 }] },
                'Exposure': { params: [{ name: 'amount', type: 'slider', min: -100, max: 100, default: 0 }] },
                'Sharpen': { params: [{ name: 'level', type: 'select', options: ['Low', 'Medium', 'High'], default: 'Medium' }] },
                'Gaussian Blur': { params: [{ name: 'radius', type: 'slider', min: 0, max: 50, default: 5 }] },
                'Vignette': { params: [{ name: 'strength', type: 'slider', min: 0, max: 100, default: 50 }] },
            };

            // --- Theme Switcher ---
            const setTheme = (theme) => {
                localStorage.setItem('theme', theme);
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    themeToggleBtn.innerHTML = `<i data-lucide="sun" class="w-5 h-5"></i>`;
                } else {
                    document.documentElement.classList.remove('dark');
                    themeToggleBtn.innerHTML = `<i data-lucide="moon" class="w-5 h-5"></i>`;
                }
                lucide.createIcons();
            };

            themeToggleBtn.addEventListener('click', () => {
                const currentTheme = localStorage.getItem('theme') || 'dark';
                setTheme(currentTheme === 'dark' ? 'light' : 'dark');
            });
            
            // --- Zoom & Pan Logic ---
            const setupZoomPan = (container, zoomControls) => {
                const image = container.querySelector('.zoomable-image');
                let state = { scale: 1, panning: false, pointX: 0, pointY: 0, start: { x: 0, y: 0 } };
                function setTransform(transition = true) {
                    image.style.transition = transition ? 'transform 0.1s ease-out' : 'none';
                    image.style.transform = `translate(${state.pointX}px, ${state.pointY}px) scale(${state.scale})`;
                    container.classList.toggle('is-zoomable', state.scale > 1);
                }
                function updateZoomLevelDisplay() {
                    if (zoomControls) { const levelEl = zoomControls.querySelector('[data-zoom="level"]'); if (levelEl) levelEl.textContent = `${Math.round(state.scale * 100)}%`; }
                }
                function resetZoom() { state.scale = 1; state.pointX = 0; state.pointY = 0; setTransform(); updateZoomLevelDisplay(); container.classList.remove('is-zoomable', 'is-panning'); }
                container.onmousedown = function (e) { if (state.scale <= 1 || e.button !== 0) return; e.preventDefault(); state.start = { x: e.clientX - state.pointX, y: e.clientY - state.pointY }; state.panning = true; container.classList.add('is-panning'); };
                container.onmouseup = function () { state.panning = false; container.classList.remove('is-panning'); };
                container.onmouseleave = function () { state.panning = false; container.classList.remove('is-panning'); };
                container.onmousemove = function (e) { if (!state.panning) return; e.preventDefault(); state.pointX = e.clientX - state.start.x; state.pointY = e.clientY - state.start.y; setTransform(false); };
                container.onwheel = function (e) { e.preventDefault(); const rect = image.getBoundingClientRect(); const oldScale = state.scale; const delta = e.deltaY > 0 ? -1 : 1; let newScale = oldScale * (1 + delta * 0.2); newScale = Math.min(Math.max(1, newScale), 10); if (Math.abs(newScale - oldScale) < 0.01) return; const x = e.clientX - rect.left; const y = e.clientY - rect.top; const scaleRatio = newScale / oldScale; state.pointX -= (x * (scaleRatio - 1)); state.pointY -= (y * (scaleRatio - 1)); state.scale = newScale; if (state.scale === 1) { state.pointX = 0; state.pointY = 0; } setTransform(); updateZoomLevelDisplay(); };
                if (zoomControls) { zoomControls.onclick = (e) => { const button = e.target.closest('button'); if (!button) return; const action = button.dataset.zoom; if (action === 'reset') { resetZoom(); return; } const rect = image.getBoundingClientRect(); const oldScale = state.scale; let newScale; if (action === 'in') newScale = oldScale * 1.5; if (action === 'out') newScale = oldScale / 1.5; newScale = Math.min(Math.max(1, newScale), 10); if (Math.abs(newScale - oldScale) < 0.01) return; const x = rect.width / 2; const y = rect.height / 2; const scaleRatio = newScale / oldScale; state.pointX -= (x * (scaleRatio - 1)); state.pointY -= (y * (scaleRatio - 1)); state.scale = newScale; if (state.scale === 1) { state.pointX = 0; state.pointY = 0; } setTransform(); updateZoomLevelDisplay(); }; }
                return resetZoom;
            };


            // --- Lightbox Functions ---
            const openLightbox = (index, sourceArray) => { lightboxState = { isOpen: true, currentIndex: index, sourceArray }; updateLightboxImage(); lightbox.classList.remove('hidden'); setTimeout(() => lightbox.style.opacity = '1', 10); };
            const closeLightbox = () => { lightbox.style.opacity = '0'; setTimeout(() => lightbox.classList.add('hidden'), 300); lightboxState.isOpen = false; };
            const updateLightboxImage = () => { if (lightboxState.sourceArray.length === 0) return; lightboxImage.src = lightboxState.sourceArray[lightboxState.currentIndex]; lightboxImage.onload = () => { if (window.lightboxResetZoom) window.lightboxResetZoom(); }; };
            const changeLightboxImage = (direction) => { const newIndex = lightboxState.currentIndex + direction; if (newIndex >= 0 && newIndex < lightboxState.sourceArray.length) { lightboxState.currentIndex = newIndex; updateLightboxImage(); } };
            lightboxClose.addEventListener('click', closeLightbox);
            lightboxPrev.addEventListener('click', () => changeLightboxImage(-1));
            lightboxNext.addEventListener('click', () => changeLightboxImage(1));
            lightbox.addEventListener('click', e => e.target === lightbox && closeLightbox());


            // --- Masonry Layout Logic ---
            const layoutMasonryGrid = (gridElement, itemSelector, columnWidth = 150, gap = 16) => { if (!gridElement) return; const gridItems = gridElement.querySelectorAll(itemSelector); if (gridItems.length === 0) { gridElement.style.height = '0px'; return; } const gridWidth = gridElement.offsetWidth; if (gridWidth === 0) return; const numColumns = Math.max(1, Math.floor((gridWidth + gap) / (columnWidth + gap))); const totalContentWidth = numColumns * (columnWidth + gap) - gap; const initialOffset = (gridWidth - totalContentWidth) / 2; const columnHeights = Array(numColumns).fill(0); gridItems.forEach(item => { item.style.width = `${columnWidth}px`; const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights)); const top = columnHeights[shortestColumnIndex]; const left = initialOffset + shortestColumnIndex * (columnWidth + gap); item.style.left = `${left}px`; item.style.top = `${top}px`; columnHeights[shortestColumnIndex] += item.offsetHeight + gap; }); gridElement.style.height = `${Math.max(...columnHeights)}px`; };

            // --- Status Messaging ---
            const updateStatus = (text, type = 'info', persistent = false) => { clearTimeout(statusTimeout); let content = text; let colorClass = 'text-gray-500 dark:text-gray-400'; switch(type) { case 'processing': content = `<i data-lucide="loader-2" class="inline-block w-4 h-4 mr-2 animate-spin"></i> ${text}`; colorClass = 'text-zinc-800 dark:text-gray-300'; break; case 'error': content = `<i data-lucide="alert-triangle" class="inline-block w-4 h-4 mr-2"></i> ${text}`; colorClass = 'text-red-600 dark:text-red-500'; break; case 'success': content = `<i data-lucide="check-circle" class="inline-block w-4 h-4 mr-2"></i> ${text}`; colorClass = 'text-green-600 dark:text-green-500'; break; case 'caution': content = `<i data-lucide="alert-circle" class="inline-block w-4 h-4 mr-2"></i> ${text}`; colorClass = 'text-yellow-600 dark:text-yellow-500'; break; } statusMessage.style.opacity = '0'; setTimeout(() => { statusMessage.innerHTML = content; statusMessage.className = `text-sm transition-all duration-300 ease-in-out flex items-center justify-center ${colorClass}`; lucide.createIcons(); statusMessage.style.opacity = '1'; }, 300); if (!persistent && ['success', 'error', 'caution'].includes(type)) { statusTimeout = setTimeout(checkAndSetIdleStatus, 4000); } };
            const checkAndSetIdleStatus = () => { if (liveProcessingToggle.checked) { updateStatus('Live mode enabled', 'info', true); return; } const selectedCount = uploadedImages.filter(img => img.selected).length; if (uploadedImages.length === 0) { updateStatus('Upload an image to start', 'info', true); } else if (selectedCount === 0) { updateStatus('Select images from the gallery to process', 'caution', true); } else if (pipeline.length === 0) { updateStatus('Add an operation to build your pipeline', 'info', true); } else { updateStatus(`Ready to process ${selectedCount} image(s)`, 'info', true); } };
            
            // --- UI/State Changers ---
            const showGridView = () => { inspectorControls.classList.add('hidden'); inspectorViewer.classList.add('hidden'); resultsHeader.classList.remove('hidden'); if (processedResults.length === 0) { resultsPlaceholder.classList.remove('hidden'); resultsGrid.classList.add('hidden'); } else { resultsPlaceholder.classList.add('hidden'); resultsGrid.classList.remove('hidden'); } selectedResult = null; document.querySelectorAll('.result-thumb.selected').forEach(el => el.classList.remove('selected')); };
            const showInspectorView = () => { resultsPlaceholder.classList.add('hidden'); resultsHeader.classList.add('hidden'); resultsGrid.classList.add('hidden'); inspectorControls.classList.remove('hidden'); inspectorControls.classList.add('flex'); inspectorViewer.classList.remove('hidden'); if (window.inspectorResetZoom) window.inspectorResetZoom(); };
            
             // --- Gallery Functions ---
            const openGallery = () => { galleryModal.classList.remove('hidden'); setTimeout(() => { galleryModal.style.opacity = '1'; layoutMasonryGrid(galleryGrid, '.gallery-thumb', 120, 16); }, 10); };
            const closeGallery = () => { galleryModal.style.opacity = '0'; setTimeout(() => galleryModal.classList.add('hidden'), 300); };
            const renderGallery = () => { galleryGrid.innerHTML = ''; if (uploadedImages.length === 0) { layoutMasonryGrid(galleryGrid, '.gallery-thumb', 120, 16); return; } let imagesToLoad = uploadedImages.length; const onImageLoad = () => { imagesToLoad--; if (imagesToLoad === 0) { layoutMasonryGrid(galleryGrid, '.gallery-thumb', 120, 16); } }; uploadedImages.forEach((image, index) => { const thumbContainer = document.createElement('div'); thumbContainer.className = `gallery-thumb rounded-md ${image.selected ? 'selected' : ''}`; thumbContainer.dataset.imageId = image.id; thumbContainer.dataset.imageIndex = index; thumbContainer.innerHTML = ` <img src="${image.dataUrl}" class="w-full h-auto block rounded-md pointer-events-none"> <div class="thumb-overlay absolute inset-0 flex items-start justify-start p-1 gap-1"> <button class="thumb-btn delete-btn"><i data-lucide="trash-2" class="w-3 h-3 text-white pointer-events-none"></i></button> <button class="thumb-btn zoom-btn"><i data-lucide="zoom-in" class="w-3 h-3 text-white pointer-events-none"></i></button> </div> <div class="check-icon absolute top-2 right-2 bg-zinc-900/80 rounded-full p-1 transition-opacity opacity-0"> <i data-lucide="check" class="w-4 h-4 text-white"></i> </div> `; galleryGrid.appendChild(thumbContainer); const imgEl = thumbContainer.querySelector('img'); if (imgEl.complete) { onImageLoad(); } else { imgEl.onload = onImageLoad; } }); modalGalleryCount.textContent = uploadedImages.length; galleryCountSpan.textContent = uploadedImages.length; lucide.createIcons(); };
            const updateLiveProcessingState = () => { const selectedCount = uploadedImages.filter(img => img.selected).length; if (selectedCount === 1) { liveProcessingToggle.disabled = false; } else { liveProcessingToggle.checked = false; liveProcessingToggle.disabled = true; liveProcessingToggle.dispatchEvent(new Event('change')); } };

            // --- Sidebar Toggle ---
            sidebarToggleBtn.addEventListener('click', () => { sidebar.classList.toggle('collapsed'); sidebarToggleBtn.innerHTML = sidebar.classList.contains('collapsed') ? '<i data-lucide="panel-right-close" class="w-5 h-5"></i>' : '<i data-lucide="panel-left-close" class="w-5 h-5"></i>'; lucide.createIcons(); });

            // --- Pipeline Functions ---
            const renderPipeline = () => {
                pipelineStepsContainer.innerHTML = '';
                if (pipeline.length === 0) { pipelineStepsContainer.innerHTML = `<p class="text-sm text-center py-4 text-gray-500 dark:text-gray-500">Add operations from the left panel</p>`; }
                pipeline.forEach((step, index) => {
                    const stepEl = document.createElement('div');
                    stepEl.className = 'pipeline-step bg-gray-100 dark:bg-zinc-800 p-3 rounded-md flex items-center gap-3';
                    stepEl.dataset.index = index;
                    stepEl.innerHTML = `
                        <div class="flex flex-col gap-1">
                             <button class="reorder-btn text-gray-400 hover:text-zinc-800 dark:hover:text-white" data-direction="up" data-index="${index}" ${index === 0 ? 'disabled' : ''}><i data-lucide="arrow-up" class="w-4 h-4 pointer-events-none"></i></button>
                             <button class="reorder-btn text-gray-400 hover:text-zinc-800 dark:hover:text-white" data-direction="down" data-index="${index}" ${index === pipeline.length - 1 ? 'disabled' : ''}><i data-lucide="arrow-down" class="w-4 h-4 pointer-events-none"></i></button>
                        </div>
                        <div class="flex-grow">${getStepParamsHTML(step)}</div>
                        <div class="flex flex-col gap-2">
                           <button class="remove-step-btn text-gray-400 hover:text-zinc-800 dark:hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                           <button class="preview-step-btn text-gray-400 hover:text-zinc-800 dark:hover:text-white" data-index="${index}"><i data-lucide="eye" class="w-5 h-5 pointer-events-none"></i></button>
                        </div>
                    `;
                    pipelineStepsContainer.appendChild(stepEl);
                });
                lucide.createIcons();
                updateStepCount();
            };
            
            const getStepParamsHTML = (step) => { const config = operationConfigs[step.name]; let html = `<div class="flex flex-col gap-2">`; html += `<div class="flex justify-between items-center"><p class="font-semibold text-zinc-900 dark:text-white">${step.name}</p>`; if (config && config.params) { config.params.forEach(param => { if (param.type === 'slider') { const value = step.params[param.name]; html += `<span class="text-sm font-mono text-gray-600 dark:text-gray-300 w-12 text-right">${value > 0 ? `+${value}` : value}</span>`; } }); } html += `</div>`; if (config && config.params) { config.params.forEach(param => { switch (param.type) { case 'slider': html += `<input type="range" class="param-slider" min="${param.min}" max="${param.max}" value="${step.params[param.name]}" data-param-name="${param.name}" data-step-id="${step.id}">`; break; case 'select': html += `<select class="param-select" data-param-name="${param.name}" data-step-id="${step.id}">${param.options.map(opt => `<option value="${opt}" ${step.params[param.name] === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select>`; break; } }); } html += `</div>`; return html; };

            const updateStepCount = () => { stepCount.innerText = pipeline.length; };
            const addStepToPipeline = (opName) => { 
                console.log('Adding operation to pipeline:', opName);
                const newStep = { id: Date.now(), name: opName, params: {}, intermediateResultUrl: null }; 
                const config = operationConfigs[opName]; 
                if (config && config.params) { 
                    config.params.forEach(param => { 
                        newStep.params[param.name] = param.default; 
                    }); 
                } 
                pipeline.push(newStep); 
                
                // Invalidate cache when pipeline changes
                cachedResults = null;
                lastPipelineHash = null;
                
                renderPipeline(); 
                checkAndSetIdleStatus(); 
                if (liveProcessingToggle.checked) {
                    debouncedLivePreview(); 
                }
            };
            const removeStepFromPipeline = (index) => { 
                pipeline.splice(index, 1); 
                // Invalidate cache when pipeline changes
                cachedResults = null;
                lastPipelineHash = null;
                renderPipeline(); 
                checkAndSetIdleStatus(); 
                if (liveProcessingToggle.checked) debouncedLivePreview(); 
            };
            const resetPipeline = () => { 
                pipeline = []; 
                // Invalidate cache when pipeline changes
                cachedResults = null;
                lastPipelineHash = null;
                renderPipeline(); 
                checkAndSetIdleStatus(); 
                if (liveProcessingToggle.checked) debouncedLivePreview(); 
            };
            
            // --- Event Listeners ---
            operationsList.addEventListener('click', (e) => { if (e.target.classList.contains('operation-btn')) { addStepToPipeline(e.target.dataset.op); } });

            pipelineStepsContainer.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.remove-step-btn');
                if (removeBtn) { const stepEl = removeBtn.closest('.pipeline-step'); removeStepFromPipeline(parseInt(stepEl.dataset.index)); return; }
                const reorderBtn = e.target.closest('.reorder-btn');
                if (reorderBtn) { const index = parseInt(reorderBtn.dataset.index); const direction = reorderBtn.dataset.direction; if (direction === 'up' && index > 0) { [pipeline[index], pipeline[index - 1]] = [pipeline[index - 1], pipeline[index]]; } else if (direction === 'down' && index < pipeline.length - 1) { [pipeline[index], pipeline[index + 1]] = [pipeline[index + 1], pipeline[index]]; } renderPipeline(); }
                const previewBtn = e.target.closest('.preview-step-btn');
                if (previewBtn) { 
                    const index = parseInt(previewBtn.dataset.index); 
                    if (viewingStepIndex === index) { 
                        viewingStepIndex = -1; /* Toggle off - show final result */ 
                    } else { 
                        viewingStepIndex = index; 
                    } 
                    
                    if (liveProcessingToggle.checked) {
                        // Live mode: Use cached results if available, otherwise process
                        if (isCacheValid()) {
                            console.log('Using cached results for step preview');
                            const selectedImages = uploadedImages.filter(img => img.selected);
                            if (selectedImages.length === 1) {
                                updateAllViews(selectedImages[0], cachedResults, viewingStepIndex);
                            }
                        } else {
                            console.log('Cache invalid, processing for step preview');
                            updateLivePreview(); 
                        }
                    } else {
                        // Batch mode: Show message that step preview requires live mode
                        updateStatus('Enable live processing to preview individual steps', 'info');
                        console.log('Step preview requires live mode');
                    }
                }
            });
            
            pipelineStepsContainer.addEventListener('input', (e) => { 
                if (e.target.matches('.param-slider')) { 
                    const stepId = parseInt(e.target.dataset.stepId); 
                    const paramName = e.target.dataset.paramName; 
                    const value = parseInt(e.target.value); 
                    const step = pipeline.find(s => s.id === stepId); 
                    
                    if (step) { 
                        step.params[paramName] = value; 
                        const valueEl = e.target.closest('.flex-col').querySelector('span'); 
                        if (valueEl) valueEl.textContent = value > 0 ? `+${value}` : value; 
                        
                        // Only log significant changes to reduce console spam
                        if (value % 10 === 0 || value === step.params[paramName]) {
                            console.log('Parameter updated:', paramName, '=', value);
                        }
                        
                        if (liveProcessingToggle.checked) { 
                            debouncedLivePreview(); 
                        } 
                    } 
                } 
            });
            pipelineStepsContainer.addEventListener('change', (e) => { if (e.target.matches('.param-select')) { const stepId = parseInt(e.target.dataset.stepId); const paramName = e.target.dataset.paramName; const value = e.target.value; const step = pipeline.find(s => s.id === stepId); if (step) { step.params[paramName] = value; if (liveProcessingToggle.checked) debouncedLivePreview(); } } });

            resetBtn.addEventListener('click', resetPipeline);

            applyBtn.addEventListener('click', async () => { const selectedImages = uploadedImages.filter(img => img.selected); if (selectedImages.length === 0) { updateStatus('Please upload and select at least one image.', 'error'); return; } if (pipeline.length === 0) { updateStatus('Please add at least one operation.', 'error'); return; } console.log(`Applying pipeline to ${selectedImages.length} image(s):`, JSON.stringify(pipeline, null, 2)); processedResults = []; resultsGrid.innerHTML = ''; resultsPlaceholder.classList.add('hidden'); resultsHeader.classList.remove('hidden'); resultsGrid.classList.remove('hidden'); updateStatus(`Processing ${selectedImages.length} image(s)...`, 'processing', true); try { const payload = { images: selectedImages.map(img => img.dataUrl), pipeline: pipeline.map(step => ({ name: step.name, params: step.params })) }; const response = await fetch('/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || `HTTP ${response.status}`); } const data = await response.json(); let imagesToLoad = data.processed_images.length; const onResultImageLoad = () => { imagesToLoad--; if (imagesToLoad === 0) { layoutMasonryGrid(resultsGrid, '.result-thumb', 120, 16); } }; data.processed_images.forEach((processedUrl, index) => { const originalImage = selectedImages[index]; const result = { id: originalImage.id, originalUrl: originalImage.dataUrl, processedUrl: processedUrl }; processedResults.push(result); const thumb = document.createElement('div'); thumb.className = 'result-thumb rounded-md'; thumb.dataset.resultId = result.id; thumb.dataset.resultIndex = index; const imgEl = new Image(); imgEl.onload = onResultImageLoad; imgEl.className = "w-full h-auto block rounded-md"; imgEl.src = result.processedUrl; thumb.appendChild(imgEl); resultsGrid.appendChild(thumb); }); updateStatus('Click a result to inspect and compare', 'info', true); } catch (error) { console.error('Processing failed:', error); updateStatus(`Processing failed: ${error.message}`, 'error'); } });
            
            imageUpload.addEventListener('change', (e) => { 
                const files = e.target.files; 
                if (files.length > 0) { 
                    let filesLoaded = 0; 
                    const totalFiles = files.length; 
                    Array.from(files).forEach((file, index) => { 
                        const reader = new FileReader(); 
                        reader.onload = (event) => { 
                            const newImage = { id: Date.now() + index, dataUrl: event.target.result, file: file, selected: true }; 
                            uploadedImages.push(newImage); 
                            filesLoaded++; 
                            if(filesLoaded === totalFiles){ 
                                // Invalidate cache when new images are uploaded
                                cachedResults = null;
                                lastPipelineHash = null;
                                console.log('Cache invalidated due to new image upload');
                                
                                galleryBtn.classList.remove('hidden'); 
                                renderGallery(); 
                                checkAndSetIdleStatus(); 
                                updateLiveProcessingState(); 
                                
                                // Trigger live processing if enabled and pipeline exists
                                if (liveProcessingToggle.checked && pipeline.length > 0) {
                                    console.log('Triggering live processing after image upload');
                                    setTimeout(updateLivePreview, 100);
                                }
                            } 
                        }; 
                        reader.readAsDataURL(file); 
                    }); 
                    e.target.value = ''; 
                } 
            });

            galleryBtn.addEventListener('click', openGallery);
            closeGalleryBtn.addEventListener('click', closeGallery);
            galleryModal.addEventListener('click', (e) => e.target === galleryModal && closeGallery());
            galleryGrid.addEventListener('click', (e) => { const thumb = e.target.closest('.gallery-thumb'); if (!thumb) return; if (e.target.closest('.delete-btn')) { e.stopPropagation(); const imageId = parseInt(thumb.dataset.imageId); const indexToDelete = uploadedImages.findIndex(img => img.id === imageId); if (indexToDelete > -1) { uploadedImages.splice(indexToDelete, 1); renderGallery(); updateLiveProcessingState(); checkAndSetIdleStatus(); if (uploadedImages.length === 0) { galleryBtn.classList.add('hidden'); } } } else if (e.target.closest('.zoom-btn')) { e.stopPropagation(); const imageIndex = parseInt(thumb.dataset.imageIndex); openLightbox(imageIndex, uploadedImages.map(img => img.dataUrl)); } else { const imageId = parseInt(thumb.dataset.imageId); const image = uploadedImages.find(img => img.id === imageId); if (image) { image.selected = !image.selected; thumb.classList.toggle('selected'); thumb.querySelector('.check-icon').style.opacity = image.selected ? '1' : '0'; checkAndSetIdleStatus(); updateLiveProcessingState(); } } });
            selectAllBtn.addEventListener('click', () => { uploadedImages.forEach(img => img.selected = true); renderGallery(); checkAndSetIdleStatus(); updateLiveProcessingState(); });
            deselectAllBtn.addEventListener('click', () => { uploadedImages.forEach(img => img.selected = false); renderGallery(); checkAndSetIdleStatus(); updateLiveProcessingState(); });
            
            resultsGrid.addEventListener('click', (e) => { const thumb = e.target.closest('.result-thumb'); if (thumb) { const resultIndex = parseInt(thumb.dataset.resultIndex); selectedResult = processedResults[resultIndex]; if (selectedResult) { document.querySelectorAll('.result-thumb.selected').forEach(el => el.classList.remove('selected')); thumb.classList.add('selected'); normalImage.src = selectedResult.processedUrl; sbsOriginalImage.src = selectedResult.originalUrl; sbsProcessedImage.src = selectedResult.processedUrl; sliderOriginalImage.src = selectedResult.originalUrl; sliderProcessedImage.src = selectedResult.processedUrl; showInspectorView(); batchViewButtons.forEach(btn => btn.classList.remove('active')); const normalModeBtn = document.querySelector('#inspector-controls .control-btn-sm[data-view="normal"]'); if (normalModeBtn) { normalModeBtn.classList.add('active'); } [normalView, sideBySideView, sliderView].forEach(v => v.classList.add('hidden')); normalView.classList.remove('hidden'); } } });

            backToGridBtn.addEventListener('click', showGridView);
            downloadResultBtn.addEventListener('click', () => { if (selectedResult && selectedResult.processedUrl) { const link = document.createElement('a'); link.href = selectedResult.processedUrl; const originalFile = uploadedImages.find(img => img.id === selectedResult.id)?.file; const fileName = originalFile ? `pixelflow_${originalFile.name}` : 'pixelflow_result.png'; link.download = fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link); } else { updateStatus('No result selected to download.', 'error'); } });
            
            liveDownloadBtn.addEventListener('click', () => { 
                console.log('Live download button clicked');
                
                // Try to get the current processed image from cache or live viewer
                let imageToDownload = null;
                
                if (cachedResults && cachedResults.length > 0) {
                    // Use cached results
                    const stepIndex = viewingStepIndex >= 0 && viewingStepIndex < cachedResults.length ? viewingStepIndex : cachedResults.length - 1;
                    imageToDownload = cachedResults[stepIndex];
                    console.log('Using cached result for download');
                } else {
                    // Fallback to live viewer image
                    const liveViewer = liveInspectorElement || document.getElementById('live-inspector-viewer');
                    if (liveViewer) {
                        const normalImg = liveViewer.querySelector('#normal-image-live');
                        if (normalImg && normalImg.src && normalImg.src.startsWith('data:')) {
                            imageToDownload = normalImg.src;
                            console.log('Using live viewer image for download');
                        }
                    }
                }
                
                if (imageToDownload) {
                    const link = document.createElement('a');
                    link.href = imageToDownload;
                    const selectedImage = uploadedImages.find(img => img.selected);
                    const stepText = viewingStepIndex >= 0 ? `_step${viewingStepIndex + 1}` : '_final';
                    const fileName = selectedImage?.file ? 
                        `pixelflow_live${stepText}_${selectedImage.file.name}` : 
                        `pixelflow_live${stepText}_result.png`;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    console.log('Download initiated:', fileName);
                } else {
                    updateStatus('No live result to download.', 'error');
                    console.error('No image available for download');
                }
            });
            
            // --- Caching and Processing System ---
            const generatePipelineHash = () => {
                const selectedImages = uploadedImages.filter(img => img.selected);
                if (selectedImages.length !== 1) return null;
                
                const pipelineData = {
                    imageId: selectedImages[0].id,
                    pipeline: pipeline.map(step => ({ name: step.name, params: step.params }))
                };
                return JSON.stringify(pipelineData);
            };
            
            const isCacheValid = () => {
                const currentHash = generatePipelineHash();
                return currentHash && currentHash === lastPipelineHash && cachedResults;
            };
            
            const updateAllViews = (selectedImage, results, stepIndex = -1) => {
                if (!liveInspectorElement || !results) return;
                
                // Validate step index
                if (stepIndex >= results.length) {
                    console.log('Step index out of range for results, using final result');
                    stepIndex = -1;
                }
                
                const currentStepResult = stepIndex >= 0 && stepIndex < results.length ? results[stepIndex] : results[results.length - 1];
                
                // Update all view modes
                const normalImg = liveInspectorElement.querySelector('#normal-image-live');
                const sbsOriginal = liveInspectorElement.querySelector('#sbs-original-image-live');
                const sbsProcessed = liveInspectorElement.querySelector('#sbs-processed-image-live');
                const sliderOriginal = liveInspectorElement.querySelector('#slider-original-image-live');
                const sliderProcessed = liveInspectorElement.querySelector('#slider-processed-image-live');
                
                // Update images
                if (normalImg) {
                    normalImg.src = currentStepResult;
                    normalImg.style.display = 'block';
                }
                if (sbsOriginal) sbsOriginal.src = selectedImage.dataUrl;
                if (sbsProcessed) sbsProcessed.src = currentStepResult;
                // For slider view, update both live and original elements
                const originalSliderOriginal = document.getElementById('slider-original-image');
                const originalSliderProcessed = document.getElementById('slider-processed-image');
                
                if (sliderOriginal) {
                    sliderOriginal.src = selectedImage.dataUrl;
                    sliderOriginal.style.width = '100%';
                    sliderOriginal.style.height = '100%';
                    sliderOriginal.style.objectFit = 'contain';
                }
                if (sliderProcessed) {
                    sliderProcessed.src = currentStepResult;
                    sliderProcessed.style.width = '100%';
                    sliderProcessed.style.height = '100%';
                    sliderProcessed.style.objectFit = 'contain';
                }
                
                // Also update original slider elements for live mode
                if (originalSliderOriginal) originalSliderOriginal.src = selectedImage.dataUrl;
                if (originalSliderProcessed) originalSliderProcessed.src = currentStepResult;
                
                // Update step badge
                if (stepIndex >= 0) {
                    liveInspectorStepBadge.textContent = `Step ${stepIndex + 1}: ${pipeline[stepIndex].name}`;
                    liveInspectorStepBadge.classList.remove('hidden');
                } else {
                    liveInspectorStepBadge.textContent = 'Final Result';
                    liveInspectorStepBadge.classList.remove('hidden');
                }
                
                console.log('Updated all views with', stepIndex >= 0 ? `step ${stepIndex + 1}` : 'final result');
            };

            // --- Live Processing Functions ---
            const updateLivePreview = async (forceStepIndex = null) => {
                console.log('updateLivePreview called', forceStepIndex !== null ? `for step ${forceStepIndex}` : '');
                
                if (!liveProcessingToggle.checked) {
                    console.log('Live processing not enabled, returning');
                    return;
                }
                
                const selectedImages = uploadedImages.filter(img => img.selected);
                if (selectedImages.length !== 1 || pipeline.length === 0) {
                    console.log('Invalid conditions: need exactly 1 image and at least 1 operation');
                    return;
                }
                
                const selectedImage = selectedImages[0];
                
                // Validate step index against current pipeline
                if (viewingStepIndex >= pipeline.length) {
                    console.log('Step index out of range, resetting to final result');
                    viewingStepIndex = -1;
                }
                
                // Check if we can use cached results
                if (forceStepIndex === null && isCacheValid()) {
                    console.log('Using cached results');
                    updateAllViews(selectedImage, cachedResults, viewingStepIndex);
                    updateStatus('Using cached results', 'success');
                    return;
                }
                
                console.log('Processing image:', selectedImage.file?.name || 'unnamed');
                
                try {
                    updateStatus('Processing live preview...', 'processing', true);
                    
                    const payload = {
                        image: selectedImage.dataUrl,
                        pipeline: pipeline.map(step => ({ name: step.name, params: step.params }))
                    };
                    
                    console.log('Sending payload to /process-live:', {
                        imageLength: selectedImage.dataUrl.length,
                        pipeline: payload.pipeline
                    });
                    
                    const response = await fetch('/process-live', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    console.log('Response status:', response.status);
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `HTTP ${response.status}`);
                    }
                    
                    const data = await response.json();
                    console.log('Received data:', {
                        resultsCount: data.results?.length,
                        firstResultLength: data.results?.[0]?.length
                    });
                    
                    // Cache the results
                    cachedResults = data.results;
                    lastPipelineHash = generatePipelineHash();
                    console.log('Cached results for future use');
                    
                    // Update all views
                    const displayStepIndex = forceStepIndex !== null ? forceStepIndex : viewingStepIndex;
                    updateAllViews(selectedImage, data.results, displayStepIndex);
                    
                    updateStatus('Live preview updated', 'success');
                    
                } catch (error) {
                    console.error('Live processing failed:', error);
                    updateStatus(`Live processing failed: ${error.message}`, 'error');
                }
            };
            
            // Optimized debounced live preview update
            let lastProcessedParams = null;
            const debouncedLivePreview = () => {
                console.log('debouncedLivePreview called');
                clearTimeout(debounceTimeout);
                
                // Check if parameters actually changed
                const currentParams = JSON.stringify(pipeline.map(s => ({name: s.name, params: s.params})));
                if (currentParams === lastProcessedParams) {
                    console.log('Parameters unchanged, skipping processing');
                    return;
                }
                
                debounceTimeout = setTimeout(() => {
                    console.log('Debounce timeout triggered, calling updateLivePreview');
                    lastProcessedParams = currentParams;
                    updateLivePreview();
                }, 500); // Increased to 500ms for better performance
            };

            // --- Live Mode Logic ---
            liveProcessingToggle.addEventListener('change', () => {
                const isLive = liveProcessingToggle.checked;
                console.log('Live processing toggle changed:', isLive);
                
                resultsSection.classList.toggle('hidden', isLive);
                liveInspectorSection.classList.toggle('hidden', !isLive);
                applyBtn.disabled = isLive;
                applyBtn.classList.toggle('opacity-50', isLive);
                applyBtn.classList.toggle('cursor-not-allowed', isLive);
                
                if (isLive) {
                    console.log('Setting up live inspector...');
                    const liveInspectorClone = inspectorViewer.cloneNode(true);
                    liveInspectorClone.id = 'live-inspector-viewer';
                    
                    // CRITICAL FIX: Remove the hidden class from the cloned element
                    liveInspectorClone.classList.remove('hidden');
                    
                    // Fix duplicate IDs by updating them to be unique
                    const updateIds = (element, suffix) => {
                        if (element.id) {
                            console.log('Updating ID from', element.id, 'to', element.id + suffix);
                            element.id = element.id + suffix;
                        }
                        element.querySelectorAll('[id]').forEach(child => {
                            if (child.id) {
                                console.log('Updating child ID from', child.id, 'to', child.id + suffix);
                                child.id = child.id + suffix;
                            }
                        });
                    };
                    updateIds(liveInspectorClone, '-live');
                    
                    console.log('Live inspector clone ID after update:', liveInspectorClone.id);
                    
                    liveInspectorDisplay.innerHTML = '';
                    liveInspectorDisplay.appendChild(liveInspectorClone);
                    
                    // Store reference to the live inspector element
                    liveInspectorElement = liveInspectorClone;
                    console.log('Stored live inspector element reference:', !!liveInspectorElement);
                    
                    // Remove the default centering classes and add proper styling
                    liveInspectorDisplay.classList.remove('flex', 'justify-center', 'items-center', 'flex-col', 'text-gray-400', 'dark:text-gray-500');
                    liveInspectorDisplay.classList.add('p-0');
                    
                    console.log('Live inspector clone created and appended');
                    
                    // Make sure the normal view is visible by default and hide others
                    const normalView = liveInspectorClone.querySelector('#normal-view-live');
                    const sideBySideView = liveInspectorClone.querySelector('#side-by-side-view-live');
                    const sliderView = liveInspectorClone.querySelector('#slider-view-live');
                    
                    if (normalView) {
                        normalView.classList.remove('hidden');
                        console.log('Normal view made visible');
                    }
                    if (sideBySideView) sideBySideView.classList.add('hidden');
                    if (sliderView) sliderView.classList.add('hidden');
                    
                    window.liveInspectorResetZoom = setupZoomPan(normalView, liveInspectorClone.querySelector('#inspector-zoom-controls-live'));
                    
                    // Note: Slider view removed from live mode for simplicity
                    
                    // Set up view buttons for live inspector
                    setupLiveViewButtons();
                    
                    // Show original image immediately
                    const selectedImages = uploadedImages.filter(img => img.selected);
                    if (selectedImages.length === 1) {
                        const normalImg = liveInspectorClone.querySelector('#normal-image-live');
                        if (normalImg) {
                            normalImg.src = selectedImages[0].dataUrl;
                            normalImg.style.display = 'block';
                            console.log('Showing original image immediately');
                        }
                    }
                    
                    // Trigger initial live preview
                    console.log('Scheduling initial live preview...');
                    setTimeout(() => {
                        console.log('Triggering initial live preview');
                        updateLivePreview();
                    }, 100);
                } else {
                    // Restore default styling when live mode is disabled
                    liveInspectorDisplay.classList.add('flex', 'justify-center', 'items-center', 'flex-col', 'text-gray-400', 'dark:text-gray-500');
                    liveInspectorDisplay.classList.remove('p-0');
                    
                    // Clear the stored reference and reset state
                    liveInspectorElement = null;
                    viewingStepIndex = -1; // Reset step viewing
                    cachedResults = null; // Clear cache
                    lastPipelineHash = null;
                    console.log('Cleared live inspector element reference and reset state');
                }
                
                // Eye icons are now always visible in both modes
                
                checkAndSetIdleStatus();
            });
            
            // --- Universal View Button Logic ---
            const setupViewButtons = (controlsSelector) => {
                const viewButtons = document.querySelectorAll(`${controlsSelector} .control-btn-sm[data-view]`);
                const parent = document.querySelector(controlsSelector).closest('.flex-grow, #live-inspector-section');
                viewButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        viewButtons.forEach(btn => btn.classList.remove('active'));
                        button.classList.add('active');
                        const view = button.dataset.view;
                        parent.querySelectorAll('#normal-view, #side-by-side-view, #slider-view').forEach(v => v.classList.add('hidden'));
                        const viewEl = parent.querySelector(`#${view}-view`);
                        if (viewEl) viewEl.classList.remove('hidden');
                    });
                });
            };
            setupViewButtons('#inspector-controls');
            setupViewButtons('#live-inspector-controls');
            
            // Also set up view buttons for dynamically created live inspector
            const setupLiveViewButtons = () => {
                const liveViewButtons = document.querySelectorAll('#live-inspector-controls .control-btn-sm[data-view]');
                const liveInspectorSection = document.getElementById('live-inspector-section');
                
                liveViewButtons.forEach(button => {
                    // Remove existing listeners
                    button.replaceWith(button.cloneNode(true));
                });
                
                // Re-get buttons after cloning
                const newLiveViewButtons = document.querySelectorAll('#live-inspector-controls .control-btn-sm[data-view]');
                newLiveViewButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        console.log('Live view button clicked:', button.dataset.view);
                        newLiveViewButtons.forEach(btn => btn.classList.remove('active'));
                        button.classList.add('active');
                        const view = button.dataset.view;
                        const liveViewer = liveInspectorElement || document.getElementById('live-inspector-viewer');
                        console.log('Live view button - liveViewer found:', !!liveViewer);
                        if (liveViewer) {
                            // Only support normal and side-by-side views for live mode
                            liveViewer.querySelectorAll('#normal-view-live, #side-by-side-view-live').forEach(v => v.classList.add('hidden'));
                            const viewEl = liveViewer.querySelector(`#${view}-view-live`);
                            console.log('View element found:', !!viewEl, 'for view:', `#${view}-view-live`);
                            if (viewEl) {
                                viewEl.classList.remove('hidden');
                                console.log('Switched to view:', view);
                            } else {
                                console.error('View element not found:', `#${view}-view-live`);
                            }
                        } else {
                            console.error('Live viewer not found for view switching');
                        }
                    });
                });
            };
            
            // --- Slider Logic ---
            const setupSliderLogic = (containerSelector, handleSelector, topContainerSelector, originalImageSelector) => {
                let isDragging = false;
                const sliderContainer = document.querySelector(containerSelector);
                const sliderHandle = document.querySelector(handleSelector);
                const topImageContainer = document.querySelector(topContainerSelector);
                const sliderOriginalImage = document.querySelector(originalImageSelector);
                
                if (!sliderContainer || !sliderHandle || !topImageContainer) return;
                
                const moveSlider = (clientX) => {
                    if (!sliderContainer || !sliderOriginalImage || !sliderOriginalImage.naturalWidth) return;
                    const containerRect = sliderContainer.getBoundingClientRect();
                    const { naturalWidth, naturalHeight } = sliderOriginalImage;
                    const containerAspectRatio = containerRect.width / containerRect.height;
                    const imageAspectRatio = naturalWidth / naturalHeight;
                    let renderedWidth, offsetLeft;
                    if (imageAspectRatio > containerAspectRatio) {
                        renderedWidth = containerRect.width;
                        offsetLeft = 0;
                    } else {
                        renderedWidth = containerRect.height * imageAspectRatio;
                        offsetLeft = (containerRect.width - renderedWidth) / 2;
                    }
                    let x = clientX - containerRect.left;
                    x = Math.max(offsetLeft, Math.min(x, offsetLeft + renderedWidth));
                    sliderHandle.style.left = `${x}px`;
                    topImageContainer.style.clipPath = `polygon(0 0, ${x}px 0, ${x}px 100%, 0 100%)`;
                };
                
                const onDragStart = (e) => {
                    e.preventDefault();
                    isDragging = true;
                };
                
                const onDragEnd = () => {
                    isDragging = false;
                };
                
                const onDragMove = (e) => {
                    if (isDragging) {
                        e.preventDefault();
                        moveSlider(e.clientX || e.touches[0].clientX);
                    }
                };
                
                sliderHandle.addEventListener('mousedown', onDragStart);
                document.addEventListener('mouseup', onDragEnd);
                document.addEventListener('mousemove', onDragMove);
                sliderHandle.addEventListener('touchstart', onDragStart, { passive: false });
                document.addEventListener('touchend', onDragEnd);
                document.addEventListener('touchmove', onDragMove, { passive: false });
            };
            
            // Setup slider for batch mode
            setupSliderLogic('#comparison-slider-container', '#slider-handle', '#top-image-container', '#slider-original-image');
            document.addEventListener('keydown', (e) => { if (!lightboxState.isOpen) return; if (e.key === 'Escape') closeLightbox(); if (e.key === 'ArrowLeft') changeLightboxImage(-1); if (e.key === 'ArrowRight') changeLightboxImage(1); });
            const galleryObserver = new ResizeObserver(() => { window.requestAnimationFrame(() => { layoutMasonryGrid(galleryGrid, '.gallery-thumb', 120, 16); }); }); galleryObserver.observe(galleryGrid.parentElement); const resultsObserver = new ResizeObserver(() => { window.requestAnimationFrame(() => { layoutMasonryGrid(resultsGrid, '.result-thumb', 120, 16); }); }); resultsObserver.observe(resultsGrid);
            
            const styleSheet = document.createElement("style"); styleSheet.innerText = ` .operation-btn { background-color: #e5e7eb; color: #1f2937; padding: 0.5rem; border-radius: 0.375rem; font-size: 0.875rem; text-align: center; transition: background-color 0.2s; } .dark .operation-btn { background-color: #3f3f46; color: #d4d4d8; } .operation-btn:hover { background-color: #d1d5db; } .dark .operation-btn:hover { background-color: #52525b; } .header-btn { background-color: #1f2937; color: #f9fafb; font-weight: 600; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; transition: background-color 0.2s; white-space: nowrap; } .dark .header-btn { background-color: #e5e7eb; color: #111827; } .header-btn:hover { background-color: #374151; } .dark .header-btn:hover { background-color: #d1d5db; } .header-btn[disabled] { opacity: 0.5; cursor: not-allowed; } .header-btn-darker { background-color: #e5e7eb; color: #1f2937; } .dark .header-btn-darker { background-color: #3f3f46; color: #e5e7eb; } .header-btn-darker:hover { background-color: #d1d5db; } .dark .header-btn-darker:hover { background-color: #52525b; } .header-btn-darker:disabled { background-color: #e5e7eb; color: #9ca3af; cursor: not-allowed; } .dark .header-btn-darker:disabled { background-color: #52525b; } .control-btn-sm { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem; background-color: #e5e7eb; color: #1f2937; border-radius: 0.375rem; transition: background-color 0.2s; } .dark .control-btn-sm { background-color: #3f3f46; color: #d4d4d8; } .control-btn-sm:hover { background-color: #d1d5db; } .dark .control-btn-sm:hover { background-color: #52525b; } .control-btn-sm.active { background-color: #1f2937; color: #f9fafb; } .dark .control-btn-sm.active { background-color: #e5e7eb; color: #111827; } details[open] > summary svg { transform: rotate(0deg); } details > summary svg { transform: rotate(-90deg); transition: transform 0.2s ease-in-out; } `; document.head.appendChild(styleSheet);
            
            // --- Debug Functions (accessible from console) ---
            window.debugLiveProcessing = () => {
                console.log('=== LIVE PROCESSING DEBUG ===');
                console.log('Live toggle checked:', liveProcessingToggle.checked);
                console.log('Selected images:', uploadedImages.filter(img => img.selected).length);
                console.log('Pipeline length:', pipeline.length);
                console.log('Pipeline:', JSON.stringify(pipeline.map(s => ({name: s.name, params: s.params})), null, 2));
                
                const liveViewer = document.getElementById('live-inspector-viewer');
                const liveDisplay = document.getElementById('live-inspector-display');
                const liveSection = document.getElementById('live-inspector-section');
                
                console.log('Live viewer exists:', !!liveViewer);
                console.log('Live display exists:', !!liveDisplay);
                console.log('Live section exists:', !!liveSection);
                console.log('Live section hidden:', liveSection?.classList.contains('hidden'));
                console.log('Live display children:', liveDisplay?.children.length);
                
                if (liveViewer) {
                    const normalImg = liveViewer.querySelector('#normal-image-live');
                    console.log('Normal image exists:', !!normalImg);
                    console.log('Normal image src:', normalImg?.src?.substring(0, 50) + '...');
                }
                
                if (liveProcessingToggle.checked) {
                    console.log('Manually triggering updateLivePreview...');
                    updateLivePreview();
                }
            };
            
            window.testLiveAPI = async () => {
                const selectedImages = uploadedImages.filter(img => img.selected);
                if (selectedImages.length === 0) {
                    console.log('No selected images');
                    return;
                }
                
                const payload = {
                    image: selectedImages[0].dataUrl,
                    pipeline: [{"name": "Brightness", "params": {"amount": 50}}]
                };
                
                console.log('Testing live API with payload:', {
                    imageLength: payload.image.length,
                    pipeline: payload.pipeline
                });
                
                try {
                    const response = await fetch('/process-live', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    const data = await response.json();
                    console.log('API Response:', {
                        status: response.status,
                        resultsCount: data.results?.length,
                        firstResultLength: data.results?.[0]?.length
                    });
                    
                    // Try to display the result
                    const liveViewer = document.getElementById('live-inspector-viewer');
                    if (liveViewer) {
                        const normalImg = liveViewer.querySelector('#normal-image-live');
                        if (normalImg) {
                            normalImg.src = data.results[0];
                            console.log('Updated live image with API result');
                        }
                    }
                    
                } catch (error) {
                    console.error('API test failed:', error);
                }
            };

            // --- Initial Setup ---
            const initialTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); setTheme(initialTheme); renderPipeline(); checkAndSetIdleStatus(); document.getElementById('copyright-year').textContent = new Date().getFullYear();
            window.lightboxResetZoom = setupZoomPan(document.getElementById('lightbox-container'), document.getElementById('lightbox-zoom-controls'));
            window.inspectorResetZoom = setupZoomPan(document.getElementById('normal-view'), document.getElementById('inspector-zoom-controls'));
        });
    