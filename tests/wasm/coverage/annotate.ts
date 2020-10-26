import {
  Parser,
  Statement,
  NodeKind,
  Node,
  Source,
  FunctionDeclaration,
  BlockStatement,
  IfStatement,
  ForStatement,
  ForOfStatement,
  WhileStatement,
  DoStatement,
  SwitchStatement,
  SwitchCase,
} from 'assemblyscript'

import { InstrumentedLines } from './'

/**
 * Annotates a given assembly script source node with a `trace` instructions before each statement.
 * The trace instruction contains the filename as well as the covered line numbers
 * `trace($file, $from_line, $to_line)
 *
 * @param source A source node e.g. from parsing an assembly script file
 * @returns a bitmap of instrumented lines in the file
 */
export function annotateSource(source: Source): InstrumentedLines {
  const line_count = source.text.split('\n').length
  const instrumentedLines: InstrumentedLines = new Array(line_count).fill(false)
  annotateNodeRecursively(source, source.text, instrumentedLines)
  return instrumentedLines
}

// Returns a parsed `trace` expression that can be inserted in the AST to annotate the given statement
function traceExpressionFor(statement: Statement, file_content: string, instrumentedLines: InstrumentedLines) {
  const range = statement.range
  const start = lineNumberForCharacterIndex(file_content, range.start)
  // Some multiline statements (e.g. function declarations) shouldn't be covered as soon as the first line is evaluated
  const end = isRangeFromStartToEnd(statement) ? lineNumberForCharacterIndex(file_content, range.end) : start
  for (let i = start; i <= end; i++) {
    instrumentedLines[i] = true
  }

  // Use a parser to create the `trace` expression from a string
  const trace = `trace('${range.source.normalizedPath}', ${start}, ${end})`
  const parser = new Parser()
  parser.parseFile(trace, 'trace.ts', true)
  return parser.sources[0].statements[0]
}

// Depending on the Node we might have to annotate nested notes recursively
function annotateNodeRecursively(node: Node, content: string, instrumentedLines: InstrumentedLines) {
  switch (node.kind) {
    case NodeKind.SWITCHCASE:
    case NodeKind.BLOCK:
    case NodeKind.SOURCE: {
      const castedNode = node as Source | BlockStatement | SwitchCase
      castedNode.statements = castedNode.statements.flatMap((s) => {
        annotateNodeRecursively(s, content, instrumentedLines)
        return [traceExpressionFor(s, content, instrumentedLines), s]
      })
      break
    }
    case NodeKind.FUNCTIONDECLARATION: {
      const fn = node as FunctionDeclaration
      fn.body && annotateNodeRecursively(fn.body, content, instrumentedLines)
      break
    }
    case NodeKind.IF: {
      const ifNode = node as IfStatement
      ifNode.ifTrue && annotateNodeRecursively(ifNode.ifTrue, content, instrumentedLines)
      ifNode.ifFalse && annotateNodeRecursively(ifNode.ifFalse, content, instrumentedLines)
      break
    }
    case NodeKind.DO:
    case NodeKind.FOR:
    case NodeKind.WHILE:
    case NodeKind.FOROF: {
      const loop = node as ForStatement | ForOfStatement | WhileStatement | DoStatement
      annotateNodeRecursively(loop.statement, content, instrumentedLines)
      break
    }
    case NodeKind.SWITCH: {
      const switchNode = node as SwitchStatement
      switchNode.cases.forEach((caseNode) => {
        annotateNodeRecursively(caseNode, content, instrumentedLines)
      })
      break
    }
    case NodeKind.NAMEDTYPE:
    case NodeKind.FUNCTIONTYPE:
    case NodeKind.TYPENAME:
    case NodeKind.TYPEPARAMETER:
    case NodeKind.PARAMETER:
    case NodeKind.IDENTIFIER:
    case NodeKind.ASSERTION:
    case NodeKind.BINARY:
    case NodeKind.CALL:
    case NodeKind.CLASS:
    case NodeKind.COMMA:
    case NodeKind.ELEMENTACCESS:
    case NodeKind.FALSE:
    case NodeKind.FUNCTION:
    case NodeKind.INSTANCEOF:
    case NodeKind.LITERAL:
    case NodeKind.NEW:
    case NodeKind.NULL:
    case NodeKind.OMITTED:
    case NodeKind.PARENTHESIZED:
    case NodeKind.PROPERTYACCESS:
    case NodeKind.TERNARY:
    case NodeKind.SUPER:
    case NodeKind.THIS:
    case NodeKind.TRUE:
    case NodeKind.CONSTRUCTOR:
    case NodeKind.UNARYPOSTFIX:
    case NodeKind.UNARYPREFIX:
    case NodeKind.BREAK:
    case NodeKind.CONTINUE:
    case NodeKind.EMPTY:
    case NodeKind.EXPORT:
    case NodeKind.EXPORTDEFAULT:
    case NodeKind.EXPORTIMPORT:
    case NodeKind.EXPRESSION:
    case NodeKind.IMPORT:
    case NodeKind.RETURN:
    case NodeKind.THROW:
    case NodeKind.TRY:
    case NodeKind.VARIABLE:
    case NodeKind.VOID:
    case NodeKind.CLASSDECLARATION:
    case NodeKind.ENUMDECLARATION:
    case NodeKind.ENUMVALUEDECLARATION:
    case NodeKind.FIELDDECLARATION:
    case NodeKind.IMPORTDECLARATION:
    case NodeKind.INTERFACEDECLARATION:
    case NodeKind.METHODDECLARATION:
    case NodeKind.NAMESPACEDECLARATION:
    case NodeKind.TYPEDECLARATION:
    case NodeKind.VARIABLEDECLARATION:
    case NodeKind.DECORATOR:
    case NodeKind.EXPORTMEMBER:
    case NodeKind.INDEXSIGNATURE:
    case NodeKind.COMMENT:
  }
}

