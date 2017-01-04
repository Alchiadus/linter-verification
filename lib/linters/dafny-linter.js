'use babel';

import VerificationLinter from './verification-linter';

export default class DafnyLinter extends VerificationLinter {

  static verificationTool = 'Dafny';

  constructor(textEditor, linterRegistry) {
    super(textEditor, linterRegistry);
    this.verificationTool = DafnyLinter.verificationTool;
  }

  trustExitCode() {
    return true;
  }
}
