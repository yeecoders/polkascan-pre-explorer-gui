export class Jsonrpc {
  constructor(
    public jsonrpc: string,
    public result: any,
    public error: string,
    public id: string,
  ) {  }
}
