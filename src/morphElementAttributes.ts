function morphElementAttributes(el: Element, toEl: Element, elAttributes: NamedNodeMap): void {
	let toElAttributes = toEl.attributes;

	for (let i = 0, l = toElAttributes.length; i < l; i++) {
		let toElAttr = toElAttributes.item(i);
		let toElAttrNamespaceURI = toElAttr.namespaceURI;
		let elAttr = toElAttrNamespaceURI ?
			elAttributes.getNamedItemNS(toElAttrNamespaceURI, toElAttr.name) :
			elAttributes.getNamedItem(toElAttr.name);

		if (!elAttr || elAttr.value != toElAttr.value) {
			if (toElAttrNamespaceURI) {
				el.setAttributeNS(toElAttrNamespaceURI, toElAttr.name, toElAttr.value);
			} else {
				el.setAttribute(toElAttr.name, toElAttr.value);
			}
		}
	}

	for (let i = elAttributes.length; i;) {
		let elAttr = elAttributes.item(--i);
		let elAttrNamespaceURI = elAttr.namespaceURI;

		if (elAttrNamespaceURI) {
			if (!toElAttributes.getNamedItemNS(elAttrNamespaceURI, elAttr.name)) {
				el.removeAttributeNS(elAttrNamespaceURI, elAttr.name);
			}
		} else {
			if (!toElAttributes.getNamedItem(elAttr.name)) {
				el.removeAttribute(elAttr.name);
			}
		}
	}
}

export = morphElementAttributes;
