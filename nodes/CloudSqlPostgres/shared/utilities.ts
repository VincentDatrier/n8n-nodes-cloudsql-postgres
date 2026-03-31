import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isNull from 'lodash/isNull';
import isObject from 'lodash/isObject';
import merge from 'lodash/merge';
import reduce from 'lodash/reduce';
import type {
	IDataObject,
	IDisplayOptions,
	IExecuteFunctions,
	INode,
	INodeExecutionData,
	INodeProperties,
	IPairedItemData,
} from 'n8n-workflow';
import {
	ApplicationError,
	jsonParse,
	MYSQL_NODE_TYPE,
	POSTGRES_NODE_TYPE,
	randomInt,
} from 'n8n-workflow';

export function chunk<T>(array: T[], size = 1) {
	const length = array === null ? 0 : array.length;
	if (!length || size < 1) {
		return [];
	}
	let index = 0;
	let resIndex = 0;
	const result = new Array(Math.ceil(length / size));

	while (index < length) {
		result[resIndex++] = array.slice(index, (index += size));
	}
	return result as T[][];
}

export const shuffleArray = <T>(array: T[]): void => {
	for (let i = array.length - 1; i > 0; i--) {
		const j = randomInt(i + 1);
		[array[i], array[j]] = [array[j], array[i]];
	}
};

export const flattenKeys = (obj: IDataObject, prefix: string[] = []): IDataObject => {
	return !isObject(obj)
		? { [prefix.join('.')]: obj }
		: reduce(
				obj,
				(cum, next, key) => merge(cum, flattenKeys(next as IDataObject, [...prefix, key])),
				{},
			);
};

export function flatten<T>(nestedArray: T[][]) {
	const result = [];

	(function loop(array: T[] | T[][]) {
		for (let i = 0; i < array.length; i++) {
			if (Array.isArray(array[i])) {
				loop(array[i] as T[]);
			} else {
				result.push(array[i]);
			}
		}
	})(nestedArray);

	return result as any;
}

export const compareItems = <T extends { json: Record<string, unknown> }>(
	obj1: T,
	obj2: T,
	keys: string[],
	disableDotNotation: boolean = false,
): boolean => {
	let result = true;
	for (const key of keys) {
		if (!disableDotNotation) {
			if (!isEqual(get(obj1.json, key), get(obj2.json, key))) {
				result = false;
				break;
			}
		} else {
			if (!isEqual(obj1.json[key], obj2.json[key])) {
				result = false;
				break;
			}
		}
	}
	return result;
};

export function updateDisplayOptions(
	displayOptions: IDisplayOptions,
	properties: INodeProperties[],
) {
	return properties.map((nodeProperty) => {
		return {
			...nodeProperty,
			displayOptions: merge({}, nodeProperty.displayOptions, displayOptions),
		};
	});
}

export function processJsonInput<T>(jsonData: T, inputName?: string) {
	let values;
	const input = inputName ? `'${inputName}' ` : '';

	if (typeof jsonData === 'string') {
		try {
			values = jsonParse(jsonData);
		} catch (error) {
			throw new ApplicationError(`Input ${input} must contain a valid JSON`, { level: 'warning' });
		}
	} else if (typeof jsonData === 'object') {
		values = jsonData;
	} else {
		throw new ApplicationError(`Input ${input} must contain a valid JSON`, { level: 'warning' });
	}

	return values;
}

function isFalsy<T>(value: T) {
	if (isNull(value)) return true;
	if (typeof value === 'string' && value === '') return true;
	if (Array.isArray(value) && value.length === 0) return true;
	return false;
}

const parseStringAndCompareToObject = (str: string, arr: IDataObject) => {
	try {
		const parsedArray = jsonParse(str);
		return isEqual(parsedArray, arr);
	} catch (error) {
		return false;
	}
};