function isRangeFromStartToEnd(statement: Statement): boolean {
  switch (statement.kind) {
    case NodeKind.WHILE:
    case NodeKind.FUNCTIONDECLARATION:
    case NodeKind.BLOCK:
    case NodeKind.SOURCE:
    case NodeKind.FOR:
    case NodeKind.FOROF:
    case NodeKind.IF:
    case NodeKind.CLASS:
    case NodeKind.CONSTRUCTOR:
    case NodeKind.SWITCH:
    case NodeKind.SWITCHCASE:
    case NodeKind.CLASSDECLARATION:
    case NodeKind.ENUMDECLARATION:
    case NodeKind.ENUMVALUEDECLARATION:
    case NodeKind.FIELDDECLARATION:
    case NodeKind.IMPORTDECLARATION:
    case NodeKind.INTERFACEDECLARATION:
    case NodeKind.METHODDECLARATION:
    case NodeKind.NAMESPACEDECLARATION:
    case NodeKind.TYPEDECLARATION:
    case NodeKind.VARIABLEDECLARATION:
      return false
    case NodeKind.NAMEDTYPE:
    case NodeKind.FUNCTIONTYPE:
    case NodeKind.TYPENAME:
    case NodeKind.TYPEPARAMETER:
    case NodeKind.PARAMETER:
    case NodeKind.IDENTIFIER:
    case NodeKind.ASSERTION:
    case NodeKind.BINARY:
    case NodeKind.CALL:
    case NodeKind.COMMA:
    case NodeKind.ELEMENTACCESS:
    case NodeKind.FALSE:
    case NodeKind.FUNCTION:
    case NodeKind.INSTANCEOF:
    case NodeKind.LITERAL:
    case NodeKind.NEW:
    case NodeKind.NULL:
    case NodeKind.OMITTED:
    case NodeKind.PARENTHESIZED:
    case NodeKind.PROPERTYACCESS:
    case NodeKind.TERNARY:
    case NodeKind.SUPER:
    case NodeKind.THIS:
    case NodeKind.TRUE:
    case NodeKind.UNARYPOSTFIX:
    case NodeKind.UNARYPREFIX:
    case NodeKind.BREAK:
    case NodeKind.CONTINUE:
    case NodeKind.DO:
    case NodeKind.EMPTY:
    case NodeKind.EXPORT:
    case NodeKind.EXPORTDEFAULT:
    case NodeKind.EXPORTIMPORT:
    case NodeKind.EXPRESSION:
    case NodeKind.IMPORT:
    case NodeKind.RETURN:
    case NodeKind.THROW:
    case NodeKind.TRY:
    case NodeKind.VARIABLE:
    case NodeKind.VOID:
    case NodeKind.DECORATOR:
    case NodeKind.EXPORTMEMBER:
    case NodeKind.INDEXSIGNATURE:
    case NodeKind.COMMENT:
      return true
  }
}

function lineNumberForCharacterIndex(content: string, index: number) {
  let count = 0
  const lines = content.split('\n')
  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    count += lines[lineNumber].length + 1 // add one character for the new line character
    if (count > index) {
      return lineNumber
    }
  }
  throw Error(`Index ${index} out of bounds: 0-${count}`)
}
