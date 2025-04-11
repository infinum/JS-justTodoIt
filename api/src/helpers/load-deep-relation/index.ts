export function loadDeepRelation(
	topLevelAlias: string,
	relation: string
): {
	property: string;
	alias: string;
} {
	const split = relation.split('.');
	const depth = split.length;
	let property: string;
	let alias: string;

	if (depth === 1) {
		property = `${topLevelAlias}.${relation}`;
		alias = relation;
	} else {
		property = `${split[depth - 2]}.${split[depth - 1]}`;
		alias = split[depth - 1];
	}

	return { property, alias };
}
