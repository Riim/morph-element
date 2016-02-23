let specialElementChecks = {
	INPUT(el1, el2) {
		return el1.value == el2.value && el1.checked == el2.checked;
	},

	TEXTAREA(el1, el2) {
		return el1.value == el2.value;
	},

	OPTION(el1, el2) {
		return el1.selected == el2.selected;
	}
};

function htmlToElement(html) {
	let el = document.createElement('div');
	el.innerHTML = html;
	return el.firstElementChild;
}

function isEqualAttributes(el1, el2) {
	let el1Attributes = el1.attributes;
	let len = el1Attributes.length;

	if (len != el2.attributes.length) {
		return false;
	}

	for (let i = len; i;) {
		let attr = el1Attributes[--i];

		if (attr.value !== el2.getAttribute(attr.name)) {
			return false;
		}
	}

	return true;
}

function isEqualElements(el1, el2) {
	let el1TagName = el1.tagName;

	if (el1TagName != el2.tagName) {
		return false;
	}

	if (!isEqualAttributes(el1, el2)) {
		return false;
	}

	let el1ChildNodes = el1.childNodes;
	let el2ChildNodes = el2.childNodes;

	let len = el1ChildNodes.length;

	if (len != el2ChildNodes.length) {
		return false;
	}

	for (let i = 0; i < len; i++) {
		let el1Child = el1ChildNodes[i];
		let el2Child = el2ChildNodes[i];

		let el1ChildType = el1Child.nodeType;

		if (el1ChildType != el2Child.nodeType) {
			return false;
		}

		switch (el1ChildType) {
			case 1: {
				if (!isEqualElements(el1Child, el2Child)) {
					return false;
				}
				break;
			}
			case 3:
			case 8: {
				if (el1Child.nodeValue != el2Child.nodeValue) {
					return false;
				}
				break;
			}
			default: {
				throw new TypeError('Unsupported node type');
			}
		}
	}

	let specialElementCheck = specialElementChecks[el1TagName];

	if (specialElementCheck && !specialElementCheck(el1, el2)) {
		return false;
	}

	return true;
}

let elWrap = document.createElement('div');
let toElWrap = document.createElement('div');

document.body.appendChild(elWrap);
document.body.appendChild(toElWrap);

function test(el, toEl, options, onBeforeMorph, onAfterMorph) {
	if (typeof el == 'string') {
		el = htmlToElement(el);
	}
	if (typeof toEl == 'string') {
		toEl = htmlToElement(toEl);
	}

	while (elWrap.firstChild) {
		elWrap.removeChild(elWrap.firstChild);
	}
	while (toElWrap.firstChild) {
		toElWrap.removeChild(toElWrap.firstChild);
	}

	elWrap.appendChild(el);
	toElWrap.appendChild(toEl);

	let uniqueElements = Array.prototype.reduce.call(
		toElWrap.querySelectorAll('[key]'),
		function(uniqueElements, el) {
			let key = el.getAttribute('key');

			el = elWrap.querySelector(`[key=${key}]`);

			if (el) {
				uniqueElements[key] = el;
			}

			return uniqueElements;
		},
		Object.create(null)
	);

	if (onBeforeMorph && !onBeforeMorph(el, toEl)) {
		return false;
	}

	morphElement(el, toEl, options);

	if (onAfterMorph && !onAfterMorph(el, toEl)) {
		return false;
	}

	if (!isEqualElements(el, toEl)) {
		return false;
	}

	return Object.keys(uniqueElements).every(key => {
		if (uniqueElements[key] === el.querySelector(`[key=${key}]`)) {
			return true;
		}

		console.log(1, key);
	});
}

