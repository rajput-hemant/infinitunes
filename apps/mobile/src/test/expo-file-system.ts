const files = new Map<string, number>();
const directories = new Set<string>();
export const Paths = { cache: "file:///cache" };
const uriOf = (parts: (string | { uri: string })[]) =>
  parts.map((part) => (typeof part === "string" ? part : part.uri)).join("/");

export class File {
  readonly uri: string;
  constructor(...parts: (string | { uri: string })[]) {
    this.uri = uriOf(parts);
  }
  get name() {
    return this.uri.split("/").at(-1) ?? "";
  }
  get exists() {
    return files.has(this.uri);
  }
  get size() {
    return files.get(this.uri) ?? 0;
  }
  delete() {
    files.delete(this.uri);
  }
  bytes = async () => new Uint8Array(this.size);
  static downloadFileAsync = jest.fn(async (_source: string, target: File) => {
    files.set(target.uri, 1024);
    return target;
  });
}

export class Directory {
  readonly uri: string;
  constructor(...parts: (string | { uri: string })[]) {
    this.uri = uriOf(parts);
  }
  get exists() {
    return directories.has(this.uri);
  }
  get size() {
    return this.list().reduce((sum, file) => sum + file.size, 0);
  }
  create() {
    directories.add(this.uri);
  }
  list() {
    return [...files.keys()]
      .filter((uri) => uri.startsWith(this.uri + "/"))
      .map((uri) => new File(uri));
  }
  delete() {
    for (const file of this.list()) file.delete();
    directories.delete(this.uri);
  }
}
export function putFile(uri: string, bytes: number) {
  files.set(uri, bytes);
  directories.add(uri.slice(0, uri.lastIndexOf("/")));
}
export function resetFiles() {
  files.clear();
  directories.clear();
  File.downloadFileAsync.mockImplementation(async (_source, target) => {
    putFile(target.uri, 1024);
    return target;
  });
}
