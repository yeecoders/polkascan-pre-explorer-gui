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
import {BrowserModule} from '@angular/platform-browser';
import { Asset } from './asset.class';
import {TransferModelClass} from './transfer-model.class';
import {Component, OnInit} from '@angular/core';
import {DocumentCollection} from 'ngx-jsonapi';
import {Extrinsic} from '../../classes/extrinsic.class';
import {BalanceTransferService} from '../../services/balance-transfer.service';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {environment} from '../../../environments/environment';
import {interval, Observable, Subscription} from 'rxjs';
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
import * as api from 'src/app/lib/api.js';
import {sign} from '@polkadot/wasm-schnorrkel';
import {AssetService} from '../../services/asset.service';
import {Event} from '../../classes/event.class';
import {EventService} from '../../services/event.service';

@Component({
  selector: 'app-wallet-detail',
  templateUrl: './wallet-detail.component.html',
  styleUrls: ['./wallet-detail.component.scss']
})
export class WalletDetailComponent implements OnInit {
  public TransferModel = new TransferModelClass('', '', '', '', '');
  public assetBalance: string;
  public showPassWordModel: boolean = false;
  public event: Event;
  public events: DocumentCollection<Event>;
  public networkTokenDecimals: number;
  public networkTokenSymbol: string;
  public cache: string;
  public nonce: string;
  public header: string;
  public balance: string;
  public shardnum: number;
  public address: string;
  public transferSuccess: boolean;
  public txHash: string;

  constructor(
    private eventService: EventService,
    private router: Router,
    private ls: LocalStorage,
    private balanceTransferService: BalanceTransferService,
    private accountService: AccountService,
    private accountIndexService: AccountIndexService,
    private httpClient: HttpClient,
  ) {
  }

  public resout = new ResultOut('', false, false);
  public model = new Transfer('', '', '', '', '');
  public calls = {};

