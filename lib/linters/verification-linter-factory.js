'use babel';

export default class VerificationLinterFactory {

  static getSupportedVerificationTools() {
    return ['Dafny', 'Chalice', 'Boogie'];
  }

  static getInstalledVerificationGrammars() {
    return VerificationLinterFactory.getSupportedVerificationTools().reduce((grammars, verificationTool) => {
      const scopeName = `source.${verificationTool.toLowerCase()}`;
      const grammar = atom.grammars.grammarForScopeName(scopeName);
      if (grammar) {
        grammars.push(grammar);
      }
      return grammars;
    }, []);
  }

  static containsHeader(textEditor, regExp) {
    const firstLine = textEditor.lineTextForScreenRow(0);
    return regExp.test(firstLine) || false;
  }

  static containsGeneratedHeader(textEditor) {
    return VerificationLinterFactory.containsHeader(textEditor, /Generated/i);
  }

  static containsOwickiGriesHeader(textEditor) {
    return VerificationLinterFactory.containsHeader(textEditor, /Use Owicki-Gries/i);
  }

  static make(textEditor, linterRegistry) {
    const grammar = textEditor.getGrammar();
    const verificationTool = grammar.name;
    const error = {
      message: `Could not create a linter for ${verificationTool}`,
      reason: null,
    };
    if (!VerificationLinterFactory.getSupportedVerificationTools().includes(verificationTool)) {
      error.reason = `${verificationTool} is not supported.`;
    }
    if (!VerificationLinterFactory.getInstalledVerificationGrammars().includes(grammar)) {
      error.reason = `the grammar for ${verificationTool} is not installed.`;
    }
    if (error.reason) {
      return Promise.reject(`${error.message}: ${error.reason}`);
    }
    if (VerificationLinterFactory.containsGeneratedHeader(textEditor)) {
      return Promise.resolve(null);
    }
    let VerificationLinter;
    if (VerificationLinterFactory.containsOwickiGriesHeader(textEditor)) {
      VerificationLinter = require('./dafny-owicki-gries-linter');
    } else {
      /* eslint-disable import/no-dynamic-require */
      VerificationLinter = require(`./${verificationTool.toLowerCase()}-linter`);
      /* eslint-enable import/no-dynamic-require */
    }
    return Promise.resolve(new VerificationLinter(textEditor, linterRegistry));
  }
}
