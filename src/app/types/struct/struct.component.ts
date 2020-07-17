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
import bech32 from 'bech32';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-struct',
  templateUrl: './struct.component.html',
  styleUrls: ['./struct.component.scss']
})
export class StructComponent implements OnInit {

  @Input() struct = null;
  @Input() networkURLPrefix = null;
  @Input() networkTokenDecimals = 0;
  @Input() networkTokenSymbol: string;

  constructor() {
  }

  ngOnInit() {
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
      const str = bech32.encode(environment.HRP, bech32.toWords(bts));
      console.log('---');
      console.log(str);
      return str;
    }
  }

  checkType(obj) {
    if (obj !== undefined && obj.coinbase && obj.coinbase.includes('0x')) {
      obj.coinbase = this.bech32_encode(obj.coinbase);
      console.log(obj.coinbase);
    }
    return typeof obj;
  }
}
