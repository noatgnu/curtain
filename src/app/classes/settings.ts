import {Project} from "./project";

export class Settings {
  fetchUniprot: boolean = true
  inputDataCols: any = {}
  probabilityFilterMap: any = {}
  barchartColorMap: any = {}
  pCutoff: number = 0.05
  log2FCCutoff: number = 0.6
  description: string = ""
  uniprot: boolean = true
  colorMap: any = {}
  academic: boolean = true
  backGroundColorGrey: boolean = false
  currentComparison: string = ""
  version: number = 2
  currentID: string = ""
  fdrCurveText: string = ""
  fdrCurveTextEnable: boolean = false
  prideAccession: string = ""
  project: Project = new Project()
  sampleOrder: any = {}
  sampleVisible: any = {}
  conditionOrder: string[] = []
  volcanoAxis: any = {minX: null, maxX: null, minY: null, maxY: null}
  textAnnotation: any = {}
  volcanoPlotTitle: string = ""
  visible: any = {}
  defaultColorList: string[] = [
    "#fd7f6f",
    "#7eb0d5",
    "#b2e061",
    "#bd7ebe",
    "#ffb55a",
    "#ffee65",
    "#beb9db",
    "#fdcce5",
    "#8bd3c7",
  ]
  scatterPlotMarkerSize: number = 5
  rankPlotColorMap: any = {}
  rankPlotAnnotation: any = {}
  legendStatus: any = {}

}
