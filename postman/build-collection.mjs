// Generates Fran-LostFound.postman_collection.json
// Run: node postman/build-collection.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const json = { key: 'Content-Type', value: 'application/json' };
const bearer = (v) => ({ key: 'Authorization', value: `Bearer {{${v}}}` });

function req(name, method, path, { headers = [], body, tests = [], description } = {}) {
  const segments = path.split('?');
  const url = {
    raw: `{{baseUrl}}${path}`,
    host: ['{{baseUrl}}'],
    path: segments[0].split('/').filter(Boolean),
  };
  if (segments[1]) {
    url.query = segments[1].split('&').map((kv) => {
      const [key, value] = kv.split('=');
      return { key, value };
    });
  }
  const item = {
    name,
    request: {
      method,
      header: body !== undefined ? [json, ...headers] : headers,
      url,
      description,
    },
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: tests } }],
  };
  if (body !== undefined) {
    item.request.body = {
      mode: 'raw',
      raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2),
      options: { raw: { language: 'json' } },
    };
  }
  return item;
}

const status = (code) =>
  `pm.test('Status code is ${code}', () => pm.response.to.have.status(${code}));`;
const statusOneOf = (codes) =>
  `pm.test('Status code is one of ${codes.join('/')}', () => pm.expect(pm.response.code).to.be.oneOf([${codes.join(',')}]));`;

const fran = { name: 'Francis Torres', email: 'fran.torres@my.centennialcollege.ca', password: 'secret123' };
const alex = { name: 'Alex Other', email: 'alex.other@my.centennialcollege.ca', password: 'secret456' };
const missingId = '64b000000000000000000000';
const pastDate = '2026-10-20T14:30:00.000Z';

const backpack = {
  title: 'Black Jansport Backpack',
  description: 'Black Jansport backpack with a laptop and a COMP229 notebook inside.',
  type: 'Lost',
  category: 'Accessories',
  location: 'Library, 2nd floor',
  date: pastDate,
};
const airpods = {
  title: 'White AirPods Pro Case',
  description: 'AirPods Pro charging case found on a table, engraved with "F.T."',
  type: 'Found',
  category: 'Electronics',
  location: 'Cafeteria, Building A',
  date: '2026-10-21T09:15:00.000Z',
};
const textbook = {
  title: 'Web Application Development Textbook',
  description: 'Hardcover textbook left behind after class, name written inside the cover.',
  type: 'Found',
  category: 'Books',
  location: 'Room C-210',
  date: '2026-10-22T16:00:00.000Z',
};

