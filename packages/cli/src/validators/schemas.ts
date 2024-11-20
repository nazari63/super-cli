import {Address as zAddress} from 'abitype/zod';
import {isHash, Hash, Hex, isHex} from 'viem';
import {z} from 'zod';

export const zodHash = z
	.string()
	.refine((value): value is Hash => isHash(value), {
		message: 'Invalid hash',
	});

export const zodHex = z.string().refine((value): value is Hex => isHex(value), {
	message: 'Invalid hex',
});

export const zodPrivateKey = z
	.string()
	.refine(
		(value): value is Hex =>
			isHex(value) && value.startsWith('0x') && value.length === 66,
		{
			message: 'Invalid private key',
		},
	);

export const zodAddress = zAddress;
