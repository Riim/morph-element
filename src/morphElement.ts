import specialElementHandlers = require('./specialElementHandlers');
import morphElementAttributes = require('./morphElementAttributes');

function defaultGetElementAttributes(el: HTMLElement): NamedNodeMap {
	return el.attributes;
}

function defaultGetElementKey(el: HTMLElement): string {
	return el.getAttribute('key');
}

function defaultIsCompatibleElements(el1: HTMLElement, el2: HTMLElement): boolean {
	return el1.tagName == el2.tagName;
}

function morphElement(el: HTMLElement, toEl: HTMLElement, options?: {
	contentOnly?: boolean,
	getElementAttributes?: (el: HTMLElement) => NamedNodeMap,
	getElementKey?: (el: HTMLElement) => string,
	isCompatibleElements?: (el1: HTMLElement, el2: HTMLElement) => boolean,
	onBeforeMorphElement?: (el: HTMLElement, toEl: HTMLElement) => boolean,
	onBeforeMorphElementContent?: (el: HTMLElement, toEl: HTMLElement) => boolean,
	onElementRemoved?: (el: HTMLElement) => void
}): void {
	if (!options) {
		options = {};
	}

	let contentOnly = !!options.contentOnly;
	let getElementAttributes = options.getElementAttributes || defaultGetElementAttributes;
	let getElementKey = options.getElementKey || defaultGetElementKey;
	let isCompatibleElements = options.isCompatibleElements || defaultIsCompatibleElements;
	let onBeforeMorphElement = options.onBeforeMorphElement;
	let onBeforeMorphElementContent = options.onBeforeMorphElementContent;
	let onElementRemoved = options.onElementRemoved;

	let activeElement = document.activeElement;
	let scrollLeft: number;
	let scrollTop: number;

	if ((<HTMLInputElement>activeElement).selectionStart !== void 0) {
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

			for (let child = <HTMLElement>el.firstElementChild; child; child = <HTMLElement>child.nextElementSibling) {
				storeElement(child, false);
			}

			if (onElementRemoved) {
				onElementRemoved(el);
			}
		}
	}

	function restoreElement(el: HTMLElement): void {
		for (let child = <HTMLElement>el.firstElementChild, nextChild: HTMLElement; child; child = nextChild) {
			nextChild = <HTMLElement>child.nextElementSibling;

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
		for (let child = <HTMLElement>el.firstElementChild; child; child = <HTMLElement>child.nextElementSibling) {
			handleRemovedElement(child);
		}

		if (onElementRemoved) {
			onElementRemoved(el);
		}
	}

	function _morphElement(el: HTMLElement, toEl: HTMLElement, contentOnly: boolean): void {
		if (!contentOnly) {
			if (onBeforeMorphElement && onBeforeMorphElement(el, toEl) === false) {
				return;
			}

			morphElementAttributes(el, toEl, getElementAttributes(el));

			if (onBeforeMorphElementContent && onBeforeMorphElementContent(el, toEl) === false) {
				return;
			}
		}

		let elTagName = el.tagName;

		if (elTagName != 'TEXTAREA') {
			let elChild = el.firstChild;

			for (let toElChild = toEl.firstChild; toElChild; toElChild = toElChild.nextSibling) {
				let toElChildType = toElChild.nodeType;
				let toElChildKey: string;

				if (toElChildType == 1) {
					toElChildKey = getElementKey(<HTMLElement>toElChild);

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

							_morphElement(storedEl, <HTMLElement>toElChild, false);
							continue;
						}
					}
				}

				let found = false;

				for (let nextElChild = elChild; nextElChild; nextElChild = nextElChild.nextSibling) {
					if (nextElChild.nodeType == toElChildType) {
						if (toElChildType == 1) {
							if (
								getElementKey(<HTMLElement>nextElChild) === toElChildKey && (
									toElChildKey ||
										isCompatibleElements(<HTMLElement>nextElChild, <HTMLElement>toElChild)
								)
							) {
								found = true;
								_morphElement(<HTMLElement>nextElChild, <HTMLElement>toElChild, false);
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
							let unmatchedEl = document.createElement((<HTMLElement>toElChild).tagName);

							el.insertBefore(unmatchedEl, elChild || null);

							if (toElChildKey) {
								unmatchedElements[toElChildKey] = {
									el: unmatchedEl,
									toEl: <HTMLElement>toElChild
								};
								haveNewUnmatchedElements = true;
							} else {
								_morphElement(unmatchedEl, <HTMLElement>toElChild, false);
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

			for (let nextElChild: Node; elChild; elChild = nextElChild) {
				nextElChild = elChild.nextSibling;

				if (elChild.nodeType == 1) {
					storeElement(<HTMLElement>elChild, true);
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
			activeElement.scrollTop = scrollTop;
		}

		(<HTMLInputElement>activeElement).focus();
	}
}

export = morphElement;
