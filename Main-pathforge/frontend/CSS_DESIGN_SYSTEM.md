# PathForge Design System & Component Library Documentation

## Overview

This document describes the comprehensive design system implemented across the PathForge platform. All components follow a consistent, professional SaaS-level design with dark theme, gradient accents, and smooth micro-interactions.

## CSS File Architecture

### Foundation Files (Loaded First)
1. **design-system.css** - Global CSS custom properties, resets, typography, and utility classes
2. **components.css** - Reusable UI component library (buttons, cards, inputs, badges, etc.)
3. **animations.css** - Comprehensive animation and micro-interaction effects

### Page-Specific Files
4. **variables.css** - Page-specific variable overrides
5. **styles.css** - General page styling
6. **Page-specific CSS files** - Unique styling for individual pages:
   - auth-unified.css
   - interview-prep.css, interview-prep-enhancements.css
   - profile-enhancements.css, profile-refactored.css
   - resume-dashboard.css
   - select-global.css
   - etc.

## Color Palette

### Primary Colors
- **Primary Green**: `#00ff88` (--color-primary)
- **Primary Dim**: `#00cc6a` (--color-primary-dim)
- **Secondary Cyan**: `#00d4ff` (--color-secondary)
- **Secondary Dim**: `#0099cc` (--color-secondary-dim)

### Accent Colors
- **Warning**: `#ffaa00` (--color-accent-warning)
- **Danger**: `#ff4444` (--color-accent-danger)
- **Success**: `#44ff44` (--color-accent-success)
- **Error**: `#ff4444` (--color-accent-error)

### Background Colors
- **Base**: `#0B0F1A` (--color-base)
- **Card Background**: `#111827` (--color-bg-card)
- **Surface**: `rgba(17, 24, 39, 0.8)` (--color-surface)
- **Border**: `rgba(255, 255, 255, 0.08)` (--color-border)

### Text Colors
- **Primary**: `#e8f4ff` (--color-text-primary)
- **Secondary**: `#b0c4de` (--color-text-secondary)
- **Muted**: `#8899bb` (--color-text-muted)
- **Inverse**: `#010008` (--color-text-inverse)

## Spacing Scale

All spacing uses a consistent 4px base unit:
- `--space-1`: 0.25rem (4px)
- `--space-2`: 0.5rem (8px)
- `--space-3`: 0.75rem (12px)
- `--space-4`: 1rem (16px)
- `--space-5`: 1.5rem (24px)
- `--space-6`: 2rem (32px)
- `--space-8`: 3rem (48px)
- `--space-10`: 4rem (64px)

## Border Radius Scale

- `--radius-xs`: 4px (very small elements)
- `--radius-sm`: 8px (inputs, small cards)
- `--radius-md`: 12px (buttons, modals)
- `--radius-lg`: 16px (cards, major containers)
- `--radius-xl`: 20px (sections, prominence)
- `--radius-2xl`: 24px (hero sections)
- `--radius-full`: 9999px (badges, pills)

## Shadow Scale

Progressive elevation through shadows:
- `--shadow-sm`: Small elevation (0 2px 4px)
- `--shadow-md`: Medium elevation (0 4px 8px)
- `--shadow-lg`: Large elevation (0 10px 24px)
- `--shadow-xl`: Extra large elevation (0 20px 40px)
- `--shadow-2xl`: Maximum elevation (0 25px 50px)
- `--shadow-glow-primary`: Green glow effect
- `--shadow-glow-secondary`: Cyan glow effect

## Component Library

### Buttons

#### Classes
- `.btn` - Base button style
- `.btn-primary` - Primary action button with gradient
- `.btn-secondary` - Secondary action button
- `.btn-ghost` - Transparent button with border
- `.btn-glass` - Frosted glass effect button
- `.btn-danger` - Destructive action button

#### Size Variants
- `.btn-sm` - Small button
- `.btn-md` - Medium button (default)
- `.btn-lg` - Large button
- `.btn-block` - Full-width button

#### Example
```html
<button class="btn btn-primary btn-lg">
  Primary Action
</button>
```

### Cards

#### Classes
- `.card` - Base card with glassmorphism
- `.card-sm` - Compact card variant
- `.card-lg` - Large card variant
- `.card-with-image` - Card with image header section

#### Features
- Backdrop blur effect
- Smooth hover lift animation
- Consistent border treatment
- Responsive padding

#### Example
```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>
```

### Form Inputs

#### Classes
- `.input-group` - Container for floating label input
- `.input-group input` - Text input with styling
- `.input-group label` - Floating label
- `.password-strength` - Password strength meter

#### Features
- Floating labels that animate on focus
- Custom focus states with glow effect
- Password strength indicators
- Accessible focus-visible outlines

