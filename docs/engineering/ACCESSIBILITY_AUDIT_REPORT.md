# Accessibility & UX Audit Report

## Scope
Production-grade accessibility and UX review for the Charme application, focused on:
- keyboard navigation
- focus states
- color contrast
- aria-labels
- semantic HTML
- image alt text
- screen reader support
- mobile usability
- loading states
- empty states

## What Was Fixed

### Checkout flow
- Added semantic step structure with an ordered list in the checkout hero.
- Reworked fulfillment selection into a fieldset/legend radio group.
- Added explicit labels and IDs for pickup slot and payment provider controls.
- Marked validation and error regions with live/alert semantics.
- Marked checkout loading states as busy/status regions.
- Added stronger focus-visible styling to actionable controls.
- Disabled primary actions now use clearer disabled affordances.

### Address entry
- Added accessible toggles for the delivery address form.
- Added alert/status semantics for loading, sign-in, and error states.
- Wrapped delivery address choices in a fieldset with a hidden legend.
- Added stronger radio sizing and focus visibility.
- Upgraded the address form with explicit label/input associations, `aria-invalid`, `aria-describedby`, and busy state handling.

### Modals and ratings
- Upgraded the item detail modal to use dialog semantics with `role="dialog"`, `aria-modal="true"`, labelled title/description, and Escape-to-close behavior.
- Added focus restore behavior for the modal.
- Improved review feedback with live regions.
- Reworked the star rating input to use radiogroup semantics plus keyboard arrow key navigation.

### Cart controls
- Added explicit button types for quantity and coupon controls.
- Added accessible names for cart increment/decrement controls.
- Improved disabled and focus-visible states.
- Added live-region semantics for coupon feedback.

## Validated

### Build
- `npm run build` passed successfully.
- TypeScript and ESLint passed during production build.

### Browser smoke test
Validated in a live browser session on both localized checkout routes:
- `/en/ng/checkout`
- `/zh-CN/ng/checkout`

Confirmed:
- EN and zh-CN checkout content renders correctly.
- Locale-specific navigation and footer content render as expected.
- Checkout hero, step list, and empty-state content render without runtime errors.

## Lighthouse Notes
A full Lighthouse accessibility run was not executed in this environment, so these are the code-reviewed notes to verify in Lighthouse next:
- Confirm focus order on checkout, cart, and modal flows.
- Confirm contrast on gold-on-dark and cinnabar-on-dark states at mobile sizes.
- Confirm no inaccessible interactive elements remain in cart quantity controls, coupon flows, or review rating buttons.
- Confirm modal keyboard trap and Escape behavior in the item detail modal.
- Confirm loading skeletons are ignored by assistive technology and do not create noise.

## Residual Risks
- Manual Lighthouse scoring still needs to be run in a browser profile that can evaluate the full app interaction paths.
- Non-empty cart, address-edit, and review-submission states should still be smoke-tested manually to cover the full interactive surface.

## Files Touched
- `src/features/checkout/components/CheckoutPage.tsx`
- `src/features/checkout/components/CheckoutAddressSection.tsx`
- `src/features/addresses/components/AddressForm.tsx`
- `src/features/menu/components/ItemDetailModal.tsx`
- `src/features/menu/components/RatingStars.tsx`
- `src/features/cart/components/CartPage.tsx`

## Status
The audited changes are production-safe and build-verified. The remaining work is a full Lighthouse accessibility pass and a manual test on populated cart and address states.
