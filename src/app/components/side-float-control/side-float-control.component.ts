import {Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {WebsocketService} from "../../websocket.service";
import {FormBuilder} from "@angular/forms";
import {Subscription} from "rxjs";
import {DataService} from "../../data.service";

interface Message {
  senderID: string,
  senderName: string,
  message: any,
  requestType: string
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
  @Output() searchChatSelection: EventEmitter<any> = new EventEmitter()
  webSub: Subscription | undefined
  constructor(private ws: WebsocketService, private fb: FormBuilder, private data: DataService) {
    this.ws.connection = this.ws.connect()
    if (this.webSub) {
      this.webSub.unsubscribe()
    }
    this.setSubscription();
    this.ws.reSubscribeSubject.asObservable().subscribe((data: boolean) => {
      if (data) {
        this.webSub?.unsubscribe()
        this.setSubscription();
      }
    })
  }

  private setSubscription() {
    console.log("set subscription")
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
    this.ws.close()
  }

  toggleChat() {
    this.toggleChatPanel = !this.toggleChatPanel
    if (this.toggleChatPanel) {
      this.chatbox?.nativeElement.scrollTo(0, this.chatbox.nativeElement.scrollHeight)
    }
  }

  handleDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();
    const selection = JSON.parse(event.dataTransfer.getData("text/plain"));
    if (selection.type === "selection-group") {
      const data: string[] = []
      for (const primaryID in this.data.selectedMap) {
        if (this.data.selectedMap[primaryID][selection.title] !== undefined) {
          data.push(primaryID)
        }
      }
      if (data.length > 0) {
        this.ws.send({message: {title:selection.title, data: data}, senderName: this.ws.displayName, requestType: "chat-selection-group"})
      }
    }

  }

  handleDragOver(event: any) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  }

  searchChatSelectionGroup(event: any) {
    this.searchChatSelection.emit({title:event.title, data: event.data})
    console.log(event)
  }
}
