import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { test } from 'node:test';
const code = ts.transpileModule(fs.readFileSync('src/lib/funnels.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleObject = { exports: {} };
new Function('exports', 'module', code)(moduleObject.exports, moduleObject);
const { validProject, validCopy, emptyStageBriefs } = moduleObject.exports;

test('project validation requires all three stage briefs and string intake values', () => {
  const project = { label: 'Dispatch journey', fields: { audience: 'Owner operators' }, stages: emptyStageBriefs() };
  assert.equal(validProject(project), true);
  assert.equal(validProject({ ...project, label: ' ' }), false);
  assert.equal(validProject({ ...project, fields: { audience: {} } }), false);
  delete project.stages.MOFO;
  assert.equal(validProject(project), false);
  assert.equal(validProject(null), false);
});
test('incomplete model output cannot be saved as usable nurture copy', () => {
  const copy = {
    adSets: [{ angle: 'Trust', primaryText: 'Copy', headline: 'Headline', description: 'Description', videoScript: { hook: 'Hook', mirror: 'Mirror', shift: 'Shift', proof: 'Proof', cta: 'CTA' } }],
    sms: [{ day: 1, message: 'Message' }], email: [{ day: 1, subject: 'Subject', body: 'Body' }], flags: [],
  };
  assert.equal(validCopy(copy), true);
  assert.equal(validCopy({ ...copy, sms: [] }), false);
  assert.equal(validCopy({ ...copy, email: [{ day: 1, subject: 'Missing body' }] }), false);
  assert.equal(validCopy({ ...copy, adSets: [...copy.adSets, ...copy.adSets] }), false);
  assert.equal(validCopy({ ...copy, adSets: [{ ...copy.adSets[0], videoScript: null }] }), false);
  assert.equal(validCopy({ ...copy, sms: [null] }), false);
});

test('imports accept multiple existing ads and optional nurture pools, rejecting malformed messages', () => {
  const { validImportedCopy } = moduleObject.exports;
  const ad = { angle: 'Imported', primaryText: 'Copy', headline: '', description: '', videoScript: { hook: '', mirror: '', shift: '', proof: '', cta: '' } };
  assert.equal(validImportedCopy({ adSets: [ad, ad], sms: [], email: [], flags: [] }), true);
  assert.equal(validImportedCopy({ adSets: [ad], sms: [{ message: 7 }], email: [], flags: [] }), false);
  assert.equal(validImportedCopy({ adSets: [], sms: [], email: [], flags: [] }), false);
});
