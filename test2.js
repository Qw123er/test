// ==UserScript==
// @name         test
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  test
// @author       Security Analyzer
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_DOMAIN = 'felixzone.com.cn';
    const REDIRECT_DOMAIN = 'ioioiio.cn';

    // 直接重定向当前页面
    if (location.hostname.includes(TARGET_DOMAIN)) {
        const newUrl = location.href.replace(TARGET_DOMAIN, REDIRECT_DOMAIN);
        console.log(`重定向: ${location.href} → ${newUrl}`);
        location.replace(newUrl);
    }

    // 拦截网络请求
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        if (typeof url === 'string' && url.includes(TARGET_DOMAIN)) {
            const newUrl = url.replace(new RegExp(TARGET_DOMAIN, 'g'), REDIRECT_DOMAIN);
            console.log(`XHR重定向: ${url} → ${newUrl}`);
            return originalXHROpen.call(this, method, newUrl, ...args);
        }
        return originalXHROpen.call(this, method, url, ...args);
    };

    const originalFetch = window.fetch;
    window.fetch = function(url, ...args) {
        if (typeof url === 'string' && url.includes(TARGET_DOMAIN)) {
            const newUrl = url.replace(new RegExp(TARGET_DOMAIN, 'g'), REDIRECT_DOMAIN);
            console.log(`Fetch重定向: ${url} → ${newUrl}`);
            return originalFetch.call(this, newUrl, ...args);
        }
        return originalFetch.call(this, url, ...args);
    };

    // 拦截动态元素
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'SCRIPT' && node.src && node.src.includes(TARGET_DOMAIN)) {
                        node.src = node.src.replace(new RegExp(TARGET_DOMAIN, 'g'), REDIRECT_DOMAIN);
                        console.log(`Script重定向: ${node.src}`);
                    }
                    if (node.tagName === 'LINK' && node.href && node.href.includes(TARGET_DOMAIN)) {
                        node.href = node.href.replace(new RegExp(TARGET_DOMAIN, 'g'), REDIRECT_DOMAIN);
                        console.log(`Link重定向: ${node.href}`);
                    }
                    if (node.tagName === 'IMG' && node.src && node.src.includes(TARGET_DOMAIN)) {
                        node.src = node.src.replace(new RegExp(TARGET_DOMAIN, 'g'), REDIRECT_DOMAIN);
                        console.log(`Image重定向: ${node.src}`);
                    }
                }
            });
        });
    });

    observer.observe(document, { childList: true, subtree: true });

    console.log('域名重定向脚本已激活: felixzone.com.cn → ioio.cn');

})();