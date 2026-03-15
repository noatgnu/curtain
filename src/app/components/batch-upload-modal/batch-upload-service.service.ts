import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BatchUploadServiceService {
  private readonly _taskStartIndex = signal(-1);
  readonly taskStartIndex = this._taskStartIndex.asReadonly();

  private readonly _resetCounter = signal(0);
  readonly resetCounter = this._resetCounter.asReadonly();

  triggerTaskStart(index: number): void {
    this._taskStartIndex.set(index);
  }

  triggerReset(): void {
    this._resetCounter.update(v => v + 1);
  }
}
