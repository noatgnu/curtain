import {GraphData} from "./graph-data";

export class Settings {
  rawFile: string = ""
  processedFile: string = ""
  selectedIDs: any = {}
  annotatedIDs: any[] = []
  uniprot: boolean = false
  dbString: boolean = false
  antilogP: boolean = false
  sampleLables: any = {}
  dataColumns: GraphData = new GraphData()
}
