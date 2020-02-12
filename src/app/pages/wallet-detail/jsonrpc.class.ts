export class Jsonrpc {
  constructor(
    public jsonrpc: string,
    public result: any,
    public error: any,
    public id: string,
  ) {  }
}
