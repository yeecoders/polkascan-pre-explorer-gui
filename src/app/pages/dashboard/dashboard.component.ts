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
import {handleHashRate, handleDifficulty} from '../dashboard/number';
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
  public networkTokenDecimals: number;
  public networkTokenSymbol: string;

  constructor(
    private blockService: BlockService,
    private balanceTransferService: BalanceTransferService,
    private networkstatsService: NetworkstatsService,
    private router: Router,
    private http: HttpClient) {

   }
  // 1 KHash/s = 1000 Hash/s
  // 1 MHash/s = 1000 KHash/s
  // 1 GHash/s = 1000 MHash/s
  // 1 THash/s = 1000 GHash/s
  // 1 PHash/s = 1000 THash/s
  async ngOnInit() {
    // tslint:disable-next-line:max-line-length
    await this.get_target('0x0459656521750350907ff82b2d1fb8d7d07fe9cc0c6e33454e1e98abce6714d20567fbf33be078eee6e993fca3bd8c7a31aaee6520b968afc1f941c88572e2d65b1a4f1f010000bae45f0f7101000002287965652d7377697463686c723bd5a554413fcaa3272fc5c68be002ae10bd837f43a37f6f7412a582dd6a252d00000000000008e6fc24bc1df1907dae7c4407d16cbc022e94210a581e119e22be83ac09ccf016a93f20da95d9a3e1a3c5ec5bd8ec24279ee9f2925d4f8b71107b46389961bde885c09af929492a871e4fae32d9d5c36e352471cd659bcdb61de08f1722acc3b1');
    // const model1 = new Data('0', '', '');
    // const model2 = new Data('1', '', '');
    // const model3 = new Data('2', '', '');
    // const model4 = new Data('3', '', '');
    // const diff = Math.pow(2, 256) / parseInt('0xdf235e97ebf249f8470231305cdf93041e5209abae6b2b4c2e9b050348', 16);
    // const hashrate = Math.pow(2, 256) / (parseInt('0xdf235e97ebf249f8470231305cdf93041e5209abae6b2b4c2e9b050348', 16) * 60);
    // console.log('diff: ', diff); // 19248017.70783897
    // console.log('hashrate: ', hashrate); // 320800.2951306496
    // console.log('handleDifficulty: ', handleDifficulty(diff)); // 19248017.86342043304
    // console.log('handleHashRate: ', handleHashRate(hashrate)); // 320800.2951306496
    // model1.rate = handleHashRate(hashrate);
    // model1.difficulty = handleDifficulty(diff);
    const count = 4;
    const ps = [];
    for (let i = 0; i < count; i++) {
      const model =  await this.getModel(i);
      ps.push(model);
    }
    console.log('ps: ', ps); // 320800.2951306496
    this.array = ps;
    this.networkURLPrefix = '';
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
  get_target(input: string) {
      console.log(' target: ', input);
      input = input.replace('0x', '');
      const digestItemType = decode(hexToBytes(input.substr(0, 2)), 'u16');
      if (digestItemType !== 4) { // consensus
        return null;
      }
      // 81db690f71010000  1585101527937
      console.log('input---', input.substr(78, 64));
      return new Promise((resolve, reject) => {
        const time = decode(hexToBytes('81db690f71010000', 'u64'))
        resolve(time);
      });
        // const timestamp = decode(hexToBytes('81db690f71010000', 'u64'));
      // const timestamp1 = decode(hexToBytes('81db690f', 'u32'));
      // const timestamp2 = decode(hexToBytes('71010000', 'u32'));
      // console.log('input---timestamp', timestamp);
      // console.log('input---timestamp1', timestamp1);
      // console.log('input---timestamp2', timestamp2);
      // resolve(timestamp);
  }
  getModel(i: any) {
    return new Promise((resolve, reject) => {
      const model = new Data(i.toString(), '', '');
      const headers = new HttpHeaders().set('Content-Type', 'application/json');
      // tslint:disable-next-line:max-line-length
      this.http.post(
        'http://18.138.185.139:9933/',
        {
          jsonrpc: '2.0' ,
          method: 'mining_getJob',
          params: [],
          id: 0
        },  {headers}).toPromise().then((res: Jsonrpc) => {
        // tslint:disable-next-line:no-eval
        if (res.result === undefined ) {
          console.log('mining_getJob: ',  res.error);
          reject(res.error);
        } else {
          console.log(' mining_getJob: ', res.result.digest_item.pow_target);
          const str = res.result.digest_item.pow_target;
          const diff = Math.pow(2, 256) / parseInt(str, 16);
          const hashrate = Math.pow(2, 256) / (parseInt(str, 16) * 60);
          console.log('diff: ', diff); // 19248017.70783897
          console.log('hashrate: ', hashrate); // 320800.2951306496
          console.log('handleDifficulty: ', handleDifficulty(diff)); // 19248017.86342043304
          console.log('handleHashRate: ', handleHashRate(hashrate)); // 320800.2951306496
          model.rate = handleHashRate(hashrate);
          model.difficulty = handleDifficulty(diff);
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
    this.blockUpdateSubsription.unsubscribe();
  }
}