describe('morphElement', () => {

	it('должен трансформировать атрибуты', function() {
		expect(test(
			`<div></div>`,
			`<div class="foo"></div>`
		))
			.to.be.ok;

		expect(test(
			`<div class="foo"></div>`,
			`<div></div>`
		))
			.to.be.ok;

		expect(test(
			`<div class="foo"></div>`,
			`<div class="bar"></div>`
		))
			.to.be.ok;
	});

	it('должен трансформировать элементы', function() {
		expect(test(
			`<div></div>`,
			`<div>
				<b></b>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b></b>
			</div>`,
			`<div></div>`
		))
			.to.be.ok;


		expect(test(
			`<div>
				<b></b>
			</div>`,
			`<div>
				<i></i>
			</div>`
		))
			.to.be.ok;
	});

	it('должен трансформировать уникальные элементы', function() {
		expect(test(
			`<div></div>`,
			`<div>
				<b key="foo"></b>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo"></b>
			</div>`,
			`<div></div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo"></b>
			</div>`,
			`<div>
				<i key="bar"></i>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo"></b>
				<i></i>
			</div>`,
			`<div>
				<i></i>
				<b key="foo"></b>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b></b>
				<i key="foo"></i>
			</div>`,
			`<div>
				<i key="foo"></i>
				<b></b>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo"></b>
				<i key="bar"></i>
			</div>`,
			`<div>
				<i key="bar"></i>
				<b key="foo"></b>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo"></b>
				<i></i>
			</div>`,
			`<div>
				<i>
					<b key="foo"></b>
				</i>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b></b>
				<i key="foo"></i>
			</div>`,
			`<div>
				<b>
					<i key="foo"></i>
				</b>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b>
					<i key="foo"></i>
				</b>
			</div>`,
			`<div>
				<i key="foo"></i>
				<b></b>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b>
					<i key="foo"></i>
				</b>
			</div>`,
			`<div>
				<b></b>
				<i key="foo"></i>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b>
					<i key="foo"></i>
				</b>
			</div>`,
			`<div>
				<i key="foo"></i>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div></div>`,
			`<div>
				<b key="foo">
					<i key="bar"></i>
				</b>
			</div>`
		))
			.to.be.ok;
	});

	it('должен по максимуму реиспользовать существующие уникальные элементы', function() {
		expect(test(
			`<div>
				<b key="foo"></b>
				<i key="bar"></i>
			</div>`,
			`<div>
				<i key="bar">
					<b key="foo"></b>
				</i>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo"></b>
				<i key="bar"></i>
			</div>`,
			`<div>
				<b key="foo">
					<i key="bar"></i>
				</b>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo">
					<i key="bar"></i>
				</b>
			</div>`,
			`<div>
				<b key="foo"></b>
				<i key="bar"></i>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo">
					<i key="bar"></i>
				</b>
			</div>`,
			`<div>
				<i key="bar"></i>
				<b key="foo"></b>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo">
					<i key="bar"></i>
				</b>
			</div>`,
			`<div>
				<i key="bar"></i>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo">
					<span>
						<i key="bar"></i>
					</span>
				</b>
			</div>`,
			`<div>
				<i key="bar"></i>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo">
					<i key="bar"></i>
				</b>
			</div>`,
			`<div>
				<i key="bar">
					<b key="foo"></b>
				</i>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo">
					<span>
						<i key="bar"></i>
					</span>
				</b>
			</div>`,
			`<div>
				<i key="bar">
					<span>
						<b key="foo"></b>
					</span>
				</i>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo">
					<i key="bar">
						<u key="baz">
							<s key="qux"></s>
						</u>
					</i>
				</b>
			</div>`,
			`<div>
				<i key="bar">
					<s key="qux"></s>
				</i>
			</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>
				<b key="foo">
					<i key="bar">
						<u key="baz"></u>
					</i>
				</b>
			</div>`,
			`<div>
				<u key="baz">
					<b key="foo">
						<i key="bar"></i>
					</b>
				</u>
			</div>`
		))
			.to.be.ok;
	});

	it('должен трансформировать значение input', function() {
		let el1 = document.createElement('input');
		let el2 = document.createElement('input');

		el1.value = 'foo';
		el2.value = 'bar';

		expect(test(el1, el2))
			.to.be.ok;

		el1 = document.createElement('input');
		el2 = document.createElement('input');

		el1.type = 'checkbox';
		el2.type = 'checkbox';

		el2.checked = true;

		expect(test(el1, el2))
			.to.be.ok;
	});

	it('должен трансформировать значение textarea', function() {
		let el1 = document.createElement('textarea');
		let el2 = document.createElement('textarea');

		el1.value = 'foo';
		el2.value = 'bar';

		expect(test(el1, el2))
			.to.be.ok;
	});

	it('должен трансформировать значение option', function() {
		let el1 = document.createElement('option');
		let el2 = document.createElement('option');

		el2.selected = true;

		expect(test(el1, el2))
			.to.be.ok;
	});

	it('должен пропускать трансформацию элемента при возврате false из onBeforeMorphElement', function() {
		let el1 = htmlToElement(`<b class="foo">bar</b>`);
		let el2 = htmlToElement(`<b class="bar">foo</b>`);

		morphElement(el1, el2, {
			onBeforeMorphElement: function(el) {
				return false;
			}
		});

		expect(el1.className)
			.to.equal('foo');

		expect(el1.innerHTML)
			.to.equal('bar');
	});

	it('должен пропускать трансформацию контента элемента при возврате false из onBeforeMorphElementContent', function() {
		let el1 = htmlToElement(`<b class="foo">bar</b>`);
		let el2 = htmlToElement(`<b class="bar">foo</b>`);

		morphElement(el1, el2, {
			onBeforeMorphElementContent: function(el) {
				return false;
			}
		});

		expect(el1.className)
			.to.equal('bar');

		expect(el1.innerHTML)
			.to.equal('bar');
	});

	it('должен вызывать onElementRemoved при удалении элемента', function() {
		let el1 = htmlToElement('<div><b></b></div>');
		let el2 = htmlToElement('<div></div>');
		let b = el1.firstChild;
		let res = false;

		morphElement(el1, el2, {
			onElementRemoved: function(el) {
				if (el == b) {
					res = true;
				}
			}
		});

		expect(res)
			.to.be.ok;
	});

	it('должен вызывать onElementRemoved при удалении уникального элемента', function() {
		let el1 = htmlToElement('<div><b key="foo"></b></div>');
		let el2 = htmlToElement('<div></div>');
		let b = el1.firstChild;
		let res = false;

		morphElement(el1, el2, {
			onElementRemoved: function(el) {
				if (el == b) {
					res = true;
				}
			}
		});

		expect(res)
			.to.be.ok;
	});

	it('должен трансформировать текстовые ноды', function() {
		expect(test(
			`<div></div>`,
			`<div>foo</div>`
		))
			.to.be.ok;

		expect(test(
			`<div>foo</div>`,
			`<div></div>`
		))
			.to.be.ok;

		expect(test(
			`<div>foo</div>`,
			`<div>bar</div>`
		))
			.to.be.ok;
	});

	it('должен трансформировать комментарии', function() {
		expect(test(
			`<div></div>`,
			`<div><!--foo--></div>`
		))
			.to.be.ok;

		expect(test(
			`<div><!--foo--></div>`,
			`<div></div>`
		))
			.to.be.ok;

		expect(test(
			`<div><!--foo--></div>`,
			`<div><!--bar--></div>`
		))
			.to.be.ok;
	});

	it('должен сохранять фокус на уникальном элементе', function() {
		let input;

		let res = test(
			`<div>
				<input type="text" key="input">
			</div>`,
			`<div>
				<i><input type="text" key="input"></i>
			</div>`,
			null,
			function(el, toEl) {
				input = el.querySelector('[key=input]');
				input.focus();

				return document.activeElement == input;
			},
			function(el, toEl) {
				return document.activeElement == input;
			}
		);

		expect(res)
			.to.be.ok;
	});

});
