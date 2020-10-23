import fs from 'fs'
import md5File from 'md5-file'
import { InstrumentedLines } from './'

const COVERAGE_FOLDER = './coverage/'
const COVERAGE_FILE = COVERAGE_FOLDER + 'report.json'

interface ReportData {
  repo_token: string | undefined
  service_job_id: string | undefined
  service_name: string
  source_files: {
    name: string
    source_digest: string
    coverage: (number | null)[]
  }[]
}

export class Report {
  data: ReportData

  constructor(data?: ReportData) {
    if (!data) {
      data = {
        repo_token: process.env.COVERALLS_REPO_TOKEN,
        service_job_id: process.env.TRAVIS_JOB_ID,
        service_name: 'travis-pro',
        source_files: [],
      }
    }
    this.data = data
  }

  addFile(file: string, instrumentedLines: InstrumentedLines): void {
    const source_digest = md5File.sync(file)
    this.data.source_files.push({
      name: file,
      source_digest,
      coverage: instrumentedLines.map((isInstrumented: boolean) => (isInstrumented ? 0 : null)),
    })
  }

  write(): void {
    // We need to call this method from inside the WASM runtime and thus need synchronous I/O
    fs.mkdirSync(COVERAGE_FOLDER, { recursive: true })
    fs.writeFileSync(COVERAGE_FILE, JSON.stringify(this.data))
  }
}

export function recordCoverage(file: string, from_line: number, to_line: number): void {
  const report = new Report(JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8')) as ReportData)
  const file_report = report.data.source_files.find((f) => f.name === file)
  if (!file_report) {
    throw new Error('Could not find coverage entry for ' + file)
  }
  for (let line = from_line; line <= to_line; line++) {
    file_report.coverage[line] = (file_report.coverage[line] || 0) + 1
  }
  report.write()
}
