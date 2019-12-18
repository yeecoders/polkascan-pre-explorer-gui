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

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss']
})
export class AccountDetailComponent implements OnInit {

  public balanceTransfers: DocumentCollection<BalanceTransfer>;
  public extrinsics: DocumentCollection<Extrinsic>;

  public account$: Observable<Account>;

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

  public bech32_encode(hex: string) {
    if (hex) {
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
      return shardNum;
    }
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
