import * as vscode from 'vscode';
import { brotliDecompressSync, brotliCompressSync } from 'zlib';
import * as fs from 'fs';

export class JsonbCustomEditorProvider implements vscode.CustomEditorProvider {

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new JsonbCustomEditorProvider(context);
    return vscode.window.registerCustomEditorProvider('jsonbEditor.view', provider);
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  private _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<vscode.CustomDocument>>();
  readonly onDidChangeCustomDocument: vscode.Event<vscode.CustomDocumentEditEvent<vscode.CustomDocument>> = this._onDidChangeCustomDocument.event;

  async saveCustomDocument(document: CustomTextDocument, _cancellation: vscode.CancellationToken): Promise<void> {
      
    const originalContent = document.getText();
    const compressed = brotliCompressSync(Buffer.from(originalContent, 'utf-8'));
    const filePath = document.uri.fsPath;

    await fs.promises.writeFile(filePath, compressed);
  }

  async saveCustomDocumentAs(document: CustomTextDocument, destination: vscode.Uri, _cancellation: vscode.CancellationToken): Promise<void> {
    const originalContent = document.getText();
    const compressed = brotliCompressSync(Buffer.from(originalContent, 'utf-8'));

    await fs.promises.writeFile(destination.fsPath, compressed);
  }

  async revertCustomDocument(document: CustomTextDocument, _cancellation: vscode.CancellationToken): Promise<void> {
    const content = await fs.promises.readFile(document.uri.fsPath);
    const decompressed = content.byteLength === 0 ? '' : brotliDecompressSync(content).toString();
    this.updateTextDocument(document, decompressed);
  }

  async backupCustomDocument(document: CustomTextDocument, context: vscode.CustomDocumentBackupContext, _cancellation: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
    const backupUri = context.destination;
    const originalContent = document.getText();
    const compressed = brotliCompressSync(Buffer.from(originalContent, 'utf-8'));

    await fs.promises.writeFile(backupUri.fsPath, compressed);

    return {
      id: backupUri.fsPath,
      delete: () => fs.promises.unlink(backupUri.fsPath)
    };
  }

  async openCustomDocument(uri: vscode.Uri, _openContext: vscode.CustomDocumentOpenContext, _token: vscode.CancellationToken): Promise<vscode.CustomDocument> {
    const content = await fs.promises.readFile(uri.fsPath);
    const decompressedContent = content.byteLength === 0 ? '' : brotliDecompressSync(content).toString();
    return new CustomTextDocument(uri, decompressedContent);
  }
  
  async resolveCustomEditor(document: CustomTextDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true
    };

    // Lire et décompresser le fichier `.jsonb`
    const content = await fs.promises.readFile(document.uri.fsPath);
    let jsonString = '';
    try {
      jsonString = content.byteLength === 0 ? '' : brotliDecompressSync(content).toString();
    } catch (e) {
      jsonString = 'An error occurred while decompressing the file';
    }

    // Créer le contenu HTML de l'éditeur personnalisé
    webviewPanel.webview.html = this.getHtmlContent(webviewPanel.webview, jsonString);

    // Gestion de la sauvegarde et des modifications
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        webviewPanel.webview.postMessage({
          type: 'update',
          text: e.document.getText()
        });
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'edit':
          this.updateTextDocument(document, message.text);
          this._onDidChangeCustomDocument.fire({
            document,
            undo: () => {},
            redo: () => {},
            label: 'Edit',
          });
          break;
      }
    });

  }
  
  private getHtmlContent(webview: vscode.Webview, jsonContent: string): string {
    const monacoScriptPath = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'node_modules', 'monaco-editor', 'min', 'vs'));

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JSONB Editor</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          #container {
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        <div id="container"></div>
        
        <script src="${monacoScriptPath}/loader.js"></script>
        <script>
          const vscode = acquireVsCodeApi();
          require.config({ paths: { 'vs': '${monacoScriptPath}' } });
          require(['vs/editor/editor.main'], function() {
            monaco.editor.create(document.getElementById('container'), {
              value: ${JSON.stringify(jsonContent)},
              language: 'json',
              theme: 'vs-dark',
              automaticLayout: true
            });
          });
        </script>
      </body>
      </html>
    `;
  }

  private updateTextDocument(document: CustomTextDocument, content: string): void {
    document.update(content);
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.countLines(), 0),
      content
    );
    vscode.workspace.applyEdit(edit);
  }
}

export class CustomTextDocument implements vscode.CustomDocument {
  uri: vscode.Uri;
  private content: string;

  constructor(uri: vscode.Uri, content: string) {
    this.uri = uri;
    this.content = content;
  }

  public getText(): string {
    return this.content;
  }

  public update(content: string) {
    this.content = content;
  }

  public countLines(): number {
    return this.content.split('\n').length;
  }

  dispose(): void {
    // Dispose of any resources if necessary
  }
}
