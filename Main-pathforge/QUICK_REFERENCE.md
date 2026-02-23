# PathForge Design System - Quick Reference Guide

## CSS Loading Order (in HTML Head)

```html
<!-- 1. Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:..." rel="stylesheet">

<!-- 2. Global Design System (ALWAYS FIRST) -->
<link rel="stylesheet" href="css/design-system.css">

<!-- 3. Component Library -->
<link rel="stylesheet" href="css/components.css">

<!-- 4. Animations Library -->
<link rel="stylesheet" href="css/animations.css">

<!-- 5. Page-Specific Variables/Overrides -->
<link rel="stylesheet" href="css/variables.css">

<!-- 6. General Styling -->
<link rel="stylesheet" href="css/styles.css">

<!-- 7. Page-Specific Styles -->
<link rel="stylesheet" href="css/interview-prep.css">
<link rel="stylesheet" href="css/interview-prep-enhancements.css">

<!-- 8. Specialized Modules -->
<link rel="stylesheet" href="css/resume-dashboard.css">
<link rel="stylesheet" href="css/select-global.css">
```

## Color Palette Quick Reference

### Use Case Matrix
| Use Case | CSS Variable | Hex Value | Usage |
|----------|---|---|---|
| Primary Buttons | `var(--color-primary)` | #00ff88 | Main CTAs |
| Primary Hover | `var(--color-primary-dim)` | #00cc6a | Button hover state |
| Secondary Buttons | `var(--color-secondary)` | #00d4ff | Secondary CTAs |
| Warning/Alert | `var(--color-accent-warning)` | #ffaa00 | Alert colors |
| Error/Danger | `var(--color-accent-danger)` | #ff4444 | Destructive actions |
| Success | `var(--color-accent-success)` | #44ff44 | Confirmation |
| Text Primary | `var(--color-text-primary)` | #e8f4ff | Main body text |
| Text Secondary | `var(--color-text-secondary)` | #b0c4de | Labels, helper text |
| Text Muted | `var(--color-text-muted)` | #8899bb | Disabled, subtle |
| Card Background | `var(--color-bg-card)` | #111827 | Card fills |
| Border | `var(--color-border)` | rgba(255,255,255,0.08) | Dividers, outlines |

## Common Patterns

### 1. Create a Button
```html
<!-- Primary -->
<button class="btn btn-primary">Click Me</button>

<!-- Secondary -->
<button class="btn btn-secondary">Secondary</button>

<!-- Ghost (outline) -->
<button class="btn btn-ghost">Outline</button>

<!-- Large button -->
<button class="btn btn-primary btn-lg">Large Button</button>

<!-- With icon -->
<button class="btn btn-primary">
  <svg>...</svg>
  Button Text
</button>
```

### 2. Create a Card
```html
<!-- Basic card -->
<div class="card">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

<!-- Large card -->
<div class="card card-lg">
  Content here
</div>

<!-- Small/compact card -->
<div class="card card-sm">
  Content here
</div>

<!-- With image -->
<div class="card card-with-image">
  <div class="card-image">
    <img src="..." alt="">
  </div>
  <h3>Title</h3>
  <p>Content</p>
</div>
```

### 3. Create a Form Input
```html
<!-- Floating label input -->
<div class="input-group">
  <input type="email" placeholder=" " id="email">
  <label for="email">Email Address</label>
</div>

<!-- Password with strength meter -->
<div class="input-group">
  <input type="password" placeholder=" " id="pwd">
  <label for="pwd">Password</label>
</div>
<div class="password-strength">
  <div class="strength-bar weak"></div>
  <div class="strength-bar"></div>
  <div class="strength-bar"></div>
  <div class="strength-bar"></div>
</div>

<!-- Select with dark styling (auto-applied) -->
<select>
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### 4. Create a Badge
```html
<!-- Outlined badges -->
<span class="badge badge-primary">New</span>
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-danger">Error</span>

<!-- Filled badges -->
<span class="badge badge-primary filled">Active</span>
<span class="badge badge-success filled">Approved</span>
```

### 5. Create Tabs
```html
<div class="tabs" role="tablist">
  <button class="tab-button active" role="tab" aria-selected="true">
    Tab 1
  </button>
  <button class="tab-button" role="tab" aria-selected="false">
    Tab 2
  </button>
</div>

<div class="tab-content active">
  Content for Tab 1
</div>
<div class="tab-content">
  Content for Tab 2
</div>
```

### 6. Create an Accordion
```html
<div class="accordion">
  <div class="accordion-item open">
    <button class="accordion-header">
      <span class="accordion-title">Item Title</span>
      <span class="accordion-toggle">▼</span>
    </button>
    <div class="accordion-content">
      Content here
    </div>
  </div>
  
  <div class="accordion-item">
    <button class="accordion-header">
      <span class="accordion-title">Item 2</span>
      <span class="accordion-toggle">▼</span>
    </button>
    <div class="accordion-content">
      More content
    </div>
  </div>
