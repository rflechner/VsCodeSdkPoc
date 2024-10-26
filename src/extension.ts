'use strict';

import * as vscode from 'vscode';
import { brotliDecompressSync, brotliCompressSync } from 'zlib';
import * as fs from 'fs';
import * as path from 'path';
import { JsonbCustomEditorProvider } from './JsonbCustomEditorProvider';

export function activate(context: vscode.ExtensionContext) {

  context.subscriptions.push(JsonbCustomEditorProvider.register(context));

}

export function deactivate() {}
