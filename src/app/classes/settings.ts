import {GraphData} from "./graph-data";

export class Settings {
  rawFile: string = ""
  processedFile: string = ""
  selectedIDs: any = {}
  annotatedIDs: any[] = []
  uniprot: boolean = false
  dbString: boolean = false
  antilogP: boolean = false
  fileSavedOnSever: boolean = false
  sampleLables: any = {}
  fileIsLink: boolean = false
  description: string = ""
  dataColumns: GraphData = new GraphData()
}
