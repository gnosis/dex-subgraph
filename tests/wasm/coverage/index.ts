// Each entry refers to the corresponding line in the source file. True means the line has been instrumented
// with a trace expression, false means the line is not instrumented and thus cannot be covered (e.g. for comments, etc.)
export type InstrumentedLines = boolean[]

export { Report, recordCoverage } from './report'
