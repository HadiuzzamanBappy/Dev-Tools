export function initializeGradientMaker() {
    const page = document.getElementById('gradient-maker');
    if (!page) return;

    // --- DOM Elements ---
    const elements = {
        canvas: page.querySelector('#gradient-canvas-preview'),
        noiseOverlay: page.querySelector('#gradient-noise-overlay'),
        gradientBarWrapper: page.querySelector('.gradient-bar-wrapper'),
        gradientBar: page.querySelector('.gradient-bar'),
        angleDialWrapper: page.querySelector('.angle-dial-wrapper'),
        angleDialHandle: page.querySelector('#angle-dial-handle'),
        angleDialLine: page.querySelector('#angle-dial-line'),
        angleValue: page.querySelector('#angle-value'),
        stopColorPicker: page.querySelector('#gradient-stop-color'),
        removeStopBtn: page.querySelector('#remove-stop-btn'),
        cssOutput: page.querySelector('#gradient-css-output'),
        copyCssBtn: page.querySelector('#copy-gradient-css-btn'),
        randomizeBtn: page.querySelector('#randomize-gradient-btn'),
        noiseToggle: page.querySelector('#gradient-noise-toggle'),
        typeSelect: page.querySelector('#gradient-type-select'),
    };

    // --- State Management ---
    let state = {
        type: 'linear-gradient',
        angle: 90,
        stops: [
            { id: Date.now() + 1, color: '#ff7e5f', position: 0 },
            { id: Date.now() + 2, color: '#feb47b', position: 100 },
        ],
        activeStopId: null,
    };
    state.activeStopId = state.stops[0].id; // Set initial active stop

    // --- Core Functions ---
    const generateCSS = () => {
        const sortedStops = [...state.stops].sort((a, b) => a.position - b.position);
        const colorStopsString = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');

        let css;
        switch (state.type) {
            case 'linear-gradient': css = `linear-gradient(${state.angle}deg, ${colorStopsString})`; break;
            case 'radial-gradient': css = `radial-gradient(circle, ${colorStopsString})`; break;
            case 'conic-gradient': css = `conic-gradient(from ${state.angle}deg at center, ${colorStopsString})`; break;
        }
        return `background: ${css};`;
    };

    const render = () => {
        const css = generateCSS();
        elements.canvas.style.cssText = css;
        elements.gradientBar.style.background = `linear-gradient(90deg, ${[...state.stops].sort((a, b) => a.position - b.position).map(s => s.color).join(', ')})`;

        // Render stops
        elements.gradientBarWrapper.querySelectorAll('.gradient-stop').forEach(s => s.remove());
        state.stops.forEach(stop => {
            const stopEl = document.createElement('div');
            stopEl.className = 'gradient-stop';
            stopEl.dataset.id = stop.id;
            stopEl.style.left = `${stop.position}%`;
            stopEl.style.borderColor = stop.color;
            if (stop.id === state.activeStopId) {
                stopEl.classList.add('active');
                elements.stopColorPicker.value = stop.color;
            }
            elements.gradientBarWrapper.appendChild(stopEl);
        });

        // ** CORRECTED ANGLE DIAL LOGIC **
        const radius = elements.angleDialWrapper.offsetWidth / 2;
        const handleRadius = elements.angleDialHandle.offsetWidth / 2;
        // Convert angle to radians, adjusting for CSS's 0deg-at-top
        const angleRad = (state.angle - 90) * (Math.PI / 180);
        const x = radius + (radius - handleRadius) * Math.cos(angleRad) - handleRadius;
        const y = radius + (radius - handleRadius) * Math.sin(angleRad) - handleRadius;
        elements.angleDialHandle.style.transform = `translate(${x}px, ${y}px)`;
        elements.angleDialLine.style.transform = `rotate(${state.angle}deg)`;
        elements.angleValue.textContent = `${state.angle}°`;

        elements.cssOutput.value = generateCSS();
        elements.removeStopBtn.disabled = state.stops.length <= 2;
    };

    // --- Event Handlers ---
    const setupListeners = () => {
        elements.typeSelect.addEventListener('change', (e) => { state.type = e.target.value; render(); });

        elements.gradientBar.addEventListener('click', (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const position = ((e.clientX - rect.left) / rect.width) * 100;
            const newStop = { id: Date.now(), color: '#ffffff', position: Math.round(position) };
            state.stops.push(newStop);
            state.activeStopId = newStop.id;
            render();
        });

        elements.gradientBarWrapper.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('gradient-stop')) {
                state.activeStopId = Number(e.target.dataset.id);
                render();

                const onMouseMove = (moveEvent) => {
                    const rect = elements.gradientBar.getBoundingClientRect();
                    let newPos = ((moveEvent.clientX - rect.left) / rect.width) * 100;
                    newPos = Math.max(0, Math.min(100, newPos)); // Clamp between 0 and 100
                    const stop = state.stops.find(s => s.id === state.activeStopId);
                    if (stop) {
                        stop.position = Math.round(newPos);
                        render();
                    }
                };
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }
        });

        elements.stopColorPicker.addEventListener('input', (e) => {
            const activeStop = state.stops.find(s => s.id === state.activeStopId);
            if (activeStop) {
                activeStop.color = e.target.value;
                render();
            }
        });

        elements.removeStopBtn.addEventListener('click', () => {
            if (state.stops.length > 2) {
                state.stops = state.stops.filter(s => s.id !== state.activeStopId);
                state.activeStopId = state.stops[0].id;
                render();
            }
        });

        elements.angleDialWrapper.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const rect = elements.angleDialWrapper.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const onMouseMove = (moveEvent) => {
                const angleRad = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
                let angleDeg = Math.round(angleRad * (180 / Math.PI)) + 90;
                if (angleDeg < 0) angleDeg += 360;
                state.angle = angleDeg % 360;
                render();
            };
            const onMouseUp = () => document.removeEventListener('mousemove', onMouseMove);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp, { once: true });
        });

        elements.noiseToggle.addEventListener('change', (e) => { elements.noiseOverlay.style.display = e.target.checked ? 'block' : 'none'; });

        elements.randomizeBtn.addEventListener('click', () => {
            state.stops = [
                { id: Date.now() + 1, color: chroma.random().hex(), position: 0 },
                { id: Date.now() + 2, color: chroma.random().hex(), position: 100 },
            ];
            state.activeStopId = state.stops[0].id;
            state.angle = Math.floor(Math.random() * 360);
            render();
        });

        // ** THIS IS THE CORRECTED AND ADDED PART **
        elements.copyCssBtn.addEventListener('click', () => {
            if (elements.cssOutput.value) {
                navigator.clipboard.writeText(elements.cssOutput.value).then(() => {
                    const originalHTML = elements.copyCssBtn.innerHTML;
                    elements.copyCssBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                    setTimeout(() => { elements.copyCssBtn.innerHTML = originalHTML; }, 2000);
                });
            }
        });
    };

    // --- INITIALIZATION ---
    setupListeners();
    render();
}