/*
 *  Explorer GUI
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
 */
import {Component, OnInit} from '@angular/core';
import {DocumentCollection} from 'ngx-jsonapi';
import {Extrinsic} from '../../classes/extrinsic.class';
import {BalanceTransferService} from '../../services/balance-transfer.service';
import {ExtrinsicService} from '../../services/extrinsic.service';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {Account} from '../../classes/account.class';
import {AccountService} from '../../services/account.service';
import {switchMap} from 'rxjs/operators';
import {BalanceTransfer} from '../../classes/balancetransfer.class';
import {AccountIndexService} from '../../services/account-index.service';
import bech32 from 'bech32';
import * as crypto from 'crypto-js';
import {Transfer} from './transfer.class';
import {SignedData} from './signedData.class';
import {ResultOut} from './result.class';
import {Jsonrpc} from './jsonrpc.class';
import {
  encode, decode, calls, runtime, chain, system, runtimeUp, pretty,
  addressBook, secretStore, metadata, nodeService, bytesToHex, AccountId, hexToBytes, TransactionEra, StorageBond
} from 'oo7-substrate';
import {LocalStorage} from './local.storage';
import axios from 'axios';
import {HttpClient,} from '@angular/common/http';
import {HttpParams} from '@angular/common/http';
import {HttpHeaders} from '@angular/common/http';
import {TransformBond} from 'oo7';
import * as chainRuntime from 'src/app/lib/runtime.js';
import {sign} from '@polkadot/wasm-schnorrkel';

@Component({
  selector: 'app-wallet-detail',
  templateUrl: './wallet-detail.component.html',
  styleUrls: ['./wallet-detail.component.scss']
})
export class WalletDetailComponent implements OnInit {
  public extrinsics: DocumentCollection<Extrinsic>;
  public networkTokenDecimals: number;
  public networkTokenSymbol: string;
  public cache: string;
  public nonce: string;
  public header: string;
  public balance: string;
  public shardnum: number;
  public address: string;
  public transferRes: string;

  constructor(
    private ls: LocalStorage,
    private balanceTransferService: BalanceTransferService,
    private extrinsicService: ExtrinsicService,
    private accountService: AccountService,
    private accountIndexService: AccountIndexService,
    private httpClient: HttpClient,
  ) {
  }

  public resout = new ResultOut('', false, false);
  public model = new Transfer('', '', '', '', '');
  public calls = {};
  public onRuntimeInit = [];

  runInBalancesTransferCall(dest, value, cb) {
    const callBond = calls.balances.transfer(dest, value);
    callBond.tie((call, i) => {
      console.log('call: ', call);
      cb(call);
      callBond.untie();
    });
  }

  ngOnInit() {
    // const hex = '0400ffa0837b84eedaf81b26323f05426b39eeedbb4d28868727de045eb679ac2c9b59a10f';
    // console.log('call--bytes:', new Uint8Array(Buffer.from(hex, 'hex')));


    this.address = this.ls.getObject('wallet_address');
    console.log('address: ', this.address);

    this.nonce = this.getNonce(this.address);
    this.balance = this.getBalance(this.address);
    this.shardnum = this.getShardNum(this.address);

    this.networkTokenDecimals = environment.networkTokenDecimals;
    this.networkTokenSymbol = environment.networkTokenSymbol;

    chainRuntime.initRuntime();
    this.calls = chainRuntime.default.calls;

    this.model.dest = 'tyee18z4vztn7d0t9290d6tmlucqcelj4d4luzshnfh274vsuf62gkdrsd7hqxh';
  }

