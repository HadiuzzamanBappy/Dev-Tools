// color.js

const WCAG_AA_NORMAL = 4.5;

// --- Main Initializer ---
export function initializeColorPalette() {
    const page = document.getElementById('color-palette');
    if (!page) return;

    const sharedState = {
        savedPalettes: JSON.parse(localStorage.getItem('colorPalettes_v5')) || []
    };

    const getBaseColor = () => {
        const manualInput = page.querySelector('#manual-color-input');
        const picker = page.querySelector('#color-picker-input');
        return chroma.valid(manualInput.value) ? chroma(manualInput.value) : chroma(picker.value);
    };

    // No longer checks URL here. Initialization is passed down.
    initializeLeftColumn(page, sharedState, getBaseColor);
    initializeCenterColumn(page, sharedState, getBaseColor); // No longer passes sharedPaletteData
    initializeRightColumn(page);
}


/**
 * Initializes all functionality for the left "Generation & Management" column.
 * This function does NOT need to change.
 */
function initializeLeftColumn(page, sharedState, getBaseColor) {
    const controls = {
        picker: page.querySelector('#color-picker-input'),
        manualInput: page.querySelector('#manual-color-input'),
        eyedropperBtn: page.querySelector('#eyedropper-btn'),
        imageImportInput: page.querySelector('#image-import-input'),
        generateMode: page.querySelector('#generate-mode-select'),
        generateBtn: page.querySelector('#generate-palette-btn'),
        randomBtn: page.querySelector('#random-palette-btn'),
        savedList: page.querySelector('#saved-palettes-list'),
    };
    const savePalettesToLocal = () => localStorage.setItem('colorPalettes_v5', JSON.stringify(sharedState.savedPalettes));
    const dispatchPaletteGeneratedEvent = (colors, name) => page.dispatchEvent(new CustomEvent('paletteGenerated', { bubbles: true, detail: { colors, name } }));
    const renderSavedPalettes = () => {
        controls.savedList.innerHTML = '';
        if (sharedState.savedPalettes.length === 0) {
            controls.savedList.innerHTML = `<li class="list-group-item small text-secondary">No palettes saved yet.</li>`;
            return;
        }
        sharedState.savedPalettes.forEach((palette, index) => {
            const item = document.createElement('li');
            item.className = 'list-group-item d-flex justify-content-between align-items-center small';
            item.innerHTML = `<span class="flex-grow-1">${palette.name}</span><div class="btn-group"><button class="btn btn-sm load-btn" data-index="${index}" title="Load Palette"><i class="fa-solid fa-upload"></i></button><button class="btn btn-sm delete-btn" data-index="${index}" title="Delete Palette"><i class="fa-solid fa-trash"></i></button></div>`;
            controls.savedList.appendChild(item);
        });
    };
    controls.picker.addEventListener('input', () => { controls.manualInput.value = controls.picker.value; });
    controls.manualInput.addEventListener('change', () => { if (chroma.valid(controls.manualInput.value)) controls.picker.value = chroma(controls.manualInput.value).hex(); });

    controls.eyedropperBtn.addEventListener('click', async () => {
        if (!window.EyeDropper) { alert("Your browser does not support the Eyedropper API."); return; }
        try {
            const eyeDropper = new EyeDropper();
            const { sRGBHex } = await eyeDropper.open();
            controls.picker.value = sRGBHex;
            controls.manualInput.value = sRGBHex;
        } catch (e) { console.info("Eyedropper selection cancelled."); }
    });

    controls.generateBtn.addEventListener('click', () => {
        const base = getBaseColor();
        const mode = controls.generateMode.value;
        let paletteColors = [];
        switch (mode) {
            case 'monochromatic': paletteColors = chroma.scale([base.darken(2), base, base.brighten(2)]).mode('lch').colors(5); break;
            case 'analogous': paletteColors = [base, base.set('hsl.h', '+30'), base.set('hsl.h', '-30'), base.set('hsl.h', '+60'), base.set('hsl.h', '-60')].map(c => c.hex()); break;
            case 'complementary': paletteColors = [base, base.set('hsl.h', '+180'), base.set('hsl.h', '+150'), base.set('hsl.h', '-150'), base.saturate(2)].map(c => c.hex()); break;
            case 'triadic': paletteColors = [base, base.set('hsl.h', '+120'), base.set('hsl.h', '-120'), base.set('hsl.h', '+120').saturate(1), base.set('hsl.h', '-120').saturate(1)].map(c => c.hex()); break;
            case 'tetradic': paletteColors = [base, base.set('hsl.h', '+90'), base.set('hsl.h', '+180'), base.set('hsl.h', '+270'), base.saturate(2)].map(c => c.hex()); break;
        }
        const paletteName = `${mode.charAt(0).toUpperCase() + mode.slice(1)} Palette`;
        dispatchPaletteGeneratedEvent(paletteColors, paletteName);
    });

    controls.randomBtn.addEventListener('click', () => {
        const randomColors = Array.from({ length: 5 }, () => chroma.random().hex());
        dispatchPaletteGeneratedEvent(randomColors, 'Random Palette');
    });

    controls.imageImportInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width; canvas.height = img.height;
                const context = canvas.getContext('2d');
                context.drawImage(img, 0, 0, img.width, img.height);
                const imageData = context.getImageData(0, 0, img.width, img.height).data;
                const rgbValues = [];
                const sampleRate = Math.max(1, Math.floor((imageData.length / 4) / 2000));
                for (let i = 0; i < imageData.length; i += 4 * sampleRate) {
                    if (imageData[i + 3] > 50) {
                        rgbValues.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
                    }
                }
                if (rgbValues.length === 0) { alert("Could not extract colors from this image."); return; }
                const colorScale = chroma.scale(chroma.limits(rgbValues, 'lch', 5)).mode('lch').colors(5);
                dispatchPaletteGeneratedEvent(colorScale, `${file.name.split('.')[0]} Palette`);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    controls.savedList.addEventListener('click', (e) => {
        const loadBtn = e.target.closest('.load-btn');
        if (loadBtn) {
            const paletteToLoad = sharedState.savedPalettes[+loadBtn.dataset.index];
            if (paletteToLoad) page.dispatchEvent(new CustomEvent('fullPaletteLoad', { detail: { palette: paletteToLoad } }));
        }
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const index = +deleteBtn.dataset.index;
            if (confirm(`Are you sure you want to delete "${sharedState.savedPalettes[index].name}"?`)) {
                sharedState.savedPalettes.splice(index, 1);
                savePalettesToLocal();
                renderSavedPalettes();
            }
        }
    });
    page.addEventListener('paletteSaved', () => {
        sharedState.savedPalettes = JSON.parse(localStorage.getItem('colorPalettes_v5')) || [];
        renderSavedPalettes();
    });
    renderSavedPalettes();
}

