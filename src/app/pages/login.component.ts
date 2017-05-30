import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../providers/authentication-service/authentication.service';
import { TranslateService } from 'ng2-translate/src/translate.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: 'login.component.html'
})
export class LoginComponent {

  public username: String;
  public password: String;
  public returnUrl: String;
  public loading: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthenticationService,
    private translateService: TranslateService)
  {
    this.loading = false;
  }

  ngOnInit() {
    // reset login status
    this.authenticationService.logout();

    // get return url from route parameters or default to '/'
    // console.log("Return URL: " + this.route.snapshot.queryParams['returnUrl']);
    // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.returnUrl = '/bulletins/bulletins';
  }

  login() {
    this.loading = true;

    this.authenticationService.authenticate(this.username, this.password).subscribe(
      data => {
        var result = data.json();
        this.authenticationService.setUser(result.token, result.username, result.image);
        console.log("[" + this.username + "] Logged in!");
        console.log("Navigate to " + this.returnUrl);
        this.router.navigate([this.returnUrl]);
      },
      error => {
        console.error("[" + this.username + "] Login failed: " + JSON.stringify(error._body));
        this.loading = false;
        // TODO show error on page
      }
    );
  }
}
