"use strict";
function morphElementAttributes(el, toEl, elAttributes) {
    var toElAttributes = toEl.attributes;
    for (var i = 0, l = toElAttributes.length; i < l; i++) {
        var toElAttr = toElAttributes.item(i);
        var elAttr = elAttributes.getNamedItem(toElAttr.name);
        if (!elAttr || elAttr.value != toElAttr.value) {
            el.setAttribute(toElAttr.name, toElAttr.value);
        }
    }
    for (var i = elAttributes.length; i;) {
        var elAttr = elAttributes.item(--i);
        if (!toElAttributes.getNamedItem(elAttr.name)) {
            el.removeAttribute(elAttr.name);
        }
    }
}
module.exports = morphElementAttributes;
