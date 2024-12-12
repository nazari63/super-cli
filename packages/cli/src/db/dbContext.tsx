import {createContext, useContext, type ReactNode} from 'react';
import {type DB} from '@/db/database';
import {initializeDatabase, runMigrations} from '@/db/database';
import {useQuery} from '@tanstack/react-query';

export const useInitializedDb = () => {
	return useQuery({
		queryKey: ['db'],
		queryFn: async () => {
			const db = await initializeDatabase();
			await runMigrations(db);
			return db;
		},
		staleTime: Infinity,
		retry: false,
	});
};

interface DbContextValue {
	db: DB;
}

const DbContext = createContext<DbContextValue | undefined>(undefined);

export function DbProvider({children}: {children: ReactNode}) {
	const {data: db, isLoading, error} = useInitializedDb();

	if (isLoading || error || !db) {
		return null;
	}

	return <DbContext.Provider value={{db}}>{children}</DbContext.Provider>;
}

export function useDb() {
	const context = useContext(DbContext);
	if (context === undefined) {
		throw new Error('useDb must be used within a DbProvider');
	}
	return context.db;
}
