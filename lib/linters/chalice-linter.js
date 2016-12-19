'use babel';

import VerificationLinter from './verification-linter';

export default class ChaliceLinter extends VerificationLinter {

  static verificationTool = 'Chalice';

  constructor(textEditor, linterRegistry) {
    super(textEditor, linterRegistry);
    this.verificationTool = ChaliceLinter.verificationTool;
  }
}
