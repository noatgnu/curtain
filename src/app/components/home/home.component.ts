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
import {
  reviver,
  replacer,
  User,
  saveToLocalStorage,
  CurtainEncryption,
  base64ToArrayBuffer,
  arrayBufferToBase64String
} from "curtain-web-api";
import {DefaultColorPaletteComponent} from "../default-color-palette/default-color-palette.component";
import {DataSelectionManagementComponent} from "../data-selection-management/data-selection-management.component";
import {QrcodeModalComponent} from "../qrcode-modal/qrcode-modal.component";
import {WebsocketService} from "../../websocket.service";
import {CollaborateModalComponent} from "../collaborate-modal/collaborate-modal.component";
import {
  SelectedDataDistributionPlotComponent
} from "../selected-data-distribution-plot/selected-data-distribution-plot.component";
import {SaveStateService} from "../../save-state.service";
import {LocalSessionStateModalComponent} from "../local-session-state-modal/local-session-state-modal.component";
import {Subscription} from "rxjs";
import {EnrichrModalComponent} from "../enrichr-modal/enrichr-modal.component";
import {
  SampleConditionAssignmentModalComponent
} from "../sample-condition-assignment-modal/sample-condition-assignment-modal.component";
import {
  ComparisonAgainstOtherPromptComponent
} from "../comparison-against-other-prompt/comparison-against-other-prompt.component";
import {
  SessionComparisonResultViewerModalComponent
} from "../session-comparison-result-viewer-modal/session-comparison-result-viewer-modal.component";
import {EncryptionSettingsComponent} from "../encryption-settings/encryption-settings.component";
import {encryptDataRSA} from "curtain-web-api/src/classes/curtain-encryption";
import {
  decryptAESData,
  decryptAESKey, encryptAESData, encryptAESKey, exportAESKey,
  generateAESKey,
  importAESKey
} from "curtain-web-api/build/classes/curtain-encryption";
import {PrimaryIdExportModalComponent} from "../primary-id-export-modal/primary-id-export-modal.component";
import {animate, style, transition, trigger} from "@angular/animations";
import {ApiKeyModalComponent} from "../api-key-modal/api-key-modal.component";
import {AreYouSureClearModalComponent} from "../are-you-sure-clear-modal/are-you-sure-clear-modal.component";
import {DataCiteCurtain, DataCiteMetadata} from "../../data-cite-metadata";
import {
  LoadPeptideCountDataModalComponent
} from "../load-peptide-count-data-modal/load-peptide-count-data-modal.component";
import {DataciteComponent} from "../datacite/datacite.component";
import {DataciteAdminManagementComponent} from "../datacite-admin-management/datacite-admin-management.component";
import {BatchUploadModalComponent} from "../batch-upload-modal/batch-upload-modal.component";
import {LogFileModalComponent} from "../log-file-modal/log-file-modal.component";
import {
  AddRawDataImputationMapModalComponent
} from "../add-raw-data-imputation-map-modal/add-raw-data-imputation-map-modal.component";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})
export class HomeComponent implements OnInit {
  showAlert: boolean = true;
  animate: boolean = false
  isDOI: boolean = false
  doiMetadata: DataCiteMetadata|undefined = undefined
  canAccessSettings: boolean = false
  isRankPlotCollapse: boolean = true
  GDPR: boolean = false
  loadingDataCite: boolean = false
  _finished: boolean = false
  set finished(value: boolean) {
    this._finished = value
  }
  get finished(): boolean {
    return this._finished
  }
  permanent: boolean = false
  rawFiltered: IDataFrame = new DataFrame()
  uniqueLink: string = ""
  filterModel: string = ""
  currentID: string = ""
  subscription: Subscription = new Subscription()
  progressEvent: any = {}
  constructor(private saveState: SaveStateService, private ws: WebsocketService, public accounts: AccountsService, private toast: ToastService, private modal: NgbModal, private route: ActivatedRoute, public data: DataService, public settings: SettingsService, public web: WebService, private uniprot: UniprotService, private scroll: ScrollService) {
    // if (location.protocol === "https:" && location.hostname === "curtainptm.proteo.info") {
    //   this.toast.show("Initialization", "Error: The webpage requires the url protocol to be http instead of https")
    // }
    if (localStorage.getItem("CurtainGDPR") === "true") {
      this.GDPR = true
      this.gdprAccepted = true
    } else {
      this.GDPR = false
      this.gdprAccepted = false
    }

    this.data.clearWatcher.asObservable().subscribe(data => {
      if (data) {
        this.rawFiltered = new DataFrame()
        this.data.selectionUpdateTrigger.next(true)
      }
    })

    this.initialize().then(
      () => {
        this.route.params.subscribe(params => {
          this.isDOI = false
          this.loadingDataCite = false
          this.accounts.isOwner = false
          console.log(params)
          if (params) {
            if (params["settings"] && params["settings"].startsWith("access_token")){
              console.log(params["settings"])
            } else if (params["settings"] && params["settings"].length > 0) {
              if (params["settings"].startsWith("doi.org/")) {
                this.isDOI = true
                this.loadingDataCite = true
                this.toast.show("Initialization", "Fetching data from DOI").then()
                const meta = document.createElement("meta");
                meta.name = "DC.identifier";
                meta.content = params["settings"];
                meta.scheme = "DCTERMS.URI";
                document.head.appendChild(meta);
                const doiID = params["settings"].replace("doi.org/", "")
                console.log(doiID)
                this.web.getDataCiteMetaData(doiID).subscribe((data) => {
                  console.log(data)
                  this.loadingDataCite = false
                  this.doiMetadata = data
                  if (data.data.attributes.alternateIdentifiers.length > 0) {
                    this.getDOISessionData(data.data.attributes.alternateIdentifiers[0]["alternateIdentifier"], params["settings"]).then()
                  }

                })

                return
              } else {
                this.isDOI = false
              }
              console.log(params["settings"])
              console.log(params["settings"])
              const settings = params["settings"].split("&")
              let token: string = ""
              if (settings.length > 1) {
                if (settings[1] !== "") {
                  token = settings[1]
                  this.data.tempLink = true
                } else {
                  this.data.tempLink = false
                }

                if (settings.length > 2 && settings[2] !== "") {
                  //this.ws.close()
                  this.ws.sessionID = settings[2]
                  //this.ws.reconnect()
                }
              }

              this.toast.show("Initialization", "Fetching data from session " + settings[0]).then()
              if (this.currentID !== settings[0]) {
                this.currentID = settings[0]
                this.getSessionData(settings[0], token).then()

              }
            }
          }
        })
      }
    )


  }

