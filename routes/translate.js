const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const { parsePptx } = require('pptx-parser');

// Upload config
const upload = multer({ dest: 'uploads/' });

// === Kiril ↔ Lotin converter ===
const latinToCyrillic = (text) => {
  // oddiy misol uchun
  return text.replace(/sh/g, 'ш').replace(/o/g, 'о');
};
const cyrillicToLatin = (text) => {
  return text.replace(/ш/g, 'sh').replace(/о/g, 'o');
};

function convertText(text) {
  const isCyrillic = /[а-яА-Я]/.test(text);
  return isCyrillic ? cyrillicToLatin(text) : latinToCyrillic(text);
}

// === POST /api/convert-text ===
router.post('/convert-text', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Matn yo‘q' });

  const converted = convertText(text);
  res.json({ converted });
});

// === POST /api/convert-file ===
router.post('/convert-file', upload.single('file'), async (req, res) => {
  const file = req.file;
  const ext = path.extname(file.originalname);
  const filePath = path.join(__dirname, '..', file.path);

  let content = '';
  try {
    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      content = result.value;
    } else if (ext === '.xlsx') {
      const workbook = xlsx.readFile(filePath);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      content = xlsx.utils.sheet_to_csv(firstSheet);
    } else if (ext === '.pptx') {
      const slides = await parsePptx(filePath);
      content = slides.map(s => s.text).join('\n\n');
    } else {
      return res.status(400).json({ error: 'Fayl turi qo‘llab-quvvatlanmaydi' });
    }

    const converted = convertText(content);
    const outputPath = path.join(__dirname, '..', 'converted', `${Date.now()}_converted.txt`);
    fs.writeFileSync(outputPath, converted, 'utf8');

    const url = `${req.protocol}://${req.get('host')}/converted/${path.basename(outputPath)}`;
    res.json({ downloadUrl: url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'O‘girishda xatolik yuz berdi' });
  } finally {
    fs.unlinkSync(filePath);
  }
});

module.exports = router;
