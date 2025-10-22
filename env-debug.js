// debug-env.js
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const cwd = process.cwd();
console.log('cwd:', cwd);

// show if .env exists and its real filename
const dirList = fs.readdirSync(cwd);
console.log('.env exists?:', dirList.includes('.env'));
console.log('files in cwd (first 50):', dirList.slice(0,50));

// try loading .env explicitly and with debug enabled
const res1 = dotenv.config({ path: path.join(cwd, '.env'), debug: true });
console.log('dotenv.config() returned:', res1);

// also try loading from "env" (in case you named it that)
const res2 = dotenv.config({ path: path.join(cwd, 'env'), debug: true });
console.log('dotenv.config(path:"env") returned:', res2);

// print exactly what process sees (with delimiters)
console.log('RAW MONGODB_URI |' + (process.env.MONGODB_URI ?? '<undefined>') + '|');

// basic sanity checks
console.log('MONGODB_URI typeof:', typeof process.env.MONGODB_URI);
console.log('process.execPath:', process.execPath);
console.log('Node argv:', process.argv.join(' '));
