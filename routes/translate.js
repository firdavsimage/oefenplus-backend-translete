const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const officeParser = require('officeparser');

const upload = multer({ dest: 'uploads/' });

const latinToCyrillic = (text) => text.replace(/sh/g, 'ш').replace(/o/g, 'о');
const cyrillicToLatin = (text) => text.replace(/ш/g, 'sh').replace(/о/g, 'o');
function convertText(text) {
  const isCyrillic = /[а-яА-Я]/.test(text);
  return isCyrillic ? cyrillicToLatin(text) : latinToCyrillic(text);
}

router.post('/convert-text', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Matn yo‘q' });
  const converted = convertText(text);
  res.json({ converted });
});

router.post('/convert-file', upload.single('file'), async (req, res) => {
  const file = req.file;
  const ext = path.extname(file.originalname);
  const filePath = path.join(__dirname, '..', file.path);

  try {
    const content = await officeParser.parseOfficeAsync(filePath);
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
