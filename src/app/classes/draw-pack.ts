import {DataFrame, IDataFrame} from "data-forge";

export class DrawPack {
  df: IDataFrame = new DataFrame()
  pCutOff: number = 0.00001
  logFCCutoff: number = 2
}
