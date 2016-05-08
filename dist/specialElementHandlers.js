"use strict";
var specialElementHandlers = {
    INPUT: function (el, toEl) {
        if (el.value != toEl.value) {
            el.value = toEl.value;
        }
        el.checked = toEl.checked;
    },
    TEXTAREA: function (el, toEl) {
        var value = toEl.value;
        if (el.value != value) {
            el.value = value;
        }
        if (el.firstChild) {
            el.firstChild.nodeValue = value;
        }
    },
    OPTION: function (el, toEl) {
        el.selected = toEl.selected;
    }
};
module.exports = specialElementHandlers;
