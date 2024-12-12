import {useState, useCallback, useRef} from 'react';
import {Box, Text, useInput} from 'ink';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {useTextInputState} from '@/components/path-input/useTextInputState';
import {useTextInput} from '@/components/path-input/useTextInput';

function expandHome(p: string) {
	if (!p) return p;
	if (p.startsWith('~')) {
		return path.join(os.homedir(), p.slice(1));
	}
	return p;
}

function normalizePath(p: string) {
	const expanded = expandHome(p);
	return path.isAbsolute(expanded)
		? expanded
		: path.resolve(process.cwd(), expanded);
}

function isDirectory(p: string) {
	try {
		return fs.statSync(p).isDirectory();
	} catch {
		return false;
	}
}

function getLongestCommonPrefix(strings: string[]) {
	if (strings.length === 0) return '';
	let prefix = strings[0]!;
	for (let i = 1; i < strings.length; i++) {
		const s = strings[i]!;
		let j = 0;
		while (j < prefix.length && j < s.length && prefix[j] === s[j]) {
			j++;
		}
		prefix = prefix.slice(0, j);
		if (prefix === '') return '';
	}
	return prefix;
}

interface PathInputProps {
	defaultValue?: string;
	onSubmit?: (path: string) => void;
}

export function PathInput({defaultValue = '', onSubmit}: PathInputProps) {
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [submittedPath, setSubmittedPath] = useState<string | null>(null);

	const lastValueRef = useRef<string>('');
	const lastSuggestionsRef = useRef<string[]>([]);
	const tabCountRef = useRef<number>(0);

	// Handle submission
	const handleSubmit = useCallback(
		(finalValue: string) => {
			const resolvedPath = normalizePath(finalValue);
			setSubmittedPath(resolvedPath);
			onSubmit?.(resolvedPath);
		},
		[onSubmit],
	);

	// Clear suggestions if user manually edits
	const handleChange = useCallback(() => {
		setSuggestions([]);
		tabCountRef.current = 0;
	}, []);

	// Initialize text input state
	const state = useTextInputState({
		defaultValue,
		suggestions: [],
		onChange: handleChange,
		onSubmit: handleSubmit,
	});

	const {inputValue} = useTextInput({
		isDisabled: false,
		placeholder: '',
		state,
	});

	const completePath = useCallback((fullPath: string) => {
		const dir = path.dirname(fullPath);
		const base = path.basename(fullPath);
		if (!fs.existsSync(dir)) {
			return [];
		}
		const files = fs.readdirSync(dir);
		return base === ''
			? files.map(f => path.join(dir, f))
			: files.filter(file => file.startsWith(base)).map(f => path.join(dir, f));
	}, []);

	useInput((_, key) => {
		if (key.tab) {
			const currentValue = state.value;
			const fullPath = normalizePath(currentValue);

			// Check if input changed since last tab press
			if (currentValue === lastValueRef.current) {
				tabCountRef.current += 1;
			} else {
				tabCountRef.current = 1; // new tab cycle
			}

			lastValueRef.current = currentValue;

			// Handle directory logic
			if (fs.existsSync(fullPath) && isDirectory(fullPath)) {
				// If doesn't end with slash, add it first on tab press to mimic zsh
				if (!currentValue.endsWith(path.sep)) {
					state.insert(path.sep);
					setSuggestions([]);
					lastSuggestionsRef.current = [];
					return;
				} else {
					// Already ends with slash, attempt to complete items inside
					const files = fs.readdirSync(fullPath);

					if (files.length === 0) {
						// Empty directory
						setSuggestions([]);
						lastSuggestionsRef.current = [];
						return;
					} else if (files.length === 1) {
						// Single match: complete it
						const single = files[0]!;
						for (const char of single) {
							state.insert(char);
						}
						if (isDirectory(path.join(fullPath, single))) {
							state.insert(path.sep);
						}
						setSuggestions([]);
						lastSuggestionsRef.current = [];
						return;
					} else {
						// Multiple matches
						const commonPrefix = getLongestCommonPrefix(files);

						if (commonPrefix.length > 0) {
							// Can partially complete
							for (const char of commonPrefix) {
								state.insert(char);
							}
							// After partial completion, don't show the list yet (zsh behavior),
							// another tab press would be needed to show full list.
							setSuggestions([]);
							lastSuggestionsRef.current = files.map(f =>
								path.join(fullPath, f),
							);
							return;
						} else {
							// No partial completion possible
							// Show all matches immediately
							const candidates = files.map(f => path.join(fullPath, f));
							setSuggestions(candidates);
							lastSuggestionsRef.current = candidates;
							return;
						}
					}
				}
			}

			// Normal file completion logic
			const candidates = completePath(fullPath);
			if (candidates.length === 0) {
				// No matches
				setSuggestions([]);
				lastSuggestionsRef.current = [];
			} else if (candidates.length === 1) {
				// Single match
				const partial = path.basename(fullPath);
				const match = path.basename(candidates[0]!);
				const completion = match.slice(partial.length);
				for (const char of completion) {
					state.insert(char);
				}
				if (isDirectory(candidates[0]!)) {
					state.insert(path.sep);
				}
				setSuggestions([]);
				lastSuggestionsRef.current = [];
			} else {
				// Multiple matches
				const partial = path.basename(fullPath);
				const names = candidates.map(c => path.basename(c));
				const commonPrefix = getLongestCommonPrefix(names);

				if (commonPrefix.length > partial.length) {
					// We can complete further
					const completion = commonPrefix.slice(partial.length);
					for (const char of completion) {
						state.insert(char);
					}
					// After this partial completion, user would press tab again to see all matches
					setSuggestions([]);
					lastSuggestionsRef.current = candidates;
				} else {
					// No further completion possible
					// Show all matches immediately
					setSuggestions(candidates);
					lastSuggestionsRef.current = candidates;
				}
			}
		}
	});

	return (
		<Box flexDirection="column">
			<Box>
				<Text dimColor>❯ </Text>
				<Text>{inputValue}</Text>
			</Box>

			{submittedPath && (
				<Box marginTop={1}>
					<Text color="green">✓ Path selected: </Text>
					<Text>{submittedPath}</Text>
				</Box>
			)}

			{suggestions.length > 0 && (
				<Box>
					<Text>
						{suggestions
							.map(s => {
								const name = path.basename(s);
								const dir = isDirectory(s);
								return `${name}${dir ? '/' : ''}`;
							})
							.join(' ')}
					</Text>
				</Box>
			)}
		</Box>
	);
}
