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
 * democracy-proposal.class.ts
 *
 */

import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-render-type',
  templateUrl: './render-type.component.html',
  styleUrls: ['./render-type.component.scss']
})
export class RenderTypeComponent implements OnInit {

  @Input() item = null;
  @Input() callId = null;
  @Input() moudleId = null;
  @Input() networkURLPrefix = null;
  @Input() networkTokenDecimals = 0;
  @Input() networkTokenSymbol: string;
  public localnetworkTokenSymbol: string;


  constructor() { }

  ngOnInit() {
    this.localnetworkTokenSymbol = '';
    console.log('item--', this.item );
    console.log('callId--', this.callId );
    console.log('moudleId--', this.moudleId );
  }
  getsymbol(): string {
    if (this.callId === 'transfer' && this.moudleId === 'balances') {
      return this.networkTokenSymbol;
    } else {
      return this.localnetworkTokenSymbol;
    }
  }
  public formatBalance(balance: number) {
    if (this.callId === 'transfer' && this.moudleId === 'balances') {
      return balance / Math.pow(10, this.networkTokenDecimals);
    } else {
      return balance;
    }
  }
  public sw(b: string) {
    const n = b.length / 2;
    const buf = Buffer.alloc(n);
    for (let i = 0 ; i < n ; i++) {
      buf[i] = parseInt(b.slice(2 * (i + 1) - 2, 2 * (i + 1)), 16);
    }
    const v = parseInt((buf.readIntLE(0, 2) / 4).toString(), null);
    return v;
  }
}
