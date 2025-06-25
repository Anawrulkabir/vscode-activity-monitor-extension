# Cursor Movement Monitor

A VS Code extension that monitors cursor movement and user activity, providing warnings after periods of inactivity to help maintain productivity.

## Features

- **Real-time Activity Monitoring**: Tracks cursor movement, text selection, typing, file operations, and terminal activity
- **Smart Inactivity Detection**: Uses a sophisticated algorithm that tracks consecutive 10-second periods of inactivity
- **Visual Status Bar**: Shows current activity status with color-coded indicators
- **Configurable Warning Time**: Customize the warning time (default: 10 seconds per period)
- **Non-intrusive Warnings**: Gentle notifications that don't interrupt your workflow
- **Easy Toggle**: Enable/disable monitoring with a single command

## How It Works

The extension monitors various user activities:
- Cursor movement and text selection
- Typing and document changes
- File operations (create, delete, rename)
- Terminal activity and commands
- Workspace changes
- Task execution

After 5 consecutive 10-second periods of inactivity (50 seconds total), the extension shows a warning message.

## Commands

- `Cursor Monitor: Toggle Cursor Monitor` - Enable/disable the monitor
- `Cursor Monitor: Reset Timer` - Reset the inactivity counter

## Configuration

You can configure the extension in VS Code settings:

```json
{
  "cursorMonitor.enabled": true,
  "cursorMonitor.warningTime": 10
}
```

- `cursorMonitor.enabled`: Enable or disable the monitor (default: true)
- `cursorMonitor.warningTime`: Warning time in seconds per period (default: 10)

## Status Bar Indicators

- 🖱️ **Active**: User is actively working
- 🟡 **Period X/5**: In an inactive period but haven't reached threshold
- 🔴 **INACTIVE**: User has been inactive for 50+ seconds (warning state)

## Installation

1. Download the `.vsix` file
2. In VS Code, go to Extensions (Ctrl+Shift+X)
3. Click the "..." menu and select "Install from VSIX..."
4. Choose the downloaded file
5. Reload VS Code when prompted

## Usage

1. The extension starts automatically when VS Code loads
2. Monitor your activity status in the status bar
3. Use the status bar item to reset the timer
4. Toggle the monitor on/off using the command palette

## Requirements

- VS Code 1.74.0 or higher

## License

MIT License

## Contributing

Feel free to submit issues and enhancement requests! 