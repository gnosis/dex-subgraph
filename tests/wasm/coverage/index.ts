import fs from 'fs'
import { Report } from './report'
import { annotateSource } from './annotate'
import { ASTBuilder, Parser } from 'assemblyscript'

// Each entry refers to the corresponding line in the source file. True means the line has been instrumented
// with a trace expression, false means the line is not instrumented and thus cannot be covered (e.g. for comments, etc.)
export type InstrumentedLines = boolean[]

export { Report, recordCoverage } from './report'

/**
 * Rewrites all files in the given directory to contain trace annotations after each reachable statement
 * This allows to later compute code coverage when running the test suite. It populates meta information
 * about each file in the report object.
 *
 * @param directory The directory for in which we recursively rewrite the files
 * @param report The report object that will be used to create the coverage report.
 */
export function rewriteDirectoryWithTraceAnnotation(directory: string, report: Report): void {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      rewriteDirectoryWithTraceAnnotation(entry.name, report)
    } else if (entry.name.endsWith('.ts')) {
      rewriteFileWithTraceAnnotation(directory + entry.name, report)
    }
  }
}

function rewriteFileWithTraceAnnotation(file: string, report: Report): void {
  const content = fs.readFileSync(file, { encoding: 'utf8' })
  const parser = new Parser()
  parser.parseFile(content, file, true)
  const source = parser.sources[0]
  const instrumentedLines = annotateSource(source)
  const parsed = ASTBuilder.build(source)

  report.addFile(source.normalizedPath, instrumentedLines)
  fs.writeFileSync(file, parsed)
}
