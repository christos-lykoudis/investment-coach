# Button

Location: `apps/web/components/ui/Button.tsx`

## Props

- `children` (`React.ReactNode`): Button content.
- `onClick?` (`() => void`): Click handler.
- `type?` (`"button" | "submit"`): HTML button type.
- `disabled?` (`boolean`): Disables the button.

## Usage

```tsx
<Button onClick={() => console.log("clicked")}>Save</Button>
```