export const fuzzyCompare = (useFuzzyCompare: boolean, compareVersion = 1) => {
	if (!useFuzzyCompare) {
		return <T, U>(item1: T, item2: U) => isEqual(item1, item2);
	}

	return <T, U>(item1: T, item2: U) => {
		if (!isNull(item1) && !isNull(item2) && typeof item1 === typeof item2) {
			return isEqual(item1, item2);
		}

		if (compareVersion >= 2) {
			if (isNull(item1) && (isNull(item2) || item2 === 0 || item2 === '0')) {
				return true;
			}

			if (isNull(item2) && (isNull(item1) || item1 === 0 || item1 === '0')) {
				return true;
			}
		}

		if (isFalsy(item1) && isFalsy(item2)) return true;

		if (isFalsy(item1) && item2 === undefined) return true;
		if (item1 === undefined && isFalsy(item2)) return true;

		if (typeof item1 === 'number' && typeof item2 === 'string') {
			return item1.toString() === item2;
		}

		if (typeof item1 === 'string' && typeof item2 === 'number') {
			return item1 === item2.toString();
		}

		if (!isNull(item1) && typeof item1 === 'object' && typeof item2 === 'string') {
			return parseStringAndCompareToObject(item2, item1 as IDataObject);
		}

		if (!isNull(item2) && typeof item1 === 'string' && typeof item2 === 'object') {
			return parseStringAndCompareToObject(item1, item2 as IDataObject);
		}

		if (typeof item1 === 'boolean' && typeof item2 === 'string') {
			if (item1 === true && item2.toLocaleLowerCase() === 'true') return true;
			if (item1 === false && item2.toLocaleLowerCase() === 'false') return true;
		}

		if (typeof item2 === 'boolean' && typeof item1 === 'string') {
			if (item2 === true && item1.toLocaleLowerCase() === 'true') return true;
			if (item2 === false && item1.toLocaleLowerCase() === 'false') return true;
		}

		if (typeof item1 === 'boolean' && typeof item2 === 'number') {
			if (item1 === true && item2 === 1) return true;
			if (item1 === false && item2 === 0) return true;
		}

		if (typeof item2 === 'boolean' && typeof item1 === 'number') {
			if (item2 === true && item1 === 1) return true;
			if (item2 === false && item1 === 0) return true;
		}

		if (typeof item1 === 'boolean' && typeof item2 === 'string') {
			if (item1 === true && item2 === '1') return true;
			if (item1 === false && item2 === '0') return true;
		}

		if (typeof item2 === 'boolean' && typeof item1 === 'string') {
			if (item2 === true && item1 === '1') return true;
			if (item2 === false && item1 === '0') return true;
		}

		return isEqual(item1, item2);
	};
};

export function wrapData(data: IDataObject | IDataObject[]): INodeExecutionData[] {
	if (!Array.isArray(data)) {
		return [{ json: data }];
	}
	return data.map((item) => ({
		json: item,
	}));
}

export const keysToLowercase = <T>(headers: T) => {
	if (typeof headers !== 'object' || Array.isArray(headers) || headers === null) return headers;
	return Object.entries(headers).reduce((acc, [key, value]) => {
		acc[key.toLowerCase()] = value as IDataObject;
		return acc;
	}, {} as IDataObject);
};

export function formatPrivateKey(privateKey: string, keyIsPublic = false): string {
	let regex = /(PRIVATE KEY|CERTIFICATE)/;
	if (keyIsPublic) {
		regex = /(PUBLIC KEY)/;
	}
	if (!privateKey || /\n/.test(privateKey)) {
		return privateKey;
	}
	let formattedPrivateKey = '';
	const parts = privateKey.split('-----').filter((item) => item !== '');
	parts.forEach((part) => {
		if (regex.test(part)) {
			formattedPrivateKey += `-----${part}-----`;
		} else {
			const passRegex = /Proc-Type|DEK-Info/;
			if (passRegex.test(part)) {
				part = part.replace(/:\s+/g, ':');
				formattedPrivateKey += part.replace(/\\n/g, '\n').replace(/\s+/g, '\n');
			} else {
				formattedPrivateKey += part.replace(/\\n/g, '\n').replace(/\s+/g, '\n');
			}
		}
	});
	return formattedPrivateKey;
}

export function getResolvables(expression: string) {
	if (!expression) return [];

	const resolvables = [];
	const resolvableRegex = /({{[\s\S]*?}})/g;

	let match;

	while ((match = resolvableRegex.exec(expression)) !== null) {
		if (match[1]) {
			resolvables.push(match[1]);
		}
	}

	return resolvables;
}

