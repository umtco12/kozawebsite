#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Database from "better-sqlite3";
import { hashPassword } from "../db/auth-model.mjs";

function argument(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? String(process.argv[index + 1] ?? "") : fallback;
}

const email = argument("email").trim().toLowerCase();
const fullName = argument("name", "Koza TV Yöneticisi").trim();
const role = argument("role", "admin");
const password = readFileSync(0, "utf8").replace(/[\r\n]+$/, "");
const allowedRoles = ["admin", "publisher", "editor", "reporter", "viewer"];

if (!/^\S+@\S+\.\S+$/.test(email) || fullName.length < 3 || !allowedRoles.includes(role)) throw new Error("Geçerli --email, --name ve --role zorunludur.");
const dbPath = resolve(process.env.KOZA_DB_PATH ?? resolve(process.cwd(), "data/koza.sqlite"));
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
db.exec("CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL COLLATE NOCASE UNIQUE, full_name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('admin','publisher','editor','reporter','viewer')), active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)), must_change_password INTEGER NOT NULL DEFAULT 1 CHECK (must_change_password IN (0,1)), failed_attempts INTEGER NOT NULL DEFAULT 0, locked_until INTEGER, last_login_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)");
const now = Date.now();
db.prepare("INSERT INTO admin_users (email,full_name,password_hash,role,active,must_change_password,failed_attempts,locked_until,last_login_at,created_at,updated_at) VALUES (?,?,?,?,1,1,0,NULL,NULL,?,?) ON CONFLICT(email) DO UPDATE SET full_name=excluded.full_name,password_hash=excluded.password_hash,role=excluded.role,active=1,must_change_password=1,failed_attempts=0,locked_until=NULL,updated_at=excluded.updated_at").run(email, fullName, hashPassword(password), role, now, now);
db.close();
process.stdout.write(`Kullanıcı hazır: ${email} (${role})\n`);
