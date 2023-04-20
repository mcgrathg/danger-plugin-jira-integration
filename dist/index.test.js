"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importStar(require("./index"));
describe('jiraIntegration()', () => {
    beforeEach(() => {
        global.warn = jest.fn();
        global.message = jest.fn();
    });
    afterEach(() => {
        global.danger = undefined;
        global.warn = undefined;
        global.message = undefined;
    });
    it('throws when supplied invalid configuration', () => {
        const anyJira = index_1.default;
        expect(() => anyJira()).toThrow();
        expect(() => (0, index_1.default)({})).toThrow();
        expect(() => (0, index_1.default)({ key: 'ABC' })).toThrow();
    });
    it('warns when PR title is missing JIRA issue key', () => {
        global.danger = { github: { pr: { title: 'Change some things' } } };
        (0, index_1.default)({
            key: 'ABC',
            url: 'https://jira.net/browse',
        });
        expect(global.warn).toHaveBeenCalledWith((0, index_1.getWarningMessage)('ABC'));
    });
    it('warns when PR title is missing all of the multiple JIRA issue keys', () => {
        global.danger = { github: { pr: { title: 'Change some things' } } };
        (0, index_1.default)({
            key: ['ABC', 'DEF'],
            url: 'https://jira.net/browse',
        });
        expect(global.warn).toHaveBeenCalledWith((0, index_1.getWarningMessage)(['ABC', 'DEF']));
    });
    it('adds the JIRA issue link from PR title to the messages table', () => {
        global.danger = {
            github: { pr: { title: '[ABC-808] Change some things' } },
        };
        (0, index_1.default)({
            key: 'ABC',
            url: 'https://jira.net/browse',
        });
        expect(global.message).toHaveBeenCalledWith(':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>');
    });
    it('properly concatenates URL parts (trailing slash in url)', () => {
        global.danger = {
            github: { pr: { title: '[ABC-808] Change some things' } },
        };
        (0, index_1.default)({
            key: 'ABC',
            url: 'https://jira.net/browse/',
        });
        expect(global.message).toHaveBeenCalledWith(':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>');
    });
    it('matches JIRA issue anywhere in title', () => {
        global.danger = { github: { pr: { title: 'My changes - ABC-123' } } };
        (0, index_1.default)({
            key: 'ABC',
            url: 'https://jira.net/browse',
        });
        expect(global.message).toHaveBeenCalledWith(':link: <a href="https://jira.net/browse/ABC-123">ABC-123</a>');
    });
    it('matches JIRA issue anywhere in title when no configuration key', () => {
        global.danger = { github: { pr: { title: 'My changes - ABC-123' } } };
        (0, index_1.default)({
            url: 'https://jira.net/browse',
        });
        expect(global.message).toHaveBeenCalledWith(':link: <a href="https://jira.net/browse/ABC-123">ABC-123</a>');
    });
    it('matches lowercase JIRA key in the git branch', () => {
        global.danger = {
            github: { pr: { head: { ref: 'abc-808/some-things' } } },
        };
        (0, index_1.default)({
            key: 'ABC',
            url: 'https://jira.net/browse',
        });
        expect(global.message).toHaveBeenCalledWith(':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>');
    });
    it('matches lowercase JIRA key in PR title', () => {
        global.danger = {
            github: { pr: { title: '[abc-808] Change some things' } },
        };
        (0, index_1.default)({
            key: 'ABC',
            url: 'https://jira.net/browse',
        });
        expect(global.message).toHaveBeenCalledWith(':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>');
    });
    it('does not match lowercase JIRA key in PR title when case-sensitive', () => {
        global.danger = {
            github: { pr: { title: '[abc-808] Change some things' } },
        };
        (0, index_1.default)({
            key: 'ABC',
            url: 'https://jira.net/browse',
            caseSensitive: true,
        });
        expect(global.warn).toHaveBeenCalled();
    });
    it('does not match JIRA key where letters are in the suffix', () => {
        global.danger = {
            github: { pr: { title: '[abc-808ABCabc] Change some things' } },
        };
        (0, index_1.default)({
            key: 'ABC',
            url: 'https://jira.net/browse',
            caseSensitive: true,
        });
        expect(global.warn).toHaveBeenCalled();
    });
    it('supports multiple JIRA keys in PR title', () => {
        global.danger = {
            github: { pr: { title: '[ABC-123][ABC-456] Change some things' } },
        };
        (0, index_1.default)({
            key: 'ABC',
            url: 'https://jira.net/browse',
        });
        expect(global.message).toHaveBeenCalledWith(':link: <a href="https://jira.net/browse/ABC-123">ABC-123</a>, <a href="https://jira.net/browse/ABC-456">ABC-456</a>');
    });
    it('supports multiple JIRA boards in PR title', () => {
        global.danger = {
            github: { pr: { title: '[ABC-123][DEF-456] Change some things' } },
        };
        (0, index_1.default)({
            key: ['ABC', 'DEF'],
            url: 'https://jira.net/browse',
        });
        expect(global.message).toHaveBeenCalledWith(':link: <a href="https://jira.net/browse/ABC-123">ABC-123</a>, <a href="https://jira.net/browse/DEF-456">DEF-456</a>');
    });
    it('supports a custom format function', () => {
        global.danger = {
            github: { pr: { title: '[ABC-123][DEF-456] Change some things' } },
        };
        (0, index_1.default)({
            format: (jiraUrls) => {
                return `JIRA Tickets: ${jiraUrls.join(', ')}`;
            },
            key: ['ABC', 'DEF'],
            url: 'https://jira.net/browse',
        });
        expect(global.message).toHaveBeenCalledWith('JIRA Tickets: <a href="https://jira.net/browse/ABC-123">ABC-123</a>, <a href="https://jira.net/browse/DEF-456">DEF-456</a>');
    });
    it('supports JIRA key in the git branch', () => {
        global.danger = {
            github: { pr: { head: { ref: 'ABC-808/some-things' } } },
        };
        (0, index_1.default)({
            key: 'ABC',
            url: 'https://jira.net/browse',
        });
        expect(global.message).toHaveBeenCalledWith(':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>');
    });
    it('supports JIRA key in the git branch when no configuration key', () => {
        global.danger = {
            github: { pr: { head: { ref: 'ABC-808/some-things' } } },
        };
        (0, index_1.default)({
            url: 'https://jira.net/browse',
        });
        expect(global.message).toHaveBeenCalledWith(':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>');
    });
    it('supports JIRA key in the PR body', () => {
        global.danger = { github: { pr: { body: '[ABC-808] Change some things' } } };
        (0, index_1.default)({
            key: 'ABC',
            url: 'https://jira.net/browse',
        });
        expect(global.message).toHaveBeenCalledWith(':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>');
    });
    it('does not find a Jira key match when text is only partial part of word when no configuration key', () => {
        global.danger = {
            github: {
                pr: {
                    body: 'Change some things\n[Image](https://user-images.githubusercontent.com/123/232530143-abcdefgh-1ab1-9876-5432-01a23bc4d56e.png)',
                },
            },
        };
        (0, index_1.default)({
            url: 'https://jira.net/browse',
        });
        expect(global.warn).toHaveBeenCalledWith((0, index_1.getWarningMessage)());
    });
    it('supports JIRA key in the PR body when no configuration key', () => {
        global.danger = { github: { pr: { body: '[ABC-808] Change some things' } } };
        (0, index_1.default)({
            url: 'https://jira.net/browse',
        });
        expect(global.message).toHaveBeenCalledWith(':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>');
    });
    it("test matches for Jira ticket RegExp's fallback pattern", () => {
        const regex = (0, index_1.generateRegExp)();
        const noMatch = [
            'change-some-things-abc-808',
            '(aaqwerqwerzxasefw12212-d1-2342-azxdv-23)',
            '(https://user-images.githubusercontent.com/123/232530143-abcdefgh-1ab1-9876-5432-01a23bc4d56e.png)',
            '4JIRA_1-1',
            'J-123',
            'JIRA-0',
            'qwerABC-1234QWER', // no match between suffix has letters
        ];
        noMatch.forEach((str) => {
            global.danger = { github: { pr: { body: str } } };
            global.warn = jest.fn();
            (0, index_1.default)({
                url: 'https://jira.net/browse',
            });
            expect(global.warn).toHaveBeenCalledWith((0, index_1.getWarningMessage)());
            global.warn = undefined;
        });
        const matches = {
            '[abc-808] Change some things': 'abc-808',
            'Change some things [abc-808]': 'abc-808',
            '[ABC-808] Change some things': 'ABC-808',
            'ab-123-qwer': 'ab-123',
            'ab-123-456': 'ab-123',
            'AB-123-asdf-456': 'AB-123',
            'ABC-123': 'ABC-123',
            'A1-123': 'A1-123',
            'a1-123': 'a1-123',
            'JA-123': 'JA-123',
            'JIRA-1': 'JIRA-1',
            'JIRA-10': 'JIRA-10',
            'jira-123': 'jira-123',
            'jira-123-change-some-things': 'jira-123',
            'JIRA-1245': 'JIRA-1245',
            'J1R4-12': 'J1R4-12',
            'J_RA-44': 'J_RA-44',
            'AtL4SiAn_JirRA-1': 'AtL4SiAn_JirRA-1',
            'Ticket: JIRA-123': 'JIRA-123',
            'Ticket:JIRA-123': 'JIRA-123',
            'Ticket(JIRA-123)': 'JIRA-123',
            'Ticket[JIRA-123]': 'JIRA-123',
        };
        Object.entries(matches).forEach(([str, matchValue]) => {
            const regexMatches = str.match(regex);
            expect(regexMatches).not.toBeNull();
            expect(regexMatches).toHaveLength(1);
            expect(matchValue).toBe(regexMatches === null || regexMatches === void 0 ? void 0 : regexMatches[0]);
        });
    });
});
