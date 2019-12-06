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
 * extrinsic-table.component.ts
 */

import {Component, Input, OnInit} from '@angular/core';
import {Extrinsic} from '../../classes/extrinsic.class';
import {Location} from '@angular/common';
import {ExtrinsicService} from '../../services/extrinsic.service';
import {Observable} from 'rxjs';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-extrinsic-table',
  templateUrl: './extrinsic-table.component.html',
  styleUrls: ['./extrinsic-table.component.scss']
})
export class ExtrinsicTableComponent implements OnInit {
  public extrinsicRelay$: Observable<Extrinsic>;
  public relayFlag: boolean;
  @Input() extrinsic: Extrinsic = null;
  @Input() extrinsicId: string = null;
  @Input() context: string = null;
  @Input() networkTokenDecimals = 0;
  @Input() networkTokenSymbol: string;
  @Input() networkURLPrefix: string;
  @Input() title: string;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private extrinsicService: ExtrinsicService
  ) { }

  ngOnInit() {
    if (this.extrinsicId) {
       this.extrinsicService.get(this.extrinsicId).subscribe(extrinsic => this.extrinsic = extrinsic);
    }
    if (this.extrinsic.id) {
      const str = 'origin' + '-' + this.extrinsic.id;
      const model = this.extrinsicService.get(str);
      this.extrinsicRelay$ = this.route.paramMap.pipe(
        switchMap((params: ParamMap) => {
           return model;
        })
      );
    }
  }

  goBack(): void {
    this.location.back();
  }

  public formatBalance(balance: number) {
    return balance / Math.pow(10, this.networkTokenDecimals);
  }

  public get_relayFlag(from: string, to: Array<string>) {
    console.log(from);
    const param = JSON.parse(JSON.stringify(to[0]));
    console.log(param.value);
    this.relayFlag = true;
  }
  paramName(name: string) {

    if (name === 'dest') {
      name = 'To';
    }

    return name;
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
