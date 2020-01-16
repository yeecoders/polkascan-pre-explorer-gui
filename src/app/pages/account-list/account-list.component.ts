import {Component, OnDestroy, OnInit} from '@angular/core';
import {DocumentCollection} from 'ngx-jsonapi';
import {Account} from '../../classes/account.class';
import {AccountService} from '../../services/account.service';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {environment} from '../../../environments/environment';
import bech32 from 'bech32';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss']
})
export class AccountListComponent implements OnInit, OnDestroy {
  public networkTokenDecimals: number;
  public accounts: DocumentCollection<Account>;
  currentPage = 1;
  public networkTokenSymbol: string;
  private fragmentSubsription: Subscription;

  constructor(
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
  ) {

  }


  ngOnInit() {
    this.networkTokenDecimals = environment.networkTokenDecimals;
    this.networkTokenSymbol = environment.networkTokenSymbol;
    this.fragmentSubsription = this.activatedRoute.fragment.subscribe(value => {
      if (+value > 0) {
        this.currentPage = +value;
      } else {
        this.currentPage = 1;
      }
      this.getItems(this.currentPage);
    });
  }

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
      const mask = 0x03
      // tslint:disable-next-line:no-bitwise
      const shardNum = mask & new Uint8Array(bech32.fromWords(bech32.decode(str).words))[31];
      console.log(shardNum);
      return shardNum;
    }
  }

  bech32_decode() {
    const str = 'yee18z4vztn7d0t9290d6tmlucqcelj4d4luzshnfh274vsuf62gkdrsqesk8y';
    const prefix = bech32.decode(str).prefix;
    const words = bech32.decode(str).words;
    const bb = bech32.fromWords(bech32.decode(str).words);
    let result = '';
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < words.length; i++) {
      result += String.fromCharCode(parseInt(words[i], 2));
    }
    console.log(result);
  }

  getItems(page: number): void {

    const params = {
      page: {number: page, size: 25},
      remotefilter: {},
    };

    this.accountService.all(params).subscribe(accounts => {
      this.accounts = accounts;
    });
  }

  ngOnDestroy() {
    // Will clear when component is destroyed e.g. route is navigated away from.
    this.fragmentSubsription.unsubscribe();
  }

  public formatBalance(balance: number) {
    return balance / Math.pow(10, this.networkTokenDecimals);
  }
}
