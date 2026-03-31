import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';

import { PostgresV2 } from './v2/PostgresV2.node';

export class CloudSqlPostgres extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'Cloud SQL (Postgres)',
			name: 'cloudSqlPostgres',
			icon: 'file:postgres.svg',
			group: ['input'],
			defaultVersion: 8,
			description: 'Get, add and update data in a Cloud SQL Postgres instance',
			parameterPane: 'wide',
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			2: new PostgresV2(baseDescription),
			3: new PostgresV2(baseDescription),
			4: new PostgresV2(baseDescription),
			5: new PostgresV2(baseDescription),
			6: new PostgresV2(baseDescription),
			7: new PostgresV2(baseDescription),
			8: new PostgresV2(baseDescription),
		};

		super(nodeVersions, baseDescription);
	}
}
