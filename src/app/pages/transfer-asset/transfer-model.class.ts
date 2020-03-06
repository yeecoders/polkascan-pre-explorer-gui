export class TransferModelClass {
  constructor(
    public password: string,
    public assetTransferShard: string,
    public assetTransferId: string,
    public assetTo: string,
    public assetAmount: string,

  ) {  }
}
