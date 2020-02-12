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
import {AccoutModelClass} from './accout-model.class';
import {ResultOut} from './result.class';
import * as crypto from 'crypto-js';
import {LocalStorage} from '../wallet-detail/local.storage';
import {ActivatedRoute, Router} from '@angular/router';
// import {
//   encode, decode, calls, runtime, chain, system, runtimeUp, pretty,
//   addressBook, secretStore, metadata, nodeService, bytesToHex, AccountId, hexToBytes, TransactionEra, StorageBond
// } from 'oo7-substrate';
// // import {u8aToHex} from '@polkadot/util';
// // import {toPublic} from '../pkg/index';
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
    ) { }
  public model = new AccoutModelClass('', '', '');
  public resout = new ResultOut('', false, false);
  public keySize = 256;
  public iterations = 100;
  ngOnInit() {
    this.networkURLPrefix = '';
  }
  public import() {
    this.resout.result = '';
    console.log(this.model);
    if ( this.model.sendPrivateKey === '' || this.model.passWord === '' ) {
      this.resout.result = 'Please fill all input';
      this.resout.showResult = true;
      console.log(this.resout);
      return;
    }
    // this.model.sendAddress = u8aToHex(toPublic(hexToBytes(this.model.sendPrivateKey)));
    this.model.sendAddress = 'tyee1aggp26vqppujx0926sas0g53zsg63yzqzsuutsx4t75v5mjkhgvs2g4r4v';
    // tslint:disable-next-line:max-line-length
    this.model.sendPrivateKey = '0x1025ba3a87d28cfe9569628d97622995e5d132bc5d3362f8083f3846dfe3754e044e3483a9187a2262e21ff11160461d2c3dfb051e0f7df36b92a4462c057f6b';
    this.ls.setObject('wallet_address', this.model.sendAddress);
    this.ls.setObject('wallet_private_key_enc', this.encrypt(this.model.sendPrivateKey, this.model.passWord));
    this.router.navigate([this.networkURLPrefix, 'wallet']);

  }
  // get(): void {
  //   this.ls.remove('logincache');
  //   this.cache = this.ls.getObject('logincache');
  // }
  //
  // set(): void {
  //   this.ls.setObject('logincache', '{"address":"EMYYerk8fASGu4jYrcyqv2K7Y4wLPzs4ka1pxQQgrcv3axR"}');
  // }
  public encrypt(msg, pass) {
    // var salt = CryptoJS.lib.WordArray.random(128/8);
    const salt = 'yee';

    console.log('salt--' + salt.toString());

    const key = crypto.PBKDF2(pass, salt, {
      keySize: this.keySize / 32,
      iterations: this.iterations
    });
    console.log('key--' + key.toString());

    // var iv = CryptoJS.lib.WordArray.random(128 / 8);
    console.log('key--' + key.toString());

    const iv = crypto.enc.Hex.parse(key.toString().substring(0, 32));
    console.log('iv--' + iv);

    const encrypted = crypto.AES.encrypt(msg, crypto.enc.Hex.parse(key.toString().substring(32, 64)), {
      iv,
      padding: crypto.pad.Pkcs7,
      mode: crypto.mode.CTR

    });
    // salt, iv will be hex 32 in length
    // append them to the ciphertext for use  in decryption
    const transitmessage = salt.toString() + iv.toString() + encrypted.toString();
    console.log('iv--' + iv.toString());
    console.log('encrypted--' + encrypted.toString());
    console.log('transitmessage--' + transitmessage.toString());
    // this.decrypt(transitmessage, pass);
    return transitmessage;
  }

  public decrypt(transitmessage, pass) {
    // var salt = crypto.enc.Hex.parse(transitmessage.substr(0, 32));
    const salt = 'yee';
    const iv = crypto.enc.Hex.parse(transitmessage.substr(3, 32));
    console.log('iv--' + iv.toString());
    const encrypted = transitmessage.substring(35);
    console.log('encrypted--' + encrypted.toString());

    const key = crypto.PBKDF2(pass, salt, {
      keySize: this.keySize / 32,
      iterations: this.iterations
    });

    const decrypted = crypto.AES.decrypt(encrypted, crypto.enc.Hex.parse(key.toString().substring(32, 64)), {
      iv,
      padding: crypto.pad.Pkcs7,
      mode: crypto.mode.CTR

    });
    console.log('decrypted--' + decrypted.toString());
    return decrypted;
  }
}
