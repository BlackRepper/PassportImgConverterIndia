import { IncomingForm } from 'formidable';
import AWS from 'aws-sdk';
import fs from 'fs';
import os from 'os';

export const config = {
  api: {
    bodyParser: false,
  },
};

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  // Use OS temp dir for compatibility (especially on Windows)
  const form = new IncomingForm({ keepExtensions: true, uploadDir: os.tmpdir() });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Formidable error:", err);
      return res.status(400).json({ error: 'Error parsing the file', details: err.message });
    }

    // Get the file (handle both array and object)
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      console.error("No file received. files object:", files);
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Try both possible properties for the file path
    const filePath = file.filepath || file.path;
    if (!filePath) {
      console.error("File path not found. file object:", file);
      return res.status(400).json({ error: 'File path not found', file });
    }

    let fileContent;
    try {
      fileContent = fs.readFileSync(filePath);
    } catch (readErr) {
      console.error("Error reading file from disk:", readErr);
      return res.status(500).json({ error: 'Failed to read uploaded file' });
    }

    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: Date.now().toString() + '-' + (file.originalFilename || file.name),
      Body: fileContent,
      ContentType: file.mimetype || file.type,
    };

    try {
      const s3Res = await s3.upload(s3Params).promise();
      return res.status(200).json({
        originalname: file.originalFilename || file.name,
        key: s3Params.Key,
        url: s3Res.Location,
      });
    } catch (uploadErr) {
      console.error("S3 upload error:", uploadErr);
      return res.status(500).json({ error: 'Failed to upload to S3', details: uploadErr.message });
    }
  });
}