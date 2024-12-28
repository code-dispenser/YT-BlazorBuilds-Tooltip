interface ITooltipConfiguration {
    tooltipTextClass: string;     tooltipModifiers: string[], tooltipGapSize: number,
    initialModifierClass: string, hideTooltipClass: string, closeTooltipKey: string,
    tooltipIconButtonClass: string, ariaAttribute: string
};

const _focusElements = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), "
                       + "button:not([disabled]), object, [tabindex = '0'], [contenteditable]";

let _isEscapeKeyHandlerRegistered = false;

/*
    * Maps to store event handlers so we can remove them when our component is disposed.
*/
const _tooltipHandlers      = new WeakMap<HTMLElement, { positionHandler: EventListener, keyHandler?: EventListener }>();
const _closeButtonHandlers  = new WeakMap<HTMLElement,EventListener>();
/*
    * Set to store open tooltips, should just be one.
*/
const _openTooltips = new Set<HTMLElement>();//store 
/*
    * Arrow function just to add the hide tooltip modifier class 
 */
const addHideTooltipClass = (tooltip: HTMLElement, hideTooltipClass: string) => tooltip.classList.add(hideTooltipClass);

/*
    * Main routine that is called to check and handle the tooltip positioning which we cannot do in Blazor.
    * As only one tooltip needs to be open at a time, it will check and close others by adding the hide class.
*/
function checkInitialTooltipPosition(tooltip: HTMLElement, configuration: ITooltipConfiguration) {

    const searchClass = configuration.tooltipTextClass.startsWith(".") ? configuration.tooltipTextClass : "." + configuration.tooltipTextClass;
    const tooltipSpan = tooltip.querySelector(searchClass) as HTMLElement;

    if (!tooltipSpan) return;
    /*
        * Close any open tooltip and clear the list so we only deal with one item
    */
    _openTooltips.forEach(tooltip => addHideTooltipClass(tooltip, configuration.hideTooltipClass));
    _openTooltips.clear();
       
    tooltip.classList.remove(configuration.hideTooltipClass)//make sure we do not have the hidden class attached.

    _openTooltips.add(tooltip);

    const currentModifierClassName = configuration.tooltipModifiers.find((className) => tooltipSpan.classList.contains(className));

    if (!currentModifierClassName) return;

    const initialModifierClassName = configuration.initialModifierClass;
    const divRect                  = tooltip.getBoundingClientRect();
    const spanRect                 = tooltipSpan.getBoundingClientRect();
    /*
        * Try to place the tooltip back in its intended location if its different to what was assigned due to screen size changes 
    */
    if (currentModifierClassName !== initialModifierClassName) {

        if (true === ModifierWithinBounds(configuration.tooltipTextClass, divRect, spanRect, initialModifierClassName, configuration.tooltipGapSize)) {

            tooltipSpan.classList.add(initialModifierClassName);
            tooltipSpan.classList.remove(currentModifierClassName);

            return;
        }
    }
    /*
        * If we are here then our tooltip cannont go in the desired/original position.
    */
    checkAndMoveTooltipPosition(tooltipSpan, divRect, spanRect, currentModifierClassName, configuration);
}
function checkAndMoveTooltipPosition(tooltipSpan: HTMLElement, divRect: DOMRect, spanRect: DOMRect, modifierClassName: string, configuration:ITooltipConfiguration){
    /*
        * Check if the current modifier class is still ok if not check the next one.
    */
    if (true === ModifierWithinBounds(configuration.tooltipTextClass, divRect, spanRect, modifierClassName, configuration.tooltipGapSize)) return;

    const startIndex: number = configuration.tooltipModifiers.indexOf(modifierClassName);
    const classCount: number = configuration.tooltipModifiers.length;

    let index = (startIndex + 1) % classCount;//acts like circular buffer goes forward until the end and then starts from the begging beginning

    while (index != startIndex) {
        /*
            * Get the next modifier and keep checking until we are ok, or end at the starting index 
        */
        const nextModifierClass = configuration.tooltipModifiers[index];

        if (true === ModifierWithinBounds(configuration.tooltipTextClass, divRect, spanRect, nextModifierClass, configuration.tooltipGapSize)) {

            tooltipSpan.classList.add(nextModifierClass);
            tooltipSpan.classList.remove(modifierClassName);
            break;
        }

        index = (index + 1) % classCount;
    }
}
function ModifierWithinBounds(tooltipClassName : string, divRect: DOMRect, spanRect: DOMRect, modifierClassName: string, tooltipGapSize: number) : boolean {

    const viewportWidth  = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let checkTop   = divRect.top;
    let checkLeft  = divRect.left;
    let checkRight = divRect.right;
    let checBottom = divRect.bottom;
    /*
        * Rather than assign the class to get the new span bounds, I just used the existing one which means we can only use the width and height 
        * of the tooltip text span to calculate what we need. The div is static so we can use all of its location properties.
    */
    switch (modifierClassName) {
        case tooltipClassName + "--top-left":
            checkTop = divRect.top - spanRect.height - tooltipGapSize;
            checkRight = divRect.left + spanRect.width;
            checBottom = divRect.bottom - (divRect.height / 2); //if we have half of the wrapped item its ok.
            break;
        case tooltipClassName + "--top":
            checkTop   = divRect.top - spanRect.height - tooltipGapSize;
            checkLeft  = divRect.width <= spanRect.width ? divRect.left - ((spanRect.width - divRect.width) / 2) - tooltipGapSize : divRect.left;
            checkRight = divRect.width <= spanRect.width ? divRect.right + ((spanRect.width - divRect.width) / 2) + tooltipGapSize : divRect.right;
            checBottom = divRect.bottom - (divRect.height / 2); 
            break;
        case tooltipClassName + "--top-right":
            checkTop   = divRect.top    - spanRect.height - tooltipGapSize;
            checkLeft  = divRect.width <= spanRect.width ? divRect.right - spanRect.width : divRect.left;
            checBottom = divRect.bottom - (divRect.height / 2); 
            break;
        case tooltipClassName + "--right":
            checkRight = divRect.right + spanRect.width + tooltipGapSize;
            checBottom = divRect.height <= spanRect.height ? divRect.bottom + (spanRect.height - divRect.height) : divRect.bottom;
            checkTop   = divRect.height <= spanRect.height ? divRect.top - (spanRect.height - divRect.height) : divRect.top
            checkLeft  = divRect.left + (divRect.width / 2) 
            break;
        case tooltipClassName + "--bottom-left":
            checBottom = divRect.bottom + spanRect.height + tooltipGapSize;
            checkRight = divRect.left + spanRect.width;
            checkTop   = divRect.top + (divRect.height / 2);
            break;
        case tooltipClassName + "--bottom":
            checBottom = divRect.bottom + spanRect.height + tooltipGapSize;
            checkLeft  = divRect.width <= spanRect.width ? divRect.left  - ((spanRect.width - divRect.width) / 2) - tooltipGapSize : divRect.left;
            checkRight = divRect.width <= spanRect.width ? divRect.right + ((spanRect.width - divRect.width) / 2) + tooltipGapSize : divRect.right;
            checkTop = divRect.top + (divRect.height / 2);
            break;
        case tooltipClassName + "--bottom-right":
            checBottom = divRect.bottom + spanRect.height + tooltipGapSize;
            checkLeft  = divRect.width <= spanRect.width ? divRect.right - spanRect.width : divRect.left;
            checkTop   = divRect.top + (divRect.height / 2);
            break;
        case tooltipClassName + "--left":
            checkRight = divRect.right - (spanRect.width / 2);
            checkLeft  = divRect.left - spanRect.width - tooltipGapSize;
            checBottom = divRect.height <= spanRect.height ? divRect.bottom + (spanRect.height - divRect.height) : divRect.bottom;
            checkTop   = divRect.height <= spanRect.height ? divRect.top - (spanRect.height - divRect.height) : divRect.top
            break;
    }

    return (checkTop > 0 && checkTop < viewportHeight && checBottom < viewportHeight
        && checkLeft > 0 && checkLeft < viewportWidth && checkRight > 0 && checkRight < viewportWidth);
}

