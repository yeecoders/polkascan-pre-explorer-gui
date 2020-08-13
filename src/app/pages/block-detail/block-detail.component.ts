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
 * block-detail.component.ts
 */

import {Component, OnInit, Input, OnDestroy} from '@angular/core';
import { Location } from '@angular/common';
import { Block } from '../../classes/block.class';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { BlockService } from '../../services/block.service';
import {Observable, Subscription} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {ExtrinsicService} from '../../services/extrinsic.service';
import {EventService} from '../../services/event.service';
import {environment} from '../../../environments/environment';
import {BlockTotal} from '../../classes/block-total.class';
import {BlockTotalService} from '../../services/block-total.service';
import {LogService} from '../../services/log.service';
import {blake2b} from 'blakejs';

@Component({
  selector: 'app-block-detail',
  templateUrl: './block-detail.component.html',
  styleUrls: ['./block-detail.component.scss'],
})
export class BlockDetailComponent implements OnInit, OnDestroy {

  block$: Observable<Block>;
  blockTotal$: Observable<BlockTotal>;

  public networkTokenDecimals: number;
  public networkTokenSymbol: string;
  public currentTab: string;
  public workhash: string;

  private fragmentSubsription: Subscription;
  networkURLPrefix: any;

  constructor(
    private route: ActivatedRoute,
    private blockService: BlockService,
    private blockTotalService: BlockTotalService,
    private extrinsicService: ExtrinsicService,
    private eventService: EventService,
    private logService: LogService,
    private location: Location
  ) { }

  ngOnInit() {
    this.currentTab = 'logs';

    this.networkTokenDecimals = environment.networkTokenDecimals;
    this.networkTokenSymbol = environment.networkTokenSymbol;

    this.block$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
          if (params.get('id')) {
            return this.blockService.get(params.get('id'), { include: ['transactions', 'inherents', 'events', 'logs'] });
          }
      })
    );

    this.fragmentSubsription = this.route.fragment.subscribe(value => {
      if (value === 'transactions' || value === 'inherents' || value === 'events' || value === 'logs') {
        this.currentTab = value;
      }
    });

    this.block$.subscribe(value => {
      if (this.currentTab === 'transactions' && value.relationships.transactions.data.length === 0 &&
        value.relationships.inherents.data.length > 0) {
        this.currentTab = 'inherents';
      }
    });

    this.blockTotal$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
          if (params.get('id')) {
            return this.blockTotalService.get(params.get('id'), { });
          }
      })
    );
    this.block$.subscribe(value => {
      if (value.relationships.logs.data.length > 0) {
        // @ts-ignore
        const workhash =  value.relationships.logs.data[3].attributes.data.value.data.substr(64, 64);
        this.workhash = workhash;
        console.log(' workhash: ', workhash);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  ngOnDestroy() {
    // Will clear when component is destroyed e.g. route is navigated away from.
    this.fragmentSubsription.unsubscribe();
  }
  public formatBalance(balance: number) {
    return balance / Math.pow(10, this.networkTokenDecimals);
  }
  public getWorkHash() {
    // tslint:disable-next-line:max-line-length
    const hex = Buffer.from( blake2b('abc', null, 32)).toString('hex');
    return this.workhash;
    // return  '0x' + hex;
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
