import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonDir = path.join(__dirname, '..', '..', 'python');

export function runPythonModel(): Promise<string> {
  return new Promise((resolve, reject) => {
    const script = path.join(pythonDir, 'model.py');
    if (!fs.existsSync(script)) {
      reject(new Error('model.py not found'));
      return;
    }
    console.log('🐍 Running Python ML model...');
    exec(`python "${script}"`, { cwd: pythonDir }, (err, stdout, stderr) => {
      if (err) {
        console.error('❌ Python error:', err.message);
        reject(err);
        return;
      }
      if (stderr && !stderr.includes('oneDNN')) console.warn('⚠️ Python stderr:', stderr);
      console.log('✅ Python model completed');
      resolve(stdout.trim());
    });
  });
}

export function hasPredictionData(): boolean {
  return fs.existsSync(path.join(pythonDir, 'outputs', 'predicted_test_set.csv'));
}

export async function ensurePredictionData(): Promise<void> {
  if (hasPredictionData()) {
    console.log('📊 Prediction data already exists, skipping model run');
    return;
  }
  try {
    await runPythonModel();
  } catch (err: any) {
    console.warn('⚠️ Could not run Python model on startup:', err.message);
  }
}
