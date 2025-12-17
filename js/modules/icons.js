/**
 * Icon System Module
 * Purpose: Provide inline SVG icons with currentColor support
 * Author: Claude Code
 * Date: December 2025
 *
 * Features:
 * - Inline SVG icons for better control
 * - currentColor support for theming
 * - Multiple sizes
 * - Accessible with aria-hidden
 */

/**
 * Icon definitions as SVG path data
 */
const ICON_PATHS = {
  check: {
    viewBox: '0 0 20 20',
    path: 'M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z'
  },
  x: {
    viewBox: '0 0 14 14',
    path: 'M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z'
  },
  warning: {
    viewBox: '0 0 20 18',
    path: 'M1 18H19L10 2L1 18ZM11 16H9V14H11V16ZM11 12H9V8H11V12Z'
  },
  info: {
    viewBox: '0 0 20 20',
    path: 'M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z'
  },
  spinner: {
    viewBox: '0 0 24 24',
    path: 'M12 2C6.48 2 2 6.48 2 12H5C5 8.13 8.13 5 12 5V2Z'
  },
  trash: {
    viewBox: '0 0 16 18',
    path: 'M3 18C3 19.1 3.9 20 5 20H13C14.1 20 15 19.1 15 18V6H3V18ZM5 8H13V18H5V8ZM12.5 1L11.5 0H6.5L5.5 1H2V3H16V1H12.5Z'
  },
  plus: {
    viewBox: '0 0 16 16',
    path: 'M14 7H9V2H7V7H2V9H7V14H9V9H14V7Z'
  },
  minus: {
    viewBox: '0 0 16 16',
    path: 'M2 7H14V9H2V7Z'
  },
  chevronDown: {
    viewBox: '0 0 16 16',
    path: 'M4.47 5.47L8 9L11.53 5.47L13 7L8 12L3 7L4.47 5.47Z'
  },
  chevronUp: {
    viewBox: '0 0 16 16',
    path: 'M11.53 10.53L8 7L4.47 10.53L3 9L8 4L13 9L11.53 10.53Z'
  },
  file: {
    viewBox: '0 0 16 20',
    path: 'M10 0H2C0.9 0 0 0.9 0 2V18C0 19.1 0.9 20 2 20H14C15.1 20 16 19.1 16 18V6L10 0ZM14 18H2V2H9V7H14V18Z'
  },
  calendar: {
    viewBox: '0 0 18 20',
    path: 'M16 2H15V0H13V2H5V0H3V2H2C0.9 2 0 2.9 0 4V18C0 19.1 0.9 20 2 20H16C17.1 20 18 19.1 18 18V4C18 2.9 17.1 2 16 2ZM16 18H2V8H16V18ZM16 6H2V4H16V6Z'
  },
  user: {
    viewBox: '0 0 20 20',
    path: 'M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 3C11.66 3 13 4.34 13 6C13 7.66 11.66 9 10 9C8.34 9 7 7.66 7 6C7 4.34 8.34 3 10 3ZM10 17.2C7.5 17.2 5.29 15.92 4 13.98C4.03 11.99 8 10.9 10 10.9C11.99 10.9 15.97 11.99 16 13.98C14.71 15.92 12.5 17.2 10 17.2Z'
  }
};

/**
 * Default icon sizes
 */
const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32
};

/**
 * Creates an SVG icon element
 * @param {string} name - Icon name from ICON_PATHS
 * @param {object} options - Icon options
 * @param {string} [options.size='md'] - Size: 'xs', 'sm', 'md', 'lg', 'xl' or number
 * @param {string} [options.className] - Additional CSS classes
 * @param {string} [options.color] - Color override (defaults to currentColor)
 * @returns {SVGElement|null} The SVG element or null if icon not found
 */
export function createIcon(name, options = {}) {
  const iconData = ICON_PATHS[name];
  if (!iconData) {
    console.warn(`[Icons] Unknown icon: ${name}`);
    return null;
  }

  const {
    size = 'md',
    className = '',
    color = 'currentColor'
  } = options;

  // Determine pixel size
  const pixelSize = typeof size === 'number' ? size : (ICON_SIZES[size] || ICON_SIZES.md);

  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(pixelSize));
  svg.setAttribute('height', String(pixelSize));
  svg.setAttribute('viewBox', iconData.viewBox);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('icon', `icon-${name}`);

  if (className) {
    className.split(' ').forEach(cls => {
      if (cls) svg.classList.add(cls);
    });
  }

  // Create path element
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', iconData.path);
  path.setAttribute('fill', color);

  svg.appendChild(path);
  return svg;
}

/**
 * Creates an animated spinner icon
 * @param {object} options - Icon options
 * @returns {SVGElement} Spinner SVG element
 */
export function createSpinnerIcon(options = {}) {
  const icon = createIcon('spinner', options);
  if (icon) {
    icon.classList.add('icon-spinner-animated');
    icon.style.animation = 'spinner-rotate 0.8s linear infinite';
  }
  return icon;
}

/**
 * Gets icon HTML string for use in templates
 * @param {string} name - Icon name
 * @param {object} options - Icon options
 * @returns {string} HTML string of the icon
 */
export function getIconHTML(name, options = {}) {
  const icon = createIcon(name, options);
  if (!icon) return '';

  const wrapper = document.createElement('div');
  wrapper.appendChild(icon);
  return wrapper.innerHTML;
}

/**
 * Replaces placeholder elements with icons
 * @param {HTMLElement} container - Container to search within
 */
export function replaceIconPlaceholders(container = document) {
  const placeholders = container.querySelectorAll('[data-icon]');

  placeholders.forEach(placeholder => {
    const iconName = placeholder.dataset.icon;
    const size = placeholder.dataset.iconSize || 'md';
    const className = placeholder.dataset.iconClass || '';

    const icon = createIcon(iconName, { size, className });
    if (icon) {
      placeholder.replaceWith(icon);
    }
  });
}

/**
 * Gets list of available icon names
 * @returns {string[]} Array of icon names
 */
export function getAvailableIcons() {
  return Object.keys(ICON_PATHS);
}

// Export icon data for reference
export { ICON_PATHS, ICON_SIZES };
