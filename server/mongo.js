
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

// Health check: confirms the server is up and can reach MongoDB
app.get('/api/health', async (req, res) => {
  try {
    await db.command({ ping: 1 });
    res.json({ ok: true, db: db.databaseName });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

// Vocab CRUD (#13),

const requiredVocab = ['german', 'english', 'partOfSpeech', 'level'];

app.post('/api/vocab', async function (req, res) {
  const word = req.body;

  const missing = requiredVocab.filter(function (field) {
  return !word[field];
});

if (missing.length > 0) {
  return res.status(400).json({ error: 'missing fields: ' + missing.join(', ') });
}

  word.createdAt = new Date();
  word.updatedAt = new Date();

  const result = await vocab.insertOne(word);
  res.status(201).json(result);
});

app.get('/api/vocab/:id', async function (req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const record = await vocab.findOne({ _id: new ObjectId(req.params.id) });

  if (!record) {
    return res.status(404).json({ error: 'not found' });
  }

  res.json(record);
});

app.patch('/api/vocab/:id', async function (req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const changes = req.body;
  changes.updatedAt = new Date();

  const result = await vocab.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: changes }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: 'not found' });
  }

  res.json(result);
});

app.delete('/api/vocab/:id', async function (req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const result = await vocab.deleteOne({ _id: new ObjectId(req.params.id) });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'not found' });
  }

  res.json(result);
});

app.get('/api/vocab', async function (req, res) {
  const filter = {};

  if (req.query.level) {
    filter.level = Number(req.query.level);
  }

  if (req.query.chapter) {
    filter['source.chapter'] = Number(req.query.chapter);
  }

  if (req.query.tag) {
    filter.tags = req.query.tag;
  }

  const records = await vocab.find(filter).toArray();
  res.json(records);
});

// grammar CRUD (#14), seed routes (#15) and saves go here


app.listen(5500, () => {
  console.log('Server is running on http://localhost:5500');
});