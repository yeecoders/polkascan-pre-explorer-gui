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
 * settings.component.ts
 */

import { Component, OnInit } from '@angular/core';
import {environment} from '../../../environments/environment';
import {AssetModelClass} from './asset-model.class';
import {ResultOut} from './result.class';
import {LocalStorage} from '../wallet-detail/local.storage';
import { Router } from '@angular/router';
import * as api from 'src/app/lib/api.js';
import * as chainRuntime from 'src/app/lib/runtime.js';
import {hexToBytes, stringToBytes} from 'oo7-substrate';
@Component({
  selector: 'app-create-asset',
  templateUrl: './create-asset.component.html',
  styleUrls: ['./create-asset.component.scss']
})
export class CreateAssetComponent implements OnInit {
  public address: string;
  public environment = environment;
  public networkURLPrefix: string;
  public transferSuccess: boolean;
  public txHash: string;
  constructor(
    private ls: LocalStorage,
    private router: Router,
    ) { }
  public model = new AssetModelClass('', '', '', '');
  public resout = new ResultOut('', false, false);
  public calls = {};

  ngOnInit() {
    this.networkURLPrefix = '';
    this.address = this.ls.get('wallet_address');
    if (!this.address) {
      this.router.navigate(['', '**']);
    }
    console.log('address: ', this.address);
    chainRuntime.initRuntime();
    this.calls = chainRuntime.default.calls;
    window['calls'] = this.calls;
    this.transferSuccess = false;
  }
  async new_asset() {
      console.log(this.calls);
      if (this.model.password === '' || this.model.assetName === '' || this.model.assetDecimals === '' || this.model.totalSupply === '' ) {
        this.resout.result = 'Please fill all field';
        this.resout.showResult = true;
        return;
      }

      if (!api.default.utils.isIntNum(this.model.assetDecimals)) {
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
      const name = stringToBytes(this.model.assetName);
      api.default.switchRootUrl = environment.switchRootUrl;
      api.default.utils.runInIssueAssetCall(
        name,
        this.model.totalSupply,
        this.model.assetDecimals,
        this.calls,
        (call) => {
          api.default.utils.composeTransaction(senderPublic, senderPrivateKey, call).then((res) => {
            this.txHash = res.data.result;
            this.transferSuccess = true;
          }).catch((res) => {
            console.log(res);
            this.resout.result = 'Something is wrong';
            this.resout.showResult = true;
          });
        }
      );
    }

  public copy(str: string) {
    const range = document.createRange();
    range.selectNode(document.getElementById(str));
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      selection.removeAllRanges();
    }
    selection.addRange(range);
    document.execCommand('copy');
    alert('复制成功');
  }
}
