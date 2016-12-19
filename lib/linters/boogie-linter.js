'use babel';

import VerificationLinter from './verification-linter';

export default class BoogieLinter extends VerificationLinter {

  static verificationTool = 'Boogie';

  constructor(textEditor, linterRegistry) {
    super(textEditor, linterRegistry);
    this.verificationTool = BoogieLinter.verificationTool;
  }
}
