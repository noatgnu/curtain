import {GraphData} from "./graph-data";

export class Settings {
  rawFile: string = ""
  processedFile: string = ""
  selectedIDs: any = {}
  annotatedIDs: any[] = []
  fdrCurveText: string = ""
  uniprot: boolean = false
  dbString: boolean = false
  antilogP: boolean = false
  fileSavedOnSever: boolean = false
  sampleLables: any = {}
  fileIsLink: boolean = false
  description: string = ""
  pCutOff: number = 0.00001
  logFCCutOff: number = 2
  conditionParsePattern = /^(.+)\.(\d+)$/
  selectionTitles: string[] = []
  dataColumns: GraphData = new GraphData()
}