  ngOnInit() {
    this.address = this.ls.get('wallet_address');
    console.log('address: ', this.address);
    this.getAssetList();
    this.nonce = this.getNonce(this.address);
    this.balance = this.getBalance(this.address);
    this.shardnum = this.getShardNum(this.address);

    this.networkTokenDecimals = environment.networkTokenDecimals;
    this.networkTokenSymbol = environment.networkTokenSymbol;

    chainRuntime.initRuntime();
    this.calls = chainRuntime.default.calls;
    window['calls'] = this.calls;

    this.transferSuccess = false;

    // TODO remove
    // this.model.dest = 'tyee18z4vztn7d0t9290d6tmlucqcelj4d4luzshnfh274vsuf62gkdrsd7hqxh';
  }
  onMyModelChange(key,value) {
    this[key] = value
    this.resout.result = '';
    this.resout.showResult = false;
    this.model.password = ''
  }
   switch(str: any) {
    return 'asset name:' + str[2].value + ', asset balance:' +   str[4].value;
  }
  selectModule(module) {
     this.event = module;
     console.log(this.event);
  }
  getAssetList(): void {
    this.event = null;
    // tslint:disable-next-line:prefer-const
    let params = {
      page: {number: 1, size: 8000},
      remotefilter: {}
    };
    // @ts-ignore
    params.remotefilter.module_id = 'assets';
    // @ts-ignore
    params.remotefilter.event_id = 'issued';
    this.eventService.all(params).subscribe(events => (
      this.updateAsset(events),
      this.events = events
    ));
  }
  updateAsset(events: any) {
    for (const entry of events.data) {
      console.log(entry.attributes.attributes[4].value);
      if (entry.attributes.attributes[4].value !== null) {
        const headers = new HttpHeaders().set('Content-Type', 'application/json');
        // tslint:disable-next-line:max-line-length
        this.httpClient.post(environment.switchRootUrl,
          // tslint:disable-next-line:max-line-length
          {jsonrpc: '2.0' , method: 'state_getAssetBalance', params: [this.address, entry.attributes.attributes[0].valueRaw,  entry.attributes.attributes[1].value], id: 0},  {headers}).toPromise().then((res: Jsonrpc) => {
            // tslint:disable-next-line:no-eval
            if (res.result === undefined ) {
              console.log('state_getAssetBalance_error: ',  res.error);
            } else {
              console.log('state_getAssetBalance: ', res.result );
              entry.attributes.attributes[4].value = eval(res.result);
            }
          });
      }
    }
  }
  async transfer_asset() {
    console.log(this.calls);
    if (this.model.password === '' || this.TransferModel.assetTransferShard === ''
      || this.TransferModel.assetTransferId === '' || this.model.dest === '' || this.model.amount === '' ) {
      this.resout.result = 'Please fill all field';
      this.resout.showResult = true;
      return;
    }

    if (!api.default.utils.isIntNum(this.TransferModel.assetTransferId)) {
      this.resout.result = 'Decimals should be a integer';
      this.resout.showResult = true;
      return;
    }
    if (!api.default.utils.isIntNum(this.model.amount)) {
      this.resout.result = 'Decimals should be a integer';
      this.resout.showResult = true;
      return;
    }
    const shardNum = api.default.utils.getShardNum(this.address);
    console.log('issuer sharding number: ', shardNum);
    const senderPublic = api.default.utils.bech32Decode(this.address);
    console.log('senderPublic:', senderPublic);

    const enc = this.ls.get('wallet_private_key_enc');
    console.log('enc:', enc);
    const senderPrivateKey = hexToBytes(api.default.utils.decrypt(enc, this.model.password));
    console.log('senderPrivateKey:', senderPrivateKey);
    api.default.switchRootUrl = environment.switchRootUrl;
    api.default.utils.runInAssetTransferCall(
      this.TransferModel.assetTransferShard,
      this.TransferModel.assetTransferId,
      api.default.utils.bech32Decode(this.model.dest),
      this.model.amount,
      this.calls,
      (call) => {
        api.default.utils.composeTransaction(senderPublic, senderPrivateKey, call).then((res) => {
          this.txHash = res.data.result;
          this.transferSuccess = true;
          this.showPassWordModel = false
        }).catch((res) => {
          console.log(res);
          this.resout.result = 'Something is wrong';
          this.resout.showResult = true;
        });
      }
    );
  }
  showPassWordModelFn() {
    if(!this.model.dest || !this.model.amount) {
      return
    }
    this.showPassWordModel = true
  }
  async transfer() {
    if (this.model.password === '' || this.model.password.length < 6) {
      this.resout.result = 'Too Short!';
      this.resout.showResult = true;
      console.log(this.resout);
      return;
    }
    if (this.event) {
      // @ts-ignore
      this.TransferModel.assetTransferShard = this.event.attributes.attributes[0].valueRaw;
      // @ts-ignore
      this.TransferModel.assetTransferId = this.event.attributes.attributes[1].value;
      this.transfer_asset()
    } else {
      this.transferFn()
    }
  }
  transferFn() {
    if (this.model.password === '' || this.model.dest === '' || this.model.amount === '') {
      this.resout.result = 'Please fill all input';
      this.resout.showResult = true;
      return;
    }
    const amountInCo = this.fromBalance(this.model.amount);
    console.log('acmountInCo: ' + amountInCo);
    if (amountInCo < 1000) {
      this.resout.result = 'The amount should not be less than 0.0001';
      this.resout.showResult = true;
      return;
    }
    if (!api.default.utils.isIntNum(amountInCo)) {
      this.resout.result = 'Amount should be a number';
      this.resout.showResult = true;
      return;
    }
    const descPublic = api.default.utils.bech32Decode(this.model.dest);
    // const senderPublic = api.utils.bech32Decode(this.sendAddress)
    // let secret = hexToBytes(that.sendPrivateKey)
    console.log('descPublic:', descPublic);

    const senderPublic = api.default.utils.bech32Decode(this.address);
    console.log('senderPublic:', senderPublic);

    const enc = this.ls.get('wallet_private_key_enc');
    console.log('enc:', enc);
    const senderPrivateKey = hexToBytes(api.default.utils.decrypt(enc, this.model.password));
    console.log('senderPrivateKey:', senderPrivateKey);


    api.default.switchRootUrl = environment.switchRootUrl;
    api.default.utils.runInBalancesTransferCall(
      descPublic,
      amountInCo,
      this.calls,
      (call) => {
        api.default.utils.composeTransaction(senderPublic, senderPrivateKey, call).then((res) => {
          this.txHash = res.data.result;
          this.transferSuccess = true;
          this.showPassWordModel = false
        }).catch((res) => {
          console.log(res);
          this.resout.result = 'Something is wrong';
          this.resout.showResult = true;
        });
      }
    );
  }
  public getBalance(str: string) {
    if (str === '' || str === undefined) {
      return;
    }
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // tslint:disable-next-line:max-line-length
    this.httpClient.post(environment.switchRootUrl, {
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

  public getNonce(str: string) {
    if (str === '' || str === undefined) {
      return;
    }
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // tslint:disable-next-line:max-line-length
    this.httpClient.post(environment.switchRootUrl, {
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

  public getShardNum(address: string) {
    if (address === '' || address === undefined) {
      return;
    }
    return api.default.utils.getShardNum(api.default.utils.bech32Decode(address));
  }

  public formatBalance(balance: string) {
    return Number(balance) / Math.pow(10, this.networkTokenDecimals);
  }

  public fromBalance(balance: string) {
    return Math.floor(Number(balance) * Math.pow(10, this.networkTokenDecimals));
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
    alert('Cpoied');
  }

  get(): void {
    this.ls.remove('logincache');
    this.cache = this.ls.get('logincache');
  }
  public AssetTransfer() {
    // @ts-ignore
    if (this.event === null) {
      alert('请选择一个资产！');
    }

    // @ts-ignore
    this.router.navigate(['', 'transfer-asset'], {
      queryParams: {
        // @ts-ignore
        assetTransferShard: this.event.attributes.attributes[0].valueRaw,
        // @ts-ignore
        assetTransferId: this.event.attributes.attributes[1].value
      }
      });
  }
}
