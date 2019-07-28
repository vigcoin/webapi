import { writeFileSync } from 'fs';
import { data } from './response-chain-data';

function convert(data: Buffer, filename: string) {
  writeFileSync(filename, data);
}

convert(Buffer.from(data), 'response-chain.bin');