#### Example
```html
<div class="input-group">
  <input type="email" placeholder=" ">
  <label>Email Address</label>
</div>
```

### Badges

#### Classes
- `.badge` - Base badge
- `.badge-primary`, `.badge-secondary`, `.badge-success`, `.badge-warning`, `.badge-danger`
- `.badge.filled` - Filled badge variant

#### Example
```html
<span class="badge badge-primary">New</span>
<span class="badge badge-success filled">Active</span>
```

### Tabs

#### Structure
```html
<div class="tabs" role="tablist">
  <button class="tab-button active" role="tab">Tab 1</button>
  <button class="tab-button" role="tab">Tab 2</button>
</div>
<div class="tab-content active">Content 1</div>
<div class="tab-content">Content 2</div>
```

### Accordion

#### Structure
```html
<div class="accordion">
  <div class="accordion-item open">
    <button class="accordion-header">
      <span class="accordion-title">Item Title</span>
      <span class="accordion-toggle">▼</span>
    </button>
    <div class="accordion-content">
      Accordion content here
    </div>
  </div>
</div>
```

### Modal

#### Structure
```html
<div class="modal-backdrop active">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Modal Title</h2>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-content">
      Modal content here
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### Alerts

#### Classes
- `.alert` - Base alert container
- `.alert-success` - Success alert
- `.alert-warning` - Warning alert
- `.alert-danger` - Danger/error alert
- `.alert-info` - Information alert

#### Example
```html
<div class="alert alert-success">
  <div class="alert-icon">✓</div>
  <div class="alert-content">
    <div class="alert-title">Success!</div>
    Operation completed successfully
  </div>
  <button class="alert-close">×</button>
</div>
```

## Animations & Micro-interactions

### Entrance Animations
- `fadeIn` - Simple fade in
- `slideUp` - Slide up from below
- `slideDown` - Slide down from above
- `slideLeft` - Slide from right
- `slideRight` - Slide from left
- `scaleIn` - Scale from 0.95 to 1
- `popIn` - Pop with overshoot effect

### Emphasis Animations
- `pulse` - Pulsing opacity
- `float` - Floating up and down
- `glow` - Glowing box shadow
- `shimmer` - Loading shimmer effect
- `bounce` - Bouncing motion

### Utility Animation Classes
- `.animate-fade-in` - Apply fade in animation
- `.animate-slide-up` - Apply slide up animation
- `.animate-pulse` - Apply pulse animation
- `.animate-spin` - Apply spinning animation

### Staggered Animations
```html
<div class="stagger-item">Item 1</div>
<div class="stagger-item">Item 2</div>
<div class="stagger-item">Item 3</div>
```

## Responsive Breakpoints

The design system supports responsive design at key breakpoints:

- **Desktop**: 1200px+ (full layout)
- **Tablet**: 900px-1200px (two-column becomes single)
- **Mobile**: 600px-900px (compact layout)
- **Small Mobile**: <600px (full-width stacked)

### Utility Classes
- `.hide-mobile` - Hide on screens ≤768px
- `.hide-small` - Hide on screens ≤600px
- `.space-mobile-sm` - Reduced gap on mobile

## Typography

### Font Family
All text uses: `'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### Font Weights
- Light: 300
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Size Scale
- `--text-xs`: 0.75rem (12px)
- `--text-sm`: 0.875rem (14px)
- `--text-base`: 1rem (16px)
- `--text-lg`: 1.125rem (18px)
- `--text-xl`: 1.25rem (20px)
- `--text-2xl`: 1.5rem (24px)
- `--text-3xl`: 1.875rem (30px)
- `--text-4xl`: 2.25rem (36px)

### Line Heights
- Tight: 1.2
- Normal: 1.5 (default)
- Relaxed: 1.75

## Utility Classes

### Spacing
- `.mt-{1-6}` - Margin top
- `.mb-{1-6}` - Margin bottom
- `.p-{4,6,8}` - Padding
- `.gap-{2,4,6}` - Gap between flex/grid items

### Flexbox
- `.flex` - Display flex
- `.flex-col` - Flex column
- `.flex-center` - Center both axes
- `.flex-between` - Space between
- `.flex-wrap` - Wrap items

### Grid
- `.grid` - Display grid
- `.grid-cols-{1-4}` - Grid columns

### Text
- `.text-center` - Text center
- `.text-uppercase` - Uppercase text
- `.text-muted` - Muted text color
- `.text-primary` - Primary color text
- `.font-bold` - Bold text
- `.font-semibold` - Semibold text

