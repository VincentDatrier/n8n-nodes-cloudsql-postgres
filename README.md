# n8n-nodes-cloudsql-postgres

This is an n8n community node package that lets you work with **Google Cloud SQL for PostgreSQL** directly from n8n workflows.

It includes:
- A database node for common SQL operations (select/insert/update/upsert/delete and custom queries)
- A trigger node for PostgreSQL `LISTEN/NOTIFY`, including optional auto-created table-change triggers

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Development](#development)  
[Resources](#resources)  
[Version history](#version-history)

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

Package name:

```bash
n8n-nodes-cloudsql-postgres
```

For local development:

```bash
npm install
npm run dev
```

## Operations

### Cloud SQL (Postgres)

Supported operations:
- **Select** rows from a table
- **Insert** rows into a table
- **Update** rows in a table
- **Insert or Update** (upsert)
- **Delete Table/Rows** with `truncate`, `delete`, or `drop`
- **Execute Query** for custom SQL

Notable capabilities:
- Query batching modes (`single`, `independently`, `transaction`)
- Dynamic schema/table/column loading
- Query parameter support (`$1`, `$2`, ...)
- Optional return columns for write operations
- Optional conversion behavior for large numbers and empty strings

### Cloud SQL (Postgres) Trigger

Supported trigger modes:
- **Table Row Change Events**: create and listen on a trigger/channel for `INSERT`, `UPDATE`, or `DELETE`
- **Advanced**: listen on an existing PostgreSQL channel

## Credentials

Credential name in n8n: **Cloud SQL (Postgres)**

Required fields:
- Instance Connection Name (`project:region:instance`)
- IP Type (`PUBLIC`, `PRIVATE`, `PSC`)
- Authentication Type (`PASSWORD` or `IAM`)
- Database
- Maximum Number of Connections
- Google Auth Method (`Service Account JSON Key` or `Application Default Credentials`)

Authentication behavior:
- `PASSWORD` mode uses database `User` + `Password`
- `IAM` mode uses IAM DB authentication with the service account identity
- If `Service Account JSON Key` is selected, provide `Service Account JSON`
- If `Application Default Credentials` is selected, credentials are taken from the runtime environment

## Compatibility

- Uses `n8nNodesApiVersion: 1`
- Database node versions available: `2` through `8` (default: `8`)
- Trigger node version: `1`

This package uses external dependencies (`@google-cloud/cloud-sql-connector`, `google-auth-library`, `pg-promise`) and has `n8n.strict = false`.

Because of that, this package is intended for **self-hosted n8n** and is **not eligible for n8n Cloud verification**.

## Usage

### Basic database setup

1. Add **Cloud SQL (Postgres)** credentials.
2. Set `Instance Connection Name`, `IP Type`, and auth settings.
3. Add a **Cloud SQL (Postgres)** node and choose an operation.
4. Select schema/table (or use expressions), then configure operation-specific fields.

### Trigger setup

1. Add a **Cloud SQL (Postgres) Trigger** node.
2. Choose `Table Row Change Events` to auto-manage trigger/function/channel.
3. Choose `Advanced` to listen on an existing channel.
4. Activate the workflow to keep listening continuously.

### Execute Query tips

- Use query parameters instead of string concatenation.
- Example query:

```sql
SELECT id, name
FROM users
WHERE status = $1 AND created_at >= $2
```

- Set `Query Parameters` to something like: `active,2026-01-01`

## Development

Available scripts:
- `npm run dev` - Start n8n with watch mode
- `npm run build` - Build `dist/`
- `npm run lint` - Run linter
- `npm run lint:fix` - Auto-fix lint issues
- `npm run release` - Run release flow

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [n8n community nodes installation](https://docs.n8n.io/integrations/community-nodes/installation/)
- [Google Cloud SQL Node.js Connector](https://github.com/GoogleCloudPlatform/cloud-sql-nodejs-connector)
- [Cloud SQL for PostgreSQL docs](https://cloud.google.com/sql/docs/postgres)

## Version history

- `1.0.0` - Initial stable release of the Cloud SQL PostgreSQL database + trigger nodes