const folders = [
  {
    name: '0 - Server',
    item: [
      req('API root (server running on 8080)', 'GET', '/', { tests: [status(200)] }),
    ],
  },
  {
    name: '1 - Auth (provided)',
    item: [
      req('Signup Fran', 'POST', '/api/auth/signup', {
        body: fran,
        tests: [status(201), "pm.test('Returns a token', () => pm.expect(pm.response.json().token).to.be.a('string'));"],
      }),
      req('Signup duplicate email -> 409', 'POST', '/api/auth/signup', { body: fran, tests: [status(409)] }),
      req('Signin wrong password -> 401', 'POST', '/api/auth/signin', {
        body: { email: fran.email, password: 'wrongpass' },
        tests: [status(401)],
      }),
      req('Signin Fran (save token)', 'POST', '/api/auth/signin', {
        body: { email: fran.email, password: fran.password },
        tests: [
          status(200),
          "pm.collectionVariables.set('franToken', pm.response.json().token);",
          "pm.collectionVariables.set('franId', pm.response.json().user._id);",
        ],
      }),
      req('Signup Alex (second user)', 'POST', '/api/auth/signup', { body: alex, tests: [status(201)] }),
      req('Signin Alex (save token)', 'POST', '/api/auth/signin', {
        body: { email: alex.email, password: alex.password },
        tests: [status(200), "pm.collectionVariables.set('alexToken', pm.response.json().token);"],
      }),
      req('Get current user (me)', 'GET', '/api/auth/me', { headers: [bearer('franToken')], tests: [status(200)] }),
    ],
  },
  {
    name: '2 - Create items (POST /api/items)',
    item: [
      req('Create item without token -> 401', 'POST', '/api/items', { body: backpack, tests: [status(401)] }),
      req('Create item with invalid token -> 401', 'POST', '/api/items', {
        headers: [{ key: 'Authorization', value: 'Bearer not.a.real.token' }],
        body: backpack,
        tests: [status(401)],
      }),
      req('Create item missing required fields -> 400', 'POST', '/api/items', {
        headers: [bearer('franToken')],
        body: { title: 'Lonely Umbrella' },
        tests: [status(400)],
      }),
      req('Create item invalid type/category/date -> 400', 'POST', '/api/items', {
        headers: [bearer('franToken')],
        body: { ...backpack, title: 'Bad Values Item', type: 'Stolen', category: 'Food', date: '2099-01-01' },
        tests: [status(400)],
      }),
      req('Create item with malformed JSON -> 400', 'POST', '/api/items', {
        headers: [bearer('franToken')],
        body: '{ "title": "Broken JSON", ',
        tests: [status(400)],
      }),
      req('Create item 1 - Fran (Lost backpack) -> 201', 'POST', '/api/items', {
        headers: [bearer('franToken')],
        body: backpack,
        tests: [
          status(201),
          "pm.collectionVariables.set('franItemId', pm.response.json()._id);",
          "pm.test('Owner is the signed-in user', () => pm.expect(pm.response.json().owner).to.eql(pm.collectionVariables.get('franId')));",
          "pm.test('Status defaults to Open', () => pm.expect(pm.response.json().status).to.eql('Open'));",
        ],
      }),
      req('Create item 2 - Fran (Found AirPods) -> 201', 'POST', '/api/items', {
        headers: [bearer('franToken')],
        body: airpods,
        tests: [status(201), "pm.collectionVariables.set('franItem2Id', pm.response.json()._id);"],
      }),
      req('Create duplicate title (case-insensitive) -> 409', 'POST', '/api/items', {
        headers: [bearer('franToken')],
        body: { ...backpack, title: 'black jansport backpack' },
        tests: [status(409)],
      }),
      req('Create item 3 - Alex (Found textbook) -> 201', 'POST', '/api/items', {
        headers: [bearer('alexToken')],
        body: textbook,
        tests: [status(201), "pm.collectionVariables.set('alexItemId', pm.response.json()._id);"],
      }),
    ],
  },
  {
    name: '3 - Read items (GET)',
    item: [
      req('List all items (public)', 'GET', '/api/items', {
        tests: [status(200), "pm.test('Returns 3 items', () => pm.expect(pm.response.json().length).to.eql(3));"],
      }),
      req('Filter by type=Found', 'GET', '/api/items?type=Found', {
        tests: [status(200), "pm.test('All items are Found', () => pm.response.json().forEach(i => pm.expect(i.type).to.eql('Found')));"],
      }),
      req('Filter by category=Electronics', 'GET', '/api/items?category=Electronics', {
        tests: [status(200), "pm.test('All items are Electronics', () => pm.response.json().forEach(i => pm.expect(i.category).to.eql('Electronics')));"],
      }),
      req('Filter by type=Found&category=Books', 'GET', '/api/items?type=Found&category=Books', {
        tests: [status(200), "pm.test('Exactly 1 match', () => pm.expect(pm.response.json().length).to.eql(1));"],
      }),
      req('Invalid filter value -> 400', 'GET', '/api/items?type=Stolen', { tests: [status(400)] }),
      req('Get item by id (public)', 'GET', '/api/items/{{franItemId}}', { tests: [status(200)] }),
      req('Get item with invalid id -> 400', 'GET', '/api/items/not-a-valid-id', { tests: [status(400)] }),
      req('Get item with valid but missing id -> 404', 'GET', `/api/items/${missingId}`, { tests: [status(404)] }),
      req('List my items - Fran', 'GET', '/api/items/mine', {
        headers: [bearer('franToken')],
        tests: [
          status(200),
          "pm.test('Only Fran\\'s 2 items', () => { const r = pm.response.json(); pm.expect(r.length).to.eql(2); r.forEach(i => pm.expect(i.owner).to.eql(pm.collectionVariables.get('franId'))); });",
        ],
      }),
      req('List my items without token -> 401', 'GET', '/api/items/mine', { tests: [status(401)] }),
    ],
  },
  {
    name: '4 - Update items (PUT /api/items/:id)',
    item: [
      req('Update own item (owner) -> 200', 'PUT', '/api/items/{{franItemId}}', {
        headers: [bearer('franToken')],
        body: { status: 'Returned', location: 'Picked up at Security Desk, Building A' },
        tests: [status(200), "pm.test('Status is Returned', () => pm.expect(pm.response.json().status).to.eql('Returned'));"],
      }),
      req("Update ANOTHER user's item (Alex -> Fran's item) -> 403", 'PUT', '/api/items/{{franItemId}}', {
        headers: [bearer('alexToken')],
        body: { title: 'Hijacked by Alex', status: 'Open' },
        tests: [status(403)],
      }),
      req('Update without token -> 401', 'PUT', '/api/items/{{franItemId}}', {
        body: { status: 'Open' },
        tests: [status(401)],
      }),
      req('Update with invalid values / owner field -> 400', 'PUT', '/api/items/{{franItemId}}', {
        headers: [bearer('franToken')],
        body: { status: 'Lost forever', owner: '64b111111111111111111111' },
        tests: [status(400)],
      }),
      req('Update with empty body -> 400', 'PUT', '/api/items/{{franItemId}}', {
        headers: [bearer('franToken')],
        body: {},
        tests: [status(400)],
      }),
      req('Update to a title that already exists -> 409', 'PUT', '/api/items/{{franItem2Id}}', {
        headers: [bearer('franToken')],
        body: { title: 'Web Application Development Textbook' },
        tests: [status(409)],
      }),
      req('Update with invalid id -> 400', 'PUT', '/api/items/12345', {
        headers: [bearer('franToken')],
        body: { status: 'Returned' },
        tests: [status(400)],
      }),
      req('Update missing item -> 404', 'PUT', `/api/items/${missingId}`, {
        headers: [bearer('franToken')],
        body: { status: 'Returned' },
        tests: [status(404)],
      }),
    ],
  },
  {
    name: '5 - Delete items (DELETE)',
    item: [
      req("Delete ANOTHER user's item (Alex -> Fran's item) -> 403", 'DELETE', '/api/items/{{franItemId}}', {
        headers: [bearer('alexToken')],
        tests: [status(403)],
      }),
      req('Delete without token -> 401', 'DELETE', '/api/items/{{franItemId}}', { tests: [status(401)] }),
      req('Delete with invalid id -> 400', 'DELETE', '/api/items/abc', {
        headers: [bearer('franToken')],
        tests: [status(400)],
      }),
      req('Delete missing item -> 404', 'DELETE', `/api/items/${missingId}`, {
        headers: [bearer('franToken')],
        tests: [status(404)],
      }),
      req('Delete own item (owner) -> 200', 'DELETE', '/api/items/{{franItemId}}', {
        headers: [bearer('franToken')],
        tests: [status(200)],
      }),
      req('Get deleted item -> 404', 'GET', '/api/items/{{franItemId}}', { tests: [status(404)] }),
      req('Delete all my items - Fran -> 200', 'DELETE', '/api/items/mine', {
        headers: [bearer('franToken')],
        tests: [status(200), "pm.test('deletedCount is 1', () => pm.expect(pm.response.json().deletedCount).to.eql(1));"],
      }),
      req('List my items after delete -> empty', 'GET', '/api/items/mine', {
        headers: [bearer('franToken')],
        tests: [status(200), "pm.test('Fran has no items left', () => pm.expect(pm.response.json()).to.eql([]));"],
      }),
      req("Alex's item still exists (other users unaffected)", 'GET', '/api/items', {
        tests: [status(200), "pm.test('Only Alex\\'s item remains', () => pm.expect(pm.response.json().length).to.eql(1));"],
      }),
    ],
  },
];

const collection = {
  info: {
    name: "Fran's Campus Lost & Found API - COMP229 MidTerm 301530008",
    description: 'Francis Torres (301530008). Run the folders in order against a fresh database.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:8080' },
    { key: 'franToken', value: '' },
    { key: 'alexToken', value: '' },
    { key: 'franId', value: '' },
    { key: 'franItemId', value: '' },
    { key: 'franItem2Id', value: '' },
    { key: 'alexItemId', value: '' },
  ],
  item: folders,
};

writeFileSync(join(here, 'Fran-LostFound.postman_collection.json'), JSON.stringify(collection, null, 2) + '\n');
console.log('Wrote postman/Fran-LostFound.postman_collection.json');
