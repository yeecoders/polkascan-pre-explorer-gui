import {Component, OnInit} from '@angular/core';
import {DocumentCollection, Resource} from 'ngx-jsonapi';
import {Extrinsic} from '../../classes/extrinsic.class';
import {BalanceTransferService} from '../../services/balance-transfer.service';
import {ExtrinsicService} from '../../services/extrinsic.service';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {environment} from '../../../environments/environment';
import {Observable, Subscription} from 'rxjs';
import {Account} from '../../classes/account.class';
import {AccountService} from '../../services/account.service';
import {switchMap} from 'rxjs/operators';
import {BalanceTransfer} from '../../classes/balancetransfer.class';
import {AccountIndexService} from '../../services/account-index.service';
import bech32 from 'bech32';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BlockService} from '../../services/block.service';
import {Block} from '../../classes/block.class';
import * as api from '../../lib/api';

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss']
})
export class AccountDetailComponent implements OnInit {
  aid: number;
  public blocks: DocumentCollection<Block>;
  public balanceTransfers: DocumentCollection<BalanceTransfer>;
  public extrinsics: DocumentCollection<Extrinsic>;
  currentPage = 1;
  blockRewardSum = '';
  feeRewardSum = '';
  public account$: Observable<Account>;
  private fragmentSubsription: Subscription;

  public networkTokenDecimals: number;
  public networkTokenSymbol: string;
  public currentTab: string;

  constructor(
    private blockService: BlockService,
    private balanceTransferService: BalanceTransferService,
    private extrinsicService: ExtrinsicService,
    private accountService: AccountService,
    private accountIndexService: AccountIndexService,
    private activatedRoute: ActivatedRoute,
    private http: HttpClient
  ) {
  }

  ngOnInit() {
    this.currentTab = 'transfers';
    this.activatedRoute.fragment.subscribe(value => {
      if (value === 'transactions' || value === 'transfers' || value === 'blockrewards') {
        this.currentTab = value;
      }
    });
    this.networkTokenDecimals = environment.networkTokenDecimals;
    this.networkTokenSymbol = environment.networkTokenSymbol;
    this.account$ = this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        this.getfee(params.get('id'));
        this.aid = api.default.utils.getShardNum(api.default.utils.bech32Decode(params.get('id')));
        return this.accountService.get(params.get('id'), {include: ['indices']});
      })
    );
    this.fragmentSubsription = this.activatedRoute.fragment.subscribe(value => {
      if (+value > 0) {
        this.currentPage = +value;
      } else {
        this.currentPage = 1;
      }
      this.getItems(this.currentPage);
    });
  }
  getItems(page: number): void {
    this.activatedRoute.params.subscribe(val => {

      this.balanceTransferService.all({
        remotefilter: {address: val.id},
        page: {number: page, size: 25 }
      }).subscribe(balanceTransfers => {this.balanceTransfers = balanceTransfers; });
      const paramsa = {
        page: {number: page, size: 25},
        remotefilter: {address: val.id},
      };
      this.extrinsicService.all(paramsa).subscribe(extrinsics => {
        this.extrinsics = extrinsics;
      });
      this.blockService.all(paramsa).subscribe(blocks => {
        this.blocks = blocks;
      });
    });
  }
  public bech32_encode(hex: string) {
    if (hex) {
      if (hex.indexOf('0x') === 0) {
        hex = hex.substr(2);
       // console.log('has head 0x!');
      }
      let bts = [];
      for (let bytes = [], c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
        bts = bytes;
      }
      const str = bech32.encode(environment.HRP, bech32.toWords(bts));
     // console.log('---');
     // console.log(str);
      return str;
    }
  }

  public getshardnum(id: string) {
    if (id) {
      return api.default.utils.getShardNum(api.default.utils.bech32Decode(id));
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
  getfee(id: string) {
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders().set('Content-Type', 'application/json');
      this.http.get(
        environment.jsonApiRootUrl + 'feesum/' + id,
        {headers}).toPromise().then((res: any) => {
        if (res.data === undefined ) {
          console.log('getfee: ',  res);
          reject(res.error);
        } else {
          const ps = [];
          const list = res.data.attributes;
          this.blockRewardSum = list.block_reward_sum;
          this.feeRewardSum = list.fee_reward_sum;
        }
      });
    });
  }

}
