const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const translateRoutes = require('./routes/translate');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/converted', express.static(path.join(__dirname, 'converted')));
app.use('/api', translateRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
