/**
 * Build styles
 */
require('./index.css').toString();

/**
 * Marker Tool for the Editor.js
 *
 * Allows to wrap inline fragment and style it somehow.
 */
class Marker {
  /**
   * Class name for term-tag
   *
   * @type {string}
   */
  static get CSS() {
    return 'cdx-marker';
  };

  /**
   * @param {{api: object}}  - Editor.js API
   */
  constructor({api, config}) {
    this.api = api;
    this.config = config;
    this.defaultColors = this.config.defaultColors || [];

    /**
     * Toolbar Button
     *
     * @type {HTMLElement|null}
     */
    this.button = null;

    /**
     * Tag represented the term
     *
     * @type {string}
     */
    this.tag = 'MARK';

    /**
     * CSS classes
     */
    this.iconClasses = {
      base: this.api.styles.inlineToolButton,
      active: this.api.styles.inlineToolButtonActive
    };
  }

  /**
   * Specifies Tool as Inline Toolbar Tool
   *
   * @return {boolean}
   */
  static get isInline() {
    return true;
  }

  /**
   * Create button element for Toolbar
   *
   * @return {HTMLElement}
   */
  render() {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add(this.iconClasses.base);
    this.button.innerHTML = this.toolboxIcon;

    return this.button;
  }


  renderActions() {
    this.wrapper = document.createElement('div')
    this.wrapper.style.padding = '8px'

    if(this.defaultColors.length) {
      const label = document.createElement('small')
      label.innerHTML = 'Marker Color'
      this.wrapper.append(label)
    }

    this.wrapper.hidden = true

    const inputWrapper = document.createElement('div')

    this.wrapper.appendChild(inputWrapper)

    this.defaultColors.forEach((color) => {
      const button = document.createElement('button')
      button.style.backgroundColor = color
      button.style.width = '25px'
      button.style.height = '25px'
      this.wrapper.appendChild(button)
    })

    return this.wrapper
  }

  /**
   * Wrap/Unwrap selected fragment
   *
   * @param {Range} range - selected fragment
   */
  surround(range) {
    if (!range) {
      return;
    }

    let termWrapper = this.api.selection.findParentTag(this.tag, Marker.CSS);

    /**
     * If start or end of selection is in the highlighted block
     */
    if (termWrapper) {
      this.unwrap(termWrapper);
    } else {
      this.wrap(range);
    }
  }

  /**
   * Wrap selection with term-tag
   *
   * @param {Range} range - selected fragment
   */
  wrap(range) {
    /**
     * Create a wrapper for highlighting
     */
    let marker = document.createElement(this.tag);

    marker.classList.add(Marker.CSS);

    /**
     * SurroundContent throws an error if the Range splits a non-Text node with only one of its boundary points
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Range/surroundContents}
     *
     * // range.surroundContents(span);
     */
    marker.appendChild(range.extractContents());
    range.insertNode(marker);

    /**
     * Expand (add) selection to highlighted block
     */
    this.api.selection.expandToTag(marker);
  }

  /**
   * Unwrap term-tag
   *
   * @param {HTMLElement} termWrapper - term wrapper tag
   */
  unwrap(termWrapper) {
    /**
     * Expand selection to all term-tag
     */
    this.api.selection.expandToTag(termWrapper);

    let sel = window.getSelection();
    let range = sel.getRangeAt(0);

    let unwrappedContent = range.extractContents();

    /**
     * Remove empty term-tag
     */
    termWrapper.parentNode.removeChild(termWrapper);

    /**
     * Insert extracted content
     */
    range.insertNode(unwrappedContent);

    /**
     * Restore selection
     */
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Check and change Term's state for current selection
   */
  checkState() {
    const termTag = this.api.selection.findParentTag(this.tag, Marker.CSS);

    if (this.defaultColors && this.defaultColors.length) {
      this.state = !!termTag

      if (this.state) {
        this.showActions(termTag)
      } else {
        this.hideActions()
      }
      return this.state
    } else {
      this.button.classList.toggle(this.iconClasses.active, !!termTag);
    }
  }

  showActions(span) {

    this.defaultColors.forEach((color, index) => {
      this.wrapper.children.item(
        index + 1
      ).onclick = () => {
        span.style.backgroundColor = color
        span.style.color = this.isLight(color) ? 'black': 'white';
      }
    })

    this.wrapper.hidden = false
  }

  hideActions() {
    this.wrapper.hidden = true
  }

  isLight(color) {
    const [red, green, blue] = this.hexToRgb(color);
    const luminance = (0.299 * red + 0.587 * green + 0.114 * blue)/255;
    return luminance > 0.5;
  }

   hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }

  /**
   * Get Tool icon's SVG
   * @return {string}
   */
  get toolboxIcon() {
    return require('./../assets/icon.svg').default;
  }

  /**
   * Sanitizer rule
   * @return {{mark: {class: string}}}
   */
  static get sanitize() {
    return {
      mark: {
        class: Marker.CSS,
        style: true,
      }
    };
  }
}

module.exports = Marker;
