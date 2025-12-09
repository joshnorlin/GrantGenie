declare module "file-saver" {
  export function saveAs(data: Blob, filename: string): void;
  export function saveAs(data: Blob, filename: string, options: { autoBom: boolean }): void;
}