  async getDOISessionData(url: string, doiLink: string) {
    this.toast.show("Initialization", "Downloading data from DOI link", undefined, undefined, "download").then()
    try {
      const data =  await this.accounts.curtainAPI.postSettings("", "", this.onDownloadProgress, url)
      if (data.data) {
        this.restoreSettings(data.data).then(() => {
          this.uniqueLink = location.origin + "/#/" + encodeURIComponent(doiLink)
          this.settings.settings.currentID = doiLink
          this.permanent = true
          if (this.data.session) {
            this.data.session.permanent = true
          }
          this.data.restoreTrigger.next(true)
        })
      }
    } catch (e) {
      console.log(e)
      this.toast.show("Initialization", "Error: DOI link is not valid").then()
      this.data.downloadProgress.next(100)
    }

  }

  async getSessionData(id: string, token: string = "") {
    const d = await this.accounts.curtainAPI.getSessionSettings(id)
    this.data.session = d.data
    if (this.data.session) {
      if (this.data.session.permanent) {
        this.permanent = true
      }
    }
    try {
      const ownership = await this.accounts.curtainAPI.getOwnership(id)
      if (ownership.data.ownership) {
        this.accounts.isOwner = true
      } else {
        this.accounts.isOwner = false
      }
      if (this.accounts.isOwner) {
        this.canAccessSettings = true
      }
    } catch (e) {
      this.accounts.isOwner = false
    }
    this.toast.show("Initialization", "Downloading data from session " + id, undefined, undefined, "download").then()
    try {
      const data = await this.accounts.curtainAPI.postSettings(id, token, this.onDownloadProgress)
      if (data.data) {
        console.log(d.data)
        if (d.data.encrypted) {
          const encryption = await this.accounts.curtainAPI.getEncryptionFactors(id)
          if (this.data.private_key) {
            this.toast.show("Encryption", "Decrypting data using private key").then()
            const decryptedKey = await decryptAESKey(this.data.private_key, base64ToArrayBuffer(encryption.data.encryption_key))
            const decryptedIV = await decryptAESKey(this.data.private_key, base64ToArrayBuffer(encryption.data.encryption_iv))
            data.data = await decryptAESData(await importAESKey(decryptedKey), data.data, arrayBufferToBase64String(decryptedIV))
            this.restoreSettings(data.data).then(result => {
              this.accounts.curtainAPI.getSessionSettings(id).then((d:any)=> {
                this.data.session = d.data
                this.settings.settings.currentID = d.data.link_id
                this.uniqueLink = location.origin + "/#/" + this.settings.settings.currentID
                this.data.restoreTrigger.next(true)
              })
            })
            this.toast.show("Encryption", "Data decrypted").then()
          } else {
            this.toast.show("Encryption", "Data is encrypted but no private key has been supplied").then()
            const ref = this.modal.open(EncryptionSettingsComponent, {scrollable: true})
            ref.componentInstance.enabled = this.settings.settings.encrypted
            ref.closed.subscribe(async (keyData: any) => {
              if (keyData.savePublicKey && keyData.public_key) {
                saveToLocalStorage(keyData.public_key, "public").then()
              }
              if (keyData.savePrivateKey && keyData.private_key) {
                saveToLocalStorage(keyData.private_key, "private").then()
              }
              this.settings.settings.encrypted = keyData.enabled
              if (keyData.public_key) {
                this.data.public_key = keyData.public_key
              }
              if (keyData.private_key) {
                this.data.private_key = keyData.private_key
                this.toast.show("Encryption", "Decrypting data using private key").then()
                const decryptedKey = await decryptAESKey(keyData.private_key, base64ToArrayBuffer(encryption.data.encryption_key))
                const decryptedIV = await decryptAESKey(keyData.private_key, base64ToArrayBuffer(encryption.data.encryption_iv))
                data.data = await decryptAESData(await importAESKey(decryptedKey), data.data, arrayBufferToBase64String(decryptedIV))
                this.restoreSettings(data.data).then(result => {
                  this.accounts.curtainAPI.getSessionSettings(id).then((d:any)=> {
                    this.data.session = d.data
                    this.settings.settings.currentID = d.data.link_id
                    this.uniqueLink = location.origin + "/#/" + this.settings.settings.currentID
                    this.data.restoreTrigger.next(true)
                  })
                })
              }

            })
          }
        } else {
          this.restoreSettings(data.data).then(result => {
            console.log(data.data)
            this.accounts.curtainAPI.getSessionSettings(id).then((d:any)=> {
              this.data.session = d.data
              this.settings.settings.currentID = d.data.link_id
              this.uniqueLink = location.origin + "/#/" + this.settings.settings.currentID
              this.data.restoreTrigger.next(true)
            })
          })
        }
      }
    } catch (error: any) {
      console.log(error)
      this.data.downloadProgress.next(100)
      if (error.status === 400) {
        this.toast.show("Credential Error", "Login Information Required").then()
        const login = this.openLoginModal()
        login.componentInstance.loginStatus.asObservable().subscribe((data:boolean) => {
          if (data) {
            location.reload()
          }
        })

      }
    }
  }
  async initialize() {
    await this.data.getKey()
    console.log(this.data.public_key)
    await this.accounts.curtainAPI.getSiteProperties()
    await this.accounts.curtainAPI.user.loadFromDB()
    if (this.accounts.curtainAPI.user.loginStatus && this.accounts.curtainAPI.user.isStaff) {
      const draft = await this.accounts.curtainAPI.getDataCites(undefined, undefined, "draft", 10, 0, true, "TP")
      this.data.draftDataCiteCount = draft.data.count
    }
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    this.subscription = this.uniprot.uniprotProgressBar.asObservable().subscribe((data: any) => {
      this.progressEvent = data
    })
  }


