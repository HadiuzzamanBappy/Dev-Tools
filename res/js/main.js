// main.js

// Import the initializer functions from other modules
import { initializeDashboard } from './dashboard.js';
import { initializeSnippetApp } from './snippet.js';
import { initializeFontPreviewer } from './font.js';
import { initializeColorPalette } from './color.js';
import { initializeLayoutVisualizer } from './layout.js';
import { initializeComponentTester } from './tester.js';
import { initializeMetaTagPreviewer } from './meta.js';
import { initializeGradientMaker } from './gradient.js';
import { initializeTypeScaleVisualizer } from './typescale.js';
import { initializeBoxShadowGenerator } from './shadow.js';
import { initializeUnitSystemGenerator } from './units.js';
import { initializeUtilityBuilder } from './utility.js';

// This function runs once the entire HTML document is ready.
function onDOMLoaded() {
    const mainContent = document.getElementById('main-content');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const themeToggle = document.getElementById('theme-toggle');
    const pages = document.querySelectorAll('.page');

    // ** THE FIX IS HERE **
    // Instead of selecting all .nav-link elements on the entire page,
    // we ONLY select the ones that are direct children of the #sidebar's navigation list.
    // This prevents conflicts with Bootstrap tabs inside your tools.
    const navLinks = sidebar.querySelectorAll('.sidebar-nav .nav-link');

    // --- THEME SWITCHING ---
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') document.body.classList.add('dark-mode');
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    // --- LAZY INITIALIZATION FOR TOOLS ---
    function initializeTool(toolId) {
        const page = document.getElementById(toolId);
        if (page && !page.dataset.initialized) {
            switch (toolId) {
                case 'dashboard':
                    initializeDashboard();
                    break;
                case 'css-snippets':
                    initializeSnippetApp();
                    break;
                case 'font-previewer':
                    initializeFontPreviewer();
                    break;
                case 'color-palette':
                    initializeColorPalette();
                    break;
                case 'spacing-visualizer':
                    initializeLayoutVisualizer();
                    break;
                case 'component-tester':
                    initializeComponentTester();
                    break;
                case 'meta-tag-preview':
                    initializeMetaTagPreviewer();
                    break;
                case 'gradient-maker':
                    initializeGradientMaker();
                    break;
                case 'typescale-visualizer':
                    initializeTypeScaleVisualizer();
                    break;
                case 'box-shadow-generator':
                    initializeBoxShadowGenerator();
                    break;
                case 'unit-system-generator':
                    initializeUnitSystemGenerator();
                    break;
                case 'css-utility-builder':
                    initializeUtilityBuilder();
                    break;
            }
            // Mark the page as initialized so the script doesn't run again
            page.dataset.initialized = 'true';
        }
    }

    // --- NAVIGATION LOGIC ---
    function switchPage(targetId) {
        pages.forEach(page => page.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));
        
        const targetPage = document.getElementById(targetId);
        const targetLink = sidebar.querySelector(`.nav-link[data-target="${targetId}"]`);

        if (targetPage) {
            targetPage.classList.add('active');
            initializeTool(targetId);
        }
        if (targetLink) targetLink.classList.add('active');
        if (window.innerWidth <= 992) sidebar.classList.remove('show');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            switchPage(targetId);
            window.location.hash = targetId;
        });
    });

    // --- MOBILE & INITIAL PAGE SETUP ---
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('show'));
    mainContent.addEventListener('click', () => {
        if (window.innerWidth <= 992 && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }
    });

    const initialPage = window.location.hash.substring(1) || 'dashboard';
    switchPage(initialPage);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMLoaded);
} else {
    onDOMLoaded();
}