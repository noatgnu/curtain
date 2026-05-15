import { Injectable, signal } from '@angular/core';
import { AccountsService } from "./accounts/accounts.service";
import { Observable } from "rxjs";
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import * as readableIDs from "uuid-readable";


@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  baseUrl = ""
  eventConnection: WebSocketSubject<any> | undefined
  jobConnection: WebSocketSubject<any> | undefined
  sessionID: string = readableIDs.short(crypto.randomUUID()).replace(/\s/g, "")
  personalID: string = readableIDs.short(crypto.randomUUID()).replace(/\s/g, "")

  displayName: string = "Anonymous"
  private readonly _resubscribeCounter = signal(0);
  readonly resubscribe = this._resubscribeCounter.asReadonly();
  connectingEvent: boolean = false
  connectingJob: boolean = false

  constructor(private accounts: AccountsService) {}

  connectEvent(): WebSocketSubject<any> {
    this.connectingEvent = true
    this.baseUrl = this.accounts.curtainAPI.baseURL.replace("http", "ws")
    const url = this.baseUrl + "ws/curtain/" + this.sessionID + "/" + this.personalID + "/"
    if (!this.eventConnection) {
      this.eventConnection = webSocket({
        url,
        closeObserver: {
          next: () => {
            this.eventConnection = undefined
            setTimeout(() => this.reconnect(), 3000)
          }
        }
      })
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
    const url = this.baseUrl + "ws/job/" + this.sessionID + "/" + this.personalID + "/"
    if (!this.jobConnection) {
      this.jobConnection = webSocket({
        url,
        closeObserver: {
          next: () => {
            this.jobConnection = undefined
          }
        }
      })
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
      this._resubscribeCounter.update(v => v + 1)
    }
  }

  getEventMessages(): Observable<any> | undefined {
    return this.eventConnection?.asObservable()
  }

  getJobMessages(): Observable<any> | undefined {
    return this.jobConnection?.asObservable()
  }
}
