// DOM Inspector for Chainlit Message Elements
// This script will log the DOM structure to help identify CSS selectors

(function() {
    console.log("=== Chainlit DOM Inspector Started ===");

    // Wait for messages to load
    setTimeout(() => {
        // Find all potential message containers
        const allDivs = document.querySelectorAll('div[class*="message"], div[class*="Message"], div[role="article"], div[data-author]');

        console.log(`Found ${allDivs.length} potential message elements`);

        allDivs.forEach((el, index) => {
            console.log(`\n--- Element ${index + 1} ---`);
            console.log('Tag:', el.tagName);
            console.log('Classes:', el.className);
            console.log('Data attributes:', Object.keys(el.dataset));
            el.dataset && Object.keys(el.dataset).forEach(key => {
                console.log(`  data-${key}:`, el.dataset[key]);
            });
            console.log('Role:', el.getAttribute('role'));
            console.log('Aria-label:', el.getAttribute('aria-label'));
            console.log('Parent classes:', el.parentElement?.className);
            console.log('Text preview:', el.textContent?.substring(0, 50));
        });

        // Also search for step elements
        const stepElements = document.querySelectorAll('[class*="step"], [class*="Step"]');
        console.log(`\n\nFound ${stepElements.length} potential step elements`);

        stepElements.forEach((el, index) => {
            console.log(`\n--- Step ${index + 1} ---`);
            console.log('Classes:', el.className);
            console.log('Data attributes:', Object.keys(el.dataset));
        });

        // Look for the messages container
        const containers = document.querySelectorAll('main, [class*="container"], [class*="Container"]');
        console.log(`\n\nFound ${containers.length} potential container elements`);
        containers.forEach((el, index) => {
            if (el.className) {
                console.log(`Container ${index + 1}:`, el.className);
            }
        });

    }, 2000);

})();