  async transfer() {

    console.log(this.calls);

    if (this.model.password === '' || this.model.dest === '' || this.model.amount === '') {
      this.resout.result = 'Please fill all input';
      this.resout.showResult = true;
      return;
    }

    const amountInCo = this.fromBalance(this.model.amount);
    console.log('acmountInCo: ' + amountInCo);

    if (amountInCo < 1000) {
      this.resout.result = 'The amount should not be less than 0.0001'
      this.resout.showResult = true;
      return;
    }




    // const decryptstr = this.decrypt(this.ls.getObject('wallet_private_key_enc') , this.model.password);
    // console.log('decryptstr:', decryptstr);
    // // tslint:disable-next-line:max-line-length
    // this.model.sendPrivateKey = '0xa079ef650520662d08f270c4bc088f0c61abd0224f58243f6d1e6827c3ab234a7a1a0a3b89bbb02f2b10e357fd2a5ddb5050bc528c875a6990874f9dc6496772';
    // this.model.sendAddress = 'tyee12n2pjuwa5hukpnxjt49q5fal7m5h2ddtxxlju0yepzxty2e2fads5g57yd';
    // if (this.model.password === '' || this.model.dest === '' || this.model.amount === '') {
    //   this.resout.result = 'Please fill all input';
    //   this.resout.showResult = true;
    //   // console.log(this.resout);
    //   return;
    // }
    // // @ts-ignore
    // if (this.model.amount < 1000) {
    //   this.resout.result = 'The amount should not be less than 1000';
    //   this.resout.showResult = true;
    //   console.log('resout:', this.resout);
    //   return;
    // }
    // console.log('this.model:' , this.model);
    // const descPublic = this.bech32_decode(this.model.dest);
    // const senderPublic = this.bech32_decode(this.model.sendAddress);
    // console.log('descPublic:', descPublic);
    // console.log('senderPublic:', senderPublic);
    // const sendShardNum = this.getshardnum(this.model.sendAddress);
    // const destShardNum = this.getshardnum(this.model.dest);
    // console.log('sendShardNum', sendShardNum);
    // console.log('destShardNum', destShardNum);
    // const secret = hexToBytes(this.model.sendPrivateKey);
    // console.log('secret:', secret);
    // // const hex = '0400ffa0837b84eedaf81b26323f05426b39eeedbb4d28868727de045eb679ac2c9b59a10f';
    // // tslint:disable-next-line:no-eval
    // const height = await this.getHeight(sendShardNum);
    // console.log('height:', height);
    // const longevity = 64;
    // const l = Math.min(15, Math.max(1, Math.ceil(Math.log2(longevity)) - 1));
    // // tslint:disable-next-line:no-bitwise
    // const period = 2 << l;
    // // tslint:disable-next-line:no-bitwise
    // const factor = Math.max(1, period >> 12);
    // const Q = (n, d) => Math.floor(n / d) * d;
    // const eraNumber = Q(height, factor);
    // console.log('eraNumber:', eraNumber);
    // const phase = eraNumber % period;
    // const era = new TransactionEra(period, phase);
    // // console.log(era);
    // const call = this.getInBalancesTransferCall(descPublic);
    // console.log('call:', call);
    // const index = this.getNonce(this.model.sendAddress);
    // console.log('index:', index);
    // const eraHash = await this.getBestHash(sendShardNum, eraNumber);
    // const e = encode([index, call, era, '0x92efd1f895cfab6ce8e428157b97e072445459f28109a4131af4d54f9f5af6b8'], [
    //   'Compact<Index>', 'Call', 'TransactionEra', 'Hash'
    // ]);
    // console.log('e:', e);
    // // tslint:disable-next-line:max-line-length
    // const a = this.bech32_decode('tyee12fdz0fgjne0j8tnlffvhfhnp7dhq74s6t50963rzqqdxaujfzdusvzkfux');
    // // tslint:disable-next-line:max-line-length
    // const b =    hexToBytes('0x7093235ec2fc85eeb4c778293979ca3885d410d6afcbd883213dc9063f277e5841513c8f8cd511dde34a79a1a1e6d317671f0d8011ce9dea19f6c1ca9ddf689d');
    // // tslint:disable-next-line:max-line-length
    // // console.log(a);
    // // console.log(b);
    // const address = '0x' + Buffer.from(senderPublic).toString('hex');
    // console.log('address:', address);
    // const signature = sign(senderPublic, secret, e);
    // console.log('signature:', signature);
    // const signmodel = new SignedData(0x81, address, signature, index, era, call);
    // console.log('signmodel:', encode(signmodel, 'Transaction'));
    // const signedDataex = encode(encode({
    //   version: 0x81,
    //   sender: address,
    //   signature,
    //   index,
    //   era,
    //   call
    // }, 'Transaction'), 'Vec<u8>');
    // console.log('signedDataex:', signedDataex);
    // const signedData = encode(encode(signmodel, 'Transaction'), 'Vec<u8>');
    // console.log('signedData:', signedData);
    // const extrinsic = '0x' + bytesToHex(signedData);
    // console.log('extrinsic:', extrinsic);
    // //
    // // this.runInBalancesTransferCall('tyee1r3ur0wf3y5a5aveeecangcwmw3wwfjje86gd9ve4smchmkhdzavqvj4dsq', '3333' , (call) => {
    // //   console.log(call);
    // //   }
    // // );
    // const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // // const params = new HttpParams().set('_page', '1').set('_limit',  '1');
    // // tslint:disable-next-line:max-line-length
    // const data =     this.httpClient.post('https://pocnet.yeescan.org/switch/api/', {jsonrpc: '2.0' , method: 'author_submitExtrinsic', params: [extrinsic], id: 0}, {headers})
    //   .toPromise().then((res: Jsonrpc) => {
    //     // tslint:disable-next-line:no-eval
    //   if (res.result === undefined ) {
    //     console.log('author_submitExtrinsic: ',  res.error);
    //     this.transferRes =  res.error.message;
    //     return  res.error;
    //   } else {
    //     console.log('author_submitExtrinsic: ', res.result );
    //     this.transferRes =  res.result;
    //     return  res.result;
    //   }
    // });
    // // this.transferRes = 'transfer success';
    // // setTimeout(() => {
    // //     this.router.navigate(['', '/']);
    // //   },
    // //   4000);
  }

