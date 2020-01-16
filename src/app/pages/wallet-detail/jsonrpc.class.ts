export class Jsonrpc {
  constructor(
    public jsonrpc: string,
    public result: string,
    public error: string,
    public id: string,
  ) {  }
}
