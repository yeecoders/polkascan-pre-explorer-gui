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
import { Router } from '@angular/router';
import * as schnorrkel from '@yeecoders/schnorrkel-js';

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

  ngOnInit() {
    this.networkURLPrefix = '';
  }

  createAccount() {
    this.resout.result = '';
    // console.log(this.model);
    if ( this.model.password === '' ) {
      this.resout.result = 'Please fill password';
      this.resout.showResult = true;
      console.log(this.resout);
      return;
    }


    schnorrkel.waitReady().then((ready) => {
      console.log("schnorrkel ready: " + ready);
      if (ready){

        const mnemonic = generateMnemonic();
        const srKeypairFromUri = window['srKeypairFromUri'];

        // console.log(mnemonic);

        const keypair = srKeypairFromUri(mnemonic);

        const publicKey = keypair.slice(64, 96);
        const privateKey = keypair.slice(0, 64);

        const address = bech32.encode('tyee', bech32.toWords(publicKey));
        console.log("address: " + address);

        const privateKeyHex = bytesToHex(privateKey);
        let enc = this.encrypt(privateKeyHex, this.model.password);

        this.ls.setObject('wallet_address', address);
        this.ls.setObject('wallet_private_key_enc', enc);


        this.privateKey = "0x" + privateKeyHex;
        this.address = address;
      }
    });

  }
  public accessWallet() {
    this.router.navigate([this.networkURLPrefix, 'wallet']);
  }

  // plainTextHex: hex without leading '0x'
  // password: utf8 string
  // return: hex
  public encrypt(plainTextHex, password) {

    const key = this.getKey(password);
    const keyHex = key[0];
    const ivHex = key[1];

    const encrypted = crypto.AES.encrypt(crypto.enc.Hex.parse(plainTextHex), crypto.enc.Hex.parse(keyHex), {
      iv: crypto.enc.Hex.parse(ivHex),
      padding: crypto.pad.NoPadding,
      mode: crypto.mode.CTR
    });

    return encrypted.ciphertext.toString();
  }

  // cypherTextHex: hex without leading '0x'
  // password: utf8 string
  // return: hex
  public decript(cypherTextHex, password) {

    const key = this.getKey(password);
    const keyHex = key[0];
    const ivHex = key[1];

    const cypherText = crypto.enc.Hex.parse(cypherTextHex);
    const cypherTextBase64 = crypto.enc.Base64.stringify(cypherText);

    let decrypted = crypto.AES.decrypt(cypherTextBase64, crypto.enc.Hex.parse(keyHex), {
      iv: crypto.enc.Hex.parse(ivHex),
      padding: crypto.pad.NoPadding,
      mode: crypto.mode.CTR
    });

    return decrypted.toString(crypto.enc.Hex);

  }

  // password: utf8 string
  // return [keyHex, ivHex]
  public getKey(password){

    const salt = 'yee';
    const keySize = 256;
    const iterations = 100;
    const rawKeyHex = crypto.PBKDF2(crypto.enc.Utf8.parse(password), salt, {
      keySize: keySize / 32 * 2,
      iterations: iterations
    }).toString();
    // console.log("raw key:" + rawKeyHex);

    const rawKey = hexToBytes(rawKeyHex);

    const keyHex = bytesToHex(rawKey.slice(0, 32));
    const ivHex = bytesToHex(rawKey.slice(32, 64));

    // console.log("key:" + keyHex);
    // console.log("iv:" + ivHex);

    return [keyHex, ivHex];

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
