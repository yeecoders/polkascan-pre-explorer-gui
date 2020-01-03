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
 * block-list.component.ts
 */
import {Component, OnInit} from '@angular/core';
import {DocumentCollection} from 'ngx-jsonapi';
import {Extrinsic} from '../../classes/extrinsic.class';
import {BalanceTransferService} from '../../services/balance-transfer.service';
import {ExtrinsicService} from '../../services/extrinsic.service';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {Account} from '../../classes/account.class';
import {AccountService} from '../../services/account.service';
import {switchMap} from 'rxjs/operators';
import {BalanceTransfer} from '../../classes/balancetransfer.class';
import {AccountIndexService} from '../../services/account-index.service';
import bech32 from 'bech32';
import {Transfer} from './transfer.class';
import {ResultOut} from './result.class';
// import {
//   encode, decode,calls, runtime, chain, system, runtimeUp, pretty,
//   addressBook, secretStore, metadata, nodeService, bytesToHex, AccountId
// } from 'oo7-substrate';
// import {sign, verify} from '@polkadot/wasm-schnorrkel';
import {srKeypairFromUri} from 'oo7-substrate';
import {generateMnemonic} from 'bip39';
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

  constructor(
    private balanceTransferService: BalanceTransferService,
    private extrinsicService: ExtrinsicService,
    private accountService: AccountService,
    private accountIndexService: AccountIndexService,
    private activatedRoute: ActivatedRoute
  ) {
  }

  public model = new Transfer('', '', '', '');
  public resout = new ResultOut('', false, false);

  transfer() {
    if (this.model.sendAddress === '' || this.model.sendPrivateKey === '' || this.model.dest === '' || this.model.amount === '') {
      this.resout.result = 'Please fill all';
      this.resout.showResult = true;
      console.log(this.resout);
      return;
    }
    // @ts-ignore
    if (this.model.amount < 1000) {
      this.resout.result = 'The amount should not be less than 1000';
      this.resout.showResult = true;
      console.log(this.resout);
      return;
    }
    console.log(this.model);
    const descPublic = this.bech32_decode(this.model.dest);
    const senderPublic = this.bech32_decode(this.model.sendAddress);
    console.log(descPublic);
    console.log(senderPublic);
    const secret = this.hexToBytes(this.model.sendPrivateKey);
    console.log(secret);
    const mnemonic = generateMnemonic();
    console.log(mnemonic);
    this.generateSrKeyPair();
    // console.log(encode(1333));
  }

  ngOnInit() {
    this.currentTab = 'transfers';
    this.activatedRoute.fragment.subscribe(value => {
      if (value === 'transactions' || value === 'transfers') {
        this.currentTab = value;
      }
    });

    this.networkTokenDecimals = environment.networkTokenDecimals;
    this.networkTokenSymbol = environment.networkTokenSymbol;

    this.account$ = this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        return this.accountService.get(params.get('id'), {include: ['indices']});
      })
    );

    this.activatedRoute.params.subscribe(val => {

      this.balanceTransferService.all({
        remotefilter: {address: val.id},
        page: {number: 0}
      }).subscribe(balanceTransfers => (this.balanceTransfers = balanceTransfers));

      const params = {
        page: {number: 0, size: 25},
        remotefilter: {address: val.id},
      };

      this.extrinsicService.all(params).subscribe(extrinsics => {
        this.extrinsics = extrinsics;
      });

    });
  }

  composeTransaction(senderPublic: any, secret: Uint8Array) {
    console.log(secret);

    // let height = eval('33');
    // let longevity = 64;
    // let l = Math.min(15, Math.max(1, Math.ceil(Math.log2(longevity)) - 1));
    // let period = 2 << l;
    // let factor = Math.max(1, period >> 12);
    // let Q = (n, d) => Math.floor(n / d) * d;
    // let eraNumber = Q(height, factor);
    // let phase = eraNumber % period;
    // let era = new TransactionEra(period, phase)
    // let signedData = encode(encode({
    //   _type: 'Transaction',
    //   version: 0x81,
    //   sender: senderPublic,
    //   signature,
    //   index,
    //   era,
    //   call
    // }), 'Vec<u8>');
    // let extrinsic = '0x' + bytesToHex(signedData);
    // console.log("extrinsic:", extrinsic);
    //
    // api.rpcCall('author_submitExtrinsic', [extrinsic]);
  }

  generateSrKeyPair() {
    const mnemonic = generateMnemonic();
    // let seed = srKeypairFromUri("//Alice")
    const seed = srKeypairFromUri(mnemonic);
    console.log(seed);
    return seed;
  }
  //
  // srKeypairToPublic(pair) {
  //   return new Uint8Array(pair.slice(64, 96));
  // }
  //
  // srKeypairToSecret(pair) {
  //   return new Uint8Array(pair.slice(0, 64));
  // }

  public bech32_encode(hex: string) {
    if (hex) {
      if (hex.indexOf('0x') === 0) {
        hex = hex.substr(2);
        console.log('has head 0x!');
      }
      let bts = [];
      for (let bytes = [], c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
        bts = bytes;
      }
      const str = bech32.encode('tyee', bech32.toWords(bts));
      console.log('---');
      console.log(str);
      return str;
    }
  }

  public getshardnum(id: string) {
    if (id) {
      let bts = [];
      for (let bytes = [], c = 0; c < id.length; c += 2) {
        bytes.push(parseInt(id.substr(c, 2), 16));
        bts = bytes;
      }
      const str = bech32.encode('tyee', bech32.toWords(bts));
      console.log('---');
      console.log(str);
      const mask = 0x03;
      // tslint:disable-next-line:no-bitwise
      const shardNum = mask & new Uint8Array(bech32.fromWords(bech32.decode(str).words))[31];
      return shardNum;
    }
  }

  bech32_decode(str: string) {
    // const str = 'yee18z4vztn7d0t9290d6tmlucqcelj4d4luzshnfh274vsuf62gkdrsqesk8y';
    const prefix = bech32.decode(str).prefix;
    const words = bech32.decode(str).words;
    const bb = bech32.fromWords(bech32.decode(str).words);
    // let result = '';
    // // tslint:disable-next-line:prefer-for-of
    // for (let i = 0; i < words.length; i++) {
    //   result += String.fromCharCode(parseInt(words[i], 2));
    // }
    // console.log(result);
    return bb;
  }

  hexToBytes(str: string) {
    const a = [];
    for (let i = str.startsWith('0x') ? 2 : 0, len = str.length; i < len; i += 2) {
      a.push(parseInt(str.substr(i, 2), 16));
    }

    return new Uint8Array(a);
  }

  public formatBalance(balance: number) {
    return balance / Math.pow(10, this.networkTokenDecimals);
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


}
