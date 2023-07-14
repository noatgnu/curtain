/// <reference lib="webworker" />

import {fromCSV, IDataFrame, Series} from "data-forge";

addEventListener('message', (data: MessageEvent<any>) => {
  console.log(data.data)
  switch (data.data.task) {
    case "processDifferentialFile":
      postMessage({type: "progress", value: 100, text: "Processing differential data..."})
      let df: IDataFrame = fromCSV(data.data.differential)

      if (!data.data.differentialForm._comparison || data.data.differentialForm._comparison === "" || data.data.differentialForm._comparison === "CurtainSetComparison") {
        data.data.differentialForm._comparison = "CurtainSetComparison"
        data.data.differentialForm._comparisonSelect = ["1"]

        df = df.withSeries("CurtainSetComparison", new Series(Array(df.count()).fill("1"))).bake()
      }

      if (!data.data.differentialForm._comparisonSelect) {
        data.data.differentialForm._comparisonSelect = [df.first()[data.data.differentialForm._comparison]]
      } else if (data.data.differentialForm._comparisonSelect.length === 0) {
        data.data.differentialForm._comparisonSelect = [df.first()[data.data.differentialForm._comparison]]
      }

      if (data.data.differentialForm._comparisonSelect === "" || data.data.differentialForm._comparisonSelect === undefined) {
        data.data.differentialForm._comparisonSelect = data.data.differential.df.first()[data.data.differentialForm._comparison]
      }

      const store: any[] = df.toArray().map((r: any) => {
        r[data.data.differentialForm._foldChange] = Number(r[data.data.differentialForm._foldChange])
        r[data.data.differentialForm._significant] = Number(r[data.data.differentialForm._significant])
        if (data.data.differentialForm._transformFC) {
          if (r[data.data.differentialForm._foldChange] > 0) {
            r[data.data.differentialForm._foldChange] = Math.log2(r[data.data.differentialForm._foldChange])
          } else if (r[data.data.differentialForm._foldChange] < 0) {
            r[data.data.differentialForm._foldChange] = -Math.log2(Math.abs(r[data.data.differentialForm._foldChange]))
          } else {
            r[data.data.differentialForm._foldChange] = 0
          }
        }
        if (data.data.differentialForm._reverseFoldChange) {
          r[data.data.differentialForm._foldChange] = -r[data.data.differentialForm._foldChange]
        }
        if (data.data.differentialForm._significant) {
          r[data.data.differentialForm._significant] = Number(r[data.data.differentialForm._significant])
        }
        if (data.data.differentialForm._transformSignificant) {
          r[data.data.differentialForm._significant] = -Math.log10(r[data.data.differentialForm._significant])
        }
        return r
      })



      // passing data back to main thread in chunks of 100 items each to avoid memory issues
      /*const chunkSize = 100
      const chunkNumber = Math.ceil(df.count() / chunkSize)
      for (let i = 0; i < chunkNumber; i++) {
        postMessage({type: "progress", value: i*100/chunkNumber, text: "Processing differential data..."})
        postMessage({type: "resultDifferential", differential: df.skip(i*chunkSize).take(chunkSize).toArray()})
      }*/
      postMessage({type: "progress", value: 100, text: "Finished processing differential data"})
      // @ts-ignore
      const result = {type: "resultDifferential", differential: JSON.stringify(store), differentialForm: data.data.differentialForm}
      postMessage(result)

      break
    case "processRawFile":
      postMessage({type: "progress", value: 100, text: "Processing primary data"})
      console.log(data.data.settings.currentID)
      let rawDF: IDataFrame = fromCSV(data.data.raw)
      const totalSampleNumber = data.data.rawForm._samples.length
      let sampleNumber = 0
      const conditions: string[] = []
      let colorPosition = 0
      const colorMap: any = {}
      const conditionOrder = data.data.settings.conditionOrder.slice()
      let samples: string[] = []
      if (conditionOrder.length > 0) {
        for (const c of conditionOrder) {
          for (const s of data.data.settings.sampleOrder[c]) {
            samples.push(s)
          }
        }
      } else {
        samples = data.data.rawForm._samples.slice()
      }
      const sampleMap: any = {}
      for (const s of samples) {
        const condition_replicate = s.split(".")
        const replicate = condition_replicate[condition_replicate.length-1]
        const condition = condition_replicate.slice(0, condition_replicate.length-1).join(".")
        if (!conditions.includes(condition)) {
          conditions.push(condition)
          if (colorPosition >= data.data.settings.defaultColorList.length) {
            colorPosition = 0
          }
          colorMap[condition] = data.data.settings.defaultColorList[colorPosition]
          colorPosition ++
        }
        if (!data.data.settings.sampleOrder[condition]) {
          data.data.settings.sampleOrder[condition] = []
        }
        if (!data.data.settings.sampleOrder[condition].includes(s)) {
          data.data.settings.sampleOrder[condition].push(s)
        }

        if (!(s in data.data.settings.sampleVisible)) {
          data.data.settings.sampleVisible[s] = true
        }
        sampleMap[s] = {replicate: replicate, condition: condition}
      }
      const storeRaw = rawDF.toArray().map((r: any) => {
        for (const s of samples) {
          r[s] = Number(r[s])
        }
        return r
      })

      // @ts-ignore
      postMessage({type: "resultRaw", raw: JSON.stringify(storeRaw), settings: data.data.settings, sampleMap: sampleMap, colorMap: colorMap, conditions: conditions})
  }
});
