export function initializeTypeScaleVisualizer() {
    const page = document.getElementById('typescale-visualizer');
    if (!page) return;

    // --- Pre-defined Scale Ratios ---
    const scales = {
        'minor-second': 1.067, 'major-second': 1.125, 'minor-third': 1.200,
        'major-third': 1.250, 'perfect-fourth': 1.333, 'augmented-fourth': 1.414,
        'perfect-fifth': 1.500, 'golden-ratio': 1.618
    };

    // --- State Management ---
    const state = {
        baseSize: 16,
        scaleRatio: scales['major-third'],
        fontFamily: 'Inter',
        previewText: 'Almost before we knew it, we had left the ground.',
        stepsUp: 5,
        stepsDown: 2,
    };

    // --- DOM Elements ---
    const elements = {
        baseSizeInput: page.querySelector('#ts-base-size'),
        scaleSelect: page.querySelector('#ts-scale-ratio'),
        customRatioInput: page.querySelector('#ts-custom-ratio'),
        fontSelect: page.querySelector('#ts-font-family'),
        previewTextInput: page.querySelector('#ts-preview-text'),
        rampContainer: page.querySelector('.type-ramp-preview'),
        cssVarsOutput: page.querySelector('#css-vars-output'),
        cssClassesOutput: page.querySelector('#css-classes-output'),
        copyBtns: page.querySelectorAll('.btn-copy'),
    };

    // --- Core Functions ---
    const calculateScale = () => {
        const scale = [];
        // Add steps above the base size
        for (let i = 0; i <= state.stepsUp; i++) {
            const size = state.baseSize * Math.pow(state.scaleRatio, i);
            scale.push({ step: i, px: size.toFixed(2), rem: (size / state.baseSize).toFixed(3) });
        }
        // Add steps below the base size
        for (let i = 1; i <= state.stepsDown; i++) {
            const size = state.baseSize / Math.pow(state.scaleRatio, i);
            scale.push({ step: -i, px: size.toFixed(2), rem: (size / state.baseSize).toFixed(3) });
        }
        return scale.sort((a, b) => b.step - a.step); // Sort from largest to smallest
    };

    const loadGoogleFont = (fontFamily) => {
        const fontId = `font-link-${fontFamily.replace(/\s+/g, '-')}`;
        if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
            document.head.appendChild(link);
        }
    };

    const render = () => {
        const scaleData = calculateScale();
        loadGoogleFont(state.fontFamily);

        // 1. Render the Type Ramp
        elements.rampContainer.innerHTML = '';
        elements.rampContainer.style.fontFamily = `'${state.fontFamily}', sans-serif`;
        scaleData.forEach(item => {
            const rampItem = document.createElement('div');
            rampItem.className = 'ramp-item';
            rampItem.innerHTML = `
                <div class="ramp-text" style="font-size: ${item.px}px;">${state.previewText}</div>
                <div class="ramp-meta">
                    <span>${item.px}px | ${item.rem}rem</span>
                    <span>--ts-${item.step >= 0 ? item.step : `n${Math.abs(item.step)}`}</span>
                </div>`;
            elements.rampContainer.appendChild(rampItem);
        });

        // 2. Generate and Render CSS
        let varsCss = `:root {\n`;
        let classesCss = ``;
        scaleData.sort((a,b) => a.step - b.step).forEach(item => { // Sort from smallest to largest for CSS
            const varName = `--ts-${item.step >= 0 ? item.step : `n${Math.abs(item.step)}`}`;
            varsCss += `  ${varName}: ${item.rem}rem; /* ${item.px}px */\n`;
            classesCss += `.ts-${item.step >= 0 ? item.step : `n${Math.abs(item.step)}`} {\n  font-size: var(${varName});\n}\n\n`;
        });
        varsCss += `}`;

        elements.cssVarsOutput.textContent = varsCss;
        elements.cssClassesOutput.textContent = classesCss.trim();
        Prism.highlightAllUnder(page);
    };

    // --- EVENT LISTENERS ---
    const setupListeners = () => {
        elements.baseSizeInput.addEventListener('input', (e) => {
            state.baseSize = parseFloat(e.target.value) || 16;
            render();
        });

        elements.scaleSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === 'custom') {
                elements.customRatioInput.hidden = false;
                state.scaleRatio = parseFloat(elements.customRatioInput.value) || 1.250;
            } else {
                elements.customRatioInput.hidden = true;
                state.scaleRatio = scales[value];
            }
            render();
        });
        
        elements.customRatioInput.addEventListener('input', (e) => {
            state.scaleRatio = parseFloat(e.target.value) || 1.250;
            render();
        });
        
        elements.fontSelect.addEventListener('change', (e) => {
            state.fontFamily = e.target.value;
            render();
        });
        
        elements.previewTextInput.addEventListener('input', (e) => {
            state.previewText = e.target.value;
            // A lighter render just for text to improve performance
            elements.rampContainer.querySelectorAll('.ramp-text').forEach(el => el.textContent = state.previewText);
        });

        elements.copyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = page.querySelector(btn.dataset.target);
                if(target.textContent){
                    navigator.clipboard.writeText(target.textContent).then(() => {
                        const originalText = btn.innerHTML;
                        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                    });
                }
            });
        });
    };
    
    // --- INITIALIZATION ---
    setupListeners();
    render();
}