import {Component, OnDestroy, OnInit} from '@angular/core';
import {DocumentCollection} from 'ngx-jsonapi';
import {Account} from '../../classes/account.class';
import {AccountService} from '../../services/account.service';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss']
})
export class AccountListComponent implements OnInit, OnDestroy {
  public networkTokenDecimals: number;
  public accounts: DocumentCollection<Account>;
  currentPage = 1;
  public networkTokenSymbol: string;
  private fragmentSubsription: Subscription;

  constructor(
    private accountService: AccountService,
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

    this.accountService.all(params).subscribe(accounts => {
      this.accounts = accounts;
    });
  }

  ngOnDestroy() {
    // Will clear when component is destroyed e.g. route is navigated away from.
    this.fragmentSubsription.unsubscribe();
  }

  public formatBalance(balance: number) {
    return balance / Math.pow(10, this.networkTokenDecimals);
  }
}
