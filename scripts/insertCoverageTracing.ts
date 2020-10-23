import { Report, rewriteDirectoryWithTraceAnnotation } from '../tests/wasm/coverage/'

const report = new Report()
rewriteDirectoryWithTraceAnnotation('./src/mappings/', report)
report.write()