/*
    * For accessibility/screen readers, ensure that the tool tip text is associated to the wrapped item via the aria attribute.
*/
function checkSetAriaAttribute(childElement: HTMLElement, controlID: string, ariaAttribute: string) {

    if (childElement && false === childElement.hasAttribute(ariaAttribute)) childElement.setAttribute(ariaAttribute, controlID);
}

function handleKeyDownEvent(keyDownEvent: KeyboardEvent, configuration: ITooltipConfiguration, focusedItem: boolean = false) {

    if (_openTooltips.size === 0) return;

    //Add the hide class on tab to negate the delay that the not:hover css selector adds    
    if (focusedItem && keyDownEvent.key === "Tab") {
        _openTooltips.forEach(tooltip => addHideTooltipClass(tooltip, configuration.hideTooltipClass));
         return;
    }

    if (keyDownEvent.key.toLowerCase() === configuration.closeTooltipKey.toLowerCase()) {

        _openTooltips.forEach(tooltip => addHideTooltipClass(tooltip, configuration.hideTooltipClass));

        if (focusedItem) keyDownEvent.stopPropagation();//be restrictive when its the wrapped input handler and not the document event handler.
    }
}
/*
     * Arrow functions that return handlers so we can both use and store them for removal once complete (blazor component disposal).
*/
const createMouseEnterHandler = (tooltip, configuration):   EventListener => () => checkInitialTooltipPosition(tooltip, configuration);
const createFocusEnterHandler = (tooltip, configuration):   EventListener => () => checkInitialTooltipPosition(tooltip, configuration);
const createCloseHandler      = (tooltip, hideTooltipClass):EventListener => () => addHideTooltipClass(tooltip, hideTooltipClass);

