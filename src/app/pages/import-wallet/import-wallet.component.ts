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

import {Component, OnInit} from '@angular/core';
import {environment} from '../../../environments/environment';
import {AccoutModelClass} from './accout-model.class';
import {ResultOut} from './result.class';
import {LocalStorage} from '../wallet-detail/local.storage';
import {ActivatedRoute, Router} from '@angular/router';
import {
  calls, runtime, chain, system, runtimeUp, pretty,
  addressBook, secretStore, metadata, nodeService, bytesToHex, hexToBytes, AccountId
} from 'oo7-substrate';

import * as schnorrkel from '@yeecoders/schnorrkel-js';
import * as api from 'src/app/lib/api.js';

@Component({
  selector: 'app-import-wallet',
  templateUrl: './import-wallet.component.html',
  styleUrls: ['./import-wallet.component.scss']
})
export class ImportWalletComponent implements OnInit {

  public environment = environment;
  public networkURLPrefix: string;

  constructor(
    private ls: LocalStorage,
    private router: Router,
    private route: ActivatedRoute,
  ) {
  }

  public model = new AccoutModelClass('', '', '');
  public resout = new ResultOut('', false, false);

  ngOnInit() {
    this.networkURLPrefix = '';
  }

  public import() {
    this.resout.result = '';
    // console.log(this.model);
    if (this.model.sendPrivateKey === '' || this.model.password === '') {
      this.resout.result = 'Please fill all input';
      this.resout.showResult = true;
      console.log(this.resout);
      return;
    }
    let privateKeyHex = this.model.sendPrivateKey;

    schnorrkel.waitReady().then((ready) => {
      console.log("schnorrkel ready: " + ready);
      if (ready){
        let publicKey = null;
        try {
          publicKey = schnorrkel.toPublic(hexToBytes(privateKeyHex));
        }catch (e) {
          this.resout.result = 'Invalid private Key';
          this.resout.showResult = true;
          return;
        }
        console.log("public key: " + bytesToHex(publicKey));

        const address = api.default.utils.bech32Encode(publicKey);
        console.log("address: " + address);

        privateKeyHex = bytesToHex(hexToBytes(privateKeyHex));//remove leading '0x'
        let enc = api.default.utils.encrypt(privateKeyHex, this.model.password);

        this.ls.setObject('wallet_address', address);
        this.ls.setObject('wallet_private_key_enc', enc);

        this.router.navigate([this.networkURLPrefix, 'wallet']);

      }
    });

  }
}
