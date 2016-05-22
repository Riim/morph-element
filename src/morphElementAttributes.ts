function morphElementAttributes(el: HTMLElement, toEl: HTMLElement, elAttributes: NamedNodeMap): void {
	let toElAttributes = toEl.attributes;

	for (let i = 0, l = toElAttributes.length; i < l; i++) {
		let toElAttr = toElAttributes.item(i);
		let elAttr = elAttributes.getNamedItem(toElAttr.name);

		if (!elAttr || elAttr.value != toElAttr.value) {
			el.setAttribute(toElAttr.name, toElAttr.value);
		}
	}

	for (let i = elAttributes.length; i;) {
		let elAttr = elAttributes.item(--i);

		if (!toElAttributes.getNamedItem(elAttr.name)) {
			el.removeAttribute(elAttr.name);
		}
	}
}

export = morphElementAttributes;