/**
 * Initializes all functionality for the center "Palette Workspace" column.
 */
function initializeCenterColumn(page, sharedState, getBaseColor) {
    const workspace = {
        nameInput: page.querySelector('#palette-name-input'),
        addBtn: page.querySelector('#add-to-palette-btn'),
        addGroupBtn: page.querySelector('#add-group-btn'),
        saveBtn: page.querySelector('#save-palette-btn'),
        clearBtn: page.querySelector('#clear-palette-btn'),
        groupsContainer: page.querySelector('#palette-groups-container'),
        placeholder: page.querySelector('#palette-placeholder'),
    };
    let currentPalette = { name: '', groups: [] };
    let activeGroupId = null, selectedColorId = null, dragState = {};

    const createColor = (hex) => ({ id: Date.now() + Math.random(), hex });
    const createGroup = (name, colors = []) => ({ id: Date.now() + Math.random(), name, colors });
    const dispatchPaletteUpdate = () => page.dispatchEvent(new CustomEvent('paletteUpdated', { bubbles: true, detail: { palette: currentPalette } }));
    const dispatchPaletteSave = () => page.dispatchEvent(new CustomEvent('paletteSaved', { bubbles: true }));

    const renderWorkspace = () => {
        workspace.groupsContainer.innerHTML = '';
        workspace.nameInput.value = currentPalette.name;
        if (currentPalette.groups.length === 0) {
            workspace.groupsContainer.appendChild(workspace.placeholder);
            dispatchPaletteUpdate();
            return;
        }
        currentPalette.groups.forEach(group => {
            const groupWrapper = document.createElement('div');
            groupWrapper.className = `palette-group ${group.id === activeGroupId ? 'is-active' : ''}`;
            groupWrapper.innerHTML = `
                <div class="palette-group-header">
                    <input type="text" class="form-control-plaintext form-control-sm group-name-input" value="${group.name}" data-group-id="${group.id}">
                    <button class="btn btn-sm p-0 delete-group-btn" title="Delete Group" data-group-id="${group.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="palette-grid-container" data-group-id="${group.id}"></div>`;
            const grid = groupWrapper.querySelector('.palette-grid-container');
            if (group.colors.length > 0) {
                group.colors.forEach(colorObj => {
                    const color = chroma(colorObj.hex);
                    const card = document.createElement('div');
                    card.className = `color-card ${colorObj.id === selectedColorId ? 'is-selected' : ''}`;
                    card.draggable = true;
                    card.dataset.id = colorObj.id;
                    card.dataset.groupId = group.id;
                    card.innerHTML = `
                        <div class="drag-handle"></div>
                        <div class="color-swatch" style="background-color: ${color.hex()};">
                            <div class="contrast-info">
                                <span><i class="fa-solid fa-circle" style="color:white;"></i> ${chroma.contrast(color, 'white').toFixed(2)}</span>
                                <span><i class="fa-solid fa-circle" style="color:black;"></i> ${chroma.contrast(color, 'black').toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="card-actions"><button class="remove-btn" title="Remove Color"><i class="fa-solid fa-trash"></i></button></div>
                        <div class="color-details">
                            <div class="color-value">HEX <span class="copy-icon">${color.hex().toUpperCase()}</span></div>
                            <div class="color-value">RGB <span class="copy-icon">${color.css('rgb')}</span></div>
                            <div class="color-value">HSL <span class="copy-icon">${color.css('hsl')}</span></div>
                        </div>`;
                    grid.appendChild(card);
                });
            } else {
                 grid.innerHTML = `<p class="text-secondary small text-center p-3">Drag colors here or use the '+' button.</p>`;
            }
            workspace.groupsContainer.appendChild(groupWrapper);
        });
        addDynamicEventListeners();
        dispatchPaletteUpdate();
    };

    function addDynamicEventListeners() {
        workspace.groupsContainer.querySelectorAll('.color-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const id = Number(card.dataset.id);
                selectedColorId = id;
                activeGroupId = Number(card.dataset.groupId);
                if (e.target.closest('.remove-btn')) {
                    const group = currentPalette.groups.find(g => g.id === activeGroupId);
                    if(group) group.colors = group.colors.filter(c => c.id !== id);
                }
                renderWorkspace();
            });
        });

        workspace.groupsContainer.querySelectorAll('.group-name-input').forEach(input => {
            input.addEventListener('change', e => {
                const group = currentPalette.groups.find(g => g.id == e.target.dataset.groupId);
                if (group) group.name = e.target.value;
            });
        });

        workspace.groupsContainer.querySelectorAll('.delete-group-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const groupId = Number(e.currentTarget.dataset.groupId);
                if (confirm("Delete this group and all its colors?")) {
                    currentPalette.groups = currentPalette.groups.filter(g => g.id !== groupId);
                    renderWorkspace();
                }
            });
        });

        workspace.groupsContainer.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const colorId = Number(e.currentTarget.dataset.colorId);
                currentPalette.groups.forEach(g => { g.colors = g.colors.filter(c => c.id !== colorId); });
                renderWorkspace();
            });
        });
    }

    page.addEventListener('paletteGenerated', (e) => {
        const { colors, name } = e.detail;
        currentPalette = { name, groups: [createGroup('Main', colors.map(hex => createColor(hex)))] };
        activeGroupId = currentPalette.groups.length > 0 ? currentPalette.groups[0].id : null;
        selectedColorId = null;
        renderWorkspace();
    });
    page.addEventListener('fullPaletteLoad', (e) => {
        currentPalette = JSON.parse(JSON.stringify(e.detail.palette));
        activeGroupId = currentPalette.groups.length > 0 ? currentPalette.groups[0].id : null;
        selectedColorId = null;
        renderWorkspace();
    });

    workspace.nameInput.addEventListener('change', () => currentPalette.name = workspace.nameInput.value);

    workspace.addGroupBtn.addEventListener('click', () => {
        const name = prompt("Enter new group name:", "Accent");
        if (name) {
            const newGroup = createGroup(name);
            currentPalette.groups.push(newGroup);
            activeGroupId = newGroup.id;
            renderWorkspace();
        }
    });

    workspace.addBtn.addEventListener('click', () => {
        if (!activeGroupId && currentPalette.groups.length > 0) activeGroupId = currentPalette.groups[0].id;
        const group = currentPalette.groups.find(g => g.id === activeGroupId);
        if (!group) { alert("Create or select a group first."); return; }
        group.colors.push(createColor(getBaseColor().hex()));
        renderWorkspace();
    });
    workspace.saveBtn.addEventListener('click', () => {
        if (!currentPalette.name || currentPalette.groups.length === 0) { alert("Please name your palette."); return; }
        sharedState.savedPalettes.push(JSON.parse(JSON.stringify(currentPalette)));
        localStorage.setItem('colorPalettes_v5', JSON.stringify(sharedState.savedPalettes));
        alert(`Palette "${currentPalette.name}" saved!`);
        dispatchPaletteSave();
    });

    workspace.clearBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear the entire workspace?")) {
            currentPalette = { name: '', groups: [] };
            activeGroupId = null;
            selectedColorId = null;
            renderWorkspace();
        }
    });

    workspace.groupsContainer.addEventListener('dragstart', (e) => {
        const target = e.target.closest('.color-card');
        // Only proceed if a valid color card is being dragged
        if (!target) {
            e.preventDefault();
            return;
        }

        // Store the state of the dragged item
        dragState = {
            srcGroupId: Number(target.dataset.groupId),
            srcColorId: Number(target.dataset.id)
        };

        // Use a timeout to allow the browser to create the drag ghost image
        // before we add the class that might visually hide the element.
        setTimeout(() => {
            target.classList.add('dragging');
        }, 0);
    });

    workspace.groupsContainer.addEventListener('dragend', (e) => {
        const target = e.target.closest('.color-card');
        if (target) {
            target.classList.remove('dragging');
        }
        // Clean up all hover effects
        workspace.groupsContainer.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        // Reset the state to prevent errors
        dragState = {};
    });

    workspace.groupsContainer.addEventListener('dragover', (e) => {
        // This is crucial to allow a drop
        e.preventDefault();
        
        const dropZoneGrid = e.target.closest('.palette-grid-container');
        if(dropZoneGrid){
            // Add a visual indicator to the grid being hovered over
            workspace.groupsContainer.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            dropZoneGrid.classList.add('drag-over');
        }
    });

    workspace.groupsContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const dropZoneGrid = e.target.closest('.palette-grid-container');
        // Clean up visual indicators immediately
        dropZoneGrid?.classList.remove('drag-over');

        // Ensure a valid drop target and a valid item is being dragged
        if (!dropZoneGrid || !dragState.srcGroupId || !dragState.srcColorId) {
            return;
        }

        const destGroupId = Number(dropZoneGrid.dataset.groupId);
        const srcGroup = currentPalette.groups.find(g => g.id === dragState.srcGroupId);
        const destGroup = currentPalette.groups.find(g => g.id === destGroupId);

        // Safety check: ensure both source and destination groups exist
        if (!srcGroup || !destGroup) return;

        // Find and remove the color from the source group
        const colorIndex = srcGroup.colors.findIndex(c => c.id === dragState.srcColorId);
        if (colorIndex === -1) return; // Color not found, abort
        const [movedColor] = srcGroup.colors.splice(colorIndex, 1);
        
        // Find where to insert the color in the destination group
        const targetCard = e.target.closest('.color-card');
        if (targetCard) {
            // If dropped on another card, insert it at that card's position
            const destIndex = destGroup.colors.findIndex(c => c.id == targetCard.dataset.id);
            destGroup.colors.splice(destIndex, 0, movedColor);
        } else {
            // If dropped on the grid's empty space, add it to the end
            destGroup.colors.push(movedColor);
        }

        // Re-render the entire workspace to reflect the new state
        renderWorkspace();
    });

    const urlParams = new URLSearchParams(window.location.search);
    const sharedPaletteData = urlParams.get('palette');
    if (sharedPaletteData) {
        try {
            const decodedString = atob(sharedPaletteData);
            const loadedPalette = JSON.parse(decodedString);
            if (loadedPalette.name && Array.isArray(loadedPalette.groups)) {
                currentPalette = loadedPalette;
                // Clean the URL so the link isn't shared again on refresh or navigation
                const newUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, newUrl);
            }
        } catch (e) {
            console.error("Failed to parse shared palette from URL:", e);
            alert("The shared palette link appears to be invalid.");
        }
    }

    renderWorkspace();
}

