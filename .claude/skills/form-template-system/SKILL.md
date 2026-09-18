---
name: form-template-system
description: >-
  Save/load form templates per user. Use when building reusable forms,
  template systems, or form state persistence. Triggers: form templates,
  save as template, reusable forms, template selector.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Form Template System

Save and load form data as named templates per user, for both trips and shipments.

## Key Files

- `src/components/SaveAsTemplate.tsx` — Dialog to save current form state
- `src/components/TemplateSelector.tsx` — Dropdown to load saved templates

## Pattern

### SaveAsTemplate Component
```tsx
<SaveAsTemplate
  userId={userId}
  type="trip" // or "shipment"
  data={formData}
  disabled={!isFormValid}
/>
```
- Bookmark icon button triggers dialog
- Dialog has name input with Enter key support
- Inserts into `templates` table: `{ user_id, name, type, data }`
- Success toast on save
- Disabled state when form is invalid

### TemplateSelector Component
```tsx
<TemplateSelector
  userId={userId}
  type="trip"
  onSelect={(data) => populateForm(data)}
/>
```
- Fetches templates from `templates` table filtered by `user_id` and `type`
- Shows dropdown with template names
- On select, calls `onSelect(template.data)` to populate form
- Hidden when no templates exist
- Bookmark icon + "Load template..." placeholder

### Database Schema
```sql
templates (
  id uuid primary key,
  user_id uuid references users(id),
  name text,
  type text, -- 'trip' or 'shipment'
  data jsonb,
  created_at timestamp
)
```

## Best Practices

- Store form data as JSONB for flexibility
- Order templates by `created_at desc`
- Show success toast after save
- Allow Enter key in name input for quick saving
- Hide selector when user has no templates
