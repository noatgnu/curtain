import {DataFrame, IDataFrame} from "data-forge";

export class GraphData {
  raw: IDataFrame = new DataFrame()
  processed: IDataFrame = new DataFrame()
  rawIdentifierCol: string = ""
  rawSamplesCol: string[] = []
  processedIdentifierCol: string = ""
  processedLog2FC: string = ""
  processedPValue: string = ""
  processedCompLabel: string = ""
  uniprotMap: Map<string, any> = new Map<string, any>()
}
