import { Injectable } from '@angular/core';
import {AccountsService} from "./accounts/accounts.service";
import {Observable, Observer, Subject} from "rxjs";
import {WebSocketSubject} from "rxjs/internal/observable/dom/WebSocketSubject";
import * as readableIDs from "uuid-readable";


@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  baseUrl = ""
  private connection: WebSocketSubject<any>|undefined
  sessionID: string = readableIDs.short(crypto.randomUUID()).replace(/\s/g, "")
  personalID: string = readableIDs.short(crypto.randomUUID()).replace(/\s/g, "")
  displayName: string = "Anonymous"
  reSubscribeSubject: Subject<boolean> = new Subject<boolean>()
  constructor(private accounts: AccountsService) {
    this.baseUrl = this.accounts.curtainAPI.baseURL.replace("http", "ws")
    this.connection = this.connect()
  }

  connect(): WebSocketSubject<any> {
    const url = this.baseUrl + "ws/curtain/"+ this.sessionID + "/" +this.personalID+ "/"
    if (!this.connection) {
      this.connection = new WebSocketSubject(url)
      return this.connection
    } else {
      return this.connection
    }
  }

  send(message: any) {
    this.connection?.next(message)
  }

  close() {
    this.connection?.complete()
    this.connection = undefined
  }

  reconnect() {
    this.close()
    this.connection = this.connect()
    if (this.connection) {
      this.reSubscribeSubject.next(true)
    }

    console.log("reconnected to " + this.sessionID)
  }

  getMessages(): Observable<any>|undefined {

    return this.connection?.asObservable()
  }
}
