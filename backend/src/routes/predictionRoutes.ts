import { Router, Request, Response } from 'express';
import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as predictionService from '../services/predictionService.js';
import { runPythonModel } from '../services/pythonRunner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonDir = path.join(__dirname, '..', '..', 'python');

const storage: StorageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(pythonDir, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, file.originalname),
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) cb(null, true);
    else cb(new Error('Only CSV files allowed') as any, false);
  },
});

const router = Router();

router.get('/predict', async (_req: Request, res: Response) => {
  try {
    const output = await runPythonModel();
    const results = predictionService.getResults();
    res.json({ output, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  '/upload-predict',
  upload.fields([
    { name: 'daily_csv', maxCount: 1 },
    { name: 'hourly_csv', maxCount: 1 },
    { name: 'macro_csv', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    const files = req.files as { [k: string]: Express.Multer.File[] };
    if (!files?.daily_csv) return res.status(400).json({ error: 'Daily CSV required' });
    try {
      fs.copyFileSync(files.daily_csv[0].path, path.join(pythonDir, 'XAU_1d_data.csv'));
      if (files.hourly_csv) fs.copyFileSync(files.hourly_csv[0].path, path.join(pythonDir, 'XAU_1h_data.csv'));
      if (files.macro_csv) fs.copyFileSync(files.macro_csv[0].path, path.join(pythonDir, 'macro_data.csv'));
      Object.values(files).forEach((arr) => arr.forEach((f) => fs.unlinkSync(f.path)));

      const output = await runPythonModel();
      const results = predictionService.getResults();
      res.json({ output, results });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.get('/prediction-data', (_req: Request, res: Response) => {
  const data = predictionService.getPredictionData();
  if (!data) return res.status(404).json({ error: 'Prediction data not found' });
  res.json(data);
});

router.get('/latest-prediction', (_req: Request, res: Response) => {
  const data = predictionService.getLatestPrediction();
  if (!data) return res.status(404).json({ error: 'No prediction available' });
  res.json(data);
});

router.get('/trading-insights', (_req: Request, res: Response) => {
  const data = predictionService.getTradingInsights();
  if (!data) return res.status(404).json({ error: 'No insights available' });
  res.json(data);
});

router.get('/support-resistance', (_req: Request, res: Response) => {
  const data = predictionService.getSupportResistance();
  if (!data) return res.status(404).json({ error: 'No data available' });
  res.json(data);
});

router.get('/sample-data', (_req: Request, res: Response) => {
  res.json({
    daily: 'Date;Open;High;Low;Close;Volume\n2024.01.01 00:00;2150.50;2160.25;2145.75;2155.00;10000',
    hourly: 'Date;Open;High;Low;Close;Volume\n2024.01.01 01:00;2155.00;2158.50;2152.25;2157.00;2500',
  });
});

export default router;
