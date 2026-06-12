import { cpSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wasmSrc = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const wasmDst = join(root, 'public', 'models', 'wasm');
const modelDst = join(root, 'public', 'models', 'face_landmarker.task');

mkdirSync(wasmDst, { recursive: true });

if (existsSync(wasmSrc)) {
  cpSync(wasmSrc, wasmDst, { recursive: true });
  console.log('Copied MediaPipe wasm → public/models/wasm/');
} else {
  console.warn('Run npm install first — @mediapipe/tasks-vision wasm not found.');
}

if (!existsSync(modelDst)) {
  console.warn(
    'Download face_landmarker.task (float16) from Google AI Edge and place at:\n  ' +
      modelDst +
      '\nReadiness will degrade gracefully until the model is present.',
  );
}