/**
 * Initializes all functionality for the right "Analysis & Preview" column.
 */
function initializeRightColumn(page) {
    const controls = {
        viewDemoBtn: page.querySelector('#view-demo-btn'),
        exportCodeBtn: page.querySelector('#export-code-btn'),
        generatePngBtn: page.querySelector('#generate-png-btn'),
        shareLinkBtn: page.querySelector('#share-link-btn'),
    };
    
    const demoModal = {
        modal: new bootstrap.Modal(page.querySelector('#view-demo-modal')),
        body: page.querySelector('#demo-modal-body'),
    };

    const exportModal = {
        modal: new bootstrap.Modal(page.querySelector('#export-modal')),
        css: page.querySelector('#export-code-css'),
        scss: page.querySelector('#export-code-scss'),
        json: page.querySelector('#export-code-json'),
    };

    let currentPalette = { name: '', groups: [] };

    // --- Core Functions ---

    const generateDemoHTML = (colors) => {
        const p = colors;
        const bgColor = p[0] || '#f8f9fa';
        const textColor = chroma.contrast(bgColor, 'white') > chroma.contrast(bgColor, 'black') ? '#ffffff' : '#000000';
        const headlineColor = p[1] || textColor;
        const btnBg = p[2] || '#0d6efd';
        const btnText = chroma.contrast(btnBg, 'white') > chroma.contrast(btnBg, 'black') ? '#ffffff' : '#000000';
        const accentColor = p[3] || btnBg;

        return `
            <div style="background-color: ${bgColor}; color: ${textColor}; font-family: 'Inter', sans-serif; padding: 5rem 2rem; text-align: center;">
                <h1 style="font-size: 3.5rem; font-weight: 700; color: ${headlineColor}; margin-bottom: 1rem;">Design with Confidence</h1>
                <p style="font-size: 1.25rem; max-width: 600px; margin: 0 auto 2rem auto; opacity: 0.8;">This is a live preview of your generated color palette applied to a modern hero section UI.</p>
                <button style="background-color: ${btnBg}; color: ${btnText}; border: none; padding: 1rem 2.5rem; font-size: 1rem; font-weight: 600; border-radius: 0.5rem; cursor: pointer;">Get Started</button>
                <div style="margin-top: 3rem; border-top: 2px solid ${accentColor}; width: 80px; margin-left: auto; margin-right: auto;"></div>
            </div>`;
    };

    const generatePalettePNG = () => {
        if (currentPalette.groups.length === 0) { alert("Please create a palette first."); return; }

        const allColors = currentPalette.groups.flatMap(g => g.colors);
        const swatchSize = 150;
        const padding = 20;
        const width = allColors.length * swatchSize + (allColors.length + 1) * padding;
        const height = swatchSize + 2 * padding + 40; // Extra space for text

        let svgString = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #ffffff; font-family: sans-serif;">`;
        allColors.forEach((color, i) => {
            const x = padding + i * (swatchSize + padding);
            svgString += `<rect x="${x}" y="${padding}" width="${swatchSize}" height="${swatchSize}" fill="${color.hex}" rx="8"/>`;
            svgString += `<text x="${x + swatchSize / 2}" y="${height - padding}" text-anchor="middle" font-size="14" fill="#333">${color.hex.toUpperCase()}</text>`;
        });
        svgString += `</svg>`;

        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${currentPalette.name.replace(/\s+/g, '-') || 'palette'}.png`;
            link.href = dataURL;
            link.click();
        };
        img.src = url;
    };

    const createShareableLink = () => {
        if (currentPalette.groups.length === 0) { alert("Please create a palette to share."); return; }
        try {
            const jsonString = JSON.stringify(currentPalette);
            const encodedData = btoa(jsonString); // Base64 encode
            const url = `${window.location.origin}${window.location.pathname}?palette=${encodedData}#color-palette`;
            navigator.clipboard.writeText(url).then(() => {
                alert("Shareable link copied to clipboard!");
            });
        } catch (e) {
            alert("Could not create shareable link. The palette might be too large.");
            console.error(e);
        }
    };

    // --- EVENT LISTENERS ---
    page.addEventListener('paletteUpdated', (e) => {
        currentPalette = e.detail.palette;
    });

    controls.viewDemoBtn.addEventListener('click', () => {
        const allColors = currentPalette.groups.flatMap(g => g.colors.map(c => c.hex));
        if (allColors.length === 0) { alert("Please create a palette to view a demo."); return; }
        demoModal.body.innerHTML = generateDemoHTML(allColors);
        demoModal.modal.show();
    });

    controls.exportCodeBtn.addEventListener('click', () => {
        if (currentPalette.groups.length === 0) { alert("Cannot export an empty palette."); return; }
        const name = currentPalette.name.trim().replace(/\s+/g, '-').toLowerCase() || 'palette';
        let cssVars = '';
        let scssVars = '';
        let jsonColors = {};
        
        currentPalette.groups.forEach(group => {
            const groupName = group.name.trim().replace(/\s+/g, '-').toLowerCase();
            group.colors.forEach((color, i) => {
                const varName = `${groupName}-${i + 1}`;
                cssVars += `  --${name}-${varName}: ${color.hex};\n`;
                scssVars += `$${name}-${varName}: ${color.hex};\n`;
                jsonColors[`${name}-${varName}`] = color.hex;
            });
        });

        exportModal.css.textContent = `:root {\n${cssVars}}`;
        exportModal.scss.textContent = scssVars;
        exportModal.json.textContent = JSON.stringify({ colors: jsonColors }, null, 2);
        exportModal.modal.show();
    });
    
    controls.generatePngBtn.addEventListener('click', generatePalettePNG);
    controls.shareLinkBtn.addEventListener('click', createShareableLink);
}