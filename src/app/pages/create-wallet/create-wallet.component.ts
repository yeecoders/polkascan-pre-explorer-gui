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
import bech32 from 'bech32';
import {srKeypairFromUri} from 'oo7-substrate';
import {generateMnemonic} from 'bip39';
import {
  encode, decode, calls, runtime, chain, system, runtimeUp, pretty,
  addressBook, secretStore, metadata, nodeService, bytesToHex, AccountId, hexToBytes, TransactionEra, StorageBond
} from 'oo7-substrate';
import {ActivatedRoute, Router} from '@angular/router';
@Component({
  selector: 'app-create-wallet',
  templateUrl: './create-wallet.component.html',
  styleUrls: ['./create-wallet.component.scss']
})
export class CreateWalletComponent implements OnInit {
  public environment = environment;
  public networkURLPrefix: string;
  public cache: string;
  public address: string;
  public privateKey: string;
  constructor(
    private ls: LocalStorage,
    private router: Router,
    ) { }
  public model = new AccoutModelClass('', '', '');
  public resout = new ResultOut('', false, false);
  public keySize = 256;
  public iterations = 100;
  public message = 'Hello World---';
  ngOnInit() {
    this.networkURLPrefix = '';
  }
  async generateSrKeyPair() {
    const mnemonic = generateMnemonic();
    console.log(mnemonic);
    // let seed = srKeypairFromUri("//Alice")
    const seedPromise = new Promise((res, rej) => {
      window.setTimeout(() => {
        console.log(srKeypairFromUri);
        // tslint:disable-next-line:no-shadowed-variable
        // tslint:disable-next-line:no-shadowed-variable
        const seed = window['srKeypairFromUri'](mnemonic);
        return res(seed);
      }, 1000);
    });
    const seed = await seedPromise;
    return seed;
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
  createAccount() {
    this.resout.result = '';
    console.log(this.model);
    if ( this.model.passWord === '' ) {
      this.resout.result = 'Please fill passWord';
      this.resout.showResult = true;
      console.log(this.resout);
      return;
    }
    this.generateSrKeyPair().then((res: Uint8Array) => {
      const word = new Uint8Array(res.slice(64, 96));
      console.log(word);
      this.address = bech32.encode('tyee', bech32.toWords(word));
      console.log(this.address);
      const descPublic = this.bech32_decode(this.address);
      console.log(descPublic);
      const rawPrivateKey = new Uint8Array(res.slice(0, 64));
      console.log(rawPrivateKey);
      this.privateKey = '0x' + bytesToHex(rawPrivateKey);
      console.log(this.privateKey);
      this.ls.setObject('wallet_address', this.address);
      this.ls.setObject('wallet_private_key_enc', this.encrypt(this.privateKey, this.model.passWord));
    });
  }
  public accessWallet() {
    this.router.navigate([this.networkURLPrefix, 'wallet']);
    // setTimeout(() => {
    //     this.router.navigate([this.networkURLPrefix, 'wallet']);
    //   },
    //   2000);
  }
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
