# @moteurio/plugin-form-data-retention

How long each form keeps what visitors send, and what a person can ask for: a copy of everything
they sent, or to be forgotten. For GDPR (articles 5, 15 and 17), Quebec's Law 25 and your own
privacy policy. MIT.

Project plugin: enable it on the host, then per project as usual. Every route needs a project
admin.

## A retention policy

```http
PUT /projects/:projectId/retention
Content-Type: application/json

{
    "default": { "keepDays": 365, "then": "delete" },
    "forms": {
        "contact": { "keepDays": 90, "then": "anonymise", "keepFields": ["topic"] },
        "newsletter": null
    },
    "forgetAddressesAfterDays": 30
}
```

- `default` applies to every form without its own rule. `null` for a form keeps its submissions
  until someone deletes them.
- `delete` removes a submission for good. `anonymise` keeps it for counts, with nothing about the
  person. What stays is listed below, and everything else goes.
- `forgetAddressesAfterDays` drops visitors' IP address and browser from every form after that
  many days, and keeps their answers.

An anonymised submission keeps exactly this:

- the answers in `keepFields`, and no other answer
- the date it was sent, and the language it was sent in
- the campaign's source, medium and name (not its term or content, which can be set for each
  recipient)
- the page it was sent from, without its query string
- its status, when it was first read (not who read it) and, for spam, when it became spam, so it's
  still deleted on time
- which of the form's actions ran and whether they worked, without their error, detail or the
  entry they made

The IP address, browser, referrer, spam checks' scores and notes, and who in your team read it all
go. A sweep looks at every submission past its days each time, so one restored from a backup or
imported later with its first date is handled like the others.

The policy runs every hour (`RETENTION_SWEEP_MINUTES`, `0` turns it off), and a minute after the
API starts. `POST /projects/:projectId/retention/run?dryRun=1` counts what would change without
changing anything; without `dryRun` it runs now. `GET /projects/:projectId/retention` shows each
form's rule, its submissions and how many are past their days.

Spam is not this plugin's: the engine deletes it 30 days after it arrived.

## A person's requests

A person is found by the email or phone number they wrote in any answer, in every form: emails
ignoring case, phones by their digits (`+1 514 555-0199` and `(514) 555 0199` match). They are
sent in the body, never in the address, which ends up in logs.

| Route                                    | What it does                                                      |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `POST …/retention/people/find`           | Which submissions they sent: form, date, status                   |
| `POST …/retention/people/export`         | Everything they sent, with where from, as JSON to send them       |
| `POST …/retention/people/erase`          | Deletes all of it for good, and answers a receipt to send them    |

The same commands exist in the CLI and MCP: `retention show`, `retention run [--dry-run]`,
`retention export --email …`, `retention erase --email …`.

## What is kept about it

`GET /projects/:projectId/retention/log` lists each sweep (how many deleted, anonymised and
addresses forgotten, by form), each policy change and each request (who in your team made it,
how many submissions). A request is kept by its `reference`, never by the email or phone itself.
The same email or phone gives the same reference again in the same project, and nobody can work
one out from an email they guess: it is signed with a key of the project's, derived from the
server's `JWT_SECRET` and never written anywhere. Changing `JWT_SECRET` gives new references from
then on. An erase leaves no copy in the project's activity log either.

Everything lives in the project's workspace, `.moteur/plugin-form-data-retention/`: never in Git.

## What it can't reach

- The `moteur-userdata-snapshots` branch on your server keeps earlier snapshots of submissions,
  and your backups keep their copies. Erasing removes the live submission, not those. Prune them
  on the schedule your privacy policy states, and tell people so.
- Copies made by the form's actions: an entry it created, an email it sent, a webhook another
  service received. Delete those where they live.
- Submissions a person in your team deleted earlier: the activity log keeps a copy of those.
