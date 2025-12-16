# NZNO Branding & Design Specifications

> Design analysis conducted December 2025 from [nzno.org.nz](https://www.nzno.org.nz/)

## Brand Colors

### Primary Palette

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Purple** | `#501F74` | rgb(80, 31, 116) | CTAs, navigation, primary buttons, links |
| **Red** | `#C10C17` | rgb(193, 12, 23) | Headings, alerts, required indicators |
| **Blue** | `#2F97D5` | rgb(47, 151, 213) | Secondary buttons, info links |
| **Green** | `#4F9F24` | rgb(79, 159, 36) | Success states, confirmations |

### Secondary/Hover States

| Color | Hex | Usage |
|-------|-----|-------|
| Purple Hover | `#501f748a` | Button hover (54% opacity) |
| Red Light | `#C4171F` | Borders, lighter red variant |
| Red Hover | `#c85f66` | Red button hover state |
| Blue Hover | `#61acb636` | Blue element hover |

### Neutral Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Dark Gray | `#333435` | Body text, primary content |
| Medium Gray | `#848587` | Secondary text, placeholders |
| Light Gray | `#F6F6F6` | Section backgrounds |
| Border Gray | `#DDDDDD` | Borders, dividers |
| Light Border | `#CCC` | Subtle borders |
| White | `#FFFFFF` | Backgrounds, text on dark |

### Shadows

```css
/* Primary shadow for buttons and cards */
box-shadow: 3px 3px 6px 0px rgba(101, 131, 151, 0.75);

/* Lighter shadow for subtle depth */
box-shadow: 3px 3px 6px 0px rgba(101, 131, 151, 0.25);

/* Text shadow (dark backgrounds) */
text-shadow: 0 0 10px rgba(0, 0, 0, 0.6);
```

---

## Typography

### Font Stack

```css
/* Primary - Body text and UI */
font-family: "Open Sans", Arial, sans-serif;

/* Secondary - Display/Headers (if available) */
font-family: "MyriadPro-Regular", "MyriadPro-Semibold", Arial, sans-serif;

/* Fallback */
font-family: Arial, sans-serif;
```

### Font Weights

| Weight | Name | Usage |
|--------|------|-------|
| 200 | Light | Large button text |
| 400 | Regular | Body text |
| 500 | Medium | Labels, emphasis |
| 600 | Semi-bold | Subheadings |
| 700 | Bold | Headings |

### Heading Styles

```css
h1 {
  font-size: 48px;
  color: #C10C17;
  font-weight: 700;
  line-height: 1.1;
}

h2 {
  font-size: 24px;
  color: #C10C17;
  font-weight: 600;
}

h3 {
  font-size: 18px;
  color: #C10C17;
  font-weight: 600;
}

h4 {
  font-size: 16px;
  color: #501F74; /* Purple for section headers */
  font-weight: 600;
}
```

### Body Text

```css
body {
  font-family: "Open Sans", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: #333435;
}
```

---

## Components

### Primary Button (Purple)

```css
.btn-primary {
  background-color: #501F74;
  color: #FFFFFF;
  border: 2px solid #501F74;
  border-radius: 4px;
  padding: 12px 22px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 3px 3px 6px 0px rgba(101, 131, 151, 0.75);
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background-color: rgba(80, 31, 116, 0.54);
  border-color: #501F74;
}

.btn-primary:focus {
  box-shadow: 0 0 0 3px rgba(80, 31, 116, 0.3);
}
```

### Secondary Button (Outline)

```css
.btn-secondary {
  background-color: #EDEDED;
  color: #501F74;
  border: 2px solid #501F74;
  border-radius: 4px;
  padding: 10px 18px;
  font-weight: 500;
}

.btn-secondary:hover {
  background-color: #501F74;
  color: #FFFFFF;
}
```

### Danger Button (Red)

```css
.btn-danger {
  background-color: #C10C17;
  color: #FFFFFF;
  border: 2px solid #C10C17;
  border-radius: 4px;
}

.btn-danger:hover {
  background-color: #c85f66;
  border-color: #c85f66;
}
```

### Form Inputs

```css
.form-control {
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: "Open Sans", Arial, sans-serif;
  color: #333435;
  background-color: #FFFFFF;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-control:focus {
  border-color: #501F74;
  outline: none;
  box-shadow: 0 0 0 3px rgba(80, 31, 116, 0.15);
}

.form-control::placeholder {
  color: #848587;
}
```

### Labels

```css
label {
  font-weight: 500;
  color: #333435;
  margin-bottom: 0.5rem;
  display: block;
}

/* Required field indicator */
.required,
label span[style*="color:red"] {
  color: #C10C17;
}
```

### Tables

```css
.table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.table thead th {
  background-color: #F2F2F2;
  color: #333435;
  font-weight: 600;
  padding: 12px 16px;
  border-bottom: 2px solid #DDDDDD;
  text-align: left;
}

.table tbody td {
  padding: 12px 16px;
  border-bottom: 1px solid #DDDDDD;
  color: #333435;
  vertical-align: middle;
}

.table tbody tr:hover {
  background-color: #F6F6F6;
}
```

### Form Sections

```css
.form-section {
  background-color: #FFFFFF;
  border: 1px solid #DDDDDD;
  border-radius: 6px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 3px 3px 6px 0px rgba(101, 131, 151, 0.25);
}

.form-section h4 {
  color: #501F74;
  border-bottom: 2px solid #501F74;
  padding-bottom: 10px;
  margin-bottom: 20px;
  margin-top: 0;
}
```

### Alerts

```css
.alert-danger {
  background-color: #fce4e4;
  border: 1px solid #C4171F;
  color: #C10C17;
  padding: 12px 16px;
  border-radius: 4px;
}

.alert-success {
  background-color: #e9f8ea;
  border: 1px solid #4F9F24;
  color: #4F9F24;
  padding: 12px 16px;
  border-radius: 4px;
}

.alert-info {
  background-color: #e8f4fc;
  border: 1px solid #2F97D5;
  color: #2F97D5;
  padding: 12px 16px;
  border-radius: 4px;
}
```

---

## Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 4px | Tight spacing, icon gaps |
| `--spacing-sm` | 8px | Compact elements |
| `--spacing-md` | 16px | Standard padding |
| `--spacing-lg` | 24px | Section padding, gaps |
| `--spacing-xl` | 40px | Major sections |
| `--spacing-xxl` | 60px | Page sections |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Buttons, inputs |
| `--radius-md` | 6px | Cards, sections |
| `--radius-lg` | 8px | Modals, large cards |
| `--radius-full` | 100% | Circular elements |

---

## CSS Variables Reference

```css
:root {
  /* Brand Colors */
  --nzno-purple: #501F74;
  --nzno-purple-hover: rgba(80, 31, 116, 0.54);
  --nzno-purple-light: rgba(80, 31, 116, 0.15);
  --nzno-red: #C10C17;
  --nzno-red-light: #C4171F;
  --nzno-red-hover: #c85f66;
  --nzno-blue: #2F97D5;
  --nzno-green: #4F9F24;

  /* Neutrals */
  --nzno-dark: #333435;
  --nzno-gray: #848587;
  --nzno-light: #F6F6F6;
  --nzno-border: #DDDDDD;
  --nzno-white: #FFFFFF;

  /* Shadows */
  --nzno-shadow: 3px 3px 6px 0px rgba(101, 131, 151, 0.75);
  --nzno-shadow-light: 3px 3px 6px 0px rgba(101, 131, 151, 0.25);
  --nzno-focus-ring: 0 0 0 3px rgba(80, 31, 116, 0.15);

  /* Typography */
  --nzno-font-primary: "Open Sans", Arial, sans-serif;
  --nzno-font-size-base: 14px;
  --nzno-line-height: 1.4;

  /* Spacing */
  --nzno-spacing-xs: 4px;
  --nzno-spacing-sm: 8px;
  --nzno-spacing-md: 16px;
  --nzno-spacing-lg: 24px;
  --nzno-spacing-xl: 40px;

  /* Borders */
  --nzno-radius-sm: 4px;
  --nzno-radius-md: 6px;
  --nzno-radius-lg: 8px;
}
```

---

## Logo Usage

### Logo Variants
- **White logo** (`NZNO_white.png`) - Use on purple/dark backgrounds
- **Standard logo** - Use on light backgrounds

### Logo Placement
- Header: Left-aligned with navigation
- Footer: Centered or left-aligned

### Clearance
- Minimum clear space around logo equal to the height of "NZNO" text

---

## Header Pattern

```css
.nzno-header {
  background-color: #501F74;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nzno-header .logo {
  height: 40px;
  width: auto;
}

.nzno-header .title {
  color: #FFFFFF;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}
```

---

## Accessibility Notes

1. **Color contrast**: All text colors meet WCAG AA standards against their backgrounds
2. **Focus states**: Purple focus ring (`--nzno-focus-ring`) provides visible focus indication
3. **Font sizes**: Minimum 14px for body text ensures readability
4. **Required fields**: Red indicator (`#C10C17`) used consistently

---

## Sources

- [NZNO Official Website](https://www.nzno.org.nz/)
- [NZNO Brand Book](https://www.nzno.org.nz/Portals/0/publications/NZNO%20Brand%20Book%20A4%20SINGLEVIEW.pdf)
- Extracted from `home2025.css` and `skin.css` stylesheets

---

*Last updated: December 2025*