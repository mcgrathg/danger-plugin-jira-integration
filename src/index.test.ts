import jiraIntegration from './index'

declare const global: any

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

  it('warns when PR title is missing JIRA issue key', () => {
    global.danger = { github: { pr: { title: 'Change some things' } } }
    jiraIntegration({
      key: 'ABC',
      url: 'https://jira.net/browse',
    })
    expect(global.warn).toHaveBeenCalledWith(
      `No JIRA keys found in the PR title, branch name, or commit messages (e.g. ABC-123).`
    )
  })

  it('warns when PR title is missing all of the multiple JIRA issue keys', () => {
    global.danger = { github: { pr: { title: 'Change some things' } } }
    jiraIntegration({
      key: ['ABC', 'DEF'],
      url: 'https://jira.net/browse',
    })
    expect(global.warn).toHaveBeenCalledWith(
      "No JIRA keys found in the PR title, branch name, or commit messages (e.g. ABC-123, DEF-123)."
    )


  })

  it('adds the JIRA issue link from PR title to the messages table', () => {
    global.danger = {
      github: { pr: { title: '[ABC-808] Change some things' } },
    }
    jiraIntegration({
      key: 'ABC',
      url: 'https://jira.net/browse',
    })
    expect(global.message).toHaveBeenCalledWith(
      ':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>'
    )
  })

  it('properly concatenates URL parts (trailing slash in url)', () => {
    global.danger = {
      github: { pr: { title: '[ABC-808] Change some things' } },
    }
    jiraIntegration({
      key: 'ABC',
      url: 'https://jira.net/browse/',
    })
    expect(global.message).toHaveBeenCalledWith(
      ':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>'
    )
  })
  it('matches JIRA issue anywhere in title', () => {
    global.danger = { github: { pr: { title: 'My changes - ABC-123' } } }
    jiraIntegration({
      key: 'ABC',
      url: 'https://jira.net/browse',
    })
    expect(global.message).toHaveBeenCalledWith(
      ':link: <a href="https://jira.net/browse/ABC-123">ABC-123</a>'
    )
  })
  it('matches JIRA issue anywhere in title when no configuration key', () => {
    global.danger = { github: { pr: { title: 'My changes - ABC-123' } } }
    jiraIntegration({
      url: 'https://jira.net/browse',
    })
    expect(global.message).toHaveBeenCalledWith(
      ':link: <a href="https://jira.net/browse/ABC-123">ABC-123</a>'
    )
  })

  it('matches lowercase JIRA key in the git branch', () => {
    global.danger = {
      github: { pr: { head: { ref: 'abc-808/some-things' } } },

    }
    jiraIntegration({
      key: 'ABC',
      url: 'https://jira.net/browse',
    })
    expect(global.message).toHaveBeenCalledWith(
      ':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>'
    )
  })
  it('matches lowercase JIRA key in PR title', () => {
    global.danger = {
      github: { pr: { title: '[abc-808] Change some things' } },
    }
    jiraIntegration({
      key: 'ABC',
      url: 'https://jira.net/browse',
    })
    expect(global.message).toHaveBeenCalledWith(
      ':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>'
    )
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
  it('supports multiple JIRA keys in PR title', () => {
    global.danger = {
      github: { pr: { title: '[ABC-123][ABC-456] Change some things' } },
    }
    jiraIntegration({
      key: 'ABC',
      url: 'https://jira.net/browse',
    })
    expect(global.message).toHaveBeenCalledWith(
      ':link: <a href="https://jira.net/browse/ABC-123">ABC-123</a>, <a href="https://jira.net/browse/ABC-456">ABC-456</a>'
    )
  })
  it('supports multiple JIRA boards in PR title', () => {
    global.danger = {
      github: { pr: { title: '[ABC-123][DEF-456] Change some things' } },
    }
    jiraIntegration({
      key: ['ABC', 'DEF'],
      url: 'https://jira.net/browse',
    })
    expect(global.message).toHaveBeenCalledWith(
      ':link: <a href="https://jira.net/browse/ABC-123">ABC-123</a>, <a href="https://jira.net/browse/DEF-456">DEF-456</a>'
    )
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
    expect(global.message).toHaveBeenCalledWith(
      'JIRA Tickets: <a href="https://jira.net/browse/ABC-123">ABC-123</a>, <a href="https://jira.net/browse/DEF-456">DEF-456</a>'
    )
  })
  it('supports JIRA key in the git branch', () => {
    global.danger = {
      github: { pr: { head: { ref: 'ABC-808/some-things' } } },
    }
    jiraIntegration({
      key: 'ABC',
      url: 'https://jira.net/browse',
    })
    expect(global.message).toHaveBeenCalledWith(
      ':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>'
    )
  })
  it('supports JIRA key in the git branch when no configuration key', () => {
    global.danger = {
      github: { pr: { head: { ref: 'ABC-808/some-things' } } },
    }
    jiraIntegration({
      url: 'https://jira.net/browse',
    })
    expect(global.message).toHaveBeenCalledWith(
      ':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>'
    )
  })
  it('supports JIRA key in the PR body', () => {
    global.danger = { github: { pr: { body: '[ABC-808] Change some things' } } }

    jiraIntegration({
      key: 'ABC',
      url: 'https://jira.net/browse',
    })
    expect(global.message).toHaveBeenCalledWith(
      ':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>'
    )
  })
  it('supports JIRA key in the PR body when no configuration key', () => {
    global.danger = { github: { pr: { body: '[ABC-808] Change some things' } } }

    jiraIntegration({
      url: 'https://jira.net/browse',
    })
    expect(global.message).toHaveBeenCalledWith(
      ':link: <a href="https://jira.net/browse/ABC-808">ABC-808</a>'
    )
  })
})
