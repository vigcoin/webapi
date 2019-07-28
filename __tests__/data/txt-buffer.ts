import { writeFileSync } from 'fs';
import { data } from './response-get-objects-data';

function convert(buffer: Buffer, filename: string) {
  writeFileSync(filename, buffer);
}

convert(Buffer.from(data), 'response-get-objects-data.bin');
