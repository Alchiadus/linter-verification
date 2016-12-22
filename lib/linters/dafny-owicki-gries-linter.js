'use babel';

import path from 'path';

import DafnyOwickiGriesTranspiler from 'dafny-transpiler';

import DafnyLinter from './dafny-linter';

export default class DafnyOwickiGriesLinter extends DafnyLinter {

  async lint() {
    this.attachPendingDafnyOwickiGriesTranspilerMessage();
    let transpiledTextEditor;
    try {
      transpiledTextEditor = this.transpileOwickiGries();
    } catch (error) {
      console.log(error);
      this.attachErrorDafnyOwickiGriesTranspilerMessage();
      return;
    }
    this.attachPendingVerificationMessage();
    const output = await super.getVerificationOutput(transpiledTextEditor);
    const verificationMessages = this.createVerificationMessages(output);
    super.attachTextEditorMessages(verificationMessages, transpiledTextEditor, this.linter);
  }

  attachPendingDafnyOwickiGriesTranspilerMessage() {
    const pendingDafnyOwickiGriesTranspilerMessage = [{
      type: 'Pending',
      text: 'Dafny Owicki-Gries Transpiler is running...',
      filePath: this.textEditor.getPath(),
    }];
    this.linter.setMessages(pendingDafnyOwickiGriesTranspilerMessage);
  }

  attachErrorDafnyOwickiGriesTranspilerMessage() {
    const errorDafnyOwickiGriesTranspilerMessage = [{
      type: 'Error',
      text: 'Dafny Owicki-Gries Transpiler encountered an error.',
      filePath: this.textEditor.getPath(),
    }];
    this.linter.setMessages(errorDafnyOwickiGriesTranspilerMessage);
  }

  transpileOwickiGries() {
    const editorText = this.textEditor.getText();
    let transpiledText;
    try {
      transpiledText = DafnyOwickiGriesTranspiler.transpile(editorText);
    } catch (error) {
      throw error;
    }
    const editorPath = this.textEditor.getPath();
    const transpiledPath = path.join(path.dirname(editorPath), `${path.basename(editorPath, '.dfy')}-transpiled.dfy`);
    this.transpiledTextEditor = atom.workspace.buildTextEditor();
    this.transpiledTextEditor.setGrammar(atom.grammars.grammarForScopeName('source.dafny'));
    this.transpiledTextEditor.getBuffer().setTextViaDiff(transpiledText);
    this.transpiledTextEditor.saveAs(transpiledPath);
    return this.transpiledTextEditor;
  }
}
