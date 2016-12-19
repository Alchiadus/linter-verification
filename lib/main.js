'use babel';

import {
  CompositeDisposable,
} from 'atom';

import VerificationLinter from './linters/verification-linter';

const subscriptions = new CompositeDisposable();
const verificationLinters = new Map();
let linterRegistry = null;

export function activate() {
  subscriptions.add(atom.workspace.observeTextEditors((textEditor) => {
    const grammar = textEditor.getGrammar();
    const installedGrammars = VerificationLinter.Factory.getInstalledVerificationGrammars();
    if (!installedGrammars.includes(grammar)) {
      return;
    }
    if (atom.packages.isPackageActive('linter')) {
      if (linterRegistry === null) {
        // Linter package is active, but it has yet to set the linter registry.
        // This typically occurs right after an `activationHook` triggers.
        // Give it a second to pick up the slack.
        setTimeout(() => {
          attachVerificationLinter(textEditor);
        }, 1000);
      } else {
        // Linter package is active, and the linter registry is set.
        // This is the 'normal' behaviour.
        attachVerificationLinter(textEditor);
      }
    } else {
      // Linter package is not active, wait for all initial packages to be activated.
      // This typically occurs when Atom is opened with a supported verification grammar open.
      atom.packages.onDidActivateInitialPackages(() => {
        // Initial packages activated, check if Linter package is active.
        if (!atom.packages.isPackageActive('linter')) {
          // Likely Linter is disabled or not installed, do nothing.
          return;
        }
        // Linter package is now active, attach the verification linter.
        attachVerificationLinter(textEditor);
      });
    }
  }));
}

export function deactivate() {
  subscriptions.dispose();
}

export function consumeLinter(indieRegistry) {
  linterRegistry = indieRegistry;
}

export async function attachVerificationLinter(textEditor) {
  // Do not do anything if the text editor already has a verification linter.
  if (verificationLinters.has(textEditor)) {
    return;
  }
  let verificationLinter;
  try {
    // Create a new verification linter if none for the text editor exists.
    verificationLinter = await VerificationLinter.Factory.make(textEditor, linterRegistry);
  } catch (error) {
    console.error(error);
  }
  // Check if a verification linter was made.
  if (verificationLinter === null) {
    // The text editor contains generated Dafny code.
    return;
  }
  // Initialize the verification linter.
  verificationLinter.initialize();
  verificationLinters.set(textEditor, verificationLinter);
  subscriptions.add(verificationLinter.subscriptions);
  subscriptions.add(textEditor.onDidDestroy(() => {
    // Dispose the verification linter when the text editor is destroyed.
    verificationLinter.dispose();
    verificationLinters.delete(textEditor);
    subscriptions.remove(verificationLinter);
    // Hack to force rerendering of the bottom panel when a verification file is closed.
    // Otherwise the bottom panels of the other verification files disappear when multiple are open.
    setTimeout(() => {
      const linterPackage = atom.packages.getActivePackage('linter');
      linterPackage.mainModule.instance.views.bottomPanel.refresh();
    }, 1000);
  }));
}
