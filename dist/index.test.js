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
const MULTI_MATCHES = {
    title: {
        '[ABC-808][DEF-123] Change some things': ['ABC-808', 'DEF-123'],
        '[abc-808] [def-123] Change some things': ['ABC-808', 'DEF-123'],
        '[def-123] [abc-808] Change some things': ['DEF-123', 'ABC-808'],
        'ABC-808, DEF-123 Change some things': ['ABC-808', 'DEF-123'],
        'ABC-808,DEF-123 Change some things': ['ABC-808', 'DEF-123'],
        'ABC-808 | DEF-123 Change some things': ['ABC-808', 'DEF-123'],
        'ABC-808|DEF-123 Change some things': ['ABC-808', 'DEF-123'],
    },
    branch: {},
    body: {
        'Closes abc-123, def-123\r\n\r\nThis PR adds': ['ABC-123', 'DEF-123'],
        'Ticket: ABC-123\nTicket: DEF-123': ['ABC-123', 'DEF-123'],
        'This PR adds def-123\r\n\r\nCloses [abc-123](https://jira.net/browse/abc-123).': ['DEF-123', 'ABC-123'],
    },
};
const MATCHES = {
    title: {
        '[abc-808] Change some things': 'ABC-808',
        '[ABC-808] Change some things': 'ABC-808',
        'Change some things [abc-808]': 'ABC-808',
        'My changes - ABC-123': 'ABC-123',
    },
    branch: {
        'abc-123-qwer': 'ABC-123',
        'abc-123-456': 'ABC-123',
        'abc-123-def-456': 'ABC-123',
        'ABC-123-asdf-456': 'ABC-123',
        'abc-123/some-things': 'ABC-123',
        'ABC-123/some-things': 'ABC-123',
    },
    body: {
        'ABC-123': 'ABC-123',
        'Ticket: ABC-123': 'ABC-123',
        'Ticket:ABC-123': 'ABC-123',
        'Ticket(ABC-123)': 'ABC-123',
        'Ticket[ABC-123]': 'ABC-123',
        'Ticket: abc-123': 'ABC-123',
        'Ticket:abc-123': 'ABC-123',
        'Ticket(abc-123)': 'ABC-123',
        'Ticket[abc-123]': 'ABC-123',
        'Closes abc-123.\r\n\r\nThis PR adds': 'ABC-123',
        'Closes [abc-123](https://jira.net/browse/abc-123).\r\n\r\nThis PR adds': 'ABC-123',
        'This PR adds\r\n\r\nCloses [abc-123](https://jira.net/browse/abc-123).': 'ABC-123',
        'This PR adds\r\n\r\nCloses abc-123': 'ABC-123',
    },
};
const NO_MATCHES = {
    title: ['Change some things', '[abc-808ABCabc] Change some things'],
    branch: [
        'a-b-c-1-2-3',
        'abc-808abc',
        'abc-808abc123',
        'change-some-things-abc-808', // no match because does not start with Jira key (abc-808 is at end of string but it must be at the start)
    ],
    body: [
        '4JIRA_1-1',
        'J-123',
        'JIRA-0',
        'qwerABC-1234QWER',
        '(aaqwerqwerzxasefw12212-d1-2342-azxdv-23)',
        '(attachment)[aaqwerqwerzxasefw12212-d1-2342-azxdv-23]',
        'https://user-images.githubusercontent.com/123/232530143-abcdefgh-1ab1-9876-5432-01a23bc4d56e.png',
        '[work snapshot](https://user-images.githubusercontent.com/123/232530143-abcdefgh-1ab1-9876-5432-01a23bc4d56e.png)',
        'https://github.com/group/project/pull/123#issuecomment-1234567890',
        '[test](https://github.com/group/project/pull/123#issuecomment-1234567890)',
        'Closes abc\r\n\r\n-123.This PR adds',
        'Closes [ticket](https://jira.net/browse/abc-123).\r\n\r\nThis PR adds',
        'This PR adds\r\n\r\nCloses [ticket](https://jira.net/browse/abc-123).',
        'Change some things\n[Image](https://user-images.githubusercontent.com/123/232530143-abcdefgh-1ab1-9876-5432-01a23bc4d56e.png)',
    ],
};
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
    const noMatchTitleTest = (title, key) => {
        it('warns when PR title is missing Jira issue key', () => {
            global.danger = { github: { pr: { title } } };
            (0, index_1.default)({
                url: 'https://jira.net/browse',
                key,
            });
            expect(global.warn).toHaveBeenCalledWith((0, index_1.getWarningMessage)(key));
        });
    };
    const noMatchBranchTest = (ref, key) => {
        it('warns when git branch is missing Jira issue key', () => {
            global.danger = { github: { pr: { head: { ref } } } };
            (0, index_1.default)({
                url: 'https://jira.net/browse',
                key,
            });
            expect(global.warn).toHaveBeenCalledWith((0, index_1.getWarningMessage)(key));
        });
    };
    const noMatchBodyTest = (body, key) => {
        it('warns when PR body is missing Jira issue key', () => {
            global.danger = { github: { pr: { body } } };
            (0, index_1.default)({
                url: 'https://jira.net/browse',
                key,
            });
            expect(global.warn).toHaveBeenCalledWith((0, index_1.getWarningMessage)(key));
        });
    };
    const confirmResults = (results, match) => {
        expect(results.size).toEqual(Array.isArray(match) ? match.length : 1);
        if (results.size === 1) {
            expect(global.message).toHaveBeenCalledWith(`:link: <a href="https://jira.net/browse/${match}">${match}</a>`);
        }
        else if (Array.isArray(match)) {
            expect(global.message).toHaveBeenLastCalledWith(`:link: ${match
                .map((m) => {
                return `<a href="https://jira.net/browse/${m}">${m}</a>`;
            })
                .join(', ')}`);
            // test that all values in results are in the match array
            expect(Array.from(results).every((value) => match.includes(value))).toBe(true);
            // test that all values in match are in results
            expect(match.every((value) => results.has(value))).toBe(true);
        }
    };
    const matchTitleTest = (title, match, key) => {
        it('supports Jira key in PR title', () => {
            global.danger = { github: { pr: { title } } };
            const results = (0, index_1.default)({
                url: 'https://jira.net/browse',
                key,
            });
            confirmResults(results, match);
        });
    };
    const matchBranchTest = (ref, match, key) => {
        it('supports Jira key in git branch', () => {
            global.danger = { github: { pr: { head: { ref } } } };
            const results = (0, index_1.default)({
                url: 'https://jira.net/browse',
                key,
            });
            confirmResults(results, match);
        });
    };
    const matchBodyTest = (body, match, key) => {
        it('supports Jira key in PR body', () => {
            global.danger = { github: { pr: { body } } };
            const results = (0, index_1.default)({
                url: 'https://jira.net/browse',
                key,
            });
            confirmResults(results, match);
        });
    };
    describe('has a key', () => {
        const key = 'ABC';
        Object.entries(MATCHES.title).forEach(([value, match]) => {
            matchTitleTest(value, match, key);
        });
        Object.entries(MATCHES.branch).forEach(([value, match]) => {
            matchBranchTest(value, match, key);
        });
        Object.entries(MATCHES.body).forEach(([value, match]) => {
            matchBodyTest(value, match, key);
        });
        NO_MATCHES.title.forEach((value) => {
            noMatchTitleTest(value, key);
        });
        NO_MATCHES.branch.forEach((value) => {
            noMatchBranchTest(value, key);
        });
        NO_MATCHES.body.forEach((value) => {
            noMatchBodyTest(value, key);
        });
    });
    describe('has multiple keys', () => {
        const key = ['ABC', 'DEF'];
        Object.entries(Object.assign(Object.assign({}, MATCHES.title), MULTI_MATCHES.title)).forEach(([value, match]) => {
            matchTitleTest(value, match, key);
        });
        Object.entries(Object.assign(Object.assign({}, MATCHES.branch), MULTI_MATCHES.branch)).forEach(([value, match]) => {
            matchBranchTest(value, match, key);
        });
        Object.entries(Object.assign(Object.assign({}, MATCHES.body), MULTI_MATCHES.body)).forEach(([value, match]) => {
            matchBodyTest(value, match, key);
        });
        NO_MATCHES.title.forEach((value) => {
            noMatchTitleTest(value, key);
        });
        NO_MATCHES.branch.forEach((value) => {
            noMatchBranchTest(value, key);
        });
        NO_MATCHES.body.forEach((value) => {
            noMatchBodyTest(value, key);
        });
    });
    describe('has no keys', () => {
        const key = undefined;
        Object.entries(Object.assign(Object.assign({}, MATCHES.title), MULTI_MATCHES.title)).forEach(([value, match]) => {
            matchTitleTest(value, match, key);
        });
        Object.entries(Object.assign(Object.assign(Object.assign({}, MATCHES.branch), MULTI_MATCHES.branch), {
            'A1-123': 'A1-123',
            'a1-123': 'A1-123',
            'JA-123': 'JA-123',
            'JIRA-1': 'JIRA-1',
            'JIRA-10': 'JIRA-10',
            'jira-123': 'JIRA-123',
            'JIRA-1245': 'JIRA-1245',
            'J1R4-12': 'J1R4-12',
            'J_RA-44': 'J_RA-44',
            'AtL4SiAn_JirRA-1': 'ATL4SIAN_JIRRA-1',
        })).forEach(([value, match]) => {
            matchBranchTest(value, match, key);
        });
        Object.entries(Object.assign(Object.assign({}, MATCHES.body), MULTI_MATCHES.body)).forEach(([value, match]) => {
            matchBodyTest(value, match, key);
        });
        NO_MATCHES.title.forEach((value) => {
            noMatchTitleTest(value, key);
        });
        NO_MATCHES.branch.forEach((value) => {
            noMatchBranchTest(value, key);
        });
        NO_MATCHES.body.forEach((value) => {
            noMatchBodyTest(value, key);
        });
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
        // expect(global.message).toHaveBeenCalledWith(
        //   'JIRA Tickets: <a href="https://jira.net/browse/ABC-123">ABC-123</a>, <a href="https://jira.net/browse/DEF-456">DEF-456</a>'
        // )
    });
});
