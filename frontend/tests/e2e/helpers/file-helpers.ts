import path from 'path';
import fs, { existsSync } from 'fs';
//function to clean test/uploads directory
export async function cleanTestDirectories() {
  //clean test-results and test-uploads directories
  const BASE_TEST_RESULTS_DIR = path.join(__dirname, '../../test-results');
  const BASE_TEST_UPLOADS_DIR = path.join(__dirname, '../../test-uploads');

  const directories = [BASE_TEST_RESULTS_DIR, BASE_TEST_UPLOADS_DIR];

  for (const dir of directories) {
    if (existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
  }
}
//function to clean specific directory
export async function cleanDirectory(dirPath: string) {
  if (existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  }
}
//function to check if directory is empty
export function isDirectoryEmpty(dirPath: string): boolean {
  if (existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    return files.length === 0;
  }
  return true;
}
//function to create directory if it doesn't exist
export function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
//function to write a file
export function writeFile(filePath: string, content: string) {
  fs.writeFileSync(filePath, content);
}
//function to read a file
export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}
//function to delete a file
export function deleteFile(filePath: string) {
  if (existsSync(filePath)) {
    fs.rmSync(filePath);
  }
}