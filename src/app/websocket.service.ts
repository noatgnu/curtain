import { Injectable, signal } from '@angular/core';
import {AccountsService} from "./accounts/accounts.service";
import {Observable} from "rxjs";
import {WebSocketSubject} from "rxjs/internal/observable/dom/WebSocketSubject";
import * as readableIDs from "uuid-readable";
import { toObservable } from '@angular/core/rxjs-interop';


@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  baseUrl = ""
  eventConnection: WebSocketSubject<any>|undefined
  jobConnection: WebSocketSubject<any>|undefined
  sessionID: string = readableIDs.short(crypto.randomUUID()).replace(/\s/g, "")
  personalID: string = readableIDs.short(crypto.randomUUID()).replace(/\s/g, "")

  displayName: string = "Anonymous"
  private readonly _resubscribeCounter = signal(0);
  readonly resubscribeCounter = this._resubscribeCounter.asReadonly();
  readonly resubscribe$ = toObservable(this._resubscribeCounter);
  connectingEvent: boolean = false
  connectingJob: boolean = false
  constructor(private accounts: AccountsService) {

  }

  connect(connecting: boolean, url: string, connection: WebSocketSubject<any>|undefined, sessionID: string, personalID: string) {
    connecting = true
    if (!connection) {
      // @ts-ignore
      connection = new WebSocketSubject(url)
      console.log("connected to " + url)
      connecting = false
      return connection
    } else {
      connecting = false
      return connection
    }
  }


  connectEvent(): WebSocketSubject<any> {
    this.connectingEvent = true
    this.baseUrl = this.accounts.curtainAPI.baseURL.replace("http", "ws")
    const url = this.baseUrl + "ws/curtain/"+ this.sessionID + "/" +this.personalID+ "/"
    if (!this.eventConnection) {
      this.eventConnection = new WebSocketSubject(url)
      console.log("connected to event " + this.sessionID)
      console.log(this.eventConnection)
      this.connectingEvent = false
      return this.eventConnection
    } else {
      this.connectingEvent = false
      return this.eventConnection
    }
  }

  connectJob(): WebSocketSubject<any> {
    this.connectingJob = true
    this.baseUrl = this.accounts.curtainAPI.baseURL.replace("http", "ws")
    const url = this.baseUrl + "ws/job/"+ this.sessionID + "/" +this.personalID+ "/"
    if (!this.jobConnection) {
      this.jobConnection = new WebSocketSubject(url)
      console.log("connected to job " + this.sessionID)
      console.log(this.jobConnection)
      this.connectingJob = false
      return this.jobConnection
    } else {
      this.connectingJob = false
      return this.jobConnection
    }
  }

  sendEvent(message: any) {
    this.eventConnection?.next(message)
  }

  closeEvent() {
    this.eventConnection?.complete()
    this.eventConnection = undefined
  }

  closeJob() {
    this.jobConnection?.complete()
    this.jobConnection = undefined
  }
  reconnect() {
    this.closeEvent()
    this.eventConnection = this.connectEvent()
    if (this.eventConnection) {
      this._resubscribeCounter.update(v => v + 1);
    }
    console.log("reconnected to " + this.sessionID)
  }

  getEventMessages(): Observable<any>|undefined {
    return this.eventConnection?.asObservable()
  }

  getJobMessages(): Observable<any>|undefined {
    return this.jobConnection?.asObservable()
  }
}
