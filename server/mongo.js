
import express from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ObjectId } from 'mongodb';
import { readFile } from 'fs/promises';
import bcrypt from 'bcryptjs';


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
const users = db.collection('users');

users.createIndex({ username: 1 }, { unique: true });



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

// grammar CRUD (#14), 

const requiredGrammar = ['title', 'summary', 'explanation', 'level'];

app.post('/api/grammar', async function (req, res) {
  const concept = req.body;

  const missing = requiredGrammar.filter(function (field) {
    return !concept[field];
  });

  if (missing.length > 0) {
    return res.status(400).json({ error: 'missing fields: ' + missing.join(', ') });
  }

  concept.createdAt = new Date();
  concept.updatedAt = new Date();

  const result = await grammar.insertOne(concept);
  res.status(201).json(result);
});

app.get('/api/grammar/:id', async function (req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const record = await grammar.findOne({ _id: new ObjectId(req.params.id) });

  if (!record) {
    return res.status(404).json({ error: 'not found' });
  }

  res.json(record);
});

app.patch('/api/grammar/:id', async function (req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const changes = req.body;
  changes.updatedAt = new Date();

  const result = await grammar.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: changes }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: 'not found' });
  }

  res.json(result);
});

app.delete('/api/grammar/:id', async function (req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const result = await grammar.deleteOne({ _id: new ObjectId(req.params.id) });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'not found' });
  }

  res.json(result);
});

app.get('/api/grammar', async function (req, res) {
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

  const records = await grammar.find(filter).toArray();
  res.json(records);
});

// seed routes (#15) and saves go here

app.post('/api/dev/seed', async function (req, res) {
  const vocabWords = JSON.parse(await readFile(join(__dirname, 'seed/vocab.json'), 'utf8'));
  const grammarConcepts = JSON.parse(await readFile(join(__dirname, 'seed/grammar.json'), 'utf8'));

  const now = new Date();
  vocabWords.forEach(function (item) { item.createdAt = now; item.updatedAt = now; });
  grammarConcepts.forEach(function (item) { item.createdAt = now; item.updatedAt = now; });

  await vocab.deleteMany({});
  await grammar.deleteMany({});
  await saves.deleteMany({});

  const vocabResult = await vocab.insertMany(vocabWords);
  const grammarResult = await grammar.insertMany(grammarConcepts);
  

  res.json({ vocab: vocabResult.insertedCount, grammar: grammarResult.insertedCount });
});

app.delete('/api/dev/clear', async function (req, res) {
  const vocabResult = await vocab.deleteMany({});
  const grammarResult = await grammar.deleteMany({});
  await saves.deleteMany({});
  
  res.json({ vocab: vocabResult.deletedCount, grammar: grammarResult.deletedCount });
});

// Saves (no accounts yet)

saves.createIndex({ itemType: 1, itemId: 1 }, { unique: true });

app.post('/api/saves', async function (req, res) {
  const { itemType, itemId } = req.body;

  if (!['vocab', 'grammar'].includes(itemType) || !ObjectId.isValid(itemId)) {
    return res.status(400).json({ error: 'itemType must be vocab or grammar, and itemId must be valid' });
  }

  const save = {
    itemType: itemType,
    itemId: new ObjectId(itemId),
    confidence: 1,
    reviewCount: 0,
    lastReviewedAt: null,
    savedAt: new Date()
  };

  try {
    const result = await saves.insertOne(save);
    res.status(201).json(result);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'already saved' });
    }
    throw err;
  }
});

app.get('/api/saves', async function (req, res) {
  const records = await saves.find({}).toArray();

  const withContent = await Promise.all(records.map(async function (save) {
    const collection = save.itemType === 'vocab' ? vocab : grammar;
    save.item = await collection.findOne({ _id: save.itemId });
    return save;
  }));

  res.json(withContent);
});

app.patch('/api/saves/:id/review', async function (req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const confidence = Number(req.body.confidence);

  if (![1, 2, 3].includes(confidence)) {
    return res.status(400).json({ error: 'confidence must be 1, 2 or 3' });
  }

  const result = await saves.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { confidence: confidence, lastReviewedAt: new Date() }, $inc: { reviewCount: 1 } }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: 'not found' });
  }

  res.json(result);
});

app.delete('/api/saves/:id', async function (req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const result = await saves.deleteOne({ _id: new ObjectId(req.params.id) });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'not found' });
  }

  res.json(result);
});

app.get('/api/review/next', async function (req, res) {
  const itemType = req.query.itemType;

  if (!['vocab', 'grammar'].includes(itemType)) {
    return res.status(400).json({ error: 'itemType must be vocab or grammar' });
  }

  const next = await saves
    .find({ itemType: itemType })
    .sort({ confidence: 1, lastReviewedAt: 1 })
    .limit(1)
    .toArray();

  if (next.length === 0) {
    return res.json({ done: true });
  }

  const save = next[0];
  const collection = itemType === 'vocab' ? vocab : grammar;
  save.item = await collection.findOne({ _id: save.itemId });

  res.json(save);
});

// Users (User System #1)

app.post('/api/auth/register', async function (req, res) {
  const body = req.body || {};
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
    return res.status(400).json({ error: 'username must be 3-30 characters: letters, numbers, - or _' });
  }

  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'password must be 8-72 characters' });
  }

  const user = {
    username: username,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'student',
    createdAt: new Date()
  };

  try {
    await users.insertOne(user);
    res.status(201).json({ username: username });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'username already taken' });
    }
    throw err;
  }
});
app.listen(5500, () => {
  console.log('Server is running on http://localhost:5500');
});