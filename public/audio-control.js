/**
 * Custom Audio Control & Chat Enhancements for Chainlit 2.x
 * - Push-to-talk behavior
 * - Auto-scroll to bottom on new messages
 * - Dynamic message bubble styling fix
 */

(function() {
    'use strict';

    // ===== CONFIGURATION =====
    const CONFIG = {
        scrollBehavior: 'smooth',
        scrollDelay: 100,
        observerThrottle: 50,
        debugMode: false
    };

    // Dark theme colors
    const THEME = {
        assistantBg: 'rgba(30, 41, 59, 0.95)',
        assistantBorder: 'rgba(100, 116, 139, 0.3)',
        textColor: '#e2e8f0',
        userGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };

    // Debug logger
    const log = (...args) => {
        if (CONFIG.debugMode) {
            console.log('[ChatEnhancements]', ...args);
        }
    };

    console.log('[Audio Control] Initializing push-to-talk override...');

    // ===== UTILITY FUNCTIONS =====
    
    function waitForElement(selector, callback, maxAttempts = 50) {
        let attempts = 0;
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                callback(element);
            } else if (++attempts >= maxAttempts) {
                clearInterval(interval);
                log('[Audio Control] Could not find element:', selector);
            }
        }, 100);
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ===== MESSAGE BUBBLE STYLING FIX =====
    
    /**
     * Fix the styling of assistant message bubbles
     */
    function fixMessageBubbleStyles() {
        // Find all step elements (message containers)
        const steps = document.querySelectorAll('.step');
        
        steps.forEach(step => {
            // Check if this is a user message (has bg-accent class)
            const isUserMessage = step.querySelector('.bg-accent') !== null;
            
            if (!isUserMessage) {
                // This is an assistant message - find the bubble container
                const bubbles = step.querySelectorAll('.rounded-2xl, .rounded-xl, .rounded-lg, [class*="rounded"]');
                
                bubbles.forEach(bubble => {
                    // Skip if it's the user message bubble
                    if (bubble.classList.contains('bg-accent')) return;
                    
                    // Check if it looks like a message bubble (has some content)
                    const hasText = bubble.textContent && bubble.textContent.trim().length > 0;
                    const hasProseContent = bubble.querySelector('.prose') !== null;
                    
                    if (hasText || hasProseContent) {
                        // Apply dark styling
                        bubble.style.setProperty('background', THEME.assistantBg, 'important');
                        bubble.style.setProperty('border', `1px solid ${THEME.assistantBorder}`, 'important');
                        bubble.style.setProperty('color', THEME.textColor, 'important');
                        bubble.style.setProperty('backdrop-filter', 'blur(12px)', 'important');
                        bubble.style.setProperty('-webkit-backdrop-filter', 'blur(12px)', 'important');
                        
                        // Also fix text color inside
                        const textElements = bubble.querySelectorAll('p, span, .prose');
                        textElements.forEach(el => {
                            el.style.setProperty('color', THEME.textColor, 'important');
                        });
                    }
                });
            }
        });
    }

    /**
     * Style explanation blocks (mother tongue explanations for corrections)
     */
    function styleExplanationBlocks() {
        const steps = document.querySelectorAll('.step:not([data-step-type="user_message"])');
        steps.forEach(step => {
            const paragraphs = step.querySelectorAll('.prose p');
            paragraphs.forEach(p => {
                if (p.textContent.includes('📝') && !p.classList.contains('explanation-block')) {
                    p.classList.add('explanation-block');
                    log('Styled explanation block:', p.textContent.substring(0, 50));
                }
            });
        });
    }

    /**
     * Initialize MutationObserver to watch for new messages and fix their styles
     */
    function initStyleObserver() {
        const observer = new MutationObserver(throttle((mutations) => {
            let shouldFix = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList?.contains('step') || 
                                node.querySelector?.('.step') ||
                                node.classList?.contains('rounded-2xl') ||
                                node.classList?.contains('rounded-xl')) {
                                shouldFix = true;
                                break;
                            }
                        }
                    }
                }
            }
            
            if (shouldFix) {
                // Small delay to let Chainlit finish rendering
                setTimeout(() => {
                    fixMessageBubbleStyles();
                    styleExplanationBlocks();
                }, 50);
            }
        }, 100));

        // Observe the entire document body for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial fix
        setTimeout(() => {
            fixMessageBubbleStyles();
            styleExplanationBlocks();
        }, 500);
        setTimeout(() => {
            fixMessageBubbleStyles();
            styleExplanationBlocks();
        }, 1000);
        setTimeout(() => {
            fixMessageBubbleStyles();
            styleExplanationBlocks();
        }, 2000);

        log('Style observer initialized');
    }

    // ===== AUDIO CONTROL =====
    
    function overrideAudioBehavior() {
        log('[Audio Control] Looking for audio controls...');

        const possibleSelectors = [
            '[data-testid="microphone-button"]',
            '[aria-label*="microphone" i]',
            '[aria-label*="audio" i]',
            'button[class*="audio" i]',
            'button[class*="mic" i]',
            '.microphone-button',
            '.audio-recorder-button'
        ];

        let foundButton = false;

        possibleSelectors.forEach(selector => {
            waitForElement(selector, (button) => {
                if (foundButton) return;
                foundButton = true;

                log('[Audio Control] Found audio button:', button);

                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes') {
                            log('[Audio Control] Button state changed:', {
                                disabled: button.disabled,
                                classList: Array.from(button.classList),
                                ariaLabel: button.getAttribute('aria-label')
                            });
                        }
                    });
                });

                observer.observe(button, {
                    attributes: true,
                    attributeFilter: ['class', 'aria-label', 'disabled', 'data-recording']
                });

                button.addEventListener('click', () => {
                    log('[Audio Control] Button clicked');
                }, true);
            });
        });

        // Intercept MediaRecorder
        if (window.MediaRecorder) {
            const OriginalMediaRecorder = window.MediaRecorder;

            window.MediaRecorder = function(...args) {
                const recorder = new OriginalMediaRecorder(...args);
                log('[Audio Control] MediaRecorder created');

                const originalStop = recorder.stop.bind(recorder);
                recorder.stop = function() {
                    log('[Audio Control] MediaRecorder.stop() called');
                    return originalStop();
                };

                recorder.addEventListener('start', () => {
                    log('[Audio Control] Recording started');
                });

                recorder.addEventListener('stop', () => {
                    log('[Audio Control] Recording stopped');
                });

                recorder.addEventListener('dataavailable', (e) => {
                    log('[Audio Control] Data available:', e.data.size, 'bytes');
                });

                return recorder;
            };

            Object.setPrototypeOf(window.MediaRecorder, OriginalMediaRecorder);
            window.MediaRecorder.isTypeSupported = OriginalMediaRecorder.isTypeSupported;
        }
    }

    // ===== CHAT ENHANCEMENTS =====

    function findChatContainer() {
        const selectors = [
            '.flex.flex-col.flex-grow.overflow-y-auto',
            '[class*="messages-container"]',
            '[class*="chat-container"]',
            'main [class*="overflow"]',
            '.overflow-y-auto'
        ];

        // First try to find a scrollable container
        for (const selector of selectors) {
            const container = document.querySelector(selector);
            if (container && container.scrollHeight > container.clientHeight) {
                log('Found scrollable chat container:', selector);
                return container;
            }
        }

        // Fallback: find any matching container (even if not scrollable yet)
        for (const selector of selectors) {
            const container = document.querySelector(selector);
            if (container) {
                log('Found chat container (not yet scrollable):', selector);
                return container;
            }
        }

        const main = document.querySelector('main');
        if (main) {
            const scrollable = main.querySelector('[style*="overflow"]') ||
                              main.querySelector('.overflow-auto') ||
                              main.querySelector('.overflow-y-auto');
            if (scrollable) {
                log('Found chat container via fallback');
                return scrollable;
            }
        }

        log('Chat container not found');
        return null;
    }

    function hasRealContent(element) {
        if (!element || element.offsetParent === null) return false;
        if (element.classList?.contains('skeleton-loader')) return false;

        const textContent = element.textContent?.trim();

        // Ignore "Thinking" text variations - they're just placeholders
        if (textContent && textContent.includes('Thinking')) return false;

        if (textContent && textContent.length > 0) return true;
        if (element.querySelector('audio')) return true;

        const prose = element.querySelector('.prose');
        return prose && prose.textContent?.trim().length > 0;
    }

    function createSkeletonLoader() {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loader';
        skeleton.setAttribute('aria-label', 'Loading response...');
        skeleton.setAttribute('role', 'status');

        for (let i = 0; i < 3; i++) {
            const line = document.createElement('div');
            line.className = 'skeleton-line';
            skeleton.appendChild(line);
        }
        return skeleton;
    }

    function initLoadingObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const step = node.classList?.contains('step') ? node : node.querySelector?.('.step');
                            if (step && !hasRealContent(step) && !step.querySelector('.skeleton-loader')) {
                                const container = step.querySelector('.rounded-2xl, .rounded-xl') || step;
                                container.appendChild(createSkeletonLoader());
                            }
                        }
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        log('Loading observer initialized');
        return observer;
    }

    function scrollToBottom(container, smooth = true) {
        if (!container) return;

        const scrollOptions = {
            top: container.scrollHeight,
            behavior: smooth ? CONFIG.scrollBehavior : 'auto'
        };

        try {
            container.scrollTo(scrollOptions);
            log('Scrolled to bottom:', container.scrollHeight);
        } catch (e) {
            container.scrollTop = container.scrollHeight;
        }
    }

    function isNearBottom(container) {
        if (!container) return true;
        
        const threshold = 150;
        const position = container.scrollTop + container.clientHeight;
        const height = container.scrollHeight;
        
        return height - position < threshold;
    }

    function initMessageObserver(container) {
        if (!container) return;

        const observer = new MutationObserver(throttle((mutations) => {
            let hasNewRealContent = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const step = node.classList?.contains('step') ? node : node.querySelector?.('.step');
                            if (step && hasRealContent(step)) {
                                hasNewRealContent = true;
                                // Remove skeleton if present
                                const skeleton = step.querySelector('.skeleton-loader');
                                if (skeleton) skeleton.remove();
                                break;
                            }
                        }
                    }
                }

                if (mutation.type === 'characterData' && mutation.target.textContent?.trim()) {
                    hasNewRealContent = true;
                }
            }

            // Clean up all skeletons when new real content appears
            if (hasNewRealContent) {
                const allSkeletons = container.querySelectorAll('.skeleton-loader');
                allSkeletons.forEach(skeleton => skeleton.remove());
            }

            if (hasNewRealContent && isNearBottom(container)) {
                setTimeout(() => scrollToBottom(container), CONFIG.scrollDelay);
            }
        }, CONFIG.observerThrottle));

        observer.observe(container, {
            childList: true,
            subtree: true,
            characterData: true
        });

        log('Smart message observer initialized');
        return observer;
    }

    function addScrollButton(container) {
        if (!container) return;
        if (document.querySelector('.scroll-to-bottom-btn')) return;

        const button = document.createElement('button');
        button.className = 'scroll-to-bottom-btn';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;
        button.setAttribute('aria-label', 'Scroll to bottom');
        button.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 24px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            z-index: 99;
        `;

        button.addEventListener('click', () => {
            scrollToBottom(container, true);
        });

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
        });

        document.body.appendChild(button);

        container.addEventListener('scroll', throttle(() => {
            if (isNearBottom(container)) {
                button.style.display = 'none';
            } else {
                button.style.display = 'flex';
            }
        }, 100));

        log('Scroll button added');
    }

    function initChatEnhancements() {
        log('Initializing chat enhancements...');

        const initWithRetry = (attempts = 0) => {
            const container = findChatContainer();
            
            if (container) {
                initMessageObserver(container);
                addScrollButton(container);
                setTimeout(() => scrollToBottom(container, false), 500);
                log('Chat enhancements initialized successfully');
            } else if (attempts < 10) {
                setTimeout(() => initWithRetry(attempts + 1), 500);
            } else {
                log('Failed to initialize after 10 attempts');
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => initWithRetry());
        } else {
            initWithRetry();
        }
    }

    // ===== TRANSLATION WIDGET =====

    /**
     * Translation Widget State & Configuration
     */
    const TranslationWidget = {
        state: {
            targetLanguage: 'ES',      // DeepL code for target language
            motherTongue: 'EN',         // DeepL code for mother tongue
            direction: 'forward',       // 'forward' (mother → target) or 'reverse' (target → mother)
            isExpanded: false,
            debounceTimer: null
        },
        elements: {
            toggleButton: null,
            widget: null,
            input: null,
            output: null,
            directionIndicator: null
        }
    };

    /**
     * Load translation preferences from localStorage
     */
    function loadTranslationPreferences() {
        const stored = localStorage.getItem('translation_prefs');
        if (stored) {
            try {
                const prefs = JSON.parse(stored);
                TranslationWidget.state.targetLanguage = prefs.targetLanguage || 'ES';
                TranslationWidget.state.motherTongue = prefs.motherTongue || 'EN';
                TranslationWidget.state.direction = prefs.direction || 'forward';
                log('Translation preferences loaded:', prefs);
            } catch (e) {
                log('Error loading translation preferences:', e);
            }
        }
    }

    /**
     * Save translation preferences to localStorage
     */
    function saveTranslationPreferences() {
        const prefs = {
            targetLanguage: TranslationWidget.state.targetLanguage,
            motherTongue: TranslationWidget.state.motherTongue,
            direction: TranslationWidget.state.direction
        };
        localStorage.setItem('translation_prefs', JSON.stringify(prefs));
        log('Translation preferences saved:', prefs);
    }

    /**
     * Fetch language configuration from backend
     */
    async function fetchLanguageConfig() {
        try {
            const response = await fetch('http://localhost:8000/api/language-config');
            if (!response.ok) throw new Error('Failed to fetch language config');
            const config = await response.json();

            // Set defaults if not already set
            if (!localStorage.getItem('translation_prefs')) {
                TranslationWidget.state.targetLanguage = config.target_languages[config.defaults.target_language]?.deepl_code || 'ES';
                TranslationWidget.state.motherTongue = config.mother_tongues[config.defaults.mother_tongue]?.deepl_code || 'EN';
                saveTranslationPreferences();
            }

            log('Language config fetched:', config);
            return config;
        } catch (e) {
            log('Error fetching language config:', e);
            return null;
        }
    }

    /**
     * Get current translation direction and languages
     */
    function getTranslationDirection() {
        if (TranslationWidget.state.direction === 'forward') {
            return {
                from: TranslationWidget.state.motherTongue,
                to: TranslationWidget.state.targetLanguage,
                label: `${TranslationWidget.state.motherTongue} → ${TranslationWidget.state.targetLanguage}`
            };
        } else {
            return {
                from: TranslationWidget.state.targetLanguage,
                to: TranslationWidget.state.motherTongue,
                label: `${TranslationWidget.state.targetLanguage} → ${TranslationWidget.state.motherTongue}`
            };
        }
    }

    /**
     * Fetch translation from API
     */
    async function fetchTranslation(text, targetLang) {
        if (!text || !text.trim()) return '';

        try {
            const response = await fetch(`http://localhost:8000/api/translate?text=${encodeURIComponent(text)}&target_lang=${targetLang}`);
            if (!response.ok) throw new Error('Translation failed');

            const data = await response.json();
            return data.translation;
        } catch (e) {
            log('Translation error:', e);
            return 'Translation error';
        }
    }

    /**
     * Handle translation input with debouncing
     */
    function handleTranslationInput() {
        const input = TranslationWidget.elements.input;
        const output = TranslationWidget.elements.output;

        if (!input || !output) return;

        // Clear previous timer
        if (TranslationWidget.state.debounceTimer) {
            clearTimeout(TranslationWidget.state.debounceTimer);
        }

        const text = input.value.trim();

        if (!text) {
            output.textContent = '';
            return;
        }

        // Show loading indicator
        output.textContent = 'Translating...';
        output.style.opacity = '0.6';

        // Debounce translation
        TranslationWidget.state.debounceTimer = setTimeout(async () => {
            const direction = getTranslationDirection();
            const translation = await fetchTranslation(text, direction.to);

            output.textContent = translation;
            output.style.opacity = '1';
        }, 300);
    }

    /**
     * Toggle translation direction
     */
    function toggleTranslationDirection() {
        TranslationWidget.state.direction =
            TranslationWidget.state.direction === 'forward' ? 'reverse' : 'forward';

        saveTranslationPreferences();
        updateDirectionIndicator();

        // Re-translate if there's text
        if (TranslationWidget.elements.input && TranslationWidget.elements.input.value.trim()) {
            handleTranslationInput();
        }
    }

    /**
     * Update direction indicator text
     */
    function updateDirectionIndicator() {
        if (TranslationWidget.elements.directionIndicator) {
            const direction = getTranslationDirection();
            TranslationWidget.elements.directionIndicator.textContent = direction.label;
        }
    }

    /**
     * Copy translation to clipboard
     */
    async function copyTranslation() {
        const output = TranslationWidget.elements.output;
        if (!output || !output.textContent) return;

        try {
            await navigator.clipboard.writeText(output.textContent);

            // Show feedback
            const originalText = output.textContent;
            output.textContent = '✓ Copied!';
            setTimeout(() => {
                output.textContent = originalText;
            }, 1500);
        } catch (e) {
            log('Copy failed:', e);
        }
    }

    /**
     * Toggle translation panel visibility
     */
    function toggleTranslationWidget() {
        const panel = TranslationWidget.elements.widget;
        const toggleButton = TranslationWidget.elements.toggleButton;

        if (!panel) return;

        TranslationWidget.state.isExpanded = !TranslationWidget.state.isExpanded;

        if (TranslationWidget.state.isExpanded) {
            panel.classList.remove('collapsed');
            toggleButton?.classList.add('active');
            // Focus input
            setTimeout(() => {
                if (TranslationWidget.elements.input) {
                    TranslationWidget.elements.input.focus();
                }
            }, 100);
        } else {
            panel.classList.add('collapsed');
            toggleButton?.classList.remove('active');
        }
    }

    /**
     * Find button toolbar in input container
     */
    function findButtonToolbar(inputContainer) {
        // Look for the button toolbar (contains send button, mic button, etc.)
        const possibleToolbars = [
            inputContainer.querySelector('.flex.gap-2'),
            inputContainer.querySelector('[class*="flex"][class*="gap"]'),
            inputContainer.querySelector('div:has(button[type="submit"])')
        ];

        for (const toolbar of possibleToolbars) {
            if (toolbar && toolbar.querySelector('button')) {
                return toolbar;
            }
        }

        return null;
    }

    /**
     * Create translation widget UI (integrated into message box)
     */
    function createTranslationWidget() {
        // Check if widget already exists
        if (document.querySelector('.translation-panel')) {
            log('Translation widget already exists');
            return;
        }

        // Find the message box input container (look for the one with textarea)
        const inputContainer = document.querySelector('.flex.flex-col.gap-2:has(textarea)') ||
                              document.querySelector('[class*="flex"][class*="flex-col"]:has(textarea)');
        if (!inputContainer) {
            log('Input container not found - will retry later');
            return;
        }

        // Create toggle button for toolbar (🌐)
        const toggleButton = document.createElement('button');
        toggleButton.className = 'translation-toggle-inline';
        toggleButton.innerHTML = '🌐';
        toggleButton.setAttribute('aria-label', 'Toggle translation helper');
        toggleButton.addEventListener('click', toggleTranslationWidget);

        // Create expandable translation panel
        const panel = document.createElement('div');
        panel.className = 'translation-panel collapsed';

        // Header with direction and controls
        const header = document.createElement('div');
        header.className = 'translation-header';

        const directionIndicator = document.createElement('span');
        directionIndicator.className = 'translation-direction';
        const direction = getTranslationDirection();
        directionIndicator.textContent = direction.label;

        const swapButton = document.createElement('button');
        swapButton.className = 'translation-swap';
        swapButton.innerHTML = '⇄';
        swapButton.setAttribute('aria-label', 'Swap translation direction');
        swapButton.addEventListener('click', toggleTranslationDirection);

        header.appendChild(directionIndicator);
        header.appendChild(swapButton);

        // Input field
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'translation-input';
        input.placeholder = 'Type to translate...';
        input.addEventListener('input', handleTranslationInput);

        // Output area
        const output = document.createElement('div');
        output.className = 'translation-output';
        output.textContent = '';

        // Actions (Copy button)
        const actions = document.createElement('div');
        actions.className = 'translation-actions';

        const copyButton = document.createElement('button');
        copyButton.className = 'translation-copy';
        copyButton.innerHTML = '📋 Copy';
        copyButton.addEventListener('click', copyTranslation);

        actions.appendChild(copyButton);

        // Assemble panel
        panel.appendChild(header);
        panel.appendChild(input);
        panel.appendChild(output);
        panel.appendChild(actions);

        // Insert panel at top of input container
        inputContainer.insertBefore(panel, inputContainer.firstChild);

        // Insert toggle button into toolbar
        const toolbar = findButtonToolbar(inputContainer);
        if (toolbar) {
            toolbar.insertBefore(toggleButton, toolbar.firstChild);
            log('Toggle button inserted into toolbar');
        } else {
            // Fallback: append to input container if toolbar not found
            inputContainer.insertBefore(toggleButton, panel);
            log('Toggle button inserted as fallback');
        }

        // Store references
        TranslationWidget.elements.toggleButton = toggleButton;
        TranslationWidget.elements.widget = panel;
        TranslationWidget.elements.input = input;
        TranslationWidget.elements.output = output;
        TranslationWidget.elements.directionIndicator = directionIndicator;

        log('Translation widget created (inline mode)');
    }

    /**
     * Handle keyboard shortcuts
     */
    function initTranslationKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+T to open/focus translation widget
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();

                if (!TranslationWidget.state.isExpanded) {
                    toggleTranslationWidget();
                } else if (TranslationWidget.elements.input) {
                    TranslationWidget.elements.input.focus();
                }
            }
        });

        log('Translation keyboard shortcuts initialized');
    }

    /**
     * Observe settings sync messages from backend
     */
    function initSettingsSyncObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Look for elements with settings_sync metadata
                            const checkForSettingsSync = (element) => {
                                // Check if this element or its children contain settings sync data
                                const metadataElements = element.querySelectorAll('[data-metadata]');

                                metadataElements.forEach(metaEl => {
                                    try {
                                        const metadata = JSON.parse(metaEl.dataset.metadata || '{}');

                                        if (metadata.type === 'settings_sync') {
                                            log('Settings sync detected:', metadata);

                                            // Update translation state
                                            if (metadata.target_deepl_code) {
                                                TranslationWidget.state.targetLanguage = metadata.target_deepl_code;
                                            }
                                            if (metadata.mother_deepl_code) {
                                                TranslationWidget.state.motherTongue = metadata.mother_deepl_code;
                                            }

                                            saveTranslationPreferences();
                                            updateDirectionIndicator();
                                        }
                                    } catch (e) {
                                        // Not valid JSON or no metadata
                                    }
                                });
                            };

                            checkForSettingsSync(node);
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        log('Settings sync observer initialized');
    }

    /**
     * Initialize translation widget
     */
    async function initTranslationWidget() {
        log('Initializing translation widget...');

        // Load preferences
        loadTranslationPreferences();

        // Fetch config from backend
        await fetchLanguageConfig();

        // Create UI with retry logic
        const createWithRetry = (attempts = 0) => {
            const inputContainer = document.querySelector('.flex.flex-col.gap-2:has(textarea)') ||
                                  document.querySelector('[class*="flex"][class*="flex-col"]:has(textarea)');

            if (inputContainer) {
                createTranslationWidget();
                log('Translation widget created successfully');
            } else if (attempts < 10) {
                log(`Input container not found, retry ${attempts + 1}/10`);
                setTimeout(() => createWithRetry(attempts + 1), 500);
            } else {
                log('Failed to create translation widget after 10 attempts');
            }
        };

        createWithRetry();

        // Set up keyboard shortcuts
        initTranslationKeyboardShortcuts();

        // Set up settings sync observer
        initSettingsSyncObserver();

        log('Translation widget initialized');
    }

    // ===== INITIALIZATION =====

    // Initialize audio control
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', overrideAudioBehavior);
    } else {
        overrideAudioBehavior();
    }

    // Retry audio control after delays
    setTimeout(overrideAudioBehavior, 2000);
    setTimeout(overrideAudioBehavior, 5000);

    // Initialize chat enhancements
    initChatEnhancements();

    // Initialize style observer for message bubbles
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStyleObserver);
    } else {
        initStyleObserver();
    }

    // Initialize translation widget
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTranslationWidget);
    } else {
        initTranslationWidget();
    }

    // Initialize loading/skeleton observer
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoadingObserver);
    } else {
        initLoadingObserver();
    }

    // Re-initialize on page navigation (for SPA)
    window.addEventListener('popstate', () => {
        setTimeout(initChatEnhancements, 500);
        setTimeout(initStyleObserver, 500);
    });

    console.log('[Audio Control] Script loaded');

})();
