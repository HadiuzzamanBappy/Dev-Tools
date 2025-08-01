// layout.js

export function initializeLayoutVisualizer() {
    const page = document.getElementById('spacing-visualizer');
    if (!page) return;

    // --- STATE MANAGEMENT: The single source of truth for the layout ---
    const state = {
        mode: 'flex', // 'flex' or 'grid'
        itemCount: 4,
        container: {
            // Flex properties
            flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch', flexWrap: 'nowrap',
            // Grid properties
            gridTemplateColumns: '1fr 1fr 1fr',
            // Shared properties
            gap: 16,
        },
        items: {
            padding: 16, margin: 8, width: '', height: '',
        }
    };

    // --- DOM ELEMENT SELECTION ---
    const elements = {
        container: page.querySelector('#visualizer-container'),
        viewport: page.querySelector('.visualizer-viewport'),
        cssOutput: page.querySelector('#css-output-code'),
        modeSelect: page.querySelector('#layout-mode-select'),
        flexControls: page.querySelector('#flex-controls'),
        gridControls: page.querySelector('#grid-controls'),
        addItemBtn: page.querySelector('#add-item-btn'),
        removeItemBtn: page.querySelector('#remove-item-btn'),
        itemCountLabel: page.querySelector('#item-count-label'),
        responsiveBtns: page.querySelectorAll('.responsive-btn'),
        copyCssBtn: page.querySelector('#copy-css-btn'),
    };

    // --- CORE FUNCTIONS ---
    const renderItems = () => {
        elements.container.innerHTML = '';
        for (let i = 1; i <= state.itemCount; i++) {
            const item = document.createElement('div');
            item.className = 'visualizer-item';
            item.textContent = i;
            elements.container.appendChild(item);
        }
        elements.itemCountLabel.textContent = state.itemCount;
        applyStyles();
    };

    const applyStyles = () => {
        const { style } = elements.container;
        style.cssText = ''; // Reset styles to prevent conflicts
        
        style.display = state.mode;
        style.gap = `${state.container.gap}px`;

        if (state.mode === 'flex') {
            style.flexDirection = state.container.flexDirection;
            style.justifyContent = state.container.justifyContent;
            style.alignItems = state.container.alignItems;
            style.flexWrap = state.container.flexWrap;
        } else { // Grid
            style.gridTemplateColumns = state.container.gridTemplateColumns;
        }

        elements.container.querySelectorAll('.visualizer-item').forEach(item => {
            item.style.padding = `${state.items.padding}px`;
            item.style.margin = `${state.items.margin}px`;
            item.style.width = state.items.width ? `${state.items.width}px` : 'auto';
            item.style.height = state.items.height ? `${state.items.height}px` : 'auto';
        });

        generateCSS();
    };

    const generateCSS = () => {
        let containerCss = `display: ${state.mode};\n`;
        containerCss += `gap: ${state.container.gap}px;\n`;
        if (state.mode === 'flex') {
            containerCss += `flex-direction: ${state.container.flexDirection};\n`;
            containerCss += `justify-content: ${state.container.justifyContent};\n`;
            containerCss += `align-items: ${state.container.alignItems};\n`;
            containerCss += `flex-wrap: ${state.container.flexWrap};\n`;
        } else {
            containerCss += `grid-template-columns: ${state.container.gridTemplateColumns};\n`;
        }

        let itemCss = `padding: ${state.items.padding}px;\n`;
        itemCss += `margin: ${state.items.margin}px;\n`;
        if (state.items.width) itemCss += `width: ${state.items.width}px;\n`;
        if (state.items.height) itemCss += `height: ${state.items.height}px;\n`;

        const fullCss = `.container {\n${' '.repeat(2)}${containerCss.replace(/\n/g, `\n${' '.repeat(2)}`)}}\n\n.item {\n${' '.repeat(2)}${itemCss.replace(/\n/g, `\n${' '.repeat(2)}`)}}`;
        elements.cssOutput.textContent = fullCss.trim();
        Prism.highlightElement(elements.cssOutput);
    };
    
    // --- EVENT LISTENERS ---
    const setupListeners = () => {
        elements.modeSelect.addEventListener('change', (e) => {
            state.mode = e.target.value;
            elements.flexControls.hidden = state.mode !== 'flex';
            elements.gridControls.hidden = state.mode !== 'grid';
            applyStyles();
        });

        elements.addItemBtn.addEventListener('click', () => { state.itemCount++; renderItems(); });
        elements.removeItemBtn.addEventListener('click', () => { if (state.itemCount > 1) { state.itemCount--; renderItems(); } });
        
        elements.responsiveBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.responsiveBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                elements.viewport.style.width = btn.dataset.width;
            });
        });

        elements.copyCssBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(elements.cssOutput.textContent).then(() => {
                const originalText = elements.copyCssBtn.innerHTML;
                elements.copyCssBtn.innerHTML = '<i class="fa-solid fa-check me-2"></i>Copied!';
                setTimeout(() => { elements.copyCssBtn.innerHTML = originalText; }, 2000);
            });
        });

        // A single, powerful listener for all control inputs
        page.querySelectorAll('.control').forEach(control => {
            control.addEventListener('input', (e) => {
                const { key, subkey } = e.target.dataset;
                if (subkey) { // e.g., data-key="container" data-subkey="gap"
                    state[key][subkey] = e.target.value;
                } else { // e.g., data-key="mode"
                    state[key] = e.target.value;
                }
                applyStyles();
            });
        });
    };
    
    // --- INITIALIZATION ---
    setupListeners();
    renderItems();
    elements.modeSelect.dispatchEvent(new Event('change')); // Trigger initial mode setup
    page.querySelector('.responsive-btn[data-width="100%"]').classList.add('active');
}