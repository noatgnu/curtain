import { Injectable } from '@angular/core';
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class BatchUploadServiceService {
  taskStartAnnouncer = new Subject<number>()
  resetAnnouncer = new Subject<number>()

  constructor() { }
}
