import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import {catchError, concatMap, delay, Observable, of, retryWhen, switchMap, throwError} from 'rxjs';
import {AccountsService} from "./accounts/accounts.service";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  isRefreshing = false
  retryTimes = 3
  retryDelay = 3000
  constructor(private accounts: AccountsService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log(request)
    // check if the request is not for refreshing the token
    if (!request.url.endsWith("/token/refresh/")) {
      // check if the request is for logging out
      if (request.url.endsWith("/logout/")) {
        return next.handle(request)
      }
      // check if the user is logged in
      if (this.accounts.loggedIn) {
        // check if the token is expired
        const currentTime = new Date()
        const diffTime = currentTime.getTime() - this.accounts.lastTokenUpdateTime.getTime()
        const minDiffTime = Math.floor(diffTime/60000)
        // if the token is expired, refresh the token and add the token to the request header
        if (minDiffTime > 5) {
          return this.accounts.refresh().pipe(switchMap((token: any) => {
              // update the token and the last token update time
              this.accounts.accessToken = token.access
              this.accounts.lastTokenUpdateTime = new Date()
              return next.handle(this.addTokenHeader(request))
            }),
            catchError((err) => {
              // if the token refresh fails, log out the user
              this.isRefreshing = false
              console.log(err)
              this.accounts.logout().subscribe(data => {
                console.log(err)
                console.log("logged out")
              })
              return throwError(err)
            })
          )
        }
        // if the token is not expired, add the token to the request header
        request = this.addTokenHeader(request);
      }
    } else {
      this.isRefreshing = true
    }
    // if the request is for refreshing the token, set the isRefreshing flag to true
    return next.handle(request).pipe(catchError(err => {
      // if the request is for uniprot and the error is 500, retry the request  3 times with 3 seconds delay
      if (request.url.startsWith("https://rest.uniprot.org") && err.status === 500) {
        return this.uniprotErrorRetry(request, next)
      }
      // if the request is for refreshing the token and the error is 401, log out the user and return the error
      if (request.url.endsWith("/token/refresh/")) {
        console.log(err)
        this.isRefreshing = false
        this.accounts.removeLocalStorage()
        this.accounts.loggedIn = false
        this.accounts.accessToken = ""
        this.accounts.refreshToken = ""
        console.log("logged out")
      } else if (err instanceof HttpErrorResponse && !request.url.endsWith("/token/")) {
        if (err.status === 401) {
          if (request.url.endsWith("get_ownership/")) {
            return throwError(err)
          }
          return this.handle401Error(request, next)
        }
      }
      return throwError(err)
    }));


  }

  // retry the request 3 times with 3 seconds delay if the error is 500 and the request is for uniprot
  uniprotErrorRetry(request: HttpRequest<unknown>, next: HttpHandler) {
    return next.handle(request).pipe(retryWhen(err => err.pipe(
        concatMap((error, count) => {
          if (count <= this.retryTimes && error.status === 500) {
            return of(error)
          }
          return throwError(error)
        }), delay(this.retryDelay)
      )
    ));
  }

  // add the token to the request header
  private addTokenHeader(request: HttpRequest<unknown>) {
    console.log(this.accounts.accessToken)
    // check if the request is not for refreshing the token
    if (!request.url.endsWith("/token")) {
      // check if the user is logged in and the token is not empty
      if (this.accounts.accessToken !== "") {
        // add the token to the request header
        request = request.clone({
          headers:
            request.headers
              .set("Authorization", `Bearer ${this.accounts.accessToken}`)
        })
        // request = request.clone({
        //   headers:
        //     request.headers
        //       .set("HTTP_X_XSRF_TOKEN", `${this.csrfTokenExtractor.getToken() as string}`)
        // })
      }
    }
    return request;
  }

  // refresh the token and add the token to the request header
  handle401Error(request: HttpRequest<unknown>, next: HttpHandler) {
    // check if the token is not being refreshed
    if (!this.isRefreshing) {
      // set the isRefreshing flag to true and remove the token from the local storage
      this.isRefreshing = true
      this.accounts.accessToken = ""
      if (this.accounts.refreshToken !== "") {
        // refresh the token
        return this.accounts.refresh().pipe(
          // update the token and the last token update time and add the token to the request header
          switchMap((token: any) => {
            this.isRefreshing = false
            this.accounts.accessToken = token.access
            this.accounts.lastTokenUpdateTime = new Date()
            return next.handle(this.addTokenHeader(request))
          }),
          // if the token refresh fails, log out the user and return the error
          catchError((err) => {
            this.isRefreshing = false
            this.accounts.logout().subscribe()
            return throwError(err)
          })
        )
      }
    }
    // if the token is being refreshed, wait for 1 second and try to refresh the token again
    return this.accounts.refresh().pipe(switchMap((token: any) => {
      this.accounts.accessToken = token.access
      this.accounts.lastTokenUpdateTime = new Date()
      return next.handle(this.addTokenHeader(request))
    }))
  }
}
