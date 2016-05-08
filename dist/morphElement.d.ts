declare function morphElement(el: HTMLElement, toEl: HTMLElement, options?: {
    contentOnly?: boolean;
    getElementKey?: (el: HTMLElement) => string;
    isCompatibleElements?: (el1: HTMLElement, el2: HTMLElement) => boolean;
    onBeforeMorphElement?: (el: HTMLElement, toEl: HTMLElement) => boolean;
    onBeforeMorphElementContent?: (el: HTMLElement, toEl: HTMLElement) => boolean;
    onElementRemoved?: (el: HTMLElement) => void;
}): void;
export = morphElement;
