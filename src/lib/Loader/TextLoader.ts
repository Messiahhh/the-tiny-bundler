import fs from 'fs/promises';

export async function TextLoader(id: string) {
  const text = await fs.readFile(id, { encoding: 'utf-8' });
  return {
    code: `module.exports = ${JSON.stringify(text)}`,
  };
}
