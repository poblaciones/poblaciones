/*
 * _register-alias.mjs — registra el hook de resolución del alias "@/table/...".
 * Uso:  node --import ./tests/_register-alias.mjs tests/run-all.mjs
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register('./_alias-hooks.mjs', pathToFileURL('./tests/').href);
