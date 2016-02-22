/* @flow */
let specialElementHandlers = require('./specialElementHandlers');
let morphElementAttributes = require('./morphElementAttributes');

function noop(): void {}

function defaultGetElementKey(el: HTMLElement): ?string {
	return el.getAttribute('key') || void 0;
}

function defaultIsCompatibleElements(el1: HTMLElement, el2: HTMLElement): boolean {
	return el1.tagName == el2.tagName;
}

function morphElement(el: HTMLElement, toEl: HTMLElement, options?: {
	contentOnly?: boolean,
	getElementKey?: (el: HTMLElement) => ?string,
	isCompatibleElements?: (el1: HTMLElement, el2: HTMLElement) => boolean,
	onBeforeMorphElement?: (el: HTMLElement, toEl: HTMLElement) => ?boolean,
	onBeforeMorphElementContent?: (el: HTMLElement, toEl: HTMLElement) => ?boolean,
	onElementRemoved?: (el: HTMLElement) => void
}) {
	if (!options) {
		options = {};
	}

	let contentOnly = options.contentOnly === true;
	let getElementKey = options.getElementKey || defaultGetElementKey;
	let isCompatibleElements = options.isCompatibleElements || defaultIsCompatibleElements;
	let onBeforeMorphElement = options.onBeforeMorphElement || noop;
	let onBeforeMorphElementContent = options.onBeforeMorphElementContent || noop;
	let onElementRemoved = options.onElementRemoved || noop;

	let activeElement = document.activeElement;
	let scrollLeft;
	let scrollTop;

	if (activeElement.selectionStart !== void 0) {
		scrollLeft = activeElement.scrollLeft;
		scrollTop = activeElement.scrollTop;
	}

	let storedElements: { [key: string]: HTMLElement } = Object.create(null);
	let someStoredElements: { [key: string]: HTMLElement } = Object.create(null);
	let unmatchedElements: { [key: string]: { el: HTMLElement, toEl: HTMLElement } } = Object.create(null);
	let haveNewStoredElements = false;
	let haveNewUnmatchedElements = false;

	function storeElement(el: HTMLElement, remove: boolean): void {
		let key = getElementKey(el);

		if (key) {
			let unmatchedEl = unmatchedElements[key];

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

			for (var child = (el.firstElementChild: any); child; child = (child.nextElementSibling: any)) {
				storeElement(child, false);
			}

			onElementRemoved(child);
		}
	}

	function restoreElement(el: HTMLElement): void {
		for (var child = (el.firstElementChild: any), nextChild; child; child = nextChild) {
			nextChild = (child.nextElementSibling: any);

			let key = getElementKey(child);

			if (key) {
				let unmatchedEl = unmatchedElements[key];

				if (unmatchedEl) {
					delete unmatchedElements[key];
					unmatchedEl.el.parentNode.replaceChild(child, unmatchedEl.el);
					_morphElement(child, unmatchedEl.toEl, false);
				} else {
					storedElements[key] = someStoredElements[key] = child;
					haveNewStoredElements = true;
				}
			} else {
				restoreElement(child);
			}
		}
	}

	function handleRemovedElement(el: HTMLElement): void {
		for (var child = (el.firstElementChild: any); child; child = (child.nextElementSibling: any)) {
			handleRemovedElement(child);
		}

		onElementRemoved(el);
	}

	function _morphElement(el: HTMLElement, toEl: HTMLElement, contentOnly: boolean): void {
		if (!contentOnly) {
			if (onBeforeMorphElement(el, toEl) === false) {
				return;
			}

			morphElementAttributes(el, toEl);

			if (onBeforeMorphElementContent(el, toEl) === false) {
				return;
			}
		}

		let elTagName = el.tagName;

		if (elTagName != 'TEXTAREA') {
			let elChild = el.firstChild;

			for (let toElChild = toEl.firstChild; toElChild; toElChild = toElChild.nextSibling) {
				let toElChildType = toElChild.nodeType;
				let toElChildKey;

				if (toElChildType == 1) {
					toElChild = (toElChild: any);
					toElChildKey = getElementKey(toElChild);

					if (toElChildKey) {
						let storedEl = storedElements[toElChildKey];

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

				let found = false;

				for (let nextElChild = elChild; nextElChild; nextElChild = nextElChild.nextSibling) {
					if (nextElChild.nodeType == toElChildType) {
						if (toElChildType == 1) {
							nextElChild = (nextElChild: any);
							toElChild = (toElChild: any);

							if (
								getElementKey(nextElChild) === toElChildKey &&
									(toElChildKey !== void 0 || isCompatibleElements(nextElChild, toElChild))
							) {
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
						case 1: {
							toElChild = (toElChild: any);

							let unmatchedEl = document.createElement(toElChild.tagName);

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

			for (let nextElChild; elChild; elChild = nextElChild) {
				nextElChild = elChild.nextSibling;

				if (elChild.nodeType == 1) {
					storeElement((elChild: any), true);
				} else {
					el.removeChild(elChild);
				}
			}
		}

		let specialElementHandler = specialElementHandlers[elTagName];

		if (specialElementHandler) {
			specialElementHandler(el, toEl);
		}
	}

	_morphElement(el, toEl, contentOnly);

	while (haveNewUnmatchedElements) {
		while (haveNewStoredElements) {
			haveNewStoredElements = false;

			for (let key in someStoredElements) {
				let storedEl = someStoredElements[key];
				delete someStoredElements[key];
				restoreElement(storedEl);
			}
		}

		haveNewUnmatchedElements = false;

		for (let key in unmatchedElements) {
			let unmatchedEl = unmatchedElements[key];
			delete unmatchedElements[key];
			_morphElement(unmatchedEl.el, unmatchedEl.toEl, false);

			if (haveNewUnmatchedElements) {
				break;
			}
		}
	}

	for (let key in storedElements) {
		handleRemovedElement(storedElements[key]);
	}

	if (activeElement != document.activeElement) {
		if (scrollLeft !== void 0) {
			activeElement.scrollLeft = scrollLeft;
			activeElement.scrollTop = (scrollTop: any);
		}

		activeElement.focus();
	}
}

module.exports = morphElement;
