import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UntypedFormBuilder, Validators} from "@angular/forms";
import {AccountsService} from "../accounts.service";
import {WebService} from "../../web.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {Subject, Subscription} from "rxjs";
import {ToastService} from "../../toast.service";
import {environment} from "../../../environments/environment";
import {DataService} from "../../data.service";




@Component({
    selector: 'app-login-modal',
    templateUrl: './login-modal.component.html',
    styleUrls: ['./login-modal.component.scss'],
    standalone: false
})
export class LoginModalComponent implements OnInit, OnDestroy {
  allowOrcid = true
  @ViewChild('orcidWidget') orcidWidget: ElementRef|undefined
  orcid: string = environment.orcid
  form = this.fb.group({
    username: [null, Validators.required],
    password: [null, Validators.required]
  })

  loginStatus: Subject<boolean> = new Subject<boolean>()
  loginWatcher: NodeJS.Timeout|undefined
  constructor(private dataService: DataService, private modal: NgbActiveModal, private fb: UntypedFormBuilder, private accounts: AccountsService, private web: WebService, private toast: ToastService) {

  }

  ngOnInit(): void {
  }

  login() {
    if (this.form.valid) {
      this.accounts.login(this.form.value["username"], this.form.value["password"]).then((data: any) => {
        this.processLogin(data)
      })
    }
  }

  processLogin(data: any) {
    this.accounts.curtainAPI.getUserInfo().then((data: any) => {
      this.form.reset()
      this.loginStatus.next(true)
      this.modal.dismiss()
      this.toast.show("Login Information","Login Successful.").then()
    }, error =>{
      this.toast.show("Login Error", "Incorrect Login Credential.").then()
    })
  }

  clickOrcid() {
    localStorage.setItem("urlAfterLogin", document.URL)
    this.loginWatcher = setInterval(()=> {
      console.log("ORCID LOGIN CHECK")
      this.accounts.reload().then(() => {
        if (this.accounts.curtainAPI.user.access_token && this.accounts.curtainAPI.user.access_token.length > 0) {
          console.log("ORCID LOGIN SUCCESSFUL")
          if (this.accounts.curtainAPI.user.isStaff) {
            this.accounts.curtainAPI.getDataCites(undefined, undefined, "draft", 10, 0, true, "TP").then((data: any) => {
              this.dataService.draftDataCiteCount = data.data.count
            })
          }
          this.modal.dismiss()
          clearInterval(this.loginWatcher)
        }

      })

    }, 1000)
  }

  ngOnDestroy() {
    if (this.loginWatcher) {
      clearInterval(this.loginWatcher)
    }
  }
}
