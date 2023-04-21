import jiraIntegration, { Options, getWarningMessage } from './index'

declare const global: any

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
}

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
}

const NO_MATCHES = {
  title: ['Change some things', '[abc-808ABCabc] Change some things'],
  branch: [
    'a-b-c-1-2-3',
    'abc-808abc',
    'abc-808abc123',
    'change-some-things-abc-808', // no match because does not start with Jira key (abc-808 is at end of string but it must be at the start)
  ],
  body: [
    '4JIRA_1-1', // no match because starts with number
    'J-123', // no match because prefix key needs to be at least 2 characters
    'JIRA-0', // no match because 0 is not a valid issue number
    'qwerABC-1234QWER', // no match between suffix has letters
    '(aaqwerqwerzxasefw12212-d1-2342-azxdv-23)', // no match because Jira key (d1-2342) is not the start of the string
    '(attachment)[aaqwerqwerzxasefw12212-d1-2342-azxdv-23]', // no match because Jira key (d1-2342) is not the start of the string
    'https://user-images.githubusercontent.com/123/232530143-abcdefgh-1ab1-9876-5432-01a23bc4d56e.png', // no match because there is no valid Jira key
    '[work snapshot](https://user-images.githubusercontent.com/123/232530143-abcdefgh-1ab1-9876-5432-01a23bc4d56e.png)', // no match because there is no valid Jira key
    'https://github.com/group/project/pull/123#issuecomment-1234567890',
    '[test](https://github.com/group/project/pull/123#issuecomment-1234567890)',
    'Closes abc\r\n\r\n-123.This PR adds',
    'Closes [ticket](https://jira.net/browse/abc-123).\r\n\r\nThis PR adds',
    'This PR adds\r\n\r\nCloses [ticket](https://jira.net/browse/abc-123).',
    'Change some things\n[Image](https://user-images.githubusercontent.com/123/232530143-abcdefgh-1ab1-9876-5432-01a23bc4d56e.png)',
  ],
}

