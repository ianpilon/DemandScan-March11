# Results Card Styling Guide

This guide explains how to recreate the styling of the results card component using Tailwind CSS and Shadcn/ui.

## Base Card Structure

The card uses the following base classes:
```html
<div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
```

### Class Breakdown
- `rounded-lg`: Applies large border radius
- `border`: Adds a 1px border
- `bg-card`: Uses the card background color from theme
- `text-card-foreground`: Uses the card text color from theme
- `shadow-sm`: Applies a subtle shadow
- `p-6`: Adds padding of 1.5rem (24px) on all sides

## Content Layout

The content inside the card uses:
```html
<div class="space-y-4">  <!-- Creates vertical spacing between child elements -->
    <h3 class="text-lg font-semibold">  <!-- Section heading -->
    <p class="mt-2">  <!-- Paragraph with top margin -->
</div>
```

### Class Breakdown
- `space-y-4`: Adds 1rem (16px) vertical spacing between child elements
- `text-lg`: Makes text larger (1.125rem/18px)
- `font-semibold`: Sets font weight to 600
- `mt-2`: Adds 0.5rem (8px) top margin

## Dependencies Required

1. Tailwind CSS
2. Shadcn/ui for the card component theme variables

## Theme Variables Used
- `bg-card`
- `text-card-foreground`

These variables can be customized in your Tailwind theme configuration to match your desired color scheme.
