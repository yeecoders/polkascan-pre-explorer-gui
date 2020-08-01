/*
 * Polkascan PRE Explorer GUI
 *
 * Copyright 2018-2019 openAware BV (NL).
 * This file is part of Polkascan.
 *
 * Polkascan is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Polkascan is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Polkascan. If not, see <http://www.gnu.org/licenses/>.
 *
 * dashboard.component.ts
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {DocumentCollection} from 'ngx-jsonapi';
import {Block} from '../../classes/block.class';
import {interval, Observable, Subscription} from 'rxjs';
import {Networkstats} from '../../classes/networkstats.class';
import {BlockService} from '../../services/block.service';
import {NetworkstatsService} from '../../services/networkstats.service';
import {Router} from '@angular/router';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BalanceTransfer} from '../../classes/balancetransfer.class';
import {BalanceTransferService} from '../../services/balance-transfer.service';
import {environment} from '../../../environments/environment';
import {Jsonrpc} from '../wallet-detail/jsonrpc.class';
import {Data} from '../dashboard/data.class';
import {handleHashRate, handleDifficulty, handleDiff} from '../dashboard/number';
import {
  encode, decode, calls, runtime, chain, system, runtimeUp, pretty,
  addressBook, secretStore, metadata, nodeService, bytesToHex, AccountId, hexToBytes, TransactionEra, StorageBond
} from 'oo7-substrate';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  public array: Array<Data> ;
  public blocks: DocumentCollection<Block>;
  public balanceTransfers: DocumentCollection<BalanceTransfer>;
  public networkstats$: Observable<Networkstats>;

  blockSearchText: string;
  private blockUpdateSubsription: Subscription;

  public networkURLPrefix: string;
  public showShards = true;
  public networkTokenDecimals: number;
  public networkTokenSymbol: string;

  constructor(
    private blockService: BlockService,
    private balanceTransferService: BalanceTransferService,
    private networkstatsService: NetworkstatsService,
    private router: Router,
    private http: HttpClient) {

  }
  async ngOnInit() {
    const count = 4;
    this.networkURLPrefix = '';
    const ps = [];
    for (let i = 0; i < count; i++) {
      const model =  await this.getModel(i);
      ps.push(model);
    }
    console.log('ps: ', ps); // 320800.2951306496
    this.array = ps;
    // tslint:disable-next-line:only-arrow-functions
    setInterval(async () => {
      this.array = [];
      console.log('setInterval: ', 'window.location.reload----');
      for (let i = 0; i < count; i++) {
        const model =  await this.getModel(i);
        // @ts-ignore
        this.array.push(model);
      }
    }, 1000 * 60);
    this.networkTokenDecimals = environment.networkTokenDecimals;
    this.networkTokenSymbol = environment.networkTokenSymbol;
    this.getBlocks();
    this.networkstats$ = this.networkstatsService.get('latest');
    const blockUpdateCounter = interval(6000);
    this.blockUpdateSubsription = blockUpdateCounter.subscribe(n => {
      this.networkstats$ = this.networkstatsService.get('latest');
      this.getBlocks();
    });
  }
  showShardsBox() {
    this.showShards = !this.showShards;
  }
  get_target(input: string) {
    console.log(' target: ', input);
    input = input.replace('0x', '');
    const digestItemType = decode(hexToBytes(input.substr(0, 2)), 'u16');
    if (digestItemType !== 4) { // consensus
      return null;
    }
    const str =  input.substr(78, 64);
    console.log('input---', str);
    const str1 = hexToBytes(str);
    return bytesToHex(str1.reverse());
  }
  getModel(i: any) {
    return new Promise((resolve, reject) => {
      const model = new Data(i.toString(), '', '', '');
      const headers = new HttpHeaders().set('Content-Type', 'application/json');
      // tslint:disable-next-line:max-line-length
      this.http.post(
        environment.switchRootUrl,
        {
          jsonrpc: '2.0' ,
          method: 'chain_getHeader',
          params: [i],
          id: 0
        },  {headers}).toPromise().then((res: Jsonrpc) => {
        if (res.result === undefined ) {
          console.log('getModelrpc: ',  res.error);
          reject(res.error);
        } else {
          let str = res.result.digest.logs[3];
          model.hight = parseInt( res.result.number, 16).toString();
          str = this.get_target(str);
          console.log(' getModelrpc: ', str);
          const diff = Math.pow(2, 256) / parseInt(str, 16);
          const hashrate = Math.pow(2, 256) / (parseInt(str, 16) * 60);
          console.log('diff: ', diff);
          console.log('hashrate: ', hashrate);
          console.log('handleDifficulty: ', handleDifficulty(diff));
          console.log('handleHashRate: ', handleHashRate(hashrate));
          model.rate = handleHashRate(hashrate);
          model.difficulty = handleDiff(diff);
          resolve(model);
        }
      });
    });
  }
  getBlocks(): void {
    this.blockService.all({
      page: { number: 0}
    }).subscribe(blocks => (this.blocks = blocks));

    this.balanceTransferService.all({
      page: { number: 0}
    }).subscribe(balanceTransfers => (this.balanceTransfers = balanceTransfers));
  }

  search(): void {
    // Strip whitespace from search text
    this.blockSearchText = this.blockSearchText.trim();
    if (this.blockSearchText !== '') {
      this.router.navigate([this.networkURLPrefix, 'analytics', 'search', this.blockSearchText]);
    }
  }

  public formatBalance(balance: number) {
    return balance / Math.pow(10, this.networkTokenDecimals);
  }

  ngOnDestroy() {
    // Will clear when component is destroyed e.g. route is navigated away from.
    if(this.blockUpdateSubsription) {
      this.blockUpdateSubsription.unsubscribe();
    }
  }
}
