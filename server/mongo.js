
import express from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ObjectId } from 'mongodb';



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const uri = process.env.MONGO_URI;

app.use(express.static(join(__dirname, '../public')));
app.use( express.json());

// app.get('/', (req, res) => {
//   res.send('Hello World')
// })

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const db = client.db('una');
const vocab = db.collection('vocab');
const grammar = db.collection('grammar');
const saves = db.collection('saves');



app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public', 'una.html'));
})

// Temporary home page until Una has its own (#16)
app.get('/', (req, res) => {
  res.redirect('/pages/content.html');
});

// Health check: confirms the server is up and can reach MongoDB
app.get('/api/health', async (req, res) => {
  try {
    await db.command({ ping: 1 });
    res.json({ ok: true, db: db.databaseName });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

// Vocab CRUD (#13), grammar CRUD (#14), seed routes (#15) and saves go here


app.listen(5500, () => {
  console.log('Server is running on http://localhost:5500');
});