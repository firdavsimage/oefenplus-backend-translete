const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/converted', express.static(path.join(__dirname, 'converted')));

const upload = multer({ dest: 'uploads/' });

// === 1. Kiril-Lotin konvertor funksiyasi ===

function transliterate(text) {
  const rules = [
    // Qo‘shimcha harflar
    [/Yo/g, 'Yo'], [/yo/g, 'yo'],
    [/Yu/g, 'Yu'], [/yu/g, 'yu'],
    [/Ya/g, 'Ya'], [/ya/g, 'ya'],
    [/Ch/g, 'Ch'], [/ch/g, 'ch'],
    [/Sh/g, 'Sh'], [/sh/g, 'sh'],
    [/Gʻ/g, "Gʻ"], [/gʻ/g, "gʻ"], [/ʼ/g, "ʼ"], [/‘/g, "ʼ"], [/`/g, "ʼ"],

    // Qolgan harflar (oddiy almashtirishlar)
    [/А/g, 'A'], [/а/g, 'a'],
    [/Б/g, 'B'], [/б/g, 'b'],
    [/В/g, 'V'], [/в/g, 'v'],
    [/Г/g, 'G'], [/г/g, 'g'],
    [/Д/g, 'D'], [/д/g, 'd'],
    [/Е/g, 'E'], [/е/g, 'e'],
    [/Ж/g, 'J'], [/ж/g, 'j'],
    [/З/g, 'Z'], [/з/g, 'z'],
    [/И/g, 'I'], [/и/g, 'i'],
    [/Й/g, 'Y'], [/й/g, 'y'],
    [/К/g, 'K'], [/к/g, 'k'],
    [/Л/g, 'L'], [/л/g, 'l'],
    [/М/g, 'M'], [/м/g, 'm'],
    [/Н/g, 'N'], [/н/g, 'n'],
    [/О/g, 'O'], [/о/g, 'o'],
    [/П/g, 'P'], [/п/g, 'p'],
    [/Р/g, 'R'], [/р/g, 'r'],
    [/С/g, 'S'], [/с/g, 's'],
    [/Т/g, 'T'], [/т/g, 't'],
    [/У/g, 'U'], [/у/g, 'u'],
    [/Ф/g, 'F'], [/ф/g, 'f'],
    [/Х/g, 'X'], [/х/g, 'x'],
    [/Ц/g, 'Ts'], [/ц/g, 'ts'],
    [/Э/g, 'E'], [/э/g, 'e'],
    [/Ь/g, ''],   [/ь/g, ''],
    [/Ъ/g, ''],   [/ъ/g, ''],
  ];

  for (const [regex, rep] of rules) {
    text = text.replace(regex, rep);
  }

  return text;
}

// === 2. Matn konvertatsiya endpoint ===

app.post('/api/convert-text', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Matn yo'q" });

  const converted = transliterate(text);
  res.json({ converted });
});

// === 3. Fayl yuklab konvertatsiya qilish ===

app.post('/api/convert-file', upload.single('file'), async (req, res) => {
  const file = req.file;
  const ext = path.extname(file.originalname);
  const id = uuidv4();
  const outputPath = path.join(__dirname, 'converted', `${id}${ext}`);

  try {
    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: file.path });
      const converted = transliterate(result.value);
      fs.writeFileSync(outputPath, converted, 'utf-8');
    } else if (ext === '.xlsx') {
      const workbook = XLSX.readFile(file.path);
      const sheetNames = workbook.SheetNames;

      sheetNames.forEach(sheet => {
        const ws = workbook.Sheets[sheet];
        for (const cell in ws) {
          if (cell[0] !== '!') {
            ws[cell].v = transliterate(String(ws[cell].v));
          }
        }
      });

      XLSX.writeFile(workbook, outputPath);
    } else if (ext === '.pptx') {
      // oddiy .pptx ishlov berish qo‘llab-quvvatlanmaydi (PowerPoint parsing murakkabroq)
      return res.status(400).json({ error: ".pptx fayllar hozircha qo‘llab-quvvatlanmaydi." });
    } else {
      return res.status(400).json({ error: "Noto‘g‘ri fayl turi." });
    }

    const downloadUrl = `/converted/${path.basename(outputPath)}`;
    res.json({ downloadUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Xatolik yuz berdi." });
  } finally {
    fs.unlinkSync(file.path); // vaqtinchalik yuklangan faylni o‘chir
  }
});

// === Serverni ishga tushirish ===

app.listen(PORT, () => {
  console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
});
