# Window Components

This folder contains unified window management components for the application that work consistently across both web and desktop (Electron) environments.

## Components

### AppBar

A unified app bar component that provides consistent header layout across all pages.

**Features:**

- **Unified Structure**: Consistent left actions, center content (draggable), right actions, and window controls layout
- **Draggable Support**: Automatically handles window dragging in Electron environment
- **Interactive Elements**: All buttons, inputs, and other interactive elements are properly marked as non-draggable
- **Responsive**: Adapts to different content and screen sizes
- **Accessible**: Proper ARIA labels and keyboard navigation

**Usage:**

```tsx
import { AppBar } from "./AppBar";

<AppBar
    title="Page Title"
    leftActions={<Button icon={<ArrowLeft />} onClick={onBack} />}
    rightActions={<Button icon={<Settings />} onClick={onSettings} />}
    backgroundColor="var(--colorBrandBackground)"
    color="var(--colorNeutralForegroundOnBrand)"
/>

// Or with custom content
<AppBar
    leftActions={leftButton}
    rightActions={rightButtons}
>
    <Title3>Custom Title Content</Title3>
</AppBar>
```

### WindowControls

Windows-style window control buttons (minimize, maximize/restore, close) for Electron.

**Features:**

- **Native Windows Feel**: Proper hover/click effects matching Windows 11 style
- **Responsive States**: Visual feedback for hover, active, and focused states
- **Close Button Emphasis**: Red hover effect for close button
- **Seamless Integration**: Only renders in Electron environment
- **Proper Sizing**: Consistent 46px width per button (Windows standard)

### DraggableArea

A wrapper component that makes content draggable in Electron while ensuring interactive elements remain clickable.

**Features:**

- **Smart Dragging**: Automatically handles draggable regions in Electron
- **Interactive Preservation**: Ensures buttons, inputs, and other controls remain functional
- **Text Selection Control**: Prevents unwanted text selection in title areas
- **Flexible Styling**: Accepts custom styles and class names

**Usage:**

```tsx
import { DraggableArea } from "./DraggableArea";

<DraggableArea>
    <Title>My App Title</Title>
    <Button>This button remains clickable</Button>
</DraggableArea>;
```

## Migration from Old Headers

The new AppBar component replaces various custom header implementations throughout the app:

### Before (Multiple Patterns)

```tsx
// Various inconsistent patterns across different pages
<div className={styles.header}>
    <Button onClick={onBack} />
    <DraggableArea>
        <Text>Title</Text>
    </DraggableArea>
    <WindowControls />
</div>

<Toolbar>
    <Button onClick={onMenu} />
    <DraggableArea>
        <Title3>Chat</Title3>
    </DraggableArea>
    <Dropdown />
    <WindowControls />
</Toolbar>
```

### After (Unified Pattern)

```tsx
// Consistent pattern everywhere
<AppBar
    title="Title"
    leftActions={<Button onClick={onBack} />}
    rightActions={<Dropdown />}
/>
```

## Styling

### CSS Classes Available

- `.app-bar` - Applied to the main AppBar container
- `.left-actions` - Applied to left actions container
- `.right-actions` - Applied to right actions container
- `.window-controls` - Applied to window controls container
- `.window-control-button` - Applied to individual control buttons
- `.draggable-area` - Applied to draggable areas
- `.electron-drag` - Applied when in Electron environment
- `.electron-no-drag` - Applied to non-draggable elements

### Customization

All components accept custom styles and class names for full customization while maintaining the underlying functionality.

## Best Practices

1. **Use AppBar for all page headers** - Provides consistency and proper window management
2. **Put navigation in leftActions** - Back buttons, menu buttons, etc.
3. **Put page actions in rightActions** - Settings, filters, etc.
4. **Use title prop for simple text** - For complex content, use children
5. **Test in both web and desktop** - Ensure dragging works properly in Electron
6. **Avoid putting draggable content inside interactive elements** - Can cause issues with event handling

## Browser vs Desktop Behavior

### Web Browser

- AppBar renders as a normal header with no special dragging behavior
- WindowControls are hidden (browser handles window management)
- All styling and layout remains the same

### Electron Desktop

- AppBar becomes draggable title bar
- WindowControls render with native-like behavior
- Interactive elements automatically marked as non-draggable
- Proper window management integration

