import {DataCiteCurtain} from "./data-cite-metadata";

export interface CurtainSession {
  id: number,
  created: Date,
  link_id: string,
  file: string,
  enable: boolean,
  description: string,
  curtain_type: string,
  encrypted: boolean,
  permanent: boolean,
  data_cite: DataCiteCurtain,
}
