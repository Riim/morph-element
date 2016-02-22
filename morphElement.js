(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["morphElement"] = factory();
	else
		root["morphElement"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var specialElementHandlers = __webpack_require__(1);
	var morphElementAttributes = __webpack_require__(2);

	function noop() {}

	function defaultGetElementKey(el) {
		return el.getAttribute('key') || void 0;
	}

	function defaultIsCompatibleElements(el1, el2) {
		return el1.tagName == el2.tagName;
	}

	function morphElement(el, toEl, options) {
		if (!options) {
			options = {};
		}

		var contentOnly = options.contentOnly === true;
		var getElementKey = options.getElementKey || defaultGetElementKey;
		var isCompatibleElements = options.isCompatibleElements || defaultIsCompatibleElements;
		var onBeforeMorphElement = options.onBeforeMorphElement || noop;
		var onBeforeMorphElementContent = options.onBeforeMorphElementContent || noop;
		var onElementRemoved = options.onElementRemoved || noop;

		var activeElement = document.activeElement;
		var scrollLeft = undefined;
		var scrollTop = undefined;

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
				} else {
					storedElements[key] = someStoredElements[key] = el;
					haveNewStoredElements = true;

					if (remove) {
						el.parentNode.removeChild(el);
					}
				}
			} else {
				if (remove) {
					el.parentNode.removeChild(el);
				}

				for (var child = el.firstElementChild; child; child = child.nextElementSibling) {
					storeElement(child, false);
				}

				onElementRemoved(child);
			}
		}

		function restoreElement(el) {
			for (var child = el.firstElementChild, nextChild; child; child = nextChild) {
				nextChild = child.nextElementSibling;

				var _key = getElementKey(child);

				if (_key) {
					var unmatchedEl = unmatchedElements[_key];

					if (unmatchedEl) {
						delete unmatchedElements[_key];
						unmatchedEl.el.parentNode.replaceChild(child, unmatchedEl.el);
						_morphElement(child, unmatchedEl.toEl, false);
					} else {
						storedElements[_key] = someStoredElements[_key] = child;
						haveNewStoredElements = true;
					}
				} else {
					restoreElement(child);
				}
			}
		}

		function handleRemovedElement(el) {
			for (var child = el.firstElementChild; child; child = child.nextElementSibling) {
				handleRemovedElement(child);
			}

			onElementRemoved(el);
		}

		function _morphElement(el, toEl, contentOnly) {
			if (!contentOnly) {
				if (onBeforeMorphElement(el, toEl) === false) {
					return;
				}

				morphElementAttributes(el, toEl);

				if (onBeforeMorphElementContent(el, toEl) === false) {
					return;
				}
			}

			var elTagName = el.tagName;

			if (elTagName != 'TEXTAREA') {
				var elChild = el.firstChild;

				for (var toElChild = toEl.firstChild; toElChild; toElChild = toElChild.nextSibling) {
					var toElChildType = toElChild.nodeType;
					var toElChildKey = undefined;

					if (toElChildType == 1) {
						toElChild = toElChild;
						toElChildKey = getElementKey(toElChild);

						if (toElChildKey) {
							var storedEl = storedElements[toElChildKey];

							if (storedEl) {
								delete storedElements[toElChildKey];
								delete someStoredElements[toElChildKey];

								if (elChild === storedEl) {
									elChild = elChild.nextSibling;
								} else {
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
								nextElChild = nextElChild;
								toElChild = toElChild;

								if (getElementKey(nextElChild) === toElChildKey && (toElChildKey !== void 0 || isCompatibleElements(nextElChild, toElChild))) {
									found = true;
									_morphElement(nextElChild, toElChild, false);
								}
							} else {
								found = true;
								nextElChild.nodeValue = toElChild.nodeValue;
							}
						}

						if (found) {
							if (elChild == nextElChild) {
								elChild = elChild.nextSibling;
							} else {
								el.insertBefore(nextElChild, elChild);
							}

							break;
						}
					}

					if (!found) {
						switch (toElChildType) {
							case 1:
								{
									toElChild = toElChild;

									var unmatchedEl = document.createElement(toElChild.tagName);

									el.insertBefore(unmatchedEl, elChild || null);

									if (toElChildKey) {
										unmatchedElements[toElChildKey] = {
											el: unmatchedEl,
											toEl: toElChild
										};
										haveNewUnmatchedElements = true;
									} else {
										_morphElement(unmatchedEl, toElChild, false);
									}

									break;
								}
							case 3:
								{
									el.insertBefore(document.createTextNode(toElChild.nodeValue), elChild || null);
									break;
								}
							case 8:
								{
									el.insertBefore(document.createComment(toElChild.nodeValue), elChild || null);
									break;
								}
							default:
								{
									throw new TypeError('Unsupported node type');
								}
						}
					}
				}

				for (var nextElChild; elChild; elChild = nextElChild) {
					nextElChild = elChild.nextSibling;

					if (elChild.nodeType == 1) {
						storeElement(elChild, true);
					} else {
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

				for (var _key2 in someStoredElements) {
					var storedEl = someStoredElements[_key2];
					delete someStoredElements[_key2];
					restoreElement(storedEl);
				}
			}

			haveNewUnmatchedElements = false;

			for (var _key3 in unmatchedElements) {
				var unmatchedEl = unmatchedElements[_key3];
				delete unmatchedElements[_key3];
				_morphElement(unmatchedEl.el, unmatchedEl.toEl, false);

				if (haveNewUnmatchedElements) {
					break;
				}
			}
		}

		for (var _key4 in storedElements) {
			handleRemovedElement(storedElements[_key4]);
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

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";

	var specialElementHandlers = {
		INPUT: function INPUT(el, toEl) {
			if (el.value != toEl.value) {
				el.value = toEl.value;
			}

			el.checked = toEl.checked;
		},
		TEXTAREA: function TEXTAREA(el, toEl) {
			var value = toEl.value;

			if (el.value != value) {
				el.value = value;
			}

			if (el.firstChild) {
				el.firstChild.nodeValue = value;
			}
		},
		OPTION: function OPTION(el, toEl) {
			el.selected = toEl.selected;
		}
	};

	module.exports = specialElementHandlers;

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";

	function morphElementAttributes(el, toEl) {
		var toElAttributes = toEl.attributes;
		var foundAttributes = {};

		for (var i = toElAttributes.length; i;) {
			var attr = toElAttributes[--i];
			var attrName = attr.name;
			var attrValue = attr.value;

			foundAttributes[attrName] = foundAttributes;

			if (el.getAttribute(attrName) !== attrValue) {
				el.setAttribute(attrName, attrValue);
			}
		}

		var elAttributes = el.attributes;

		for (var i = elAttributes.length; i;) {
			var attr = elAttributes[--i];
			var attrName = attr.name;

			if (foundAttributes[attrName] !== foundAttributes) {
				el.removeAttribute(attrName);
			}
		}
	}

	module.exports = morphElementAttributes;

/***/ }
/******/ ])
});
;