  ngOnInit(): void {
    const currentDate = new Date();
    const hideDate = new Date(currentDate.getFullYear(), 1, 20); // February is month 1 (0-indexed)
    this.data.loadDataTrigger.asObservable().subscribe((data: boolean) => {
      if (data) {
        this.handleFinish(data)
        this.data.redrawTrigger.next(true)
        this.data.selectionUpdateTrigger.next(true)
      }
    })
  }

  handleFinish(e: boolean) {
    this.finished = e
    if (this.finished) {
      if (this.data.selected.length > 0) {
        this.data.finishedProcessingData.next(e)

        this.rawFiltered = this.data.raw.df.where(r => this.data.selected.includes(r[this.data.rawForm.primaryIDs])).bake()
        for (const s of this.rawFiltered) {
          this.addGeneToSelected(s).then();
        }
      } else {
        this.rawFiltered = new DataFrame()
        this.data.finishedProcessingData.next(e)
      }
      console.log(this.rawFiltered)
      this.finished = true
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
    console.log(rawFiltered)
    console.log(this.data.selected)
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

    if (this.rawFiltered.count() >= 1) {
      this.rawFiltered = DataFrame.concat([rawFiltered, this.rawFiltered])
    } else if (this.rawFiltered.count() === 0) {
      this.rawFiltered = rawFiltered
    }
    console.log(this.rawFiltered)
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

  saveSession(permanent: boolean = false) {
    this.toast.show("User information", "Saving session data").then()
    console.log(this.settings.settings.conditionOrder.slice())
    if (!this.accounts.curtainAPI.user.loginStatus) {
      if (this.web.siteProperties.non_user_post) {
        this.saving(permanent);
      } else {
        this.toast.show("User information", "Please login before saving data session").then()
      }
    } else {
      if (!this.accounts.curtainAPI.user.curtainLinkLimitExceeded ) {
        this.saving(permanent);
      } else {
        this.toast.show("User information", "Curtain link limit exceed").then()
      }
    }
  }

  private createPayload(permanent: boolean = false) {
    const extraData: any = {
      uniprot: {
        results: this.uniprot.results,
        dataMap: this.uniprot.dataMap,
        db: this.uniprot.db,
        organism: this.uniprot.organism,
        accMap: this.uniprot.accMap,
        geneNameToAcc: this.uniprot.geneNameToAcc
      },
      data: {
        dataMap: this.data.dataMap,
        genesMap: this.data.genesMap,
        primaryIDsmap: this.data.primaryIDsMap,
        allGenes: this.data.allGenes,
      }
    }
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
      annotatedData: this.data.annotatedData,
      extraData: extraData,
      permanent: permanent,
    }
    console.log(data.settings.conditionOrder)

    return data
  }

  private saving(permanent: boolean = false) {
    const data = this.createPayload()
    const encryption: CurtainEncryption = {
      encrypted: this.settings.settings.encrypted,
      e2e: this.settings.settings.encrypted,
      publicKey: this.data.public_key,
    }
    console.log(encryption)
    this.toast.show("User information", "Uploading session data", undefined, undefined, "upload").then()
    this.accounts.curtainAPI.putSettings(data, !this.accounts.curtainAPI.user.loginStatus, data.settings.description, "TP", encryption, permanent, this.onUploadProgress).then((data: any) => {
      if (data.data) {
        this.toast.show("User information", `Curtain link saved with unique id ${data.data.link_id}`).then()
        this.data.session = data.data
        this.settings.settings.currentID = data.data.link_id
        console.log(this.data.session)
        this.uniqueLink = location.origin + "/#/" + this.settings.settings.currentID
        this.permanent = data.data.permanent
        this.accounts.isOwner = true
        this.uniprot.uniprotProgressBar.next({value: 100, text: "Session data saved"})
      }
    }).catch(err => {
      console.log(err)
      this.data.uploadProgress.next(100)
      this.toast.show("User information", "Curtain link cannot be saved").then()

    })
  }

  onUploadProgress = (progressEvent: any) => {
    this.uniprot.uniprotProgressBar.next({value: progressEvent.progress * 100, text: "Uploading session data at " + Math.round(progressEvent.progress *100) + "%"})
    this.data.uploadProgress.next(progressEvent.progress * 100)
  }

  async restoreSettings(object: any) {

    if (typeof object === "string") {
      object = JSON.parse(object, reviver)
    }
    if (typeof object.settings === "string") {
      object.settings = JSON.parse(object.settings, reviver)
    }
    if (object.fetchUniprot) {
      if (object.extraData) {
        if (typeof object.extraData === "string") {
          object.extraData = JSON.parse(object.extraData, reviver)
        }
        console.log(object.extraData)
        if (object.extraData.uniprot) {
          this.uniprot.results = object.extraData.uniprot.results
          if (object.extraData.uniprot.dataMap instanceof Map) {
            this.uniprot.dataMap = object.extraData.uniprot.dataMap
          } else {
            this.uniprot.dataMap = new Map(object.extraData.uniprot.dataMap.value)
          }
          if (object.extraData.uniprot.accMap instanceof Map) {
            this.uniprot.accMap = object.extraData.uniprot.accMap
          } else {
            this.uniprot.accMap = new Map(object.extraData.uniprot.accMap.value)
          }
          if (object.extraData.uniprot.db instanceof Map) {
            this.uniprot.db = object.extraData.uniprot.db
          } else {
            this.uniprot.db = new Map(object.extraData.uniprot.db.value)
          }

          this.uniprot.organism = object.extraData.uniprot.organism
          if (object.extraData.uniprot.accMap instanceof Map) {
            this.uniprot.accMap = object.extraData.uniprot.accMap
          } else {
            this.uniprot.accMap = new Map(object.extraData.uniprot.accMap.value)
          }
          this.uniprot.geneNameToAcc = object.extraData.uniprot.geneNameToAcc
        }
        if (object.extraData.data) {
          if (object.extraData.data.dataMap instanceof Map) {
            this.data.dataMap = object.extraData.data.dataMap
          } else {
            this.data.dataMap = new Map(object.extraData.data.dataMap.value)
          }
          this.data.genesMap = object.extraData.data.genesMap
          this.data.primaryIDsMap = object.extraData.data.primaryIDsmap
          this.data.allGenes = object.extraData.data.allGenes
        }
        this.data.bypassUniProt = true
        console.log(this.data.dataMap)
      }
    }

    if (!object.settings.project) {
      object.settings.project = new Project()
    } else {
      const p = new Project()
      for (const key in object.settings.project) {
        if (object.settings.project.hasOwnProperty(key)) {
          // @ts-ignore
          p[key] = object.settings.project[key]
        }
      }
      object.settings.project = p
    }

    if (!object.settings.plotFontFamily) {
      object.settings.plotFontFamily = "Arial"
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
    console.log(JSON.stringify(object.settings.conditionOrder))
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
    this.settings.settings = new Settings()
    for (const i in object.settings) {
      if (i !== "currentID") {
        // @ts-ignore
        this.settings.settings[i] = object.settings[i]
      }
    }
    console.log(this.data.fetchUniprot)
  }

  clearSelections() {
    const rememberClearSettings = localStorage.getItem("curtainRememberClearSettings")
    if (rememberClearSettings === "true") {
      this.data.selected = []
      this.data.selectedGenes = []
      this.data.selectedMap = {}
      this.data.selectOperationNames = []
      this.settings.settings.rankPlotAnnotation = {}
      this.settings.settings.textAnnotation = {}
      this.data.annotatedData = {}
      this.data.clearWatcher.next(true)
    } else {
      const ref = this.modal.open(AreYouSureClearModalComponent)
      ref.closed.subscribe(data => {
        if (data) {
          this.data.selected = []
          this.data.selectedGenes = []
          this.data.selectedMap = {}
          this.data.selectOperationNames = []
          this.settings.settings.rankPlotAnnotation = {}
          this.settings.settings.textAnnotation = {}
          this.settings.settings.volcanoAdditionalShapes = []
          this.data.annotatedData = {}
          this.data.clearWatcher.next(true)
        }
      })
    }
  }


  openProfileCompare() {
    const ref = this.modal.open(ProfileCompareComponent, {size: "xl"})
    if ( this.settings.settings.selectedComparison.length > 0) {
      ref.componentInstance.selected = this.settings.settings.selectedComparison
    }

    ref.componentInstance.data = this.data.raw.df
  }

  openCorrelationMatrix() {
    this.modal.open(CorrelationMatrixComponent, {size: "xl", scrollable: true})
  }

  openResourceCitation() {
    this.modal.open(CitationComponent)
  }

  openAnnotation() {
    const ref = this.modal.open(SampleAnnotationComponent, {size: "lg", scrollable: true})
    ref.closed.subscribe(data => {
      for (const i in data) {
        // @ts-ignore
        this.settings.settings.project[i] = data[i]
      }
    })
  }

  getSelectedList() {
    //this.web.downloadFile("SelectedPrimaryIDs.txt", this.data.selected.join("\n"))
    //this.web.downloadFile("SelectedGenes.txt", this.data.selectedGenes.join("\n"))
    const ref = this.modal.open(PrimaryIdExportModalComponent, {scrollable: true})
  }

  openSampleSettings() {
    const ref = this.modal.open(SampleOrderAndHideComponent, {scrollable:true})

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

  openQRCode() {
    const ref = this.modal.open(QrcodeModalComponent, {size: "sm"})
    if (this.settings.settings.currentID) {
      ref.componentInstance.url = location.origin + "/#/" + this.settings.settings.currentID
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.toast.show("Clipboard", "Session link has been copied to clipboard").then()
    })
  }

  onDownloadProgress = (progressEvent: any) => {
    if (progressEvent.progress) {
      this.uniprot.uniprotProgressBar.next({value: progressEvent.progress *100, text: "Downloading session data at " + Math.round(progressEvent.progress * 100) + "%"})
      this.data.downloadProgress.next(progressEvent.progress*100)
    } else {
      const sizeDownloaded = (progressEvent.loaded / (1024*1024)).toFixed(2)
      this.uniprot.uniprotProgressBar.next({value: 100, text: "Downloading session data at " + sizeDownloaded + " MB"})
      this.data.downloadProgress.next(100)
    }

  }

  openCollaborateModal() {
    const ref = this.modal.open(CollaborateModalComponent)
  }

  openSelectedDataDistributionModal() {
    const ref = this.modal.open(SelectedDataDistributionPlotComponent, {size: "xl"})
  }

  saveLocalState() {
    this.saveState.saveState()
    this.toast.show("Local state", "A local settings state has been created").then()
  }

  openStateModal() {
    const ref = this.modal.open(LocalSessionStateModalComponent, {scrollable: true})
  }

  openEnrichrModal() {
    const ref = this.modal.open(EnrichrModalComponent, {scrollable: true})
    ref.closed.subscribe(data => {
      if (data) {
        for (const i in data.geneRankMap) {
          this.settings.settings.enrichrGeneRankMap[i] = data.geneRankMap[i]
        }
        this.settings.settings.enrichrRunList.push(data.library)
        this.data.finishedProcessingData.next(true)
      }
    })
  }

  closeGDPR() {
    this.GDPR = true
    //localStorage.setItem("GDPR", "true")
  }

  _gdprAccepted: boolean = false
  set gdprAccepted(value: boolean) {
    this._gdprAccepted = value
    localStorage.setItem("CurtainGDPR", value.toString())
  }

  get gdprAccepted(): boolean {
    return this._gdprAccepted
  }

  openSampleAndConditionModal() {
    const ref = this.modal.open(SampleConditionAssignmentModalComponent, {scrollable: true})
  }

  openCompareSessionModal() {
    const ref = this.modal.open(ComparisonAgainstOtherPromptComponent, {scrollable: true})
    ref.closed.subscribe(data => {
      if (data) {
        const ref2 = this.modal.open(SessionComparisonResultViewerModalComponent, {scrollable: true, size: "xl"})
        ref2.componentInstance.data = data
      }
    })
  }

  openEncryptionSettings() {

    const ref = this.modal.open(EncryptionSettingsComponent, {scrollable: true})
    ref.componentInstance.enabled = this.settings.settings.encrypted
    ref.closed.subscribe(data => {
      if (data.savePublicKey && data.public_key) {
        saveToLocalStorage(data.public_key, "public").then()
      }
      if (data.savePrivateKey && data.private_key) {
        saveToLocalStorage(data.private_key, "private").then()
      }
      this.settings.settings.encrypted = data.enabled
      if (data.public_key) {
        this.data.public_key = data.public_key
      }
      if (data.private_key) {
        this.data.private_key = data.private_key
      }

    })
  }

  async testEncryptSave() {
    const data = this.createPayload()
    const jsonstring = JSON.stringify(data, replacer)
    if (this.data.public_key) {
      //generate aes key and encrypt data then encrypt aes key and initialization vector with public key
      const aesKey = await generateAESKey()
      const encryptedData = await encryptAESData(aesKey, jsonstring)
      const encryptedKey = await encryptAESKey(this.data.public_key, await exportAESKey(aesKey))
      const encryptedIV = await encryptAESKey(this.data.public_key, base64ToArrayBuffer(encryptedData.iv))
      const payload = {
        encryptedData: encryptedData.encrypted,
        encryptedKey: arrayBufferToBase64String(encryptedKey),
        encryptedIV: arrayBufferToBase64String(encryptedIV)
      }
      //decrypt the encrypted key and iv then use the decrypted key and iv to decrypt the data and test if it is the same as the original data
      if (this.data.private_key) {
        const decryptedKey = await decryptAESKey(this.data.private_key, base64ToArrayBuffer(payload.encryptedKey))
        const decryptedIV = await decryptAESKey(this.data.private_key, base64ToArrayBuffer(payload.encryptedIV))
        const decryptedData = await decryptAESData(await importAESKey(decryptedKey), payload.encryptedData, arrayBufferToBase64String(decryptedIV))
        if (decryptedData === jsonstring) {
          this.toast.show("Test Encryption", "Encryption and decryption successful").then()
        } else {
          this.toast.show("Test Encryption", "Encryption and decryption failed").then()
        }
      }
    }
  }

  openAPIKeyModal() {
    this.modal.open(ApiKeyModalComponent, {scrollable: true})
  }

  handleDataCiteClickDownload(event: string) {
    switch (event) {
      case "different":
        this.web.downloadFile('different.txt', this.data.differential.originalFile)
        break
      case "searched":
        this.web.downloadFile('searched.txt', this.data.raw.originalFile)
        break
    }
  }

  openPeptideCountModal() {
    const ref = this.modal.open(LoadPeptideCountDataModalComponent, {scrollable: true})
    ref.closed.subscribe(data => {
      this.data.redrawTrigger.next(true)
    })
  }

  openDataciteDOI() {
    const ref = this.modal.open(DataciteComponent, {scrollable: true, size: "xl"})
    ref.componentInstance.linkID = this.settings.settings.currentID
    if (this.data.session) {
      if (this.data.session.data_cite) {
        ref.componentInstance.dataCiteMetadata = this.data.session.data_cite
        ref.componentInstance.lock = this.data.session.data_cite.lock
      }
    }

    ref.closed.subscribe((data: DataCiteCurtain) => {
      if (data) {
        //this.uniqueLink = location.origin + "/#/" + encodeURIComponent(`doi.org/${data.doi}`)
        //this.settings.settings.currentID = `doi.org/${data.doi}`
        //this.permanent = true
        //this.isDOI = true
        if (this.data.session) {
          //this.data.session.permanent = true
          this.data.session.data_cite = data
        }
      }
    })
  }

  openDataciteAdminManagement() {
    const ref = this.modal.open(DataciteAdminManagementComponent, {scrollable: true, size: "xl", backdrop: "static"})

  }

  openBatchSessionCreator() {
    const ref = this.modal.open(BatchUploadModalComponent, {scrollable: true, size: "xl", backdrop: "static"})
  }

  openLogFileModal() {
    const ref = this.modal.open(LogFileModalComponent, {scrollable: true, size: "xl", backdrop: "static"})
  }

  openAddRawDataImputationMap() {
    const ref = this.modal.open(AddRawDataImputationMapModalComponent, {scrollable: true, backdrop: "static"})
    ref.closed.subscribe((data: {form: any, data: IDataFrame<number,any>}) => {
      if (data) {
        if (data.form && data.data) {
          const result = this.data.raw.df.join(data.data, a => a[this.data.rawForm.primaryIDs], b => b[data.form.indexCol], (a, b) => {
            const v: any = {...b}
            v[this.data.rawForm.primaryIDs] = a[this.data.rawForm.primaryIDs]
            return v
          }).bake()

          result.forEach((r: any) => {
            this.settings.settings.imputationMap[r[this.data.rawForm.primaryIDs]] = {}
            for (let i = 0; i < this.data.rawForm.samples.length; i++) {
              const sampleNameB = data.form.sampleCols[i]
              const sampleNameA = this.data.rawForm.samples[i]
              if (r[sampleNameB] !== "") {
                if (r[sampleNameB] === undefined || r[sampleNameB] === null) {
                  this.settings.settings.imputationMap[r[this.data.rawForm.primaryIDs]][sampleNameA] = true
                } else {
                  try {
                    const cellB = parseFloat(r[sampleNameB])
                    if (isNaN(cellB)) {
                      this.settings.settings.imputationMap[r[this.data.rawForm.primaryIDs]][sampleNameA] = true
                    }
                  } catch (e) {
                    this.settings.settings.imputationMap[r[this.data.rawForm.primaryIDs]][sampleNameA] = true
                  }
                }
              } else {
                this.settings.settings.imputationMap[r[this.data.rawForm.primaryIDs]][sampleNameA] = true
              }
            }
          })
          console.log(this.settings.settings.imputationMap)
          this.toast.show("Imputation", "Imputation map has been created").then()
          this.data.redrawTrigger.next(true)
        }
      }
    })
  }

}
