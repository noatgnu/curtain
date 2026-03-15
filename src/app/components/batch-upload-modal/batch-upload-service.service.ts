import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class BatchUploadServiceService {
  readonly taskStartIndex = signal(-1);
  readonly taskStart$ = toObservable(this.taskStartIndex);

  readonly resetCounter = signal(0);
  readonly reset$ = toObservable(this.resetCounter);

  triggerTaskStart(index: number): void {
    this.taskStartIndex.set(index);
  }

  triggerReset(): void {
    this.resetCounter.update(v => v + 1);
  }
}
