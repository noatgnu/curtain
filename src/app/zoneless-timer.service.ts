import {ApplicationRef, inject, Injectable} from '@angular/core';

/**
 * Service providing zoneless-compatible timer utilities.
 * Automatically triggers change detection after timer callbacks execute.
 */
@Injectable({
  providedIn: 'root',
})
export class ZonelessTimerService {
  private appRef = inject(ApplicationRef);

  /**
   * Zoneless-compatible setTimeout that triggers change detection after callback execution.
   * @param callback Function to execute after delay
   * @param delay Delay in milliseconds
   * @returns Timer ID for use with clearTimeout
   */
  setTimeout(callback: () => void, delay: number): number {
    return window.setTimeout(() => {
      callback();
      this.appRef.tick();
    }, delay);
  }

  /**
   * Zoneless-compatible setInterval that triggers change detection after each callback execution.
   * @param callback Function to execute at each interval
   * @param interval Interval in milliseconds
   * @returns Timer ID for use with clearInterval
   */
  setInterval(callback: () => void, interval: number): number {
    return window.setInterval(() => {
      callback();
      this.appRef.tick();
    }, interval);
  }

  /**
   * Clears a timeout created by this service.
   * @param timeoutId Timer ID returned by setTimeout
   */
  clearTimeout(timeoutId: number): void {
    window.clearTimeout(timeoutId);
  }

  /**
   * Clears an interval created by this service.
   * @param intervalId Timer ID returned by setInterval
   */
  clearInterval(intervalId: number): void {
    window.clearInterval(intervalId);
  }
}
