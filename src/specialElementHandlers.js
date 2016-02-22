/* @flow */
let specialElementHandlers = {
	INPUT(el: HTMLInputElement, toEl: HTMLInputElement): void {
		if (el.value != toEl.value) {
			el.value = toEl.value;
		}

		el.checked = toEl.checked;
	},

	TEXTAREA(el: HTMLTextAreaElement, toEl: HTMLTextAreaElement): void {
		let value = toEl.value;

		if (el.value != value) {
			el.value = value;
		}

		if (el.firstChild) {
			el.firstChild.nodeValue = value;
		}
	},

	OPTION(el: HTMLOptionElement, toEl: HTMLOptionElement): void {
		el.selected = toEl.selected;
	}
};

module.exports = specialElementHandlers;
