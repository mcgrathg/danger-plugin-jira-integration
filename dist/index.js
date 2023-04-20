"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jiraIntegration = exports.getWarningMessage = exports.generateRegExp = void 0;
// valid Jira keys have the following:
// must be at the beginning of the string (unless it's immediately preceded by a symbol that's not a "-")
// prefix (area before the hyphen) must start with a letter
// prefix (area before the hyphen) must be at least 2 characters (letters, numbers, _)
// issue number (area after the hyphen) must be at least 1 digit and be greater than 0, must be only numbers
const FALLBACK_REGEXP = '((?<!([\\w]{1,10})-?)[A-Z][A-Z0-9_]+-[1-9]([0-9]*)(?!\\w))';
const generateRegExp = (options) => {
    const { key, caseSensitive } = options || {};
    const generatePattern = () => {
        // Support multiple JIRA projects.
        const keys = Array.isArray(key) ? `(${key.join('|')})` : key;
        return `(${keys}-[1-9]([0-9]*)(?!\\w))`;
    };
    const pattern = key ? generatePattern() : FALLBACK_REGEXP;
    return new RegExp(pattern, `g${caseSensitive ? '' : 'i'}`);
};
exports.generateRegExp = generateRegExp;
const getWarningMessage = (key) => {
    let warningKeys;
    if (key) {
        warningKeys = Array.isArray(key) ? key.map((k) => `${k}-123`).join(', ') : key + '-123';
    }
    else {
        warningKeys = 'ABC-123';
    }
    return `No JIRA keys found in the PR title, branch name, or commit messages (e.g. ${warningKeys}).`;
};
exports.getWarningMessage = getWarningMessage;
/**
 * Danger plugin to integrate your pull request with JIRA
 */
function jiraIntegration({ key, url, format = defaultFormat, caseSensitive = false }) {
    if (!url) {
        throw Error(`'url' missing - must supply JIRA installation URL`);
    }
    const jiraKeyRegex = (0, exports.generateRegExp)({ key, caseSensitive });
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
        warn((0, exports.getWarningMessage)(key));
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
