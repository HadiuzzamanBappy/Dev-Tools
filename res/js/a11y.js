// a11y.js

export function initializeA11yChecker() {
    const page = document.getElementById('a11y-checker');
    if (!page) return;

    // --- DOM Elements ---
    const elements = {
        urlInput: page.querySelector('#a11y-url-input'),
        codeInput: page.querySelector('#a11y-code-input'),
        runBtn: page.querySelector('#run-a11y-check-btn'),
        resultsContainer: page.querySelector('#a11y-results-container'),
        placeholder: page.querySelector('#a11y-placeholder'),
        loadingSpinner: page.querySelector('#a11y-loading-spinner'),
        activeTab: () => page.querySelector('#a11y-tab .active')?.id,
    };

    // --- Core Logic ---

    const renderResults = (results) => {
        elements.placeholder.style.display = 'none';
        elements.resultsContainer.innerHTML = ''; // Clear previous results

        const { violations } = results;
        if (violations.length === 0) {
            elements.resultsContainer.innerHTML = `
                <div class="text-center text-success p-5">
                    <i class="fa-solid fa-check-circle fa-3x mb-3"></i>
                    <h4>Fantastic! No accessibility violations were found.</h4>
                </div>`;
            return;
        }

        const severities = { critical: [], serious: [], moderate: [], minor: [] };
        violations.forEach(v => severities[v.impact]?.push(v));

        const accordion = document.createElement('div');
        accordion.className = 'accordion a11y-results-accordion';
        accordion.id = 'resultsAccordion';

        Object.keys(severities).forEach((level, index) => {
            const issues = severities[level];
            if (issues.length === 0) return;

            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';
            const levelCapitalized = level.charAt(0).toUpperCase() + level.slice(1);
            
            accordionItem.innerHTML = `
                <h2 class="accordion-header" id="heading-${level}">
                    <button class="accordion-button ${index > 1 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${level}">
                        ${levelCapitalized} Violations <span class="badge bg-danger ms-2">${issues.length}</span>
                    </button>
                </h2>
                <div id="collapse-${level}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#resultsAccordion">
                    <div class="accordion-body"></div>
                </div>`;

            const body = accordionItem.querySelector('.accordion-body');
            issues.forEach(issue => {
                const issueCard = document.createElement('div');
                issueCard.className = 'violation-card';
                // Use innerText to safely display the HTML, preventing it from being rendered
                const safeHtml = document.createElement('div');
                safeHtml.innerText = issue.nodes[0].html;

                issueCard.innerHTML = `
                    <div class="violation-card-body">
                        <h6>${issue.help}</h6>
                        <p>${issue.description}</p>
                        <p class="mb-0"><strong>Element:</strong> <code>${safeHtml.innerHTML}</code></p>
                    </div>
                    <div class="violation-card-footer">
                        <a href="${issue.helpUrl}" target="_blank" rel="noopener noreferrer">Learn More <i class="fa-solid fa-external-link-alt ms-1"></i></a>
                    </div>`;
                body.appendChild(issueCard);
            });
            accordion.appendChild(accordionItem);
        });

        elements.resultsContainer.appendChild(accordion);
    };

    const runCheck = async () => {
        const mode = elements.activeTab();
        elements.placeholder.style.display = 'none';
        elements.resultsContainer.innerHTML = '';
        elements.loadingSpinner.style.display = 'block';
        elements.runBtn.disabled = true;

        try {
            let context = null;
            if (mode === 'url-tab') {
                let url = elements.urlInput.value.trim();
                if (!url) { alert("Please enter a URL."); throw new Error("URL is empty"); }
                if (!url.startsWith('http')) url = `https://${url}`;
                
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const html = await response.text();
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                context = tempDiv; // Axe will run on this DOM element

            } else { // Code Snippet mode
                const code = elements.codeInput.value.trim();
                if (!code) { alert("Please enter an HTML snippet."); throw new Error("Code is empty"); }
                
                // ** THE FIX IS HERE **
                // Instead of passing a string, we create a temporary element
                // and pass that element to axe.run(), just like in the URL check.
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = code;
                context = tempDiv; // Axe will run on this DOM element
            }

            // Safety check
            if (!context) throw new Error("Analysis context could not be created.");

            const results = await axe.run(context);
            renderResults(results);

        } catch (error) {
            console.error("A11y Check Error:", error);
            elements.resultsContainer.innerHTML = `
                <div class="text-center text-danger p-5">
                    <i class="fa-solid fa-exclamation-triangle fa-3x mb-3"></i>
                    <h4>Check Failed</h4>
                    <p>Could not analyze the target. For URLs, ensure the site is available and not blocking requests. For code, ensure it is valid HTML.</p>
                </div>`;
        } finally {
            elements.loadingSpinner.style.display = 'none';
            elements.runBtn.disabled = false;
        }
    };
    
    // --- EVENT LISTENERS ---
    elements.runBtn.addEventListener('click', runCheck);
}