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
 * app.component.ts
 */

import { Component } from '@angular/core';
import {environment} from '../environments/environment';
import { AccoutModelClass } from './accout-model.class'
import { ResultOut } from './result.class'
import {HttpHeaders} from '@angular/common/http';
import {HttpClient} from '@angular/common/http';
import * as schnorrkel from '@yeecoders/schnorrkel-js';
import {generateMnemonic} from 'bip39';
import {
  calls, runtime, chain, system, runtimeUp, pretty,
  addressBook, secretStore, metadata, nodeService, bytesToHex, hexToBytes, AccountId
} from 'oo7-substrate';
import * as api from 'src/app/lib/api.js';
import {NavigationEnd, NavigationStart, Router, ActivatedRoute} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {LocalStorage} from '../app/pages/wallet-detail/local.storage';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Polkascan';
  public showModel:boolean = false;
  public showPassWordModel:boolean = false;
  public showCreateModel:boolean = false;
  public showResultModel:boolean = false;
  public privateKeyHex:string;
  public balance: string;
  public model = new AccoutModelClass('', '', '');
  public resout = new ResultOut('', false, false);
  public privateKey: string;
  public networkTokenSymbol: string;
  public networkTokenDecimals: number;
  public address: string;
  public environment = environment;
  public showNavigation = false;
  public showSubmenus = true;
  public langs = ['en', 'de', 'fr', 'it', 'es', 'zh', 'ja', 'ko', 'ru', 'uk'];
  public selectedLanguage = 'en';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private httpClient: HttpClient,
    private translate: TranslateService,
    private ls: LocalStorage) {
    router.events.subscribe((val) => {
        this.showNavigation = false;
        this.address = this.ls.get('wallet_address');
        console.log('address: ', this.address);
    });
    translate.addLangs(this.langs);
    translate.setDefaultLang('en');

    // this.selectedLanguage = translate.getBrowserLang().match(/en|de|fr|it|es|zh|ja|ko|ru|uk/) ? translate.getBrowserLang() : 'en';
    translate.use(this.selectedLanguage);
  }
  // tslint:disable-next-line:use-life-cycle-interface
  ngOnInit() {
    this.address = this.ls.get('wallet_address');
    console.log('address: ', this.address);
    console.log('app init');
    this.balance = this.getBalance(this.address);
    this.networkTokenDecimals = environment.networkTokenDecimals;
    this.networkTokenSymbol = environment.networkTokenSymbol
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
  public formatBalance(balance: string) {
    return Number(balance) / Math.pow(10, this.networkTokenDecimals);
  }
  showModelFn() :void {
    this.model = new AccoutModelClass('', '', '');
    this.resout = new ResultOut('', false, false);
    this.showModel = true
  }
  showCreateModelFn() :void {
    this.model = new AccoutModelClass('', '', '');
    this.resout = new ResultOut('', false, false);
    this.showCreateModel = true
  }
  showPassWordModelFn():void {
    if (!this.model.sendPrivateKey) return;
    this.resout.result = '';
    // console.log(this.model);
    if (this.model.sendPrivateKey === '') {
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
          this.resout.result = 'Wrong Private Key!';
          this.resout.showResult = true;
          return;
        }
        console.log("public key: " + bytesToHex(publicKey));
        this.address = api.default.utils.bech32Encode(publicKey);
        this.privateKeyHex = bytesToHex(hexToBytes(privateKeyHex));//remove leading '0x'
      }
      this.showModel = false
      this.showPassWordModel = true
    })
  }
  public import() {
    this.resout.result = '';
    if (this.model.password === '' || this.model.password.length < 6) {
      this.resout.result = 'Too Short!';
      this.resout.showResult = true;
      console.log(this.resout);
      return;
    }
    let privateKeyHex = this.privateKeyHex;
    privateKeyHex = bytesToHex(hexToBytes(privateKeyHex));//remove leading '0x'
    let enc = api.default.utils.encrypt(privateKeyHex, this.model.password);
    this.ls.set('wallet_address', this.address);
    this.ls.set('wallet_private_key_enc', enc);
    this.router.navigate(['', 'wallet']);
    this.model = new AccoutModelClass('', '', '');
    this.resout = new ResultOut('', false, false);
  }
  createAccount() {
    this.resout.result = '';
    if (this.model.password === '' || this.model.password.length < 6) {
      this.resout.result = 'Too Short!';
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
        const address = api.default.utils.bech32Encode(publicKey);
        console.log("address: " + address);
        const privateKeyHex = bytesToHex(privateKey);
        let enc = api.default.utils.encrypt(privateKeyHex, this.model.password);
        this.ls.set('wallet_address', address);
        this.ls.set('wallet_private_key_enc', enc);
        this.privateKey = "0x" + privateKeyHex;
        this.address = address;
        console.log(this.privateKey)
        console.log(this.address)
        this.showResultModel = true
        this.showCreateModel = false
        this.model = new AccoutModelClass('', '', '');
        this.resout = new ResultOut('', false, false);
      }
    });

  }
  public copy() {
    const range = document.createRange();
    range.selectNode(document.getElementById('private'));
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      selection.removeAllRanges();
    }
    selection.addRange(range);
    document.execCommand('copy');
    alert('复制成功');
  }
  public accessWallet() {
    this.showResultModel = false
    this.router.navigate(['', 'wallet']);
  }
  onMyModelChange(key,value) {
    this[key] = value
  }
  toggleNavigation() {
    this.showNavigation = !this.showNavigation;
  }

  toggleSubmenus() {
    this.showSubmenus = false;

    setTimeout(() => { this.showSubmenus = true; }, 300);

  }
  logout() {
    console.log('logout');
    this.ls.remove('wallet_address');
    this.ls.remove('wallet_private_key_enc');
    this.address = null;
  }
  langsTitle(selectedLang: string) {
    switch (selectedLang) {
      case 'de':
        return 'Deutsche';
      case 'fr':
        return 'Française';
      case 'it':
        return 'Italiano';
      case 'es':
        return 'Español';
      case 'zh':
        return '中國';
      case 'ja':
        return '日本語';
      case 'ko':
        return '한국어';
      case 'ru':
        return 'Русский';
      case 'uk':
        return 'Українська';
      default:
        return 'English';
    }
  }
}
