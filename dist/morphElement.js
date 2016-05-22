"use strict";
var specialElementHandlers = require('./specialElementHandlers');
var morphElementAttributes = require('./morphElementAttributes');
function defaultGetElementAttributes(el) {
    return el.attributes;
}
function defaultGetElementKey(el) {
    return el.getAttribute('key');
}
function defaultIsCompatibleElements(el1, el2) {
    return el1.tagName == el2.tagName;
}
function morphElement(el, toEl, options) {
    if (!options) {
        options = {};
    }
    var contentOnly = !!options.contentOnly;
    var getElementAttributes = options.getElementAttributes || defaultGetElementAttributes;
    var getElementKey = options.getElementKey || defaultGetElementKey;
    var isCompatibleElements = options.isCompatibleElements || defaultIsCompatibleElements;
    var onBeforeMorphElement = options.onBeforeMorphElement;
    var onBeforeMorphElementContent = options.onBeforeMorphElementContent;
    var onElementRemoved = options.onElementRemoved;
    var activeElement = document.activeElement;
    var scrollLeft;
    var scrollTop;
    if (activeElement.selectionStart !== void 0) {
        scrollLeft = activeElement.scrollLeft;
        scrollTop = activeElement.scrollTop;
    }
    var storedElements = Object.create(null);
    var someStoredElements = Object.create(null);
    var unmatchedElements = Object.create(null);
    var haveNewStoredElements = false;
    var haveNewUnmatchedElements = false;
    function storeElement(el, remove) {
        var key = getElementKey(el);
        if (key) {
            var unmatchedEl = unmatchedElements[key];
            if (unmatchedEl) {
                delete unmatchedElements[key];
                unmatchedEl.el.parentNode.replaceChild(el, unmatchedEl.el);
                _morphElement(el, unmatchedEl.toEl, false);
            }
            else {
                storedElements[key] = someStoredElements[key] = el;
                haveNewStoredElements = true;
                if (remove) {
                    el.parentNode.removeChild(el);
                }
            }
        }
        else {
            if (remove) {
                el.parentNode.removeChild(el);
            }
            for (var child = el.firstElementChild; child; child = child.nextElementSibling) {
                storeElement(child, false);
            }
            if (onElementRemoved) {
                onElementRemoved(el);
            }
        }
    }
    function restoreElement(el) {
        for (var child = el.firstElementChild, nextChild = void 0; child; child = nextChild) {
            nextChild = child.nextElementSibling;
            var key = getElementKey(child);
            if (key) {
                var unmatchedEl = unmatchedElements[key];
                if (unmatchedEl) {
                    delete unmatchedElements[key];
                    unmatchedEl.el.parentNode.replaceChild(child, unmatchedEl.el);
                    _morphElement(child, unmatchedEl.toEl, false);
                }
                else {
                    storedElements[key] = someStoredElements[key] = child;
                    haveNewStoredElements = true;
                }
            }
            else {
                restoreElement(child);
            }
        }
    }
    function handleRemovedElement(el) {
        for (var child = el.firstElementChild; child; child = child.nextElementSibling) {
            handleRemovedElement(child);
        }
        if (onElementRemoved) {
            onElementRemoved(el);
        }
    }
    function _morphElement(el, toEl, contentOnly) {
        if (!contentOnly) {
            if (onBeforeMorphElement && onBeforeMorphElement(el, toEl) === false) {
                return;
            }
            morphElementAttributes(el, toEl, getElementAttributes(el));
            if (onBeforeMorphElementContent && onBeforeMorphElementContent(el, toEl) === false) {
                return;
            }
        }
        var elTagName = el.tagName;
        if (elTagName != 'TEXTAREA') {
            var elChild = el.firstChild;
            for (var toElChild = toEl.firstChild; toElChild; toElChild = toElChild.nextSibling) {
                var toElChildType = toElChild.nodeType;
                var toElChildKey = void 0;
                if (toElChildType == 1) {
                    toElChildKey = getElementKey(toElChild);
                    if (toElChildKey) {
                        var storedEl = storedElements[toElChildKey];
                        if (storedEl) {
                            delete storedElements[toElChildKey];
                            delete someStoredElements[toElChildKey];
                            if (elChild === storedEl) {
                                elChild = elChild.nextSibling;
                            }
                            else {
                                el.insertBefore(storedEl, elChild || null);
                            }
                            _morphElement(storedEl, toElChild, false);
                            continue;
                        }
                    }
                }
                var found = false;
                for (var nextElChild = elChild; nextElChild; nextElChild = nextElChild.nextSibling) {
                    if (nextElChild.nodeType == toElChildType) {
                        if (toElChildType == 1) {
                            if (getElementKey(nextElChild) === toElChildKey && (toElChildKey ||
                                isCompatibleElements(nextElChild, toElChild))) {
                                found = true;
                                _morphElement(nextElChild, toElChild, false);
                            }
                        }
                        else {
                            found = true;
                            nextElChild.nodeValue = toElChild.nodeValue;
                        }
                    }
                    if (found) {
                        if (elChild == nextElChild) {
                            elChild = elChild.nextSibling;
                        }
                        else {
                            el.insertBefore(nextElChild, elChild);
                        }
                        break;
                    }
                }
                if (!found) {
                    switch (toElChildType) {
                        case 1: {
                            var unmatchedEl = document.createElement(toElChild.tagName);
                            el.insertBefore(unmatchedEl, elChild || null);
                            if (toElChildKey) {
                                unmatchedElements[toElChildKey] = {
                                    el: unmatchedEl,
                                    toEl: toElChild
                                };
                                haveNewUnmatchedElements = true;
                            }
                            else {
                                _morphElement(unmatchedEl, toElChild, false);
                            }
                            break;
                        }
                        case 3: {
                            el.insertBefore(document.createTextNode(toElChild.nodeValue), elChild || null);
                            break;
                        }
                        case 8: {
                            el.insertBefore(document.createComment(toElChild.nodeValue), elChild || null);
                            break;
                        }
                        default: {
                            throw new TypeError('Unsupported node type');
                        }
                    }
                }
            }
            for (var nextElChild = void 0; elChild; elChild = nextElChild) {
                nextElChild = elChild.nextSibling;
                if (elChild.nodeType == 1) {
                    storeElement(elChild, true);
                }
                else {
                    el.removeChild(elChild);
                }
            }
        }
        var specialElementHandler = specialElementHandlers[elTagName];
        if (specialElementHandler) {
            specialElementHandler(el, toEl);
        }
    }
    _morphElement(el, toEl, contentOnly);
    while (haveNewUnmatchedElements) {
        while (haveNewStoredElements) {
            haveNewStoredElements = false;
            for (var key in someStoredElements) {
                var storedEl = someStoredElements[key];
                delete someStoredElements[key];
                restoreElement(storedEl);
            }
        }
        haveNewUnmatchedElements = false;
        for (var key in unmatchedElements) {
            var unmatchedEl = unmatchedElements[key];
            delete unmatchedElements[key];
            _morphElement(unmatchedEl.el, unmatchedEl.toEl, false);
            if (haveNewUnmatchedElements) {
                break;
            }
        }
    }
    for (var key in storedElements) {
        handleRemovedElement(storedElements[key]);
    }
    if (activeElement != document.activeElement) {
        if (scrollLeft !== void 0) {
            activeElement.scrollLeft = scrollLeft;
            activeElement.scrollTop = scrollTop;
        }
        activeElement.focus();
    }
}
module.exports = morphElement;
