import specialElementHandlers = require('./specialElementHandlers');
import morphElementAttributes = require('./morphElementAttributes');

let defaultNamespaceURI = document.documentElement.namespaceURI;

function defaultGetElementAttributes(el: Element): NamedNodeMap {
	return el.attributes;
}

function defaultGetElementKey(el: Element): string {
	return el.getAttribute('key');
}

function defaultIsCompatibleElements(el1: Element, el2: Element): boolean {
	return el1.tagName == el2.tagName;
}

function morphElement(el: Element, toEl: Element|NodeList, options?: {
	contentOnly?: boolean,
	getElementAttributes?: (el: Element) => NamedNodeMap,
	getElementKey?: (el: Element) => string,
	isCompatibleElements?: (el1: Element, el2: Element) => boolean,
	onBeforeMorphElement?: (el: Element, toEl: Element) => boolean,
	onBeforeMorphElementContent?: (el: Element, toEl: Element) => boolean,
	onElementRemoved?: (el: Element) => void
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

	let storedElements: { [key: string]: Element } = Object.create(null);
	let someStoredElements: { [key: string]: Element } = Object.create(null);
	let unmatchedElements: { [key: string]: { el: Element, toEl: Element } } = Object.create(null);
	let haveNewStoredElements = false;
	let haveNewUnmatchedElements = false;

	function storeElement(el: Element, remove: boolean): void {
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

			for (let child = el.firstElementChild; child; child = child.nextElementSibling) {
				storeElement(child, false);
			}

			if (onElementRemoved) {
				onElementRemoved(el);
			}
		}
	}

	function restoreElement(el: Element): void {
		for (let child = el.firstElementChild, nextChild: Element; child; child = nextChild) {
			nextChild = child.nextElementSibling;

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

	function handleRemovedElement(el: Element): void {
		for (let child = el.firstElementChild; child; child = child.nextElementSibling) {
			handleRemovedElement(child);
		}

		if (onElementRemoved) {
			onElementRemoved(el);
		}
	}

	function _morphElement(el: Element, toEl: Element|NodeList, contentOnly: boolean): void {
		let isToElNodeList = toEl instanceof NodeList;

		if (!contentOnly && !isToElNodeList) {
			if (onBeforeMorphElement && onBeforeMorphElement(el, <Element>toEl) === false) {
				return;
			}

			morphElementAttributes(el, <Element>toEl, getElementAttributes(el));

			if (onBeforeMorphElementContent && onBeforeMorphElementContent(el, <Element>toEl) === false) {
				return;
			}
		}

		let elTagName = el.tagName;

		if (elTagName != 'TEXTAREA') {
			let elChild = el.firstChild;
			let toElChildren = isToElNodeList ? <NodeList>toEl : (<Element>toEl).childNodes;

			for (let i = 0, l = toElChildren.length; i < l; i++) {
				let toElChild = toElChildren[i];
				let toElChildType = toElChild.nodeType;
				let toElChildKey: string;

				if (toElChildType == 1) {
					toElChildKey = getElementKey(<Element>toElChild);

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

							_morphElement(storedEl, <Element>toElChild, false);
							continue;
						}
					}
				}

				let found = false;

				for (let nextElChild = elChild; nextElChild; nextElChild = nextElChild.nextSibling) {
					if (nextElChild.nodeType == toElChildType) {
						if (toElChildType == 1) {
							if (
								getElementKey(<Element>nextElChild) === toElChildKey &&
									(toElChildKey || isCompatibleElements(<Element>nextElChild, <Element>toElChild))
							) {
								found = true;
								_morphElement(<Element>nextElChild, <Element>toElChild, false);
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
							let unmatchedEl = (<Element>toElChild).namespaceURI == defaultNamespaceURI ?
								document.createElement((<Element>toElChild).tagName) :
								document.createElementNS(
									(<Element>toElChild).namespaceURI,
									(<Element>toElChild).tagName
								);

							el.insertBefore(unmatchedEl, elChild || null);

							if (toElChildKey) {
								unmatchedElements[toElChildKey] = {
									el: unmatchedEl,
									toEl: <Element>toElChild
								};
								haveNewUnmatchedElements = true;
							} else {
								_morphElement(unmatchedEl, <Element>toElChild, false);
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
					storeElement(<Element>elChild, true);
				} else {
					el.removeChild(elChild);
				}
			}
		}

		if (!isToElNodeList) {
			let specialElementHandler = specialElementHandlers[elTagName];

			if (specialElementHandler) {
				specialElementHandler(el, <Element>toEl);
			}
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
