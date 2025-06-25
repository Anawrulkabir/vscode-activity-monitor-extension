const vscode = require('vscode');

let cursorTimer;
let startTime;
let statusBarItem;
let isEnabled = true;
let warningTime = 10; // seconds
let inactivityCounter = 0; // counts consecutive 10-second periods
let maxInactivityPeriods = 5; // 5 periods = 50 seconds total
let intervalTimer; // for 10-second interval checks

function activate(context) {
  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'cursorMonitor.reset';
  statusBarItem.show();
  
  // Get configuration
  const config = vscode.workspace.getConfiguration('cursorMonitor');
  isEnabled = config.get('enabled', true);
  warningTime = config.get('warningTime', 10);
  
  // Register commands
  const toggleCommand = vscode.commands.registerCommand('cursorMonitor.toggle', () => {
    isEnabled = !isEnabled;
    if (isEnabled) {
      vscode.window.showInformationMessage('🖱️ Cursor Monitor: ENABLED');
      resetTimer();
    } else {
      vscode.window.showInformationMessage('🖱️ Cursor Monitor: DISABLED');
      clearTimeout(cursorTimer);
      clearInterval(intervalTimer);
      inactivityCounter = 0;
      statusBarItem.text = '🖱️ Monitor: OFF';
      statusBarItem.backgroundColor = undefined;
    }
  });
  
  const resetCommand = vscode.commands.registerCommand('cursorMonitor.reset', () => {
    if (isEnabled) {
      resetTimer();
      vscode.window.showInformationMessage('⏰ Timer Reset!');
    }
  });
  
  // Track cursor/selection changes
  const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(() => {
    if (isEnabled) {
      resetTimer();
    }
  });
  
  // Track active editor changes
  const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(() => {
    if (isEnabled) {
      resetTimer();
    }
  });
  
  // Track terminal activity
  const terminalChangeDisposable = vscode.window.onDidChangeActiveTerminal(() => {
    if (isEnabled) {
      resetTimer();
    }
  });
  
  // Track terminal opening/closing and setup input monitoring
  const terminalOpenDisposable = vscode.window.onDidOpenTerminal((terminal) => {
    if (isEnabled) {
      resetTimer();
    }
    
    // Monitor terminal data output (indicates activity)
    try {
      if (terminal && terminal.onDidWriteData) {
        const dataDisposable = terminal.onDidWriteData(() => {
          if (isEnabled) {
            resetTimer();
          }
        });
        context.subscriptions.push(dataDisposable);
      }
    } catch (error) {
      // Fallback - some terminal types may not support this
    }
  });
  
  const terminalCloseDisposable = vscode.window.onDidCloseTerminal(() => {
    if (isEnabled) {
      resetTimer();
    }
  });
  
  // Monitor existing terminals on activation
  vscode.window.terminals.forEach(terminal => {
    try {
      if (terminal && terminal.onDidWriteData) {
        const dataDisposable = terminal.onDidWriteData(() => {
          if (isEnabled) {
            resetTimer();
          }
        });
        context.subscriptions.push(dataDisposable);
      }
    } catch (error) {
      // Some terminal types may not support this
    }
  });
  
  // Track document changes (typing)
  const documentChangeDisposable = vscode.workspace.onDidChangeTextDocument((e) => {
    if (isEnabled && e.contentChanges.length > 0) {
      resetTimer();
    }
  });
  
  // Track file operations
  const fileCreateDisposable = vscode.workspace.onDidCreateFiles(() => {
    if (isEnabled) {
      resetTimer();
    }
  });
  
  const fileDeleteDisposable = vscode.workspace.onDidDeleteFiles(() => {
    if (isEnabled) {
      resetTimer();
    }
  });
  
  const fileRenameDisposable = vscode.workspace.onDidRenameFiles(() => {
    if (isEnabled) {
      resetTimer();
    }
  });
  
  // Track workspace changes
  const workspaceChangeDisposable = vscode.workspace.onDidChangeWorkspaceFolders(() => {
    if (isEnabled) {
      resetTimer();
    }
  });
  
  // Additional fallback: Monitor tasks (terminal commands often create tasks)
  const taskStartDisposable = vscode.tasks.onDidStartTask(() => {
    if (isEnabled) {
      resetTimer();
    }
  });
  
  const taskEndDisposable = vscode.tasks.onDidEndTask(() => {
    if (isEnabled) {
      resetTimer();
    }
  });
  
  // Track configuration changes
  const configChangeDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('cursorMonitor')) {
      const config = vscode.workspace.getConfiguration('cursorMonitor');
      isEnabled = config.get('enabled', true);
      warningTime = config.get('warningTime', 10);
      if (isEnabled) {
        resetTimer();
      }
    }
  });
  
  context.subscriptions.push(
    statusBarItem,
    toggleCommand,
    resetCommand,
    selectionChangeDisposable,
    editorChangeDisposable,
    terminalChangeDisposable,
    terminalOpenDisposable,
    terminalCloseDisposable,
    documentChangeDisposable,
    fileCreateDisposable,
    fileDeleteDisposable,
    fileRenameDisposable,
    workspaceChangeDisposable,
    taskStartDisposable,
    taskEndDisposable,
    configChangeDisposable
  );
  
  // Start monitoring
  if (isEnabled) {
    resetTimer();
  } else {
    statusBarItem.text = '🖱️ Monitor: OFF';
  }
}

