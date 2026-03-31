import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class CloudSqlPostgres implements ICredentialType {
	name = 'cloudSqlPostgres';
	displayName = 'Cloud SQL (Postgres)';
	icon = 'file:postgres.svg' as const;
	testedBy = 'cloudSqlPostgresConnectionTest';
	documentationUrl = 'https://github.com/GoogleCloudPlatform/cloud-sql-nodejs-connector#usage';

	properties: INodeProperties[] = [
		{
			displayName: 'Instance Connection Name',
			name: 'instanceConnectionName',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'project:region:instance',
			description: 'The Cloud SQL instance connection name in the format project:region:instance',
		},
		{
			displayName: 'IP Type',
			name: 'ipType',
			type: 'options',
			options: [
				{ name: 'Public', value: 'PUBLIC' },
				{ name: 'Private', value: 'PRIVATE' },
				{ name: 'PSC', value: 'PSC' },
			],
			default: 'PUBLIC',
			description: 'The IP address type used to connect to the Cloud SQL instance',
		},
		{
			displayName: 'Authentication Type',
			name: 'authType',
			type: 'options',
			options: [
				{
					name: 'Password',
					value: 'PASSWORD',
					description: 'Authenticate with a database username and password',
				},
				{
					name: 'IAM',
					value: 'IAM',
					description:
						'Authenticate using IAM — the service account email becomes the database user',
				},
			],
			default: 'PASSWORD',
		},
		{
			displayName: 'Database',
			name: 'database',
			type: 'string',
			default: 'postgres',
		},
		{
			displayName: 'User',
			name: 'user',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					authType: ['PASSWORD'],
				},
			},
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			displayOptions: {
				show: {
					authType: ['PASSWORD'],
				},
			},
		},
		{
			displayName: 'Google Auth Method',
			name: 'googleAuthMethod',
			type: 'options',
			options: [
				{
					name: 'Service Account JSON Key',
					value: 'serviceAccountKey',
					description: 'Authenticate using a downloaded service account JSON key file',
				},
				{
					name: 'Application Default Credentials',
					value: 'adc',
					description:
						'Use credentials auto-configured by the environment (Workload Identity, GCE metadata server, gcloud CLI, etc.)',
				},
			],
			default: 'serviceAccountKey',
		},
		{
			displayName: 'Service Account JSON',
			name: 'serviceAccountJson',
			type: 'string',
			typeOptions: {
				password: true,
				rows: 4,
			},
			default: '',
			required: true,
			description: 'Paste the contents of your Google service account JSON key file',
			placeholder: '{ "type": "service_account", "project_id": "...", ... }',
			displayOptions: {
				show: {
					googleAuthMethod: ['serviceAccountKey'],
				},
			},
		},
		{
			displayName: 'Maximum Number of Connections',
			name: 'maxConnections',
			type: 'number',
			default: 100,
			description:
				'Make sure this value times the number of workers you have is lower than the maximum number of connections your postgres instance allows.',
		},
	];
}
