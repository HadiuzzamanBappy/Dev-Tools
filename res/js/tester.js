// tester.js

export function initializeComponentTester() {
    const page = document.getElementById('component-tester');
    if (!page) return;

    // --- Default Code Snippets ---
    const defaultHTML = 
`<div class="card">
  <h2>Welcome to the Sandbox!</h2>
  <p>Start typing your HTML here.</p>
  <button id="my-button" class="btn">Click Me</button>
</div>`;

    const defaultCSS = 
`body { 
  font-family: sans-serif;
  display: grid;
  place-items: center;
  height: 100vh;
  margin: 0;
}
.card {
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  text-align: center;
}
.btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
}`;

    const defaultJS = 
`const button = document.getElementById('my-button');
button.addEventListener('click', () => {
  alert('Hello from the sandbox!');
});`;

    // --- DOM Elements ---
    const elements = {
        htmlEditor: page.querySelector('#html-editor'),
        cssEditor: page.querySelector('#css-editor'),
        jsEditor: page.querySelector('#js-editor'),
        previewFrame: page.querySelector('#tester-preview-iframe'),
        themeSelect: page.querySelector('#tester-theme-select'),
        responsiveBtns: page.querySelectorAll('.responsive-btn'),
    };

    // --- CodeMirror Editor Initialization ---
    const createEditor = (element, mode, value) => {
        return CodeMirror(element, {
            value: value,
            mode: mode,
            theme: 'one-dark',
            lineNumbers: true,
            lineWrapping: true,
            autofocus: mode === 'html',
            extraKeys: {"Ctrl-Space": "autocomplete"},
            gutters: ["CodeMirror-linenumbers"],
        });
    };
    
    const htmlEditor = createEditor(elements.htmlEditor, 'xml', defaultHTML);
    const cssEditor = createEditor(elements.cssEditor, 'css', defaultCSS);
    const jsEditor = createEditor(elements.jsEditor, 'javascript', defaultJS);

    // --- Core Logic ---
    const updatePreview = () => {
        const htmlCode = htmlEditor.getValue();
        const cssCode = cssEditor.getValue();
        const jsCode = jsEditor.getValue();
        const selectedTheme = elements.themeSelect.value;
        
        let themeLink = '';
        if (selectedTheme === 'dark') {
            themeLink = `<style>body { background-color: #1f2937; color: #f9fafb; }</style>`;
        } else if (selectedTheme === 'bootstrap') {
            themeLink = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">`;
        }

        const sourceDoc = `
            <!DOCTYPE html>
            <html>
            <head>
                ${themeLink}
                <style>${cssCode}</style>
            </head>
            <body>
                ${htmlCode}
                <script>${jsCode}<\/script>
            </body>
            </html>
        `;
        
        const preview = elements.previewFrame;
        preview.srcdoc = sourceDoc;
    };

    // --- Event Listeners ---
    const setupListeners = () => {
        // Use a debounce function to avoid updating on every single keystroke
        let debounceTimeout;
        const debouncedUpdate = () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(updatePreview, 300); // 300ms delay
        };

        htmlEditor.on('change', debouncedUpdate);
        cssEditor.on('change', debouncedUpdate);
        jsEditor.on('change', debouncedUpdate);
        
        elements.themeSelect.addEventListener('change', updatePreview);
        
        elements.responsiveBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.responsiveBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                elements.previewFrame.style.width = btn.dataset.width;
            });
        });
    };
    
    // --- INITIALIZATION ---
    setupListeners();
    updatePreview(); // Initial render
}