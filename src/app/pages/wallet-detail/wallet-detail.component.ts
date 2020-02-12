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
import {srKeypairFromUri} from 'oo7-substrate';
import {generateMnemonic} from 'bip39';
import {LocalStorage} from './local.storage';
import axios from 'axios';
import { HttpClient, } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import * as camel from 'change-case';
import { TransformBond } from 'oo7';
import {initRuntime} from 'src/assets/runtime.js';
import {sign} from "@polkadot/wasm-schnorrkel";

@Component({
  selector: 'app-wallet-detail',
  templateUrl: './wallet-detail.component.html',
  styleUrls: ['./wallet-detail.component.scss']
})
export class WalletDetailComponent implements OnInit {
  // public trs: Transfer;

  public balanceTransfers: DocumentCollection<BalanceTransfer>;
  public extrinsics: DocumentCollection<Extrinsic>;
  public account$: Observable<Account>;
  public submitted = false;
  public networkTokenDecimals: number;
  public networkTokenSymbol: string;
  public currentTab: string;
  public cache: string;
  public jsonrpc: Jsonrpc;
  public nonce: string;
  public header: string;
  public balance: string;
  public shardnum: number;
  public subex: string;
  public address: string;
  public transferRes: string;
  public privateKey: string;
  constructor(
    private ls: LocalStorage,
    private balanceTransferService: BalanceTransferService,
    private extrinsicService: ExtrinsicService,
    private accountService: AccountService,
    private accountIndexService: AccountIndexService,
    private httpClient: HttpClient,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {
  }

  public resout = new ResultOut('', false, false);
  public model = new Transfer('', '', '', '', '');
  public immodel = new Transfer('', '', '', '', '');
  public keySize = 256;
  public iterations = 100;
  public password = '111Password';
  public calls = {};
  public runtime = {};
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
    const hex = '0400ffa0837b84eedaf81b26323f05426b39eeedbb4d28868727de045eb679ac2c9b59a10f';
    console.log('call--bytes:', new Uint8Array(Buffer.from(hex, 'hex')));
    this.address = this.ls.getObject('wallet_address');
    console.log('this.address: ', this.address);
    this.nonce = this.getNonce( this.address);
    this.balance = this.getBalance( this.address);
    this.shardnum = this.getshardnum( this.address);
    // initRuntime();
    this.networkTokenDecimals = environment.networkTokenDecimals;
    this.networkTokenSymbol = environment.networkTokenSymbol;
  }

