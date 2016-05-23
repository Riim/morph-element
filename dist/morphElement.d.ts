declare function morphElement(el: Element, toEl: Element, options?: {
    contentOnly?: boolean;
    getElementAttributes?: (el: Element) => NamedNodeMap;
    getElementKey?: (el: Element) => string;
    isCompatibleElements?: (el1: Element, el2: Element) => boolean;
    onBeforeMorphElement?: (el: Element, toEl: Element) => boolean;
    onBeforeMorphElementContent?: (el: Element, toEl: Element) => boolean;
    onElementRemoved?: (el: Element) => void;
}): void;
export = morphElement;
