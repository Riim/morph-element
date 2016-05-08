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
