function morphElementAttributes(el: HTMLElement, toEl: HTMLElement): void {
	let toElAttributes = toEl.attributes;
	let foundAttributes: { [key: string]: Object; } = {};

	for (let i = toElAttributes.length; i;) {
		let attr = toElAttributes[--i];
		let attrName = attr.name;
		let attrValue = attr.value;

		foundAttributes[attrName] = foundAttributes;

		if (el.getAttribute(attrName) !== attrValue) {
			el.setAttribute(attrName, attrValue);
		}
	}

	let elAttributes = el.attributes;

	for (let i = elAttributes.length; i;) {
		let attr = elAttributes[--i];
		let attrName = attr.name;

		if (foundAttributes[attrName] !== foundAttributes) {
			el.removeAttribute(attrName);
		}
	}
}

export = morphElementAttributes;
