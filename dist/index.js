"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jiraIntegration = void 0;
/**
 * Danger plugin to integrate your pull request with JIRA
 */
function jiraIntegration({ key, url, format = defaultFormat, caseSensitive = false }) {
    if (!url) {
        throw Error(`'url' missing - must supply JIRA installation URL`);
    }
    // Support multiple JIRA projects.
    const keys = key ? (Array.isArray(key) ? `(${key.join('|')})` : key) : '[A-Za-z]{2,4}';
    const jiraKeyRegex = new RegExp(`(${keys}-[0-9]+)`, `g${caseSensitive ? '' : 'i'}`);
    function findMatches(property) {
        const issues = [];
        let match = jiraKeyRegex.exec(property);
        while (match !== null) {
            issues.push(match[0].toLowerCase());
            match = jiraKeyRegex.exec(property);
        }
        return issues;
    }
    const allIssues = new Set([
        ...findMatches(danger.github.pr.title),
        ...findMatches(danger.github.pr.head ? danger.github.pr.head.ref : ''),
        ...findMatches(danger.github.pr.body),
    ]);
    if (allIssues.size > 0) {
        // URL must end with a slash before attempting to fully resolve the JIRA URL.
        url = ensureUrlEndsWithSlash(url);
        const jiraUrls = Array.from(allIssues).map((issue) => {
            const formattedIssue = issue.toUpperCase();
            const resolvedUrl = new URL(formattedIssue, url);
            return link(resolvedUrl.href, formattedIssue);
        });
        message(format(jiraUrls));
    }
    else {
        let warningKeys;
        if (key) {
            warningKeys = Array.isArray(key) ? key.map((k) => `${k}-123`).join(', ') : key + '-123';
        }
        else {
            warningKeys = 'ABC-123';
        }
        warn(`No JIRA keys found in the PR title, branch name, or commit messages (e.g. ${warningKeys}).`);
    }
    return allIssues;
}
exports.default = jiraIntegration;
exports.jiraIntegration = jiraIntegration;
function link(href, text) {
    return `<a href="${href}">${text}</a>`;
}
function ensureUrlEndsWithSlash(url) {
    return url.endsWith('/') ? url : url.concat('/');
}
const defaultFormat = (urls) => `:link: ${urls.join(', ')}`;
