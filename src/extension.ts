'use strict';

import * as vscode from 'vscode';
import { brotliDecompressSync, brotliCompressSync } from 'zlib';
import * as fs from 'fs';
import * as path from 'path';
import { JsonbCustomEditorProvider } from './JsonbCustomEditorProvider';

export function activate(context: vscode.ExtensionContext) {

  context.subscriptions.push(JsonbCustomEditorProvider.register(context));


  // let openJsonbCommand = vscode.commands.registerCommand('jsonbEditor.openJsonb', async () => {
  //   const editor = vscode.window.activeTextEditor;
  //   console.log("Active editor:", editor);
  //   if (editor) {
  //     const document = editor.document;
  //     if (document.languageId === 'jsonb') {

  //       const text = await fs.promises.readFile(document.fileName);
  //       let jsonString = '';

  //       try {
  //         const decompressed = brotliDecompressSync(text);
  //         jsonString = decompressed.toString();
  //       } catch (e: unknown) {
  //         if (e instanceof Error) {
  //           jsonString = e.message;
  //         } else {
  //           jsonString = 'An unknown error occurred';
  //         }
  //       }

  //       await editor.edit(editBuilder => {
  //         editBuilder.replace(new vscode.Range(0, 0, document.lineCount, 0), jsonString);
  //       });
  //       // vscode.languages.setTextDocumentLanguage(document, 'json');
  //     }
  //   }
  // });

  // // Hook pour ouvrir automatiquement les fichiers JSONB lorsque ouverts depuis l'explorateur
  // vscode.workspace.onDidOpenTextDocument(async document => {

  //   console.log(`onDidOpenTextDocument: ${document.fileName}`);

  //   if (document.fileName.endsWith('.jsonb')) {
  //     vscode.commands.executeCommand('jsonbEditor.openJsonb', document.uri);
  //   }
  // });

  // context.subscriptions.push(vscode.commands.registerCommand('jsonbEditor.openJsonbFromPalette', async () => {
  //   vscode.commands.executeCommand('jsonbEditor.openJsonb');
  // }));

  // vscode.workspace.onWillSaveTextDocument(async event => {
  //   if (event.document.languageId === 'jsonb') {
  //     const originalContent = event.document.getText();
  //     const compressed = brotliCompressSync(Buffer.from(originalContent, 'utf-8'));
  //     const filePath = event.document.uri.fsPath;

  //     await fs.promises.writeFile(filePath, compressed, { encoding: 'binary' });
  //     console.log("saved:", filePath);
  //   }
  // });

  // context.subscriptions.push(openJsonbCommand);
}

export function deactivate() {}
