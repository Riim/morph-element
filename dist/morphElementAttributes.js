"use strict";
function morphElementAttributes(el, toEl, elAttributes) {
    var toElAttributes = toEl.attributes;
    for (var i = 0, l = toElAttributes.length; i < l; i++) {
        var toElAttr = toElAttributes.item(i);
        var toElAttrNamespaceURI = toElAttr.namespaceURI;
        var elAttr = toElAttrNamespaceURI ?
            elAttributes.getNamedItemNS(toElAttrNamespaceURI, toElAttr.name) :
            elAttributes.getNamedItem(toElAttr.name);
        if (!elAttr || elAttr.value != toElAttr.value) {
            if (toElAttrNamespaceURI) {
                el.setAttributeNS(toElAttrNamespaceURI, toElAttr.name, toElAttr.value);
            }
            else {
                el.setAttribute(toElAttr.name, toElAttr.value);
            }
        }
    }
    for (var i = elAttributes.length; i;) {
        var elAttr = elAttributes.item(--i);
        var elAttrNamespaceURI = elAttr.namespaceURI;
        if (elAttrNamespaceURI) {
            if (!toElAttributes.getNamedItemNS(elAttrNamespaceURI, elAttr.name)) {
                el.removeAttributeNS(elAttrNamespaceURI, elAttr.name);
            }
        }
        else {
            if (!toElAttributes.getNamedItem(elAttr.name)) {
                el.removeAttribute(elAttr.name);
            }
        }
    }
}
module.exports = morphElementAttributes;
