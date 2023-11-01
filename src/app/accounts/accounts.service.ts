import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {ToastService} from "../toast.service";
import {CurtainWebAPI, User} from "curtain-web-api";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {SessionExpiredModalComponent} from "../components/session-expired-modal/session-expired-modal.component";

@Injectable({
  providedIn: 'root'
})
export class AccountsService {

  curtainAPI: CurtainWebAPI = new CurtainWebAPI(environment.apiURL)

  isOwner: boolean = false


  constructor(private toast: ToastService, private modal: NgbModal) {
    this.curtainAPI.axiosInstance.interceptors.request.use((config) => {
      if (config.url) {
        if (this.curtainAPI.checkIfRefreshTokenExpired() && this.curtainAPI.user.loginStatus === true) {
          this.curtainAPI.user.loginStatus = false
          this.curtainAPI.user.clearDB().then((data: any) => {
            this.curtainAPI.user = new User()
          })


          console.log(this.curtainAPI.user)
          const ref = this.modal.open(SessionExpiredModalComponent, {backdrop: 'static'})

        }
        if (
          //config.url === this.refereshURL ||
          config.url === this.curtainAPI.logoutURL ||
          config.url === this.curtainAPI.userInfoURL ||
          config.url.startsWith(this.curtainAPI.baseURL + "curtain/") ||
          config.url.startsWith(this.curtainAPI.baseURL + "data_filter_list/")) {
          console.log(this.curtainAPI.user)
          if (this.curtainAPI.user.loginStatus) {
            config.headers["Authorization"] = "Bearer " + this.curtainAPI.user.access_token;
          }
        }
      }

      return config;
    }, (error) => {
      return Promise.reject(error);
    });
    this.curtainAPI.axiosInstance.interceptors.response.use((response) => {
      return response
    } , (error) => {
      if (error.response.status === 401) {
        if (error.config.url !== this.curtainAPI.refereshURL &&
          error.config.url !== this.curtainAPI.loginURL &&
          error.config.url !== this.curtainAPI.orcidLoginURL) {
          if (!this.curtainAPI.checkIfRefreshTokenExpired() && this.curtainAPI.user.loginStatus) {
            console.log("refreshing token")
            if (!this.curtainAPI.isRefreshing) {
              return this.refresh().then((response) => {
                this.curtainAPI.isRefreshing = false;
                return this.curtainAPI.axiosInstance.request(error.config);
              }).catch((error) => {
                this.curtainAPI.isRefreshing = false;
                this.curtainAPI.user = new User();
                return error;
              });
            }
          }
        }
      }
      return Promise.reject(error);
    });
  }

  reload() {
    return this.curtainAPI.user.loadFromDB().then((data: any) => {
      return data;
    })
  }

  getUser(reNavigate: boolean = false) {
    return this.curtainAPI.getUserInfo().then((data: any) => {
      this.toast.show("Login Information", "User information updated.").then(() => {
        const url = localStorage.getItem("urlAfterLogin")
        if (url && reNavigate) {
          window.location.assign(url)
        }
      })
    }).catch((error: any) => {
      this.toast.show("Error", "User data retrieval error.").then()
      return error
    })
  }

  login(username: string, password: string) {
    return this.curtainAPI.login(username, password).then((data: any) => {return data}).catch((error: any) => {
      this.toast.show("Login Error", "Incorrect Login Credential.").then()
      return error
    })
  }

  refresh() {
    return this.curtainAPI.refresh().then((data: any) => {return data}).catch((error: any) => {
      this.toast.show("Error", "User data update error.").then()
      return error
    })
  }

  logout() {
    return this.curtainAPI.logout().then((data: any) => {
      this.toast.show("Login Information", "Logout Successful.").then()
    }).catch((error: any) => {
      return error
    })
  }


  getSessionPermission(): boolean {
    if (this.curtainAPI.user.isStaff) {
      return true
    } else if (this.isOwner) {
      return true
    }
    return false
  }


  postORCIDCode(data: string) {
    return this.curtainAPI.ORCIDLogin(data, window.location.origin+"/").then((data: any) => {
      return data
    }).catch((error: any) => {
      return error
    })
  }

  ORCIDLogin(data: string) {
    return this.postORCIDCode(data).then((data:any) => {
      return data
    }).catch((error: any) => {
      return error
    })
  }


  deleteCurtainLink(link_id: string) {
    return this.curtainAPI.deleteCurtainLink(link_id).then((data: any) => {
      return data
    }).catch((error: any) => {
      return error
    })
  }
}