</div>
```

### 7. Create an Alert
```html
<!-- Success -->
<div class="alert alert-success">
  <div class="alert-icon">✓</div>
  <div class="alert-content">
    <div class="alert-title">Success!</div>
    Your action was completed.
  </div>
  <button class="alert-close">×</button>
</div>

<!-- Warning -->
<div class="alert alert-warning">
  <div class="alert-icon">⚠</div>
  <div class="alert-content">
    <div class="alert-title">Warning</div>
    Please review this.
  </div>
</div>

<!-- Error -->
<div class="alert alert-danger">
  <div class="alert-icon">✕</div>
  <div class="alert-content">
    <div class="alert-title">Error</div>
    Something went wrong.
  </div>
</div>
```

### 8. Create a Modal
```html
<div class="modal-backdrop active">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Modal Title</h2>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-content">
      Modal content goes here
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

## Animation Classes

### Entrance Animations
```html
<!-- Fade in -->
<div class="animate-fade-in">Content</div>

<!-- Slide up -->
<div class="animate-slide-up">Content</div>

<!-- Scale in -->
<div class="animate-scale-in">Content</div>

<!-- Pop in (overshoot) -->
<div class="animate-pop-in">Content</div>
```

### Emphasis Animations
```html
<!-- Pulsing -->
<div class="animate-pulse">Content</div>

<!-- Floating -->
<div class="animate-float">Content</div>

<!-- Glowing -->
<div class="animate-glow">Content</div>

<!-- Spinning -->
<div class="animate-spin">Content</div>

<!-- Bouncing -->
<div class="animate-bounce">Content</div>
```

### Hover Effects
```html
<!-- Lift on hover -->
<div class="hover-lift">Hovers up</div>

<!-- Glow on hover -->
<div class="hover-glow">Glows on hover</div>

<!-- Link with underline animation -->
<a href="#" class="link-underline">Link Text</a>
```

### Staggered Animations
```html
<div class="stagger-item">Item 1</div> <!-- 0.1s delay -->
<div class="stagger-item">Item 2</div> <!-- 0.2s delay -->
<div class="stagger-item">Item 3</div> <!-- 0.3s delay -->
<div class="stagger-item">Item 4</div> <!-- 0.4s delay -->
<div class="stagger-item">Item 5</div> <!-- 0.5s delay -->
```

## Layout Utilities

### Flexbox
```html
<!-- Flex row (default) -->
<div class="flex">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Flex column -->
<div class="flex flex-col">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Centered -->
<div class="flex flex-center">
  Centered content
</div>

<!-- Space between -->
<div class="flex flex-between">
  <div>Left</div>
  <div>Right</div>
</div>

<!-- With gap -->
<div class="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Grid
```html
<!-- 2 columns -->
<div class="grid grid-cols-2">
  <div>Cell 1</div>
  <div>Cell 2</div>
</div>

<!-- 3 columns -->
<div class="grid grid-cols-3">
  <div>Cell 1</div>
  <div>Cell 2</div>
  <div>Cell 3</div>
</div>

<!-- 4 columns -->
<div class="grid grid-cols-4">
  <div>Cell 1</div>
  <div>Cell 2</div>
  <div>Cell 3</div>
  <div>Cell 4</div>
</div>
```

## Spacing

### Margin/Padding (in rem units)
```css
mt-1 (margin-top: 0.25rem)
mt-2 (margin-top: 0.5rem)
mt-3 (margin-top: 0.75rem)
mt-4 (margin-top: 1rem)
mt-5 (margin-top: 1.5rem)
mt-6 (margin-top: 2rem)

mb-* (same as mt-)
p-4 (padding: 1rem)
p-6 (padding: 2rem)
p-8 (padding: 3rem)

gap-2 (gap: 0.5rem)
gap-4 (gap: 1rem)
gap-6 (gap: 2rem)
```

## Responsive Behavior

### Hide on small screens
```html
<!-- Hide on mobile (≤768px) -->
<div class="hide-mobile">Desktop only</div>

<!-- Hide on very small (≤600px) -->
<div class="hide-small">Small screen hidden</div>

<!-- Reduced gap on mobile -->
<div class="flex space-mobile-sm">Items with small gap on mobile</div>
```

### Responsive text sizes
```css
/* Desktop: 2.25rem */
/* Tablet (1200px): 1.875rem */
/* Mobile (600px): 1.5rem */
h1 { font-size: var(--text-4xl); }
```

## Gradient Buttons

### Primary Gradient
```html
<button class="btn btn-primary">
  Uses: linear-gradient(135deg, #00ff88, #00cc6a)
</button>
```

### Secondary Gradient
```html
<button class="btn btn-secondary">
  Uses: linear-gradient(135deg, #00d4ff, #0099cc)
</button>
```

## Common CSS Patterns

### Dark Card with Blur
```css
.my-card {
  background: var(--color-surface);
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-xl);
}

.my-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-2xl);
  transform: translateY(-4px);
}
```

### Button with Glow
```css
.my-button {
  background: linear-gradient(135deg, 
    var(--color-primary), 
    var(--color-primary-dim)
  );
  box-shadow: var(--shadow-glow-primary);
  transition: all var(--duration-normal) var(--ease-out);
}

