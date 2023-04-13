import { resolve } from 'url'

// Provides dev-time type structures for  `danger` - doesn't affect runtime.
import {DangerDSLType} from "../node_modules/danger/distribution/dsl/DangerDSL"
declare var danger: DangerDSLType
export declare function message(message: string): void
export declare function warn(message: string): void
export declare function fail(message: string): void
export declare function markdown(message: string): void

export interface Options {
  /** The JIRA instance issue base URL (e.g. https://jira.atlassian.com/browse/). */
  url: string

  /**
   * The JIRA issue key(s) (e.g. the ABC in ABC-123).
   * Supports multiple JIRA projects (e.g. `['ABC', 'DEF']`).
   */
  key?: string | string[]

  /**
   * A format function to format the message
   * @param {string[]} jiraUrls
   * @returns {string}
   */
  format?: (jiraUrls: string[]) => string

  /**
   * Whether to match JIRA issue keys case-sensitively.
   */
  caseSensitive?: boolean
}

/**
 * Danger plugin to integrate your pull request with JIRA
 */
export default function jiraIntegration({ key, url, format = defaultFormat, caseSensitive=false }: Options) {
  if (!url) {
    throw Error(`'url' missing - must supply JIRA installation URL`)
  }

  // Support multiple JIRA projects.
  const keys = key ? (Array.isArray(key) ? `(${key.join('|')})` : key) : '[A-Za-z]{2,4}'

  const jiraKeyRegex = new RegExp(`(${keys}-[0-9]+)`, `g${caseSensitive ? '' : 'i'}`)

  function findMatches(property: string): string[] {
    const issues: string[] = []

    let match = jiraKeyRegex.exec(property)
    while (match !== null) {
      issues.push(match[0].toLowerCase())
      match = jiraKeyRegex.exec(property)
    }

    return issues
  }

  const allIssues = new Set([
    ...findMatches(danger.github.pr.title),
    ...findMatches(danger.github.pr.head ? danger.github.pr.head.ref : ''),
    ...findMatches(danger.github.pr.body),
  ])

  if (allIssues.size > 0) {
    // URL must end with a slash before attempting to fully resolve the JIRA URL.
    url = ensureUrlEndsWithSlash(url)
    const jiraUrls = Array.from(allIssues).map(issue => {
      const formattedIssue = issue.toUpperCase()
      const resolvedUrl = resolve(url, formattedIssue)
      return link(resolvedUrl, formattedIssue)
    })
    message(format(jiraUrls))
  } else {

    let warningKeys;
    if (key) {
      warningKeys = Array.isArray(key) ? key.map(k => `${k}-123`).join(', ') : key + '-123';
    } else {
      warningKeys = 'ABC-123';
    }


    warn(`No JIRA keys found in the PR title, branch name, or commit messages (e.g. ${warningKeys}).`);
  }
}

function link(href: string, text: string): string {
  return `<a href="${href}">${text}</a>`
}

function ensureUrlEndsWithSlash(url: string): string {
  return url.endsWith('/') ? url : url.concat('/')
}

const defaultFormat = (urls: string[]) => `:link: ${urls.join(', ')}`