### Background & Border
- `.bg-card` - Card background color
- `.bg-transparent` - Transparent background
- `.border` - Full border
- `.border-top` - Top border only
- `.rounded-lg` - Large border radius
- `.rounded-xl` - Extra large border radius

## Advanced Features

### Glassmorphism
All cards and overlays use:
- `backdrop-filter: blur(20px)`
- Semi-transparent background
- Border with opacity for definition

### Gradient Accents
Primary gradient buttons use:
```css
background: linear-gradient(135deg, #00ff88, #00cc6a);
```

Secondary gradient uses:
```css
background: linear-gradient(135deg, #00d4ff, #0099cc);
```

### Accessibility

#### WCAG AA Compliance
- Minimum touch targets: 44px (48px on mobile)
- Contrast ratio: 4.5:1 minimum
- Focus indicators: Visible `focus-visible` outline
- Motion: Respects `prefers-reduced-motion` setting

#### Keyboard Navigation
All interactive elements are keyboard accessible:
- Buttons: Tab, Enter/Space to activate
- Dropdowns: Tab, Arrow keys, Enter to select
- Modals: Tab trapped, Escape to close

### Performance Optimizations
- CSS custom properties for theme switching
- GPU acceleration with `transform: translate3d(0, 0, 0)`
- `will-change` properties on animated elements
- Minimal reflows through property optimization

## Dark Mode Support

All colors are optimized for dark mode:
- `prefers-color-scheme: dark` media query used
- High contrast ratios for accessibility
- Glow effects reduced in dark environments

## Transition Durations

Standard transitions for consistency:
- Fast: 150ms (quick interaction feedback)
- Normal: 300ms (default transitions)
- Slow: 500ms (emphasis animations)

### Easing Functions
- `--ease-in`: `cubic-bezier(0.4, 0, 1, 1)`
- `--ease-out`: `cubic-bezier(0, 0, 0.2, 1)`
- `--ease-in-out`: `cubic-bezier(0.4, 0, 0.2, 1)`
- `--ease-bouncy`: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`

## Common Patterns

### Form with Floating Labels
```html
<form>
  <div class="input-group">
    <input type="email" placeholder=" ">
    <label>Email</label>
  </div>
  <button class="btn btn-primary">Submit</button>
</form>
```

### Card Grid Layout
```html
<div class="grid grid-cols-3">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>
```

### Action Menu
```html
<div class="flex flex-between">
  <h2>Section Title</h2>
  <div class="flex gap-3">
    <button class="btn btn-secondary">Secondary</button>
    <button class="btn btn-primary">Primary</button>
  </div>
</div>
```

## Best Practices

### Don't
- Don't use hardcoded colors - use CSS custom properties
- Don't add inconsistent spacing - use the spacing scale
- Don't create new animations - use the animation library
- Don't skip using semantic HTML for accessibility
- Don't ignore the responsive breakpoints

### Do
- Do use existing component classes before creating new styles
- Do follow the spacing scale (--space-{n})
- Do use utility classes for common patterns
- Do ensure keyboard accessibility
- Do test animations with `prefers-reduced-motion`
- Do use backdrop filters for glass effects
- Do apply shadow scale consistently
- Do use gradients for emphasis (buttons, badges)

## Migration Guide

### Moving to New Design System

1. **Update CSS links** in HTML head:
   ```html
   <link rel="stylesheet" href="css/design-system.css">
   <link rel="stylesheet" href="css/components.css">
   <link rel="stylesheet" href="css/animations.css">
   <!-- Then page-specific styles -->
   ```

2. **Replace hardcoded values** with CSS custom properties:
   - Colors: `var(--color-primary)`, etc.
   - Spacing: `var(--space-4)`, etc.
   - Radii: `var(--radius-lg)`, etc.
   - Shadows: `var(--shadow-lg)`, etc.

3. **Use component classes** instead of custom styles:
   - Buttons: Use `.btn`, `.btn-primary`, etc.
   - Cards: Use `.card`, `.card-lg`, etc.
   - Forms: Use `.input-group`, `.password-strength`, etc.

4. **Import animations** by adding animation class names:
   - `class="animate-fade-in"`
   - `class="animate-slide-up"`
   - `class="hover-lift"`

## Future Enhancements

Potential areas for expansion:
- Dark/Light theme toggle using CSS custom properties
- Additional icon set for common UI elements
- Form validation error states
- Data visualization components (charts, graphs)
- Table component library
- Breadcrumb navigation patterns
- Pagination components
- File upload components

## Support & Feedback

For questions or issues with the design system:
1. Review this documentation
2. Check existing component examples
3. Review the CSS files for variable definitions
4. Test changes locally before committing

---

**Design System Version**: 2.0  
**Last Updated**: 2025  
**Maintained By**: PathForge Development Team
