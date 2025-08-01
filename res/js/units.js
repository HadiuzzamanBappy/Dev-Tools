// units.js

export function initializeUnitSystemGenerator() {
    const page = document.getElementById('unit-system-generator');
    if (!page) return;

    // --- State Management ---
    const state = {
        spacing: { base: 8, multiplier: 1.5, steps: 10, prefix: 'sp' },
        radius: { unit: 'px', isLinked: true, all: 16, tl: 16, tr: 16, br: 16, bl: 16 },
    };

    // --- DOM Elements ---
    const elements = {
        // Preview
        previewBox: page.querySelector('#unit-preview-box'),
        // Spacing Controls
        spacingBase: page.querySelector('#spacing-base-size'),
        spacingMultiplier: page.querySelector('#spacing-multiplier'),
        spacingPrefix: page.querySelector('#spacing-prefix'),
        spacingTableBody: page.querySelector('#spacing-scale-tbody'),
        // Radius Controls
        radiusAll: page.querySelector('#radius-all'),
        radiusUnit: page.querySelector('#radius-unit'),
        cornerInputs: {
            tl: page.querySelector('.corner-tl'), tr: page.querySelector('.corner-tr'),
            br: page.querySelector('.corner-br'), bl: page.querySelector('.corner-bl'),
        },
        // Outputs
        cssVarsOutput: page.querySelector('#css-vars-output'),
        utilityClassesOutput: page.querySelector('#utility-classes-output'),
        tailwindConfigOutput: page.querySelector('#tailwind-config-output'),
        copyBtns: page.querySelectorAll('.btn-copy'),
    };

    // --- Core Functions ---
    const renderSpacing = () => {
        const { base, multiplier, steps } = state.spacing;
        elements.spacingTableBody.innerHTML = '';
        for (let i = 1; i <= steps; i++) {
            const px = base * Math.pow(multiplier, i - 1);
            const rem = px / 16;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i}</td>
                <td>--${state.spacing.prefix}-${i}</td>
                <td>${px.toFixed(2)}px</td>
                <td>${rem.toFixed(3)}rem</td>
            `;
            elements.spacingTableBody.appendChild(tr);
        }
    };

    const renderRadius = () => {
        const { unit, tl, tr, br, bl } = state.radius;
        elements.previewBox.style.borderRadius = `${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit}`;
        elements.cornerInputs.tl.value = tl;
        elements.cornerInputs.tr.value = tr;
        elements.cornerInputs.br.value = br;
        elements.cornerInputs.bl.value = bl;
        elements.radiusAll.value = state.radius.all;
    };

    const renderOutputs = () => {
        // Spacing Vars
        let spacingVars = `:root {\n`;
        for (let i = 1; i <= state.spacing.steps; i++) {
            const rem = (state.spacing.base * Math.pow(state.spacing.multiplier, i - 1)) / 16;
            spacingVars += `  --${state.spacing.prefix}-${i}: ${rem.toFixed(3)}rem;\n`;
        }
        spacingVars += `}`;

        // Utility Classes
        let utilityClasses = `/* Spacing Utilities */\n`;
        for (let i = 1; i <= state.spacing.steps; i++) {
            utilityClasses += `.p-${i} { padding: var(--${state.spacing.prefix}-${i}); }\n`;
            utilityClasses += `.m-${i} { margin: var(--${state.spacing.prefix}-${i}); }\n`;
        }
        
        // Tailwind Config
        let tailwindSpacing = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      spacing: {\n`;
        for (let i = 1; i <= state.spacing.steps; i++) {
            const rem = (state.spacing.base * Math.pow(state.spacing.multiplier, i - 1)) / 16;
            tailwindSpacing += `        '${i}': '${rem.toFixed(3)}rem',\n`;
        }
        tailwindSpacing += `      }\n    }\n  }\n}`;

        elements.cssVarsOutput.textContent = spacingVars;
        elements.utilityClassesOutput.textContent = utilityClasses;
        elements.tailwindConfigOutput.textContent = tailwindSpacing;
        Prism.highlightAllUnder(page);
    };

    const renderAll = () => {
        renderSpacing();
        renderRadius();
        renderOutputs();
    };

    // --- Event Listeners ---
    const setupListeners = () => {
        // Spacing
        elements.spacingBase.addEventListener('input', (e) => { state.spacing.base = Number(e.target.value); renderAll(); });
        elements.spacingMultiplier.addEventListener('input', (e) => { state.spacing.multiplier = Number(e.target.value); renderAll(); });
        elements.spacingPrefix.addEventListener('input', (e) => { state.spacing.prefix = e.target.value; renderAll(); });

        // Radius
        elements.radiusAll.addEventListener('input', (e) => {
            const val = Number(e.target.value);
            state.radius.isLinked = true;
            state.radius.all = val;
            state.radius.tl = val; state.radius.tr = val;
            state.radius.br = val; state.radius.bl = val;
            renderRadius();
            renderOutputs();
        });

        elements.radiusUnit.addEventListener('change', (e) => { state.radius.unit = e.target.value; renderRadius(); });
        
        Object.keys(elements.cornerInputs).forEach(key => {
            elements.cornerInputs[key].addEventListener('input', (e) => {
                state.radius.isLinked = false;
                state.radius[key] = Number(e.target.value);
                renderRadius();
                renderOutputs();
            });
        });

        elements.copyBtns.forEach(btn => { /* ... unchanged copy logic ... */ });
    };

    // --- INITIALIZATION ---
    setupListeners();
    renderAll();
}