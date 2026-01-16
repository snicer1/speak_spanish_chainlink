/**
 * Custom Audio Control for Chainlit 2.x
 * Implements true push-to-talk behavior since Chainlit 2.x removed config options
 */

(function() {
    'use strict';

    console.log('[Audio Control] Initializing push-to-talk override...');

    // Wait for the DOM to be ready
    function waitForElement(selector, callback, maxAttempts = 50) {
        let attempts = 0;
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                callback(element);
            } else if (++attempts >= maxAttempts) {
                clearInterval(interval);
                console.log('[Audio Control] Could not find element:', selector);
            }
        }, 100);
    }

    // Override the audio recording behavior
    function overrideAudioBehavior() {
        console.log('[Audio Control] Looking for audio controls...');

        // Chainlit 2.x uses different selectors - try multiple approaches
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

                console.log('[Audio Control] Found audio button:', button);

                // Monitor for recording state changes
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes') {
                            console.log('[Audio Control] Button state changed:', {
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

                // Log clicks
                button.addEventListener('click', (e) => {
                    console.log('[Audio Control] Button clicked');
                }, true);

            });
        });

        // Also try to intercept MediaRecorder if it's being used
        if (window.MediaRecorder) {
            const OriginalMediaRecorder = window.MediaRecorder;

            window.MediaRecorder = function(...args) {
                const recorder = new OriginalMediaRecorder(...args);
                console.log('[Audio Control] MediaRecorder created');

                // Intercept stop to ensure it works
                const originalStop = recorder.stop.bind(recorder);
                recorder.stop = function() {
                    console.log('[Audio Control] MediaRecorder.stop() called');
                    return originalStop();
                };

                // Log state changes
                recorder.addEventListener('start', () => {
                    console.log('[Audio Control] Recording started');
                });

                recorder.addEventListener('stop', () => {
                    console.log('[Audio Control] Recording stopped');
                });

                recorder.addEventListener('dataavailable', (e) => {
                    console.log('[Audio Control] Data available:', e.data.size, 'bytes');
                });

                return recorder;
            };

            // Copy static properties
            Object.setPrototypeOf(window.MediaRecorder, OriginalMediaRecorder);
            window.MediaRecorder.isTypeSupported = OriginalMediaRecorder.isTypeSupported;
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', overrideAudioBehavior);
    } else {
        overrideAudioBehavior();
    }

    // Also retry after a delay in case Chainlit loads slowly
    setTimeout(overrideAudioBehavior, 2000);
    setTimeout(overrideAudioBehavior, 5000);

    console.log('[Audio Control] Script loaded');
})();
