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
 * messages.component.ts
 */

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-model',
  templateUrl: './model.component.html',
  styleUrls: ['./model.component.scss']
})
export class ModelComponent implements OnInit {
  public _myModel;
    @Input()
    get myModel() {
      return this._myModel;
    }
    set myModel(value) {
      console.log(value)
      this._myModel = value;
      this.myModelChange.emit(value);
    }
    @Output()
    myModelChange: EventEmitter<any> = new EventEmitter();
    @Input() title
    constructor() { }

    ngOnInit() {
      console.log(this)
    }
    close() {
      console.log(1111)
      this.myModelChange.emit(false);
    }

}
