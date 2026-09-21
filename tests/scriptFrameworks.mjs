import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { test } from 'node:test';
const code = ts.transpileModule(fs.readFileSync('src/lib/scriptFrameworks.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleObject = { exports: {} };
new Function('exports', 'module', code)(moduleObject.exports, moduleObject);
const { scriptBeats, scriptBrief, validScriptOptions, DEFAULT_SCRIPT_OPTIONS } = moduleObject.exports;
test('legacy scripts retain original labels and edit paths while cold scripts show their own beats', () => {
  const script = { hook: 'one', mirror: 'two', shift: 'three', proof: 'four', cta: 'five' };
  assert.equal(scriptBeats(script)[0].label, 'Hook');
  assert.match(scriptBeats(script, 'insider')[0].label, /Credential Flash/);
  assert.match(scriptBeats(script, 'story')[3].label, /Universalize/);
  assert.deepEqual(scriptBeats(script, 'story').map(b => b.value), Object.values(script));
  assert.deepEqual(scriptBeats(script, 'story').map(b => b.key), Object.keys(script));
});
test('cold briefs enforce lead magnets and proof fidelity; story voice and CTA tests are explicit', () => {
  const brief = scriptBrief({ ...DEFAULT_SCRIPT_OPTIONS, framework: 'story', voice: 'client', cta: 'engagement' });
  assert.match(brief, /never a direct booking or sale/);
  assert.match(brief, /Voice variant: client/);
  assert.match(brief, /exactly ONE CTA style for this test: engagement/);
  assert.match(brief, /Never invent or import example figures/);
  assert.equal(validScriptOptions({ ...DEFAULT_SCRIPT_OPTIONS, framework: 'unknown' }), false);
  assert.equal(validScriptOptions(DEFAULT_SCRIPT_OPTIONS), true);
});
