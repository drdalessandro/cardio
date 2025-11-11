export interface Patient {
    id: Id
    meta: Meta
    text: Text
    identifier: Identifier[]
    name: Name[]
    gender: Gender
    birthDate: BirthDate
  }
  
  export interface Id {
    value: string
  }
  
  export interface Meta {
    versionId: VersionId
    lastUpdated: LastUpdated
    source: Source
  }
  
  export interface VersionId {
    value: string
  }
  
  export interface LastUpdated {
    value: string
  }
  
  export interface Source {
    value: string
  }
  
  export interface Text {
    status: Status
    div: Div
  }
  
  export interface Status {
    value: string
  }
  
  export interface Div {
    value: string
  }
  
  export interface Identifier {
    system: System
    value: Value
  }
  
  export interface System {
    value: string
  }
  
  export interface Value {
    value: string
  }
  
  export interface Name {
    use: Use
    text: Text2
    family: Family
    given: Given[]
  }
  
  export interface Use {
    value: string
  }
  
  export interface Text2 {
    value: string
  }
  
  export interface Family {
    value: string
  }
  
  export interface Given {
    value: string
  }
  
  export interface Gender {
    value: string
  }
  
  export interface BirthDate {
    value: string
  }
  
  
  