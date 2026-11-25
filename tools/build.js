// Assemble index.html à partir de template.html, engine.js et levels.json
const fs = require('fs'), path = require('path');
const d = __dirname;
let t = fs.readFileSync(path.join(d, 'template.html'), 'utf8');
let eng = fs.readFileSync(path.join(d, 'engine.js'), 'utf8');
eng = eng.slice(0, eng.indexOf('// Énumère les solutions'));
t = t.replace('/*ENGINE*/', () => eng).replace('/*LEVELS*/', () => fs.readFileSync(path.join(d, 'levels.json'), 'utf8'));
fs.writeFileSync(path.join(d, '..', 'index.html'), t);
