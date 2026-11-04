import assert from 'node:assert/strict';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readlink, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

test('Radore kurulumu hata verirse dağıtım durur ve karantinaya alınan sürüm etkinleşmez', async (t) => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'koza-deploy-failure-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sha = 'a'.repeat(40), previous = join(root, 'releases', 'b'.repeat(40));
  const incoming = join(root, 'incoming', sha), bin = join(root, 'bin');
  await Promise.all([mkdir(previous, { recursive: true }), mkdir(incoming, { recursive: true }), mkdir(bin)]);
  await Promise.all(['package.json', 'package-lock.json'].map(name => writeFile(join(incoming, name), '{}')));
  await symlink(previous, join(root, 'current'));
  const stubs = {
    runuser: '#!/bin/sh\nexit 42\n',
    chown: '#!/bin/sh\nexit 0\n',
    systemctl: '#!/bin/sh\nexit 0\n',
    install: '#!/bin/sh\nfor target; do :; done\nmkdir -p "$target"\n',
    mv: '#!/usr/bin/env node\nconst fs=require("node:fs"); const args=process.argv.slice(2).filter(s=>!s.startsWith("-")); fs.renameSync(args[0],args[1]);\n',
    curl: '#!/bin/sh\ncase "$*" in *auth/me*) printf 401;; *admin*) printf 307;; esac\n',
    'kozatv-postgres-backup': '#!/bin/sh\nexit 0\n',
    'kozatv-postgres-health': '#!/bin/sh\nexit 0\n',
    'kozatv-prune-releases': '#!/bin/sh\nexit 0\n',
  };
  await Promise.all(Object.entries(stubs).map(([name, source]) => writeFile(join(bin, name), source, { mode: 0o755 })));
  const source = await readFile(new URL('../deployment/radore/deploy.sh', import.meta.url), 'utf8');
  const script = source.replace('base_dir="/srv/kozatv"', `base_dir="${root}"`).replaceAll('/usr/local/sbin/', `${bin}/`);
  const path = join(root, 'deploy.sh');
  await writeFile(path, script);
  let result;
  try {
    await promisify(execFile)('bash', [path, sha], { env: { ...process.env, PATH: `${bin}:${process.env.PATH}` }, timeout: 10000 });
  } catch (error) { result = error; }
  assert.equal(result?.code, 42, 'İlk kurulum hatası aynen döndürülmeli; yayın adımına devam edilmemeli');
  assert.equal(await readlink(join(root, 'current')), previous);
  assert.equal((await readdir(join(root, 'quarantine'))).filter(name => name.startsWith(`${sha}-failed-`)).length, 1);
  const workflow = await readFile(new URL('../.github/workflows/production.yml', import.meta.url), 'utf8');
  assert.match(workflow, /ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=6 koza-deploy@/);
});
