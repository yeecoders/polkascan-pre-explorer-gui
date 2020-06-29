import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {switchMap} from 'rxjs/operators';
import {BalanceTransfer} from '../../classes/balancetransfer.class';
import {BalanceTransferService} from '../../services/balance-transfer.service';
import {environment} from '../../../environments/environment';
import {ExtrinsicService} from '../../services/extrinsic.service';
import {Extrinsic} from '../../classes/extrinsic.class';
import bech32 from 'bech32';

@Component({
  selector: 'app-balances-transfer-detail',
  templateUrl: './balances-transfer-detail.component.html',
  styleUrls: ['./balances-transfer-detail.component.scss']
})
export class BalancesTransferDetailComponent implements OnInit {
  public relayFlag: boolean;
  public extrinsicRelay$: Observable<Extrinsic>;
  public balanceTransfer$: Observable<BalanceTransfer>;

  public networkTokenDecimals: number;
  public networkTokenSymbol: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private balanceTransferService: BalanceTransferService,
    private extrinsicService: ExtrinsicService
  ) {
  }

  ngOnInit() {
    this.networkTokenDecimals = environment.networkTokenDecimals;
    this.networkTokenSymbol = environment.networkTokenSymbol;

    this.balanceTransfer$ = this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        return this.balanceTransferService.get(params.get('id'));
      })
    );
    this.extrinsicRelay$ = this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const str = 'origin' + '-' + params.get('id');
        return  this.extrinsicService.get(str);
      })
    );
  }
  //
  // public get_re(hash: string) {
  //   const str = 'origin' + '-' + hash;
  //   if (hash) {
  //    console.log(str);
  //   }
  //
  // }

  public get_relayFlag(from: string, to: string, flag: string) {
    if (from && to) {
      console.log(from);
      console.log(to);
      const mask = 0x03;
      // tslint:disable-next-line:no-bitwise
      // @ts-ignore
      // tslint:disable-next-line:no-bitwise
      const shardNum1 = mask & new Uint8Array(bech32.fromWords(bech32.decode(from).words))[31];
      // tslint:disable-next-line:no-bitwise
      // @ts-ignore
      // tslint:disable-next-line:no-bitwise
      const shardNum2 = mask & new Uint8Array(bech32.fromWords(bech32.decode(to).words))[31];
      console.log('---------');
      console.log(shardNum1);
      console.log(shardNum2);
      if (shardNum1 !== shardNum2) {
        this.relayFlag = true;
      } else {
        this.relayFlag = false;
      }
      // @ts-ignore
      if (flag !== 1) {
        console.log('suflag:', flag);
        this.relayFlag = false;
      }
      console.log(this.relayFlag);
    }
  }

  public formatBalance(balance: number) {
    return balance / Math.pow(10, this.networkTokenDecimals);
  }

  public Copy() {
    const range = document.createRange();
    range.selectNode(document.getElementById('hash'));
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      selection.removeAllRanges();
    }
    selection.addRange(range);
    document.execCommand('copy');
    alert('复制成功');
  }
}