.my-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0, 255, 136, 0.5);
}
```

### Progress Bar
```css
.my-progress {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.my-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, 
    var(--color-primary), 
    var(--color-secondary)
  );
  box-shadow: 0 0 12px rgba(0, 255, 136, 0.4);
}
```

## CSS Variables Cheat Sheet

### Colors
```css
/* Primary */
var(--color-primary)           /* #00ff88 */
var(--color-primary-dim)       /* #00cc6a */
var(--color-primary-light)     /* #66ffbb */
var(--color-primary-dark)      /* #008844 */

/* Secondary */
var(--color-secondary)         /* #00d4ff */
var(--color-secondary-dim)     /* #0099cc */
var(--color-secondary-light)   /* #66e5ff */
var(--color-secondary-dark)    /* #0066aa */

/* Text */
var(--color-text-primary)      /* #e8f4ff */
var(--color-text-secondary)    /* #b0c4de */
var(--color-text-muted)        /* #8899bb */
var(--color-text-inverse)      /* #010008 */

/* Backgrounds */
var(--color-base)              /* #0B0F1A */
var(--color-bg-card)           /* #111827 */
var(--color-surface)           /* rgba(17,24,39,0.8) */

/* Borders */
var(--color-border)            /* rgba(255,255,255,0.08) */
var(--color-border-light)      /* rgba(255,255,255,0.05) */
var(--color-border-strong)     /* rgba(0,255,136,0.2) */
```

### Spacing
```css
var(--space-1)  /* 0.25rem (4px) */
var(--space-2)  /* 0.5rem (8px) */
var(--space-3)  /* 0.75rem (12px) */
var(--space-4)  /* 1rem (16px) */
var(--space-5)  /* 1.5rem (24px) */
var(--space-6)  /* 2rem (32px) */
var(--space-8)  /* 3rem (48px) */
var(--space-10) /* 4rem (64px) */
```

### Sizing
```css
var(--radius-xs)    /* 4px */
var(--radius-sm)    /* 8px */
var(--radius-md)    /* 12px */
var(--radius-lg)    /* 16px */
var(--radius-xl)    /* 20px */
var(--radius-2xl)   /* 24px */
var(--radius-full)  /* 9999px */
```

### Shadows
```css
var(--shadow-sm)         /* 0 2px 4px */
var(--shadow-md)         /* 0 4px 8px */
var(--shadow-lg)         /* 0 10px 24px */
var(--shadow-xl)         /* 0 20px 40px */
var(--shadow-2xl)        /* 0 25px 50px */
var(--shadow-glow-primary)    /* Green glow */
var(--shadow-glow-secondary)  /* Cyan glow */
```

### Transitions
```css
var(--duration-fast)    /* 150ms */
var(--duration-normal)  /* 300ms */
var(--duration-slow)    /* 500ms */
var(--ease-in)          /* cubic-bezier(0.4, 0, 1, 1) */
var(--ease-out)         /* cubic-bezier(0, 0, 0.2, 1) */
var(--ease-in-out)      /* cubic-bezier(0.4, 0, 0.2, 1) */
var(--ease-bouncy)      /* cubic-bezier(0.68, -0.55, 0.265, 1.55) */
```

## Tips & Tricks

1. **Don't hardcode colors** - Always use `var(--color-*)` variables
2. **Use spacing scale** - Don't use random pixel values like `padding: 13px`
3. **Leverage gradients** - Use primary/secondary gradients for emphasis
4. **Add animations** - Use `.animate-*` classes or animation variables
5. **Trust contrast** - The color palette is WCAG AA compliant
6. **Mobile first** - Start with mobile layout, then use media queries for larger screens
7. **Use backdrop-filter** - Creates elegant glass effect on cards
8. **Respect prefers-reduced-motion** - Test with system accessibility settings
9. **Keyboard navigation** - Ensure Tab order is logical
10. **Test responsively** - Use browser DevTools device emulation

## Quick Links

- **Full Documentation**: See `CSS_DESIGN_SYSTEM.md`
- **Completion Report**: See `REFACTORING_COMPLETION_REPORT.md`
- **Design System File**: `css/design-system.css`
- **Component Library**: `css/components.css`
- **Animations**: `css/animations.css`

---

**Last Updated**: 2025  
**Design System Version**: 2.0  
**Status**: Production Ready ✅
