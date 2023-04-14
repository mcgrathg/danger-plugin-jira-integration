"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var url_1 = require("url");
/**
 * Danger plugin to integrate your pull request with JIRA
 */
function jiraIntegration(_a) {
    var key = _a.key, url = _a.url, _b = _a.format, format = _b === void 0 ? defaultFormat : _b, _c = _a.caseSensitive, caseSensitive = _c === void 0 ? false : _c;
    if (!url) {
        throw Error("'url' missing - must supply JIRA installation URL");
    }
    // Support multiple JIRA projects.
    var keys = key ? (Array.isArray(key) ? "(".concat(key.join('|'), ")") : key) : '[A-Za-z]{2,4}';
    var jiraKeyRegex = new RegExp("(".concat(keys, "-[0-9]+)"), "g".concat(caseSensitive ? '' : 'i'));
    function findMatches(property) {
        var issues = [];
        var match = jiraKeyRegex.exec(property);
        while (match !== null) {
            issues.push(match[0].toLowerCase());
            match = jiraKeyRegex.exec(property);
        }
        return issues;
    }
    var allIssues = new Set(__spreadArray(__spreadArray(__spreadArray([], findMatches(danger.github.pr.title), true), findMatches(danger.github.pr.head ? danger.github.pr.head.ref : ''), true), findMatches(danger.github.pr.body), true));
    if (allIssues.size > 0) {
        // URL must end with a slash before attempting to fully resolve the JIRA URL.
        url = ensureUrlEndsWithSlash(url);
        var jiraUrls = Array.from(allIssues).map(function (issue) {
            var formattedIssue = issue.toUpperCase();
            var resolvedUrl = (0, url_1.resolve)(url, formattedIssue);
            return link(resolvedUrl, formattedIssue);
        });
        message(format(jiraUrls));
    }
    else {
        var warningKeys = void 0;
        if (key) {
            warningKeys = Array.isArray(key) ? key.map(function (k) { return "".concat(k, "-123"); }).join(', ') : key + '-123';
        }
        else {
            warningKeys = 'ABC-123';
        }
        warn("No JIRA keys found in the PR title, branch name, or commit messages (e.g. ".concat(warningKeys, ")."));
    }
}
exports.default = jiraIntegration;
function link(href, text) {
    return "<a href=\"".concat(href, "\">").concat(text, "</a>");
}
function ensureUrlEndsWithSlash(url) {
    return url.endsWith('/') ? url : url.concat('/');
}
var defaultFormat = function (urls) { return ":link: ".concat(urls.join(', ')); };