export function flattenObject(data: IDataObject) {
	const returnData: IDataObject = {};
	for (const key1 of Object.keys(data)) {
		if (data[key1] !== null && typeof data[key1] === 'object') {
			if (data[key1] instanceof Date) {
				returnData[key1] = data[key1]?.toString();
				continue;
			}
			const flatObject = flattenObject(data[key1] as IDataObject);
			for (const key2 in flatObject) {
				if (flatObject[key2] === undefined) {
					continue;
				}
				returnData[`${key1}.${key2}`] = flatObject[key2];
			}
		} else {
			returnData[key1] = data[key1];
		}
	}
	return returnData;
}

export function capitalize(str: string): string {
	if (!str) return str;

	const chars = str.split('');
	chars[0] = chars[0].toUpperCase();

	return chars.join('');
}

export function generatePairedItemData(length: number): IPairedItemData[] {
	return Array.from({ length }, (_, item) => ({
		item,
	}));
}

export function preparePairedItemDataArray(
	pairedItem: number | IPairedItemData | IPairedItemData[] | undefined,
): IPairedItemData[] {
	if (pairedItem === undefined) return [];
	if (typeof pairedItem === 'number') return [{ item: pairedItem }];
	if (Array.isArray(pairedItem)) return pairedItem;
	return [pairedItem];
}

export const sanitizeDataPathKey = (item: IDataObject, key: string) => {
	if (item[key] !== undefined) {
		return key;
	}

	if (
		(key.startsWith("['") && key.endsWith("']")) ||
		(key.startsWith('["') && key.endsWith('"]'))
	) {
		key = key.slice(2, -2);
		if (item[key] !== undefined) {
			return key;
		}
	}
	return key;
};

export function escapeHtml(text: string): string {
	if (!text) return '';
	return text.replace(/&amp;|&lt;|&gt;|&#39;|&quot;/g, (match) => {
		switch (match) {
			case '&amp;':
				return '&';
			case '&lt;':
				return '<';
			case '&gt;':
				return '>';
			case '&#39;':
				return "'";
			case '&quot;':
				return '"';
			default:
				return match;
		}
	});
}

export function sortItemKeysByPriorityList(data: INodeExecutionData[], priorityList: string[]) {
	return data.map((item) => {
		const itemKeys = Object.keys(item.json);

		const updatedKeysOrder = itemKeys.sort((a, b) => {
			const indexA = priorityList.indexOf(a);
			const indexB = priorityList.indexOf(b);

			if (indexA !== -1 && indexB !== -1) {
				return indexA - indexB;
			} else if (indexA !== -1) {
				return -1;
			} else if (indexB !== -1) {
				return 1;
			}
			return a.localeCompare(b);
		});

		const updatedItem: IDataObject = {};
		for (const key of updatedKeysOrder) {
			updatedItem[key] = item.json[key];
		}

		item.json = updatedItem;
		return item;
	});
}

export function addExecutionHints(
	context: IExecuteFunctions,
	node: INode,
	items: INodeExecutionData[],
	operation: string,
	executeOnce: boolean | undefined,
) {
	if (
		(node.type === POSTGRES_NODE_TYPE || node.type === MYSQL_NODE_TYPE) &&
		operation === 'select' &&
		items.length > 1 &&
		!executeOnce
	) {
		context.addExecutionHints({
			message: `This node ran ${items.length} times, once for each input item. To run for the first item only, enable 'execute once' in the node settings`,
			location: 'outputPane',
		});
	}

	if (
		node.type === POSTGRES_NODE_TYPE &&
		operation === 'executeQuery' &&
		items.length > 1 &&
		(context.getNodeParameter('options.queryBatching', 0, 'single') as string) === 'single' &&
		(context.getNodeParameter('query', 0, '') as string).toLowerCase().startsWith('insert')
	) {
		context.addExecutionHints({
			message:
				"Inserts were batched for performance. If you need to preserve item matching, consider changing 'Query batching' to 'Independent' in the options.",
			location: 'outputPane',
		});
	}

	if (
		node.type === MYSQL_NODE_TYPE &&
		operation === 'executeQuery' &&
		(context.getNodeParameter('options.queryBatching', 0, 'single') as string) === 'single' &&
		(context.getNodeParameter('query', 0, '') as string).toLowerCase().startsWith('insert')
	) {
		context.addExecutionHints({
			message:
				"Inserts were batched for performance. If you need to preserve item matching, consider changing 'Query batching' to 'Independent' in the options.",
			location: 'outputPane',
		});
	}
}
