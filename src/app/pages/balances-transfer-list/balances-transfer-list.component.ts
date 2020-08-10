import { Component, OnDestroy, OnInit } from '@angular/core';
import { DocumentCollection } from 'ngx-jsonapi';
import { BalanceTransfer } from '../../classes/balancetransfer.class';
import { BalanceTransferService } from '../../services/balance-transfer.service';
import { environment } from '../../../environments/environment';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import bech32 from 'bech32';

@Component({
  selector: 'app-balances-transfer-list',
  templateUrl: './balances-transfer-list.component.html',
  styleUrls: ['./balances-transfer-list.component.scss']
})
export class BalancesTransferListComponent implements OnInit, OnDestroy {

  public balanceTransfers: DocumentCollection<BalanceTransfer>;
  currentPage = 1;

  public networkTokenDecimals: number;
  public networkTokenSymbol: string;

  private fragmentSubsription: Subscription;

  constructor(
    private balanceTransferService: BalanceTransferService,
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

  getItems(page: number): void {

    const params = {
      page: { number: page, size: 25 },
      remotefilter: {},
    };

    this.balanceTransferService.all(params).subscribe(balanceTransfers => {
      this.balanceTransfers = balanceTransfers;
    });
  }

  ngOnDestroy() {
    // Will clear when component is destroyed e.g. route is navigated away from.
    this.fragmentSubsription.unsubscribe();
  }
  public getshardnum(id: string) {
    console.log('DestShard--', id);
    if (id) {
      // let bts = [];
      // for (let bytes = [], c = 0; c < id.length; c += 2) {
      //   bytes.push(parseInt(id.substr(c, 2), 16));
      //   bts = bytes;
      // }
      // const str = bech32.encode(environment.HRP, bech32.toWords(bts));
      const mask = 0x03;
      // tslint:disable-next-line:no-bitwise
      const shardNum = mask & new Uint8Array(bech32.fromWords(bech32.decode(id).words))[31];
      return shardNum;
    }
  }
  public formatBalance(balance: number) {
    return balance / Math.pow(10, this.networkTokenDecimals);
  }

}