const createKeydownHandler = (configuration: ITooltipConfiguration, focusedItem: boolean): EventListener => ((event: Event) => handleKeyDownEvent(event as KeyboardEvent, configuration, focusedItem)) as EventListener;

function configurTooltipTrigger(tooltip: HTMLElement, configuration: ITooltipConfiguration) {

    const focusableElements = tooltip.querySelectorAll(_focusElements);

    if (focusableElements.length > 0) {

        const focusableChild = focusableElements[0] as HTMLElement;
        const focusHandler   = createFocusEnterHandler(tooltip, configuration); 
        const keydownHandler = createKeydownHandler(configuration, true);
        const searchClass    = configuration.tooltipTextClass.startsWith(".") ? configuration.tooltipTextClass : "." + configuration.tooltipTextClass;
        const tooltipSpan    = tooltip.querySelector(searchClass) as HTMLElement;

        focusableChild.removeEventListener("keydown", keydownHandler);//remove does nothing if not there.
        focusableChild.removeEventListener('focus', focusHandler);

        focusableChild.addEventListener("keydown", keydownHandler);
        focusableChild.addEventListener('focus', focusHandler);
        /*
            * Store handler for later removal. 
        */
        _tooltipHandlers.set(focusableChild, {positionHandler:focusHandler, keyHandler: keydownHandler }); 
        checkSetAriaAttribute(focusableChild, tooltipSpan.id, configuration.ariaAttribute);
    }

}

function configureTooltip(tooltip: HTMLElement, configuration: ITooltipConfiguration) {

    const mouseEnterHandler: EventListener = createMouseEnterHandler(tooltip, configuration);

    tooltip.removeEventListener("mouseenter", mouseEnterHandler);
    tooltip.addEventListener("mouseenter", mouseEnterHandler);

    _tooltipHandlers.set(tooltip, { positionHandler: mouseEnterHandler });
}
function configureGlobalCloseHandler(configuration: ITooltipConfiguration) { 
    
    if (false === _isEscapeKeyHandlerRegistered) document.addEventListener("keydown", (event) => handleKeyDownEvent(event, configuration));
    /*
        * Modules are like singletons so once added will remain for the lifetime of the application instance.
    */
    _isEscapeKeyHandlerRegistered = true;
}

function configureTooltipCloseButton(tooltip: HTMLElement, configuration: ITooltipConfiguration, map: WeakMap<HTMLElement, EventListener>) {

    const searchClass = configuration.tooltipTextClass.startsWith(".") ? configuration.tooltipIconButtonClass : "." + configuration.tooltipIconButtonClass;
    const closeSpanButton = tooltip.querySelector(searchClass) as HTMLElement;

    if (!closeSpanButton) return;

    const closeButtonHandler = createCloseHandler(tooltip, configuration.hideTooltipClass);

    closeSpanButton.addEventListener("click", closeButtonHandler);

    map.set(closeSpanButton, closeButtonHandler);
}

function registerTooltip(tooltip: HTMLElement, configuration: ITooltipConfiguration) {

    configurTooltipTrigger(tooltip, configuration);
    configureTooltip(tooltip, configuration);
    configureTooltipCloseButton(tooltip, configuration, _closeButtonHandlers);
    configureGlobalCloseHandler(configuration);
}
function unRegisterTooltip(tooltip: HTMLElement, tooltipIconButtonClass:string) {

    const searchClass       = tooltipIconButtonClass.startsWith(".") ? tooltipIconButtonClass : "." + tooltipIconButtonClass;
    const closeSpanButton   = tooltip.querySelector(searchClass) as HTMLElement;
    const mouseEnterHandler = _tooltipHandlers.get(tooltip);
    const focusableElements = tooltip.querySelectorAll(_focusElements);
    /*
        * Remove our event listeners, gets called from our components Dispose method
    */
    if (mouseEnterHandler) {

        tooltip.removeEventListener("mouseenter", mouseEnterHandler.positionHandler);
        _tooltipHandlers.delete(tooltip);
    }

    if (focusableElements.length > 0) {

        const focusableChild = focusableElements[0] as HTMLElement;
        const childHandlers = _tooltipHandlers.get(focusableChild);

        if (childHandlers) {

            const { positionHandler, keyHandler } = childHandlers;

            if (positionHandler)   focusableChild.removeEventListener('focus', positionHandler);
            if (keyHandler) focusableChild.removeEventListener('keydown', keyHandler);

            _tooltipHandlers.delete(focusableChild);
        }
    }

    if (closeSpanButton) {

        const closeHandler = _closeButtonHandlers.get(closeSpanButton);

        if (closeHandler) closeSpanButton.removeEventListener("click", closeHandler);
    }
}
/*
    * Only expose our register and unregister methods from this module.
*/
export { registerTooltip, unRegisterTooltip};