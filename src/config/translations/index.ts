import { DefinedCollection } from '../../structures/Utils';

import { EN, Language } from './EN';
export * from './EN';

export const translations = new DefinedCollection<LanguageName, Language>([
    ["EN", EN]
])

export type LanguageName =
    | "EN"

export default translations;
