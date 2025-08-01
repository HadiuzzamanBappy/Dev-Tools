// shadow.js

/**
 * A simple helper function to convert a HEX color and an opacity value (0-1)
 * into a valid rgba() CSS string. This replaces the Chroma.js dependency for this tool.
 * @param {string} hex - The hex color string (e.g., "#000000").
 * @param {number|string} opacity - The opacity value (e.g., 0.2).
 * @returns {string} The rgba() string (e.g., "rgba(0, 0, 0, 0.2)").
 */
function hexToRgba(hex, opacity) {
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        let c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')}, ${opacity})`;
    }
    // Return a fallback if the hex is invalid
    return `rgba(0, 0, 0, ${opacity})`;
}


export function initializeBoxShadowGenerator() {
    const page = document.getElementById('box-shadow-generator') || document.getElementById('shadow-maker');
    if (!page) return;

    // --- DOM Elements ---
    const elements = {
        previewPane: page.querySelector('#shadow-preview-pane'),
        previewElement: page.querySelector('#shadow-preview-element'),
        bgColorPicker: page.querySelector('#shadow-bg-color'),
        elementColorPicker: page.querySelector('#shadow-element-color'),
        layersList: page.querySelector('.shadow-layers-list'),
        addLayerBtn: page.querySelector('#add-shadow-layer-btn'),
        removeLayerBtn: page.querySelector('#remove-shadow-layer-btn'),
        controls: {
            inset: page.querySelector('#shadow-inset-toggle'),
            offsetX: page.querySelector('#shadow-offset-x'),
            offsetY: page.querySelector('#shadow-offset-y'),
            blur: page.querySelector('#shadow-blur'),
            spread: page.querySelector('#shadow-spread'),
            color: page.querySelector('#shadow-color'),
            opacity: page.querySelector('#shadow-opacity'),
        },
        presetBtns: page.querySelectorAll('.preset-btn'),
        cssOutput: page.querySelector('#shadow-css-output'),
        copyCssBtn: page.querySelector('#copy-shadow-css-btn'),
    };

    // --- State Management ---
    let state = {
        layers: [
            { id: Date.now(), inset: false, offsetX: 0, offsetY: 10, blur: 25, spread: -5, color: '#000000', opacity: 0.1 }
        ],
        activeLayerId: null,
    };
    state.activeLayerId = state.layers[0].id;

    // --- Presets Data ---
    const presets = {
        soft: [ { inset: false, offsetX: 0, offsetY: 4, blur: 6, spread: -1, color: '#000000', opacity: 0.1 }, { inset: false, offsetX: 0, offsetY: 2, blur: 4, spread: -2, color: '#000000', opacity: 0.1 } ],
        material: [ { inset: false, offsetX: 0, offsetY: 1, blur: 3, spread: 0, color: '#000000', opacity: 0.2 }, { inset: false, offsetX: 0, offsetY: 1, blur: 1, spread: 0, color: '#000000', opacity: 0.14 }, { inset: false, offsetX: 0, offsetY: 2, blur: 1, spread: -1, color: '#000000', opacity: 0.12 } ],
        neumorphic: [ { inset: false, offsetX: 5, offsetY: 5, blur: 10, spread: 0, color: '#bebebe', opacity: 1 }, { inset: false, offsetX: -5, offsetY: -5, blur: 10, spread: 0, color: '#ffffff', opacity: 1 } ]
    };

    // --- Core Functions ---
    const generateCSS = () => {
        if (state.layers.length === 0) return 'none';
        const shadowStrings = state.layers.map(layer => {
            // ** THE FIX IS HERE: Use the new, reliable helper function **
            const colorWithOpacity = hexToRgba(layer.color, layer.opacity);
            return `${layer.inset ? 'inset ' : ''}${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${layer.spread}px ${colorWithOpacity}`;
        });
        return shadowStrings.join(',\n       ');
    };

    const render = () => {
        const css = generateCSS();
        elements.previewElement.style.boxShadow = css;
        
        elements.layersList.innerHTML = '';
        state.layers.forEach(layer => {
            const item = document.createElement('li');
            item.className = `shadow-layer-item ${layer.id === state.activeLayerId ? 'active' : ''}`;
            item.dataset.id = layer.id;
            const colorWithOpacity = hexToRgba(layer.color, layer.opacity);
            item.innerHTML = `
                <div class="layer-swatch" style="background-color: ${colorWithOpacity}"></div>
                <div class="layer-text-wrapper">
                    <div class="layer-text">${layer.inset ? 'Inset' : 'Outset'} Shadow</div>
                    <div class="layer-subtext">${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${layer.spread}px</div>
                </div>`;
            elements.layersList.appendChild(item);
        });

        const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
        if (activeLayer) {
            Object.values(elements.controls).forEach(input => input.disabled = false);
            const controlMap = {
                'shadow-inset-toggle': 'inset', 'shadow-offset-x': 'offsetX', 'shadow-offset-y': 'offsetY',
                'shadow-blur': 'blur', 'shadow-spread': 'spread', 'shadow-color': 'color', 'shadow-opacity': 'opacity'
            };
            Object.keys(controlMap).forEach(id => {
                const input = page.querySelector(`#${id}`);
                const stateKey = controlMap[id];
                if(input.type === 'checkbox') input.checked = activeLayer[stateKey];
                else input.value = activeLayer[stateKey];
            });
        } else {
            Object.values(elements.controls).forEach(input => input.disabled = true);
        }
        
        elements.cssOutput.value = `box-shadow: ${css};`;
        elements.removeLayerBtn.disabled = state.layers.length === 0;
    };

    // --- Event Listeners ---
    const setupListeners = () => {
        const controlMap = {
            'shadow-inset-toggle': 'inset', 'shadow-offset-x': 'offsetX', 'shadow-offset-y': 'offsetY',
            'shadow-blur': 'blur', 'shadow-spread': 'spread', 'shadow-color': 'color', 'shadow-opacity': 'opacity'
        };

        Object.keys(controlMap).forEach(id => {
            const input = page.querySelector(`#${id}`);
            if (input) {
                input.addEventListener('input', (e) => {
                    const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
                    if (activeLayer) {
                        const key = controlMap[id];
                        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                        activeLayer[key] = value;
                        render();
                    }
                });
            }
        });

        elements.addLayerBtn.addEventListener('click', () => {
            const lastLayer = state.layers[state.layers.length - 1] || presets.soft[0];
            const newLayer = { ...lastLayer, id: Date.now() };
            state.layers.push(newLayer);
            state.activeLayerId = newLayer.id;
            render();
        });

        elements.removeLayerBtn.addEventListener('click', () => {
            if (state.layers.length > 0) {
                state.layers = state.layers.filter(l => l.id !== state.activeLayerId);
                state.activeLayerId = state.layers[state.layers.length - 1]?.id || null;
                render();
            }
        });

        elements.layersList.addEventListener('click', (e) => {
            const item = e.target.closest('.shadow-layer-item');
            if (item) {
                state.activeLayerId = Number(item.dataset.id);
                render();
            }
        });

        elements.bgColorPicker.addEventListener('input', (e) => elements.previewPane.style.backgroundColor = e.target.value);
        elements.elementColorPicker.addEventListener('input', (e) => elements.previewElement.style.backgroundColor = e.target.value);
        
        elements.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const presetKey = btn.dataset.preset;
                if (presets[presetKey]) {
                    state.layers = presets[presetKey].map((layer, i) => ({ ...layer, id: Date.now() + i }));
                    state.activeLayerId = state.layers[0].id;
                    render();
                }
            });
        });
        
        elements.copyCssBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(elements.cssOutput.value).then(() => {
                const originalText = elements.copyCssBtn.innerHTML;
                elements.copyCssBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                setTimeout(() => { originalText = elements.copyCssBtn.innerHTML; }, 2000);
            });
        });
    };

    // --- INITIALIZATION ---
    setupListeners();
    render();
}