  public getInBalancesTransferCall(dest: any) {
    const hex = '0400ffa0837b84eedaf81b26323f05426b39eeedbb4d28868727de045eb679ac2c9b59a10f';
    return new Uint8Array(Buffer.from(hex, 'hex'));
  }

  public getBalance(str: string) {
    if (str === '' || str === undefined) {
      return;
    }
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // tslint:disable-next-line:max-line-length
    this.httpClient.post('https://pocnet.yeescan.org/switch/api/', {
      jsonrpc: '2.0',
      method: 'state_getBalance',
      params: [str],
      id: 0
    }, {headers}).subscribe((res: Jsonrpc) => {
      console.log('getBalance: ', res.result);
      // tslint:disable-next-line:no-eval
      this.balance = eval(res.result);
    });
    return this.balance;
  }

  public getBestHash(shard: number, h: number) {
    if (shard === null || shard === undefined || h === null || h === undefined) {
      return;
    }
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // tslint:disable-next-line:max-line-length
    const data = this.httpClient.post('https://pocnet.yeescan.org/switch/api/', {
      jsonrpc: '2.0',
      method: 'chain_getHead',
      params: [shard, h],
      id: 0
    }, {headers}).toPromise().then((res: Jsonrpc) => {
      console.log('chain_getHead: ', hexToBytes(res.result));
      // tslint:disable-next-line:no-eval
      return hexToBytes(res.result);
    });
    return data;
  }

  public getHeight(shard: number) {
    if (shard === null || shard === undefined) {
      return;
    }
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // tslint:disable-next-line:max-line-length
    const data = this.httpClient.post('https://pocnet.yeescan.org/switch/api/', {
      jsonrpc: '2.0',
      method: 'chain_getHeader',
      params: [shard],
      id: 0
    }, {headers}).toPromise().then((res: Jsonrpc) => {
      console.log('chain_getHeader: ', eval(res.result.number));
      // tslint:disable-next-line:no-eval
      return eval(res.result.number);
    });
    return data;
  }

  bech32_decode(str: string) {
    // const str = 'yee18z4vztn7d0t9290d6tmlucqcelj4d4luzshnfh274vsuf62gkdrsqesk8y';
    const prefix = bech32.decode(str).prefix;
    const words = bech32.decode(str).words;
    const bb = bech32.fromWords(bech32.decode(str).words);
    return bb;
  }

  public getNonce(str: string) {
    if (str === '' || str === undefined) {
      return;
    }
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // tslint:disable-next-line:max-line-length
    this.httpClient.post('https://pocnet.yeescan.org/switch/api/', {
      jsonrpc: '2.0',
      method: 'state_getNonce',
      params: [str],
      id: 0
    }, {headers}).subscribe((res: Jsonrpc) => {
      console.log('getNonce: ', res.result);
      // tslint:disable-next-line:no-eval
      this.nonce = eval(res.result);
    });
    return this.nonce;
  }

  public getShardNum(str: string) {
    if (str === '' || str === undefined) {
      return;
    }
    const mask = 0x03;
    // tslint:disable-next-line:no-bitwise
    const shardNum = mask & new Uint8Array(bech32.fromWords(bech32.decode(str).words))[31];
    return shardNum;
  }

  public formatBalance(balance: string) {
    return Number(balance) / Math.pow(10, this.networkTokenDecimals);
  }

  public fromBalance(balance: string) {
    return Number(balance) * Math.pow(10, this.networkTokenDecimals);
  }

  public copy() {
    const range = document.createRange();
    range.selectNode(document.getElementById('address'));
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      selection.removeAllRanges();
    }
    selection.addRange(range);
    document.execCommand('copy');
    alert('复制成功');
  }

  get(): void {
    this.ls.remove('logincache');
    this.cache = this.ls.getObject('logincache');
  }
}
