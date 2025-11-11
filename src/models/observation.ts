export interface Observation {
    data: Data[]
  }
  
  export interface Data {
    id: Id
    meta: Meta
    status: Status
    category: Category[]
    code: Code2
    subject: Subject
    effective: Effective
    value: Value
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
  
  export interface Status {
    value: string
  }
  
  export interface Category {
    coding: Coding[]
  }
  
  export interface Coding {
    system: System
    code: Code
    display: Display
  }
  
  export interface System {
    value: string
  }
  
  export interface Code {
    value: string
  }
  
  export interface Display {
    value: string
  }
  
  export interface Code2 {
    coding: Coding2[]
  }
  
  export interface Coding2 {
    system: System2
    code: Code3
    display: Display2
  }
  
  export interface System2 {
    value: string
  }
  
  export interface Code3 {
    value: string
  }
  
  export interface Display2 {
    value: string
  }
  
  export interface Subject {
    reference: Reference
  }
  
  export interface Reference {
    value: string
  }
  
  export interface Effective {
    start: Start
    end: End
  }
  
  export interface Start {
    value: string
  }
  
  export interface End {
    value: string
  }
  
  export interface Value {
    value: Value2
    unit: Unit
    system: System3
    code: Code4
  }
  
  export interface Value2 {
    value: number
  }
  
  export interface Unit {
    value: string
  }
  
  export interface System3 {
    value: string
  }
  
  export interface Code4 {
    value: string
  }
  