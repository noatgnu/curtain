export class Differential {
  get reverseFoldChange(): boolean {
    return this._reverseFoldChange;
  }

  set reverseFoldChange(value: boolean) {
    this._reverseFoldChange = value;
  }
  get comparisonSelect(): string[] {
    return this._comparisonSelect;
  }

  set comparisonSelect(value: string[]) {
    this._comparisonSelect = value;
  }
  get primaryIDs(): string {
    return this._primaryIDs;
  }

  set primaryIDs(value: string) {
    this._primaryIDs = value;
  }

  get geneNames(): string {
    return this._geneNames;
  }

  set geneNames(value: string) {
    this._geneNames = value;
  }

  get foldChange(): string {
    return this._foldChange;
  }

  set foldChange(value: string) {
    this._foldChange = value;
  }

  get transformFC(): boolean {
    return this._transformFC;
  }

  set transformFC(value: boolean) {
    this._transformFC = value;
  }

  get significant(): string {
    return this._significant;
  }

  set significant(value: string) {
    this._significant = value;
  }

  get transformSignificant(): boolean {
    return this._transformSignificant;
  }

  set transformSignificant(value: boolean) {
    this._transformSignificant = value;
  }

  get comparison(): string {
    return this._comparison;
  }

  set comparison(value: string) {
    this._comparison = value;
  }
  private _primaryIDs: string = ""
  private _geneNames: string = ""
  private _foldChange: string = ""
  private _transformFC: boolean = false
  private _significant: string = ""
  private _transformSignificant: boolean = false
  private _comparison: string = ""
  private _comparisonSelect: string[] = []
  private _reverseFoldChange: boolean = false
  restore(value: any) {
    for (const i in value) {
      // @ts-ignore
      this[i] = value[i]
      console.log(i, value[i])
    }
  }
}