function updateTimer() {
  if (!isEnabled || !startTime) return;
  
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const currentPeriod = Math.floor(elapsed / warningTime);
  
  // If we've completed a 10-second period without activity
  if (currentPeriod > inactivityCounter) {
    inactivityCounter = currentPeriod;
    
    // Check if we've reached the threshold (5 consecutive periods = 50 seconds)
    if (inactivityCounter >= maxInactivityPeriods) {
      showWarning(elapsed);
    }
  }
  
  // Update status bar display
  if (inactivityCounter >= maxInactivityPeriods) {
    // Show warning state - user has been inactive for 50+ seconds
    const pulseIcon = elapsed % 2 === 0 ? '🔴' : '⚠️';
    statusBarItem.text = `${pulseIcon} INACTIVE: ${elapsed}s (${inactivityCounter} periods)`;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    statusBarItem.tooltip = `⚠️ User inactive for ${elapsed} seconds across ${inactivityCounter} consecutive 10-second periods!`;
  } else if (elapsed >= warningTime) {
    // In an inactive period but haven't reached threshold yet
    const periodsRemaining = maxInactivityPeriods - inactivityCounter;
    statusBarItem.text = `🟡 Period ${inactivityCounter}/${maxInactivityPeriods}: ${elapsed}s`;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    statusBarItem.tooltip = `${periodsRemaining} more inactive periods until warning (${elapsed}s in current period)`;
  } else {
    // Active state
    let activityIcon = '🖱️';
    let bgColor = 'statusBarItem.prominentBackground';
    
    if (elapsed <= 3) {
      activityIcon = '💚'; // Very active
    } else if (elapsed <= 7) {
      activityIcon = '🖱️'; // Normal
    } else {
      activityIcon = '🟡'; // Getting close to period end
    }
    
    const counterDisplay = inactivityCounter > 0 ? ` (${inactivityCounter} periods)` : '';
    statusBarItem.text = `${activityIcon} Active: ${elapsed}s${counterDisplay}`;
    statusBarItem.backgroundColor = new vscode.ThemeColor(bgColor);
    statusBarItem.tooltip = `User active - ${elapsed}s in current period. ${inactivityCounter} previous inactive periods. Warning after ${maxInactivityPeriods} consecutive periods.`;
  }
}

function showWarning(elapsed) {
  // Non-blocking information message that appears briefly
  const totalPeriods = Math.floor(elapsed / warningTime);
  vscode.window.showInformationMessage(
    `⚠️ Inactive for ${totalPeriods} consecutive 10-second periods (${elapsed}s total) - Time to get active!`,
    'Reset Counter',
    'Disable'
  ).then(selection => {
    if (selection === 'Reset Counter') {
      resetTimer();
    } else if (selection === 'Disable') {
      vscode.commands.executeCommand('cursorMonitor.toggle');
    }
  });
}

function resetTimer() {
  if (!isEnabled) return;
  
  clearTimeout(cursorTimer);
  clearInterval(intervalTimer);
  
  // Reset all counters and timers
  startTime = Date.now();
  inactivityCounter = 0; // Reset the consecutive periods counter
  
  statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
  
  // Update timer every second
  intervalTimer = setInterval(() => {
    if (!isEnabled) {
      clearInterval(intervalTimer);
      return;
    }
    updateTimer();
  }, 1000);
  
  // Initial display
  updateTimer();
}

function deactivate() {
  clearTimeout(cursorTimer);
  clearInterval(intervalTimer);
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}

module.exports = {
  activate,
  deactivate
};