describe('jiraIntegration()', () => {
  beforeEach(() => {
    global.warn = jest.fn()
    global.message = jest.fn()
  })
  afterEach(() => {
    global.danger = undefined
    global.warn = undefined
    global.message = undefined
  })

  it('throws when supplied invalid configuration', () => {
    const anyJira = jiraIntegration as any
    expect(() => anyJira()).toThrow()
    expect(() => jiraIntegration({} as any)).toThrow()
    expect(() => jiraIntegration({ key: 'ABC' } as any)).toThrow()
  })

  const noMatchTitleTest = (title: string, key?: Options['key']) => {
    it('warns when PR title is missing Jira issue key', () => {
      global.danger = { github: { pr: { title } } }
      jiraIntegration({
        url: 'https://jira.net/browse',
        key,
      })
      expect(global.warn).toHaveBeenCalledWith(getWarningMessage(key))
    })
  }

  const noMatchBranchTest = (ref: string, key?: Options['key']) => {
    it('warns when git branch is missing Jira issue key', () => {
      global.danger = { github: { pr: { head: { ref } } } }
      jiraIntegration({
        url: 'https://jira.net/browse',
        key,
      })

      expect(global.warn).toHaveBeenCalledWith(getWarningMessage(key))
    })
  }

  const noMatchBodyTest = (body: string, key?: Options['key']) => {
    it('warns when PR body is missing Jira issue key', () => {
      global.danger = { github: { pr: { body } } }
      jiraIntegration({
        url: 'https://jira.net/browse',
        key,
      })

      expect(global.warn).toHaveBeenCalledWith(getWarningMessage(key))
    })
  }

  const confirmResults = (results: Set<string>, match: string | string[]) => {
    expect(results.size).toEqual(Array.isArray(match) ? match.length : 1)

    if (results.size === 1) {
      expect(global.message).toHaveBeenCalledWith(`:link: <a href="https://jira.net/browse/${match}">${match}</a>`)
    } else if (Array.isArray(match)) {
      expect(global.message).toHaveBeenLastCalledWith(
        `:link: ${match
          .map((m) => {
            return `<a href="https://jira.net/browse/${m}">${m}</a>`
          })
          .join(', ')}`
      )

      // test that all values in results are in the match array
      expect(Array.from(results).every((value) => match.includes(value))).toBe(true)

      // test that all values in match are in results
      expect(match.every((value) => results.has(value))).toBe(true)
    }
  }

  const matchTitleTest = (title: string, match: string | string[], key?: Options['key']) => {
    it('supports Jira key in PR title', () => {
      global.danger = { github: { pr: { title } } }
      const results = jiraIntegration({
        url: 'https://jira.net/browse',
        key,
      })

      confirmResults(results, match)
    })
  }

  const matchBranchTest = (ref: string, match: string | string[], key?: Options['key']) => {
    it('supports Jira key in git branch', () => {
      global.danger = { github: { pr: { head: { ref } } } }
      const results = jiraIntegration({
        url: 'https://jira.net/browse',
        key,
      })

      confirmResults(results, match)
    })
  }

  const matchBodyTest = (body: string, match: string | string[], key?: Options['key']) => {
    it('supports Jira key in PR body', () => {
      global.danger = { github: { pr: { body } } }
      const results = jiraIntegration({
        url: 'https://jira.net/browse',
        key,
      })

      confirmResults(results, match)
    })
  }

  describe('has a key', () => {
    const key = 'ABC'
    Object.entries(MATCHES.title).forEach(([value, match]) => {
      matchTitleTest(value, match, key)
    })

    Object.entries(MATCHES.branch).forEach(([value, match]) => {
      matchBranchTest(value, match, key)
    })

    Object.entries(MATCHES.body).forEach(([value, match]) => {
      matchBodyTest(value, match, key)
    })

    NO_MATCHES.title.forEach((value) => {
      noMatchTitleTest(value, key)
    })

    NO_MATCHES.branch.forEach((value) => {
      noMatchBranchTest(value, key)
    })

    NO_MATCHES.body.forEach((value) => {
      noMatchBodyTest(value, key)
    })
  })

  describe('has multiple keys', () => {
    const key = ['ABC', 'DEF']

    Object.entries({ ...MATCHES.title, ...MULTI_MATCHES.title }).forEach(([value, match]) => {
      matchTitleTest(value, match, key)
    })

    Object.entries({ ...MATCHES.branch, ...MULTI_MATCHES.branch }).forEach(([value, match]) => {
      matchBranchTest(value, match, key)
    })

    Object.entries({ ...MATCHES.body, ...MULTI_MATCHES.body }).forEach(([value, match]) => {
      matchBodyTest(value, match, key)
    })

    NO_MATCHES.title.forEach((value) => {
      noMatchTitleTest(value, key)
    })

    NO_MATCHES.branch.forEach((value) => {
      noMatchBranchTest(value, key)
    })

    NO_MATCHES.body.forEach((value) => {
      noMatchBodyTest(value, key)
    })
  })

  describe('has no keys', () => {
    const key = undefined

    Object.entries({ ...MATCHES.title, ...MULTI_MATCHES.title }).forEach(([value, match]) => {
      matchTitleTest(value, match, key)
    })

    Object.entries({
      ...MATCHES.branch,
      ...MULTI_MATCHES.branch,
      ...{
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
      },
    }).forEach(([value, match]) => {
      matchBranchTest(value, match, key)
    })

    Object.entries({ ...MATCHES.body, ...MULTI_MATCHES.body }).forEach(([value, match]) => {
      matchBodyTest(value, match, key)
    })

    NO_MATCHES.title.forEach((value) => {
      noMatchTitleTest(value, key)
    })

    NO_MATCHES.branch.forEach((value) => {
      noMatchBranchTest(value, key)
    })

    NO_MATCHES.body.forEach((value) => {
      noMatchBodyTest(value, key)
    })
  })

  it('properly concatenates URL parts (trailing slash in url)', () => {
    global.danger = {
      github: { pr: { title: '[ABC-808] Change some things' } },
    }
    jiraIntegration({
      key: 'ABC',
      url: 'https://jira.net/browse/',
    })
    expect(global.message).toHaveBeenCalledWith(':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>')
  })

  it('does not match lowercase JIRA key in PR title when case-sensitive', () => {
    global.danger = {
      github: { pr: { title: '[abc-808] Change some things' } },
    }
    jiraIntegration({
      key: 'ABC',
      url: 'https://jira.net/browse',
      caseSensitive: true,
    })

    expect(global.warn).toHaveBeenCalled()
  })

  it('does not match JIRA key where letters are in the suffix', () => {
    global.danger = {
      github: { pr: { title: '[abc-808ABCabc] Change some things' } },
    }
    jiraIntegration({
      key: 'ABC',
      url: 'https://jira.net/browse',
      caseSensitive: true,
    })
    expect(global.warn).toHaveBeenCalled()
  })

  it('supports a custom format function', () => {
    global.danger = {
      github: { pr: { title: '[ABC-123][DEF-456] Change some things' } },
    }
    jiraIntegration({
      format: (jiraUrls) => {
        return `JIRA Tickets: ${jiraUrls.join(', ')}`
      },
      key: ['ABC', 'DEF'],
      url: 'https://jira.net/browse',
    })
    // expect(global.message).toHaveBeenCalledWith(
    //   'JIRA Tickets: <a href="https://jira.net/browse/ABC-123">ABC-123</a>, <a href="https://jira.net/browse/DEF-456">DEF-456</a>'
    // )
  })
})
