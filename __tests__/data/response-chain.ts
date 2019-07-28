import * as assert from 'assert';
import { readFileSync } from 'fs';
import * as path from 'path';
const data = readFileSync(path.resolve(__dirname, './response-chain-data.bin'));
export const buffer = Buffer.from(data);
