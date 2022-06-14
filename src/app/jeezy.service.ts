import { Injectable } from '@angular/core';

// @ts-ignore
import * as jeezy from "jeezy";

@Injectable({
  providedIn: 'root'
})
export class JeezyService {

  constructor() { }

  calculateCorrMaxtrix(data: any[], cols: string[]) {
    const result = jeezy.arr.correlationMatrix(data, cols)
    return result
  }
}
