export const toCliFlags = (options: Record<string, any>): string => {
	return Object.entries(options)
		.filter(
			([_, value]) => value !== '' && value !== undefined && value !== null,
		)
		.map(([key, value]) => {
			return flagToString(key, value);
		})
		.join(' ')
		.replace(/\n/g, ' ');
};

const flagToString = (key: string, value: any) => {
	const flag = toKebabCase(key);

	if (Array.isArray(value)) {
		return `--${flag} ${value.join(',')}`;
	}

	if (typeof value === 'boolean') {
		if (value) {
			return `--${flag}`;
		}
		return '';
	}

	return `--${flag} ${value.toString().replace('\n', ' ')}`;
};

const toKebabCase = (str: string) => {
	return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
};
