export class Transfer {
  constructor(
    public sendAddress: string,
    public password: string,
    public dest: string,
    public sendPrivateKey: string,
    public amount: string,
  ) {  }
}
