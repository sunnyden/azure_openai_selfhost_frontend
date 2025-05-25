import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Configure the loader to use the local monaco-editor package
loader.config({ monaco });

export { monaco };
