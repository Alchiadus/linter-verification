'use babel';

import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  CompositeDisposable,
} from 'atom';
import * as Helpers from 'atom-linter';

import VerificationLinterFactory from './verification-linter-factory';

export default class VerificationLinter {

  static Factory = VerificationLinterFactory;

  constructor(textEditor, linterRegistry) {
    this.textEditor = textEditor;
    this.linterRegistry = linterRegistry;
    this.subscriptions = new CompositeDisposable();
  }

  initialize() {
    this.linter = this.linterRegistry.register({
      name: this.verificationTool,
    });
    this.subscriptions.add(this.linter);
    const verificationToolExecutableName = this.verificationTool.toLowerCase();
    this.subscriptions.add(atom.config.observe(`linter-verification.executableSettings.${verificationToolExecutableName}ExecutablePath`, (executablePath) => {
      this.executablePath = executablePath;
    }));
    this.subscriptions.add(atom.config.observe(`linter-verification.executableSettings.${verificationToolExecutableName}ExecutableArguments`, (executableArguments) => {
      this.executableArguments = executableArguments;
    }));
    this.subscriptions.add(this.textEditor.onDidStopChanging(() => {
      this.lint();
    }));
  }

  dispose() {
    this.linterRegistry.unregister(this.linter);
    this.subscriptions.dispose();
  }

  async lint() {
    return this.lintTextEditor();
  }

  async lintTextEditor(textEditor = this.textEditor, linter = this.linter) {
    this.attachPendingVerificationMessage(textEditor);
    const output = await this.getVerificationOutput(textEditor);
    const verificationMessages = this.createVerificationMessages(output);
    if (verificationMessages.length === 0) {
      console.error(output);
    }
    this.attachTextEditorMessages(verificationMessages, textEditor, linter);
  }

  attachPendingVerificationMessage(textEditor = this.textEditor, linter = this.linter) {
    const pendingVerificationMessage = [{
      type: 'Pending',
      text: `${this.verificationTool} is running...`,
      filePath: textEditor.getPath(),
    }];
    linter.setMessages(pendingVerificationMessage);
  }

  getVerificationOutput(textEditor = this.textEditor) {
    const filePath = textEditor.getPath();
    const tmpFilePath = this.writeTemporaryFile(textEditor, filePath);
    const args = this.executableArguments.concat(tmpFilePath);
    const options = {
      stream: 'both',
      throwOnStderr: false,
      allowEmptyStderr: true,
    };
    return Helpers.exec(this.executablePath, args, options);
  }

  createVerificationMessages(output) {
    const parseErrorRegExp = /(\d+) (parse errors detected in) (.*)/;
    const errorRegExp = /(.+)\((\d+),(\d+)\): [Ee]rror(?:| [\w\d]+): (.+)/;
    const locationRegExp = /(.+)\((\d+),(\d+)\): Related location: (.+)/;
    const finishedRegExp = /(\d+) verified, (\d+) errors/;
    const messages = [];
    output.stdout.split('\n').forEach((line) => {
      const parseError = line.match(parseErrorRegExp);
      if (parseError !== null) {
        const type = 'Error';
        const text = `${this.verificationTool} program verifier finished with ${parseError[1]} parse error(s)`;
        messages.push({
          type,
          text,
        });
      }
      const verificationError = line.match(errorRegExp);
      if (verificationError !== null) {
        const type = 'Error';
        const lineNumber = verificationError[2];
        const column = verificationError[3];
        const text = verificationError[4];
        messages.push({
          type,
          text,
          range: [
            [lineNumber - 1, column - 1],
            [lineNumber - 1, column - 1],
          ],
        });
      }
      const verificationLocation = line.match(locationRegExp);
      if (verificationLocation !== null) {
        const type = 'Info';
        const lineNumber = verificationLocation[2];
        const column = verificationLocation[3];
        const text = verificationLocation[4];
        messages.push({
          type,
          text,
          range: [
            [lineNumber - 1, column - 1],
            [lineNumber - 1, column - 1],
          ],
        });
      }
      const verificationFinished = line.match(finishedRegExp);
      if (verificationFinished !== null) {
        const unsuccessfulVerifications = verificationFinished[2];
        const type = unsuccessfulVerifications === '0' ? 'Success' : 'Info';
        messages.push({
          type,
          text: line,
        });
      }
    });
    return messages;
  }

  attachTextEditorMessages(verificationToolMessages, textEditor = this.textEditor, linter = this.linter) {
    const filePath = textEditor.getPath();
    const linterMessages = verificationToolMessages.map((verificationMessage) => {
      verificationMessage.filePath = filePath;
      return verificationMessage;
    });
    linter.setMessages(linterMessages);
  }

  writeTemporaryFile(textEditor = this.textEditor, filePath = this.textEditor.getPath()) {
    const fileBuffer = textEditor.getText();
    const tmpDir = path.join(os.tmpdir());
    const tmpFilePath = path.join(tmpDir, path.basename(filePath));
    fs.writeFileSync(tmpFilePath, fileBuffer, 'UTF-8');
    return tmpFilePath;
  }
}
