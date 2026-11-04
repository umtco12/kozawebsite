import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createContext, runInContext } from 'node:vm';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { renderToString } from 'react-dom/server';
import { createRoot, hydrateRoot } from 'react-dom/client';
import ts from 'typescript';
import * as consent from '../app/google-consent.mjs';

test('AdSense hydration, istemcide yeniden oluşturma ve tekrar render sırasında ilk scripti korur', async (t) => {
  const require = createRequire(import.meta.url);
  const context = createContext({ exports: {}, require: name => {
    if (name === 'next/navigation') return { usePathname: () => '/' };
    if (name === './google-consent.mjs') return consent;
    return require(name);
  } });
  const source = await readFile(new URL('../app/google-head.tsx', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
  } });
  runInContext(outputText, context);
  const element = React.createElement('html', { lang: 'tr' },
    React.createElement('head', null, React.createElement(context.exports.GoogleAdSenseHead, {
      config: { publisherId: 'ca-pub-8257810988134211', advertisingEnabled: true },
      hostname: 'www.kozatv.com.tr', bootstrap: consent.googleBootstrapSource(),
    })), React.createElement('body', null, 'Koza TV'));
  const html = '<!DOCTYPE html>' + renderToString(element);
  assert.ok(html.indexOf('id="koza-google-bootstrap"') < html.indexOf('id="koza-adsense"'));
  for (const key of ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT']) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    t.after(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key]);
  }
  for (const mode of ['hydrate', 'client-recovery']) {
    const { window } = new JSDOM(html, { url: 'https://www.kozatv.com.tr/' });
    const existing = window.document.getElementById('koza-adsense');
    // Google'ın yüklenen etiket üzerinde yaptığı işaretleme de eşleşmeyi bozmamalı.
    existing.setAttribute('data-checked-head', 'true');
    context.window = window;
    Object.assign(globalThis, { window, document: window.document, IS_REACT_ACT_ENVIRONMENT: true });
    let root;
    try {
      await act(async () => {
        if (mode === 'hydrate') root = hydrateRoot(window.document, element);
        else { root = createRoot(window.document); root.render(element); }
      });
      assert.equal(window.document.querySelectorAll('script[src*="adsbygoogle.js"]').length, 1, mode);
      assert.equal(window.document.getElementById('koza-adsense'), existing, `${mode}: ilk script korunmalı`);
      await act(async () => { root.render(element); });
      assert.equal(window.document.querySelectorAll('script[src*="adsbygoogle.js"]').length, 1, mode);
      assert.equal(window.document.getElementById('koza-adsense'), existing);
    } finally {
      if (root) await act(async () => { root.unmount(); });
      window.close();
    }
  }
});
