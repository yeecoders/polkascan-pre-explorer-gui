import { Component, OnInit } from '@angular/core';
import {Observable} from 'rxjs';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {switchMap} from 'rxjs/operators';
import {BalanceTransfer} from '../../classes/balancetransfer.class';
import {BalanceTransferService} from '../../services/balance-transfer.service';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-balances-transfer-detail',
  templateUrl: './balances-transfer-detail.component.html',
  styleUrls: ['./balances-transfer-detail.component.scss']
})
export class BalancesTransferDetailComponent implements OnInit {

  public balanceTransfer$: Observable<BalanceTransfer>;

  public networkTokenDecimals: number;
  public networkTokenSymbol: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private balanceTransferService: BalanceTransferService
  ) { }

  ngOnInit() {
    this.networkTokenDecimals = environment.networkTokenDecimals;
    this.networkTokenSymbol = environment.networkTokenSymbol;

    this.balanceTransfer$ = this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
          return this.balanceTransferService.get(params.get('id'));
      })
    );
  }

  public formatBalance(balance: number) {
    return balance / Math.pow(10, this.networkTokenDecimals);
  }

  public Copy() {
    const range = document.createRange();
    range.selectNode(document.getElementById('hash'));
    const selection = window.getSelection();
    if (selection.rangeCount > 0) { selection.removeAllRanges(); }
    selection.addRange(range);
    document.execCommand('copy');
    alert('复制成功');
  }
}
