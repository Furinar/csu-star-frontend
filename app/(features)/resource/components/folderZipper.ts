import { zip } from 'fflate';

function getFileFromEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

async function readDirectory(dirEntry: FileSystemDirectoryEntry, path: string, zipObj: Record<string, Uint8Array>): Promise<void> {
  const dirReader = dirEntry.createReader();
  
  const readAllEntries = async () => {
    let allEntries: FileSystemEntry[] = [];
    while (true) {
      const entries: FileSystemEntry[] = await new Promise((resolve, reject) => {
        dirReader.readEntries(resolve, reject);
      });
      if (entries.length === 0) break;
      allEntries = allEntries.concat(entries);
    }
    return allEntries;
  };

  const entries = await readAllEntries();
  for (const entry of entries) {
    const fullPath = path ? `${path}/${entry.name}` : entry.name;
    if (entry.isDirectory) {
      await readDirectory(entry as FileSystemDirectoryEntry, fullPath, zipObj);
    } else {
      const file = await getFileFromEntry(entry as FileSystemFileEntry);
      const buffer = await file.arrayBuffer();
      zipObj[fullPath] = new Uint8Array(buffer);
    }
  }
}

function zipDirectory(dirEntry: FileSystemDirectoryEntry): Promise<Uint8Array> {
  return new Promise(async (resolve, reject) => {
    try {
      const zipObj: Record<string, Uint8Array> = {};
      await readDirectory(dirEntry, '', zipObj);
      zip(zipObj, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function processDataTransferItems(items: DataTransferItemList): Promise<File[]> {
  const files: File[] = [];
  const entries = Array.from(items)
    .map(item => item.webkitGetAsEntry())
    .filter(Boolean) as FileSystemEntry[];

  for (const entry of entries) {
    if (entry.isFile) {
      files.push(await getFileFromEntry(entry as FileSystemFileEntry));
    } else if (entry.isDirectory) {
      const zippedData = await zipDirectory(entry as FileSystemDirectoryEntry);
      const file = new File([Uint8Array.from(zippedData)], `${entry.name}.zip`, { type: 'application/zip' });
      files.push(file);
    }
  }
  return files;
}

export async function processFileInput(files: FileList): Promise<File[]> {
  // when an input[webkitdirectory] is used, files have webkitRelativePath
  // But normally we wouldn't receive them all nested nicely without it.
  // Actually, `<input type="file" multiple>` doesn't let you pick a folder easily.
  // We'll just return the array.
  return Array.from(files);
}
