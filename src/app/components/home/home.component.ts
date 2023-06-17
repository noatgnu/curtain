import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {DataService} from "../../data.service";
import {selectionData} from "../protein-selections/protein-selections.component";
import {DataFrame, fromCSV, IDataFrame} from "data-forge";
import {Settings} from "../../classes/settings";
import {SettingsService} from "../../settings.service";
import {WebService} from "../../web.service";
import {InputFile} from "../../classes/input-file";
import {Differential} from "../../classes/differential";
import {Raw} from "../../classes/raw";
import {UniprotService} from "../../uniprot.service";
import {ScrollService} from "../../scroll.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ProfileCompareComponent} from "../profile-compare/profile-compare.component";
import {CorrelationMatrixComponent} from "../correlation-matrix/correlation-matrix.component";
import {ToastService} from "../../toast.service";
import {CitationComponent} from "../citation/citation.component";
import {SampleAnnotationComponent} from "../sample-annotation/sample-annotation.component";
import {Project} from "../../classes/project";
import {SampleOrderAndHideComponent} from "../sample-order-and-hide/sample-order-and-hide.component";
import {LoginModalComponent} from "../../accounts/login-modal/login-modal.component";
import {AccountsService} from "../../accounts/accounts.service";
import {SessionSettingsComponent} from "../session-settings/session-settings.component";
import {AccountsComponent} from "../../accounts/accounts/accounts.component";
import {reviver, User} from "curtain-web-api";
import {DefaultColorPaletteComponent} from "../default-color-palette/default-color-palette.component";
import {DataSelectionManagementComponent} from "../data-selection-management/data-selection-management.component";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  finished: boolean = false
  rawFiltered: IDataFrame = new DataFrame()
  uniqueLink: string = ""
  filterModel: string = ""
  currentID: string = ""

  constructor(public accounts: AccountsService, private toast: ToastService, private modal: NgbModal, private route: ActivatedRoute, public data: DataService, private settings: SettingsService, public web: WebService, private uniprot: UniprotService, private scroll: ScrollService) {
    // if (location.protocol === "https:" && location.hostname === "curtainptm.proteo.info") {
    //   this.toast.show("Initialization", "Error: The webpage requires the url protocol to be http instead of https")
    // }
    this.initialize().then(
      () => {
        this.route.params.subscribe(params => {
          console.log(params)
          if (params) {
            if (params["settings"] && params["settings"].startsWith("access_token")){
              console.log(params["settings"])
            } else if (params["settings"] && params["settings"].length > 0) {
              console.log(params["settings"])
              const settings = params["settings"].split("&")
              let token: string = ""
              if (settings.length > 1) {
                token = settings[1]
                this.data.tempLink = true
              } else {
                this.data.tempLink = false
              }
              this.toast.show("Initialization", "Fetching data from session " + settings[0]).then()
              if (this.currentID !== settings[0]) {
                this.currentID = settings[0]
                this.accounts.curtainAPI.getSessionSettings(settings[0]).then((d:any)=> {
                  this.data.session = d.data
                  this.accounts.curtainAPI.postSettings(settings[0], token).then((data:any) => {
                    if (data.data) {
                      this.restoreSettings(data.data).then(result => {
                        this.accounts.curtainAPI.getSessionSettings(settings[0]).then((d:any)=> {
                          this.data.session = d.data
                          this.settings.settings.currentID = d.data.link_id
                        })
                      })
                      this.accounts.curtainAPI.getOwnership(settings[0]).then((data:any) => {
                        if (data.ownership) {
                          this.accounts.isOwner = true
                        } else {
                          this.accounts.isOwner = false
                        }
                      }).catch(error => {
                        this.accounts.isOwner = false
                      })
                    }
                  }).catch(error => {
                    if (error.status === 400) {
                      this.toast.show("Credential Error", "Login Information Required").then()
                      const login = this.openLoginModal()
                      login.componentInstance.loginStatus.asObservable().subscribe((data:boolean) => {
                        if (data) {
                          location.reload()
                        }
                      })
                    }
                  })
                })
              }
            }
          }
        })
      }
    )


  }

  async initialize() {
    await this.accounts.curtainAPI.getSiteProperties()
    await this.accounts.curtainAPI.user.loadFromDB()
  }


  ngOnInit(): void {

  }

  handleFinish(e: boolean) {
    this.finished = e
    if (this.finished) {
      if (this.data.selected.length > 0) {
        this.data.finishedProcessingData.next(e)
        this.rawFiltered = this.data.raw.df.where(r => this.data.selected.includes(r[this.data.rawForm.primaryIDs])).bake()
        console.log(this.rawFiltered)
        for (const s of this.rawFiltered) {
          this.addGeneToSelected(s).then();
        }
      }
    }
  }

  private async addGeneToSelected(s: any) {
    let uni: any = {}
    if (typeof s === "string") {
      uni = this.uniprot.getUniprotFromPrimary(s)
    } else {
      uni = this.uniprot.getUniprotFromPrimary(s[this.data.rawForm.primaryIDs])
    }

    if (uni) {
      if (uni["Gene Names"] !== "") {
        if (!this.data.selectedGenes.includes(uni["Gene Names"])) {
          this.data.selectedGenes.push(uni["Gene Names"])
        }
      }
    }
  }

  handleSearch(e: selectionData) {
    console.log(e)
    const rawFiltered = this.data.raw.df.where(r => e.data.includes(r[this.data.rawForm.primaryIDs])).bake()
    this.data.selected = this.data.selected.concat(e.data)
    for (const c of this.data.differentialForm.comparisonSelect) {
      let title = e.title + " (" + c + ")"
      if (e.title.endsWith(" (" + c + ")")) {
        title = e.title
      }

      if (!this.data.selectOperationNames.includes(title)) {
        this.data.selectOperationNames.push(title)
      }
      for (const s of e.data) {
        if (!this.data.selectedMap[s]) {
          this.data.selectedMap[s] = {}
        }
        this.addGeneToSelected(s);
        this.data.selectedMap[s][title] = true
      }
    }

    this.rawFiltered = DataFrame.concat([rawFiltered, this.rawFiltered])
    this.data.selectionUpdateTrigger.next(true)
  }

  scrollTo() {
    let primaryIDs = ""
    switch (this.data.searchType) {
      case "Gene Names":
        const res = this.data.getPrimaryIDsFromGeneNames(this.filterModel)
        if (res.length > 0) {
          primaryIDs = res[0]
        }
        break
      case "Primary IDs":
        primaryIDs = this.filterModel
        break
    }
    //const ind = this.data.selected.sort().indexOf(primaryIDs)
    const f = this.rawFiltered.toArray().findIndex(r=> r[this.data.rawForm.primaryIDs] === primaryIDs)

    const newPage = Math.floor((f + 1)/ this.data.pageSize) + 1
    if (this.data.page !== newPage) {
      this.data.page = newPage
    }
    this.scroll.scrollToID(primaryIDs+"scrollID")
  }

  saveSession() {
    if (!this.accounts.curtainAPI.user.loginStatus) {
      if (this.web.siteProperties.non_user_post) {
        this.saving();
      } else {
        this.toast.show("User information", "Please login before saving data session").then()
      }
    } else {
      if (!this.accounts.curtainAPI.user.curtainLinkLimitExceeded ) {
        this.saving();
      } else {
        this.toast.show("User information", "Curtain link limit exceed").then()
      }
    }
  }

  private saving() {
    const data: any = {
      raw: this.data.raw.originalFile,
      rawForm: this.data.rawForm,
      differentialForm: this.data.differentialForm,
      processed: this.data.differential.originalFile,
      password: "",
      selections: this.data.selected,
      selectionsMap: this.data.selectedMap,
      selectionsName: this.data.selectOperationNames,
      settings: this.settings.settings,
      fetchUniprot: this.data.fetchUniprot,
      annotatedData: this.data.annotatedData
    }
    this.accounts.curtainAPI.putSettings(data, !this.accounts.curtainAPI.user.loginStatus, data.settings.description).then((data: any) => {
      if (data.data) {
        this.data.session = data.data
        this.settings.settings.currentID = data.data.link_id
        this.uniqueLink = location.origin + "/#/" + this.settings.settings.currentID
      }
    }).catch(err => {
      this.toast.show("User information", "Curtain link cannot be saved").then()
    })
  }

  async restoreSettings(object: any) {
    console.log(object)
    if (typeof object.settings === "string") {
      object.settings = JSON.parse(object.settings)
    }
    console.log(object.settings)
    if (!object.settings.project) {
      object.settings.project = new Project()
    }
    if (!object.settings.scatterPlotMarkerSize) {
      object.settings.scatterPlotMarkerSize = 10
    }
    if (!object.settings.defaultColorList) {
      object.settings.defaultColorList = this.data.palette["pastel"]
    }
    if (!object.settings.prideAccession) {
      object.settings.prideAccession = ""
    }

    if (!object.settings.volcanoPlotTitle) {
      object.settings.volcanoPlotTitle = ""
    }

    if (!object.settings.textAnnotation) {
      object.settings.textAnnotation = {}
    }
    if (!object.settings.barchartColorMap) {
      object.settings.barchartColorMap = {}
    }
    if (!object.settings.volcanoAxis) {
      object.settings.volcanoAxis = {minX: null, maxX: null, minY: null, maxY: null}
    }
    if (!object.settings.sampleOrder) {
      object.settings.sampleOrder = {}
    }
    if (!object.settings.sampleVisible) {
      object.settings.sampleVisible = {}
    }
    if (!object.settings.conditionOrder) {
      object.settings.conditionOrder = []
    }
    if (object.settings.version) {
      if (object.settings.version === 2) {
        this.data.selected = object.selections
        this.data.selectedMap = object.selectionsMap
        this.data.selectOperationNames = object.selectionsName
        this.data.differentialForm = new Differential()
        if (typeof object.differentialForm._comparisonSelect === "string") {
          object.differentialForm._comparisonSelect = [object.differentialForm._comparisonSelect]
        }
        this.data.differentialForm.restore(object.differentialForm)

        this.data.rawForm = new Raw()
        this.data.rawForm.restore(object.rawForm)
        this.data.fetchUniprot = object.fetchUniprot
        if (object.annotatedData) {
          this.data.annotatedData = object.annotatedData
        }
      }
    } else {
      this.data.fetchUniprot = object.settings.uniprot
      if (!object.settings.colormap) {
        object.settings["colormap"] = {}
      }
      if (!object.settings.pCutoff){
        object.settings["pCutoff"] = 0.05
      }
      if (!object.settings.logFCCutoff){
        object.settings["log2FCCutoff"] = 0.6
      }
      if (object.settings.dataColumns) {
        this.data.rawForm = new Raw()
        this.data.rawForm.samples = object.settings.dataColumns["rawSamplesCol"]
        this.data.rawForm.primaryIDs = object.settings.dataColumns["rawIdentifierCol"]
        this.data.differentialForm = new Differential()
        this.data.differentialForm.primaryIDs = object.settings.dataColumns["processedIdentifierCol"]
        this.data.differentialForm.significant = object.settings.dataColumns["processedPValue"]
        this.data.differentialForm.foldChange = object.settings.dataColumns["processedLog2FC"]
        this.data.differentialForm.comparison = object.settings.dataColumns["processedCompLabel"]
        if (typeof object.settings.dataColumns["comparison"] === "string") {
          object.settings.dataColumns["comparison"] = [object.settings.dataColumns["comparison"]]
        }
        this.data.differentialForm.comparisonSelect = object.settings.dataColumns["comparison"]

        if (object.settings.antilogP) {
          this.data.differentialForm.transformSignificant = false
        } else {
          this.data.differentialForm.transformSignificant = true
        }
      }
      if (object.selections) {

        for (const s in object.selections) {
          if (!this.data.selectOperationNames.includes(s)) {
            this.data.selectOperationNames.push(s)
          }
          for (const i of object.selections[s]) {
            this.data.selected.push(i)
            if (!this.data.selectedMap[i]) {
              this.data.selectedMap[i] = {}
            }
            this.data.selectedMap[i][s] = true
          }
        }
      }
    }
    if (/\t/.test(object.raw)) {
      // @ts-ignore
      this.data.raw = new InputFile(fromCSV(object.raw, {delimiter: "\t"}), "rawFile.txt", object.raw)
    } else {
      // @ts-ignore
      this.data.raw = new InputFile(fromCSV(object.raw), "rawFile.txt", object.raw)
    }
    if (/\t/.test(object.processed)) {
      // @ts-ignore
      this.data.differential = new InputFile(fromCSV(object.processed, {delimiter: "\t"}), "processedFile.txt", object.processed)
    } else {
      this.data.differential = new InputFile(fromCSV(object.processed), "processedFile.txt", object.processed)
    }
    object.settings.version = 2
    console.log(object.settings.barchartColorMap)
    for (const i in object.settings) {
      // @ts-ignore
      this.settings.settings[i] = object.settings[i]
    }
    this.data.restoreTrigger.next(true)
    console.log(this.settings.settings.barchartColorMap)
  }

  clearSelections() {
    this.data.selected = []
    this.data.selectedGenes = []
    this.data.selectedMap = {}
    this.data.selectOperationNames = []
    this.settings.settings.colorMap = {}
    this.settings.settings.textAnnotation = {}
    this.rawFiltered = new DataFrame()
    this.data.annotatedData = {}
    this.data.selectionUpdateTrigger.next(true)
  }

  openProfileCompare() {
    const ref = this.modal.open(ProfileCompareComponent, {size: "xl"})
    ref.componentInstance.selected = this.data.selectedComparison
    ref.componentInstance.data = this.data.raw.df
  }

  openCorrelationMatrix() {
    this.modal.open(CorrelationMatrixComponent, {size: "xl"})
  }

  openResourceCitation() {
    this.modal.open(CitationComponent)
  }

  openAnnotation() {
    const ref = this.modal.open(SampleAnnotationComponent, {size: "lg"})
    ref.closed.subscribe(data => {
      this.settings.settings.project = data
    })
  }

  getSelectedList() {
    this.web.downloadFile("SelectedPrimaryIDs.txt", this.data.selected.join("\n"))
    this.web.downloadFile("SelectedGenes.txt", this.data.selectedGenes.join("\n"))
  }

  openSampleSettings() {
    const ref = this.modal.open(SampleOrderAndHideComponent)

  }

  openLoginModal() {
    const ref = this.modal.open(LoginModalComponent)
    return ref
  }

  openSessionSettings() {
    const ref = this.modal.open(SessionSettingsComponent)
    console.log(this.settings.settings.currentID)
    ref.componentInstance.currentID = this.settings.settings.currentID
  }

  openAccountModal() {
    const ref = this.modal.open(AccountsComponent, {size:"xl"})
  }

  downloadAll() {
    const pageNumber = Math.ceil(this.rawFiltered.count()/this.data.pageSize)
    for (let i = 1; i <= pageNumber; i++) {
      this.data.page = i
      this.data.externalBarChartDownloadTrigger.next(true)
    }

  }

  openColorPaletteModal() {
    const ref = this.modal.open(DefaultColorPaletteComponent, {size: "xl", scrollable: true})

  }

  selectionManagementModal() {
    const ref = this.modal.open(DataSelectionManagementComponent, {scrollable: true, size: "xl"})
    ref.closed.subscribe(data => {
      if (data) {
        this.data.selectedGenes = []
        if (this.data.selected.length > 0) {
          this.handleFinish(true)
        } else {
          this.clearSelections()
        }

      }
    })
  }
}

