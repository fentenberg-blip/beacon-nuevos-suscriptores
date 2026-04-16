const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = 'historial.json';
const API_BASE = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
};

async function getFile() {
  const res = await fetch(API_BASE, { headers });
  if (res.status === 404) return { data: {}, sha: null };
  const json = await res.json();
  const data = JSON.parse(Buffer.from(json.content, 'base64').toString('utf-8'));
  return { data, sha: json.sha };
}

async function saveFile(data, sha) {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const body = {
    message: 'update historial',
    content,
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(API_BASE, { method: 'PUT', headers, body: JSON.stringify(body) });
  return res.ok;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { data } = await getFile();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { pais, fecha } = req.body;
    if (!pais || !fecha) return res.status(400).json({ error: 'Faltan datos' });
    const { data, sha } = await getFile();
    data[pais] = fecha;
    await saveFile(data, sha);
    return res.status(200).json(data);
  }

  return res.status(405).end();
}
