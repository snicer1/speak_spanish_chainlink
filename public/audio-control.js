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
                setTimeout(fixMessageBubbleStyles, 50);
            }
        }, 100));

        // Observe the entire document body for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial fix
        setTimeout(fixMessageBubbleStyles, 500);
        setTimeout(fixMessageBubbleStyles, 1000);
        setTimeout(fixMessageBubbleStyles, 2000);

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

                button.addEventListener('click', (e) => {
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

        for (const selector of selectors) {
            const container = document.querySelector(selector);
            if (container && container.scrollHeight > container.clientHeight) {
                log('Found chat container with selector:', selector);
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
            let hasNewContent = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList?.contains('step') || 
                                node.querySelector?.('.step') ||
                                node.classList?.contains('message') ||
                                node.querySelector?.('.message')) {
                                hasNewContent = true;
                                break;
                            }
                        }
                    }
                }
                
                if (mutation.type === 'characterData') {
                    hasNewContent = true;
                }
            }

            if (hasNewContent && isNearBottom(container)) {
                setTimeout(() => scrollToBottom(container), CONFIG.scrollDelay);
            }
        }, CONFIG.observerThrottle));

        observer.observe(container, {
            childList: true,
            subtree: true,
            characterData: true
        });

        log('Message observer initialized');
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

    // Re-initialize on page navigation (for SPA)
    window.addEventListener('popstate', () => {
        setTimeout(initChatEnhancements, 500);
        setTimeout(initStyleObserver, 500);
    });

    console.log('[Audio Control] Script loaded');

})();
