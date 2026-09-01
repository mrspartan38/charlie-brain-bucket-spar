import express from 'express'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

app.use(express.static('public'));
app.use(express.static('docs'));
app.use(express.static(join(__dirname, '../public', 'index.html')));
app.use('/static', express.static('assets'));


app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/pages', 'auth.html'))
})


app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})