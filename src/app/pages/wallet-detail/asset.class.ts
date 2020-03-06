import {Resource, DocumentCollection} from 'ngx-jsonapi';

export class Asset extends Resource {
  public attributes = {
    decimals: 'decimals',
    id: 'id',
    issuer: 'issuer',
    name: 'name',
    shard_code: 'shard_code',
    total_supply: 'total_supply',
  };
}
