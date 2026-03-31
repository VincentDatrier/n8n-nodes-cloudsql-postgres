/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import { NodeConnectionTypes, type INodeTypeDescription } from 'n8n-workflow';

import * as database from './database/Database.resource';

export const versionDescription: INodeTypeDescription = {
	displayName: 'Cloud SQL (Postgres)',
	name: 'cloudSqlPostgres',
	icon: 'file:cloudsql.svg',
	group: ['input'],
	version: [2, 3, 4, 5, 6, 7, 8],
	subtitle: '={{ $parameter["operation"] }}',
	description: 'Get, add and update data in a Cloud SQL Postgres instance',
	defaults: {
		name: 'Cloud SQL (Postgres)',
	},
	inputs: [NodeConnectionTypes.Main],
	outputs: [NodeConnectionTypes.Main],
	usableAsTool: true,
	credentials: [
		{
			name: 'cloudSqlPostgres',
			required: true,
			testedBy: 'cloudSqlPostgresConnectionTest',
		},
	],
	properties: [
		{
			displayName: 'Resource',
			name: 'resource',
			type: 'hidden',
			noDataExpression: true,
			options: [
				{
					name: 'Database',
					value: 'database',
				},
			],
			default: 'database',
		},
		...database.description,
	],
};
