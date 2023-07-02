import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {WebsocketService} from "../../websocket.service";
import {FormBuilder} from "@angular/forms";
import {Subscription} from "rxjs";

interface Message {
  senderID: string,
  senderName: string,
  message: string,
}

@Component({
  selector: 'app-side-float-control',
  templateUrl: './side-float-control.component.html',
  styleUrls: ['./side-float-control.component.scss']
})

export class SideFloatControlComponent implements OnInit, OnDestroy {
  toggleChatPanel: boolean = false
  messagesList: Message[] = []
  form = this.fb.group({
    message: ['']
  })
  @ViewChild("chatbox") chatbox: ElementRef|undefined
  webSub: Subscription | undefined
  constructor(private ws: WebsocketService, private fb: FormBuilder) {
    if (this.webSub) {
      this.webSub.unsubscribe()
      this.setSubscription();
    }
    this.ws.reSubscribeSubject.asObservable().subscribe((data: boolean) => {
      this.webSub?.unsubscribe()
      this.setSubscription();
    })
    //this.ws.send({message:  "hello", senderName: this.ws.displayName})
  }

  private setSubscription() {
    this.webSub = this.ws.getMessages()?.subscribe((data: any) => {
      this.messagesList.push(data)
      this.chatbox?.nativeElement.scrollTo(0, this.chatbox.nativeElement.scrollHeight)
    }, (error: any) => {
      console.log(error)
    }, () => {
      console.log("complete")
    })
  }

  ngOnInit(): void {
  }

  sendMessage() {
    if (this.form.value.message !== "") {
      this.ws.send({message: this.form.value.message, senderName: this.ws.displayName, requestType: "chat"})
      this.form.reset()
    }

  }
  ngOnDestroy() {
    this.webSub?.unsubscribe()
  }

  toggleChat() {
    this.toggleChatPanel = !this.toggleChatPanel
    if (this.toggleChatPanel) {
      this.chatbox?.nativeElement.scrollTo(0, this.chatbox.nativeElement.scrollHeight)
    }
  }
}