  encrypt(msg, pass) {
    const salt = 'yee';
    const key = crypto.PBKDF2(pass, salt, {
      keySize: this.keySize / 32,
      iterations: this.iterations
    });
    const iv = crypto.enc.Hex.parse(key.toString().substring(0, 32));
    const encrypted = crypto.AES.encrypt(msg, crypto.enc.Hex.parse(key.toString().substring(32, 64)), {
      iv,
      padding: crypto.pad.Pkcs7,
      mode: crypto.mode.CTR

    });
    // salt, iv will be hex 32 in length
    // append them to the ciphertext for use  in decryption
    const transitmessage = salt.toString() + iv.toString() + encrypted.toString();
    return transitmessage;
  }
  transfer() {
    const decryptstr = this.decrypt(this.ls.getObject('wallet_private_key_enc') , this.model.password);
    console.log('decryptstr:', decryptstr);
    // tslint:disable-next-line:max-line-length
    this.model.sendPrivateKey = '0x1025ba3a87d28cfe9569628d97622995e5d132bc5d3362f8083f3846dfe3754e044e3483a9187a2262e21ff11160461d2c3dfb051e0f7df36b92a4462c057f6b';
    this.model.sendAddress = 'tyee1aggp26vqppujx0926sas0g53zsg63yzqzsuutsx4t75v5mjkhgvs2g4r4v';
    if (this.model.password === '' || this.model.dest === '' || this.model.amount === '') {
      this.resout.result = 'Please fill all input';
      this.resout.showResult = true;
      // console.log(this.resout);
      return;
    }
    // @ts-ignore
    if (this.model.amount < 1000) {
      this.resout.result = 'The amount should not be less than 1000';
      this.resout.showResult = true;
      console.log('resout:', this.resout);
      return;
    }
    console.log('this.model:' , this.model);
    const descPublic = this.bech32_decode(this.model.dest);
    const senderPublic = this.bech32_decode(this.model.sendAddress);
    console.log('descPublic:', descPublic);
    console.log('senderPublic:', senderPublic);
    const sendShardNum = this.getshardnum(this.model.sendAddress);
    const destShardNum = this.getshardnum(this.model.dest);
    console.log('sendShardNum', sendShardNum);
    console.log('destShardNum', destShardNum);
    const secret = hexToBytes(this.model.sendPrivateKey);
    console.log('secret:', secret);
    const hex = '0400ffa0837b84eedaf81b26323f05426b39eeedbb4d28868727de045eb679ac2c9b59a10f';
    console.log('call--bytes:', new Uint8Array(Buffer.from(hex, 'hex')));
    // tslint:disable-next-line:no-eval
    const height = this.getHeight(sendShardNum);
    console.log('height:', height);
    const longevity = 64;
    const l = Math.min(15, Math.max(1, Math.ceil(Math.log2(longevity)) - 1));
    // tslint:disable-next-line:no-bitwise
    const period = 2 << l;
    // tslint:disable-next-line:no-bitwise
    const factor = Math.max(1, period >> 12);
    const Q = (n, d) => Math.floor(n / d) * d;
    const eraNumber = Q(height, factor);
    console.log('eraNumber:', eraNumber);
    const phase = eraNumber % period;
    const era = new TransactionEra(period, phase);
    // console.log(era);
    const call = new Uint8Array(Buffer.from(hex, 'hex'));
    const index = this.getNonce(this.model.sendAddress);
    console.log('index:', index);
    const eraHash =  this.getBestHash(sendShardNum, eraNumber);
    const e = encode([index, call, era, '0x92efd1f895cfab6ce8e428157b97e072445459f28109a4131af4d54f9f5af6b8'], [
      'Compact<Index>', 'Call', 'TransactionEra', 'Hash'
    ]);
    console.log('e:', e);
    // tslint:disable-next-line:max-line-length
    const a = this.bech32_decode('tyee12fdz0fgjne0j8tnlffvhfhnp7dhq74s6t50963rzqqdxaujfzdusvzkfux');
    // tslint:disable-next-line:max-line-length
    const b =    hexToBytes('0x7093235ec2fc85eeb4c778293979ca3885d410d6afcbd883213dc9063f277e5841513c8f8cd511dde34a79a1a1e6d317671f0d8011ce9dea19f6c1ca9ddf689d');
    // tslint:disable-next-line:max-line-length
    // console.log(a);
    // console.log(b);
    const address = '0x' + Buffer.from(senderPublic).toString('hex');
    console.log('address:', address);
    const signature = sign(senderPublic, secret, e);
    console.log('signature:', signature);
    const signmodel = new SignedData(0x81, address, signature, index, era, call);
    console.log('signmodel:', encode(signmodel, 'Transaction'));
    const signedDataex = encode(encode({
      version: 0x81,
      sender: address,
      signature,
      index,
      era,
      call
    }, 'Transaction'), 'Vec<u8>');
    console.log('signedDataex:', signedDataex);
    const signedData = encode(encode(signmodel, 'Transaction'), 'Vec<u8>');
    console.log('signedData:', signedData);
    const extrinsic = '0x' + bytesToHex(signedData);
    console.log('extrinsic:', extrinsic);
    //
    // this.runInBalancesTransferCall('tyee1r3ur0wf3y5a5aveeecangcwmw3wwfjje86gd9ve4smchmkhdzavqvj4dsq', '3333' , (call) => {
    //   console.log(call);
    //   }
    // );
    // this.httpClient.get('https://pocnet.yeescan.org/api/v1/extrinsic').subscribe(data => {
    //   console.log(data);
    // });
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // const params = new HttpParams().set('_page', '1').set('_limit',  '1');

    // tslint:disable-next-line:max-line-length
    // this.httpClient.post('https://pocnet.yeescan.org/switch/api/', {jsonrpc: '2.0' , method: 'chain_getHeader', params: [1], id: 0}, {headers}).subscribe((res: Jsonrpc) => {
    //   // console.log(res.result);
    //   // console.log(hexToBytes(res.result.toString()));
    // });
    // // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:max-line-length
    // this.httpClient.post('https://pocnet.yeescan.org/switch/api/', {jsonrpc: '2.0' , method: 'state_getNonce', params: ['tyee1jfakj2rvqym79lmxcmjkraep6tn296deyspd9mkh467u4xgqt3cqkv6lyl'], id: 0}, {headers}).subscribe((res: Jsonrpc) => {
    //   // console.log(res.result);
    // });
    // // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:max-line-length
    // this.httpClient.post('https://pocnet.yeescan.org/switch/api/', {jsonrpc: '2.0' , method: 'state_getBalance', params: ['tyee1t2kk9rmkx4rgxtyspc40ugpvf3rr5658mtqjxt6p7xqpgsu6l94s2w6cpp'], id: 0}, {headers}).subscribe((res: Jsonrpc) => {
    //   // console.log(res.result);
    //   this.balance = res.result;
    // });
    // tslint:disable-next-line:max-line-length
    this.httpClient.post('https://pocnet.yeescan.org/switch/api/', {jsonrpc: '2.0' , method: 'author_submitExtrinsic', params: ['0x290281ff927b69286c0137e2ff66c6e561f721d2e6a2e9b92402d2eed7aebdca99005c701e702c4970676ff5a42c6e2619ab0c33e6802b3b1ce0971a114ce5ee88ffd55aca5e7c204f27a6497552d4176d31d94edb93211e2a0ed78b7176979b8ad12b060cd5020400ff1c7837b931253b4eb339ce3b3461db745ce4ca593e90d2b33586f17ddaed17581534'], id: 0}, {headers}).subscribe((res: Jsonrpc) => {
      // console.log(res.error);
    });
    this.transferRes = 'transfer success';
    // setTimeout(() => {
    //     this.router.navigate(['', '/']);
    //   },
    //   4000);
  }
  public decrypt(transitmessage, pass) {
    // var salt = crypto.enc.Hex.parse(transitmessage.substr(0, 32));
    const salt = 'yee';
    const iv = crypto.enc.Hex.parse(transitmessage.substr(3, 32));
    // console.log('iv--' + iv.toString());
    const encrypted = transitmessage.substring(35);
    // console.log('encrypted--' + encrypted.toString());

    const key = crypto.PBKDF2(pass, salt, {
      keySize: this.keySize / 32,
      iterations: this.iterations
    });

    const decrypted = crypto.AES.decrypt(encrypted, crypto.enc.Hex.parse(key.toString().substring(32, 64)), {
      iv,
      padding: crypto.pad.Pkcs7,
      mode: crypto.mode.CTR

    });
   // console.log('decrypted--' + decrypted.toString());
    return decrypted;
  }
  public getBalance(str: string) {
    if (str === '' || str === undefined ) {
      return;
    }
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // tslint:disable-next-line:max-line-length
    this.httpClient.post('https://pocnet.yeescan.org/switch/api/', {jsonrpc: '2.0' , method: 'state_getBalance', params: [str], id: 0}, {headers}).subscribe((res: Jsonrpc) => {
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
    this.httpClient.post('https://pocnet.yeescan.org/switch/api/', {jsonrpc: '2.0' , method: 'chain_getHead', params: [shard, h], id: 0}, {headers}).subscribe((res: Jsonrpc) => {
      console.log('chain_getHead: ', hexToBytes(res.result));
      // tslint:disable-next-line:no-eval
      return  hexToBytes(res.result);
    });
  }
  public getHeight(shard: number) {
    if (shard === null || shard === undefined ) {
      return;
    }
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // tslint:disable-next-line:max-line-length
    this.httpClient.post('https://pocnet.yeescan.org/switch/api/', {jsonrpc: '2.0' , method: 'chain_getHeader', params: [shard], id: 0}, {headers}).subscribe((res: Jsonrpc) => {
      console.log('chain_getHeader: ', eval(res.result.number));
      // tslint:disable-next-line:no-eval
      return eval(res.result.number);
    });
  }
  public getNonce(str: string) {
    if (str === '' || str === undefined ) {
      return;
    }
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // tslint:disable-next-line:max-line-length
    this.httpClient.post('https://pocnet.yeescan.org/switch/api/', {jsonrpc: '2.0' , method: 'state_getNonce', params: [str], id: 0}, {headers}).subscribe((res: Jsonrpc) => {
      console.log('getNonce: ', res.result);
      // tslint:disable-next-line:no-eval
      this.nonce = eval(res.result);
    });
    return this.nonce;
  }
  public getshardnum(str: string) {
    if (str === '' || str === undefined ) {
      return;
    }
    const mask = 0x03;
    // tslint:disable-next-line:no-bitwise
    const shardNum = mask & new Uint8Array(bech32.fromWords(bech32.decode(str).words))[31];
    return shardNum;
  }

  // public import() {
  //   console.log(this.immodel);
  //   if (this.immodel.sendAddress === '' || this.immodel.sendPrivateKey === '' ) {
  //     this.resout.result = 'Please fill all';
  //     this.resout.showResult = true;
  //     console.log(this.resout);
  //     return;
  //   }
  //   this.address = this.immodel.sendAddress;
  //   this.ls.setObject(this.immodel.sendAddress, this.encrypt(this.immodel.sendPrivateKey, this.password));
  //
  // }
  bech32_decode(str: string) {
    // const str = 'yee18z4vztn7d0t9290d6tmlucqcelj4d4luzshnfh274vsuf62gkdrsqesk8y';
    const prefix = bech32.decode(str).prefix;
    const words = bech32.decode(str).words;
    const bb = bech32.fromWords(bech32.decode(str).words);
    return bb;
  }
  public formatBalance(balance: string) {
    return Number(2424240) / Math.pow(10, this.networkTokenDecimals);
  }

  public Copy() {
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

  set(): void {
    this.ls.setObject('logincache', '{"address":"EMYYerk8fASGu4jYrcyqv2K7Y4wLPzs4ka1pxQQgrcv3axR"}');
  }
}
