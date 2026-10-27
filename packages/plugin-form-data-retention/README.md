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
- `delete` removes a submission for good. `anonymise` keeps it for counts: only the answers in
  `keepFields`, the date, the language, the campaign and the page without its query string. The
  IP address, browser and referrer go.
- `forgetAddressesAfterDays` drops visitors' IP address and browser from every form after that
  many days, and keeps their answers.

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
how many submissions). A request is kept by its `reference`, a hash the same email or phone gives
again in the same project, never by the email or phone itself. An erase leaves no copy in the
project's activity log either.

Everything lives in the project's workspace, `.moteur/plugin-form-data-retention/`: never in Git.

## What it can't reach

- The `moteur-userdata-snapshots` branch on your server keeps earlier snapshots of submissions,
  and your backups keep their copies. Erasing removes the live submission, not those. Prune them
  on the schedule your privacy policy states, and tell people so.
- Copies made by the form's actions: an entry it created, an email it sent, a webhook another
  service received. Delete those where they live.
- Submissions a person in your team deleted earlier: the activity log keeps a copy of those.
