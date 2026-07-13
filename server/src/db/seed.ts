import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import path from 'path';
import ExcelJS from 'exceljs';
import { pool } from './pool';

const EMPLOYEES = [
  { employee_number: '2407029', name_ja: 'ドンカナ　サイ　キラン',      name_en: 'Donkana SaiKiran',    dispatch_company: 'システム開発1課（新⻑⽥216）' },
  { employee_number: '2407032', name_ja: 'カニティ　ゴウタム',           name_en: 'Kanithi Gowtham',     dispatch_company: '受託開発室' },
  { employee_number: '2407036', name_ja: 'モハメド　ロシャン',           name_en: 'Mohammed Roshan',     dispatch_company: 'システム開発1課（神⼾）' },
  { employee_number: '2407039', name_ja: 'プラディオット',               name_en: 'Pradyot',             dispatch_company: '受託開発室' },
  { employee_number: '2407041', name_ja: 'マダン　リティック',           name_en: 'Madan Ritik',         dispatch_company: 'システム開発1課（神⼾）' },
  { employee_number: '2407048', name_ja: 'ソニ　ユーワン',               name_en: 'Soni Youwan',         dispatch_company: '受託開発室' },
  { employee_number: '2510004', name_ja: 'パスワン　ガウラヴ',           name_en: 'Paswan Gaurav',       dispatch_company: '受託開発室' },
  { employee_number: '2510006', name_ja: 'ベシュラ　アルハン　チャラン', name_en: 'Beshra Alhan Charan', dispatch_company: 'システム開発1課（神⼾）' },
];

function generatePassword(): string {
  const upper  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower  = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const pick = (s: string) => s[randomInt(0, s.length)];
  return pick(upper) + pick(lower) + pick(lower) + pick(lower)
       + pick(digits) + pick(digits) + pick(digits) + pick(digits) + '!';
}

async function seed() {
  // 1. Remove old test accounts and all their dependent data (cascades handle the rest)
  // Null out reviewed_by references first (FK has no ON DELETE SET NULL)
  const { rows: oldUsers } = await pool.query(
    `SELECT id FROM users WHERE employee_number IN ('ADMIN-001', 'EMP-001')`
  );
  if (oldUsers.length > 0) {
    const oldIds = oldUsers.map(u => u.id);
    await pool.query(`UPDATE requests SET reviewed_by = NULL WHERE reviewed_by = ANY($1::uuid[])`, [oldIds]);
  }
  await pool.query(`DELETE FROM users WHERE employee_number IN ('ADMIN-001', 'EMP-001')`);

  // 2. Ensure Chiiho exists as admin (create only if missing). This seed runs on
  //    every service start, so we must NOT clobber an existing admin's password
  //    (e.g. one changed via reset) on each redeploy / cold-start restart.
  const CHIIHO_PASSWORD = 'Chiiho2407!';
  let { rows: [chiiho] } = await pool.query(
    `SELECT id FROM users WHERE employee_number = '0000208'`
  );
  if (!chiiho) {
    const chiihoHash = await bcrypt.hash(CHIIHO_PASSWORD, 12);
    ({ rows: [chiiho] } = await pool.query(`
      INSERT INTO users (employee_number, name_ja, name_en, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, 'admin')
      RETURNING id
    `, ['0000208', '佐野　ちいほ', 'Chiiho Sano', 'c_sano@morabu.com', chiihoHash]));
  }

  // 3. Create each employee only if missing — generate a password just once (first
  //    seed). Existing employees keep their current password across redeploys and
  //    cold-start restarts. Manager assignment is idempotent (ON CONFLICT DO NOTHING).
  const passwordMap: Record<string, string> = {};

  for (const emp of EMPLOYEES) {
    let { rows: [empRow] } = await pool.query(
      `SELECT id FROM users WHERE employee_number = $1`, [emp.employee_number]
    );
    if (!empRow) {
      const plain = generatePassword();
      passwordMap[emp.employee_number] = plain;
      const hash = await bcrypt.hash(plain, 12);

      ({ rows: [empRow] } = await pool.query(`
        INSERT INTO users (employee_number, name_ja, name_en, email, password_hash, role, dispatch_company)
        VALUES ($1, $2, $3, $4, $5, 'applicant', $6)
        RETURNING id
      `, [
        emp.employee_number,
        emp.name_ja,
        emp.name_en,
        `${emp.employee_number}@noemail.local`,
        hash,
        emp.dispatch_company,
      ]));
    }

    await pool.query(
      `INSERT INTO employee_managers (employee_id, manager_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [empRow.id, chiiho.id]
    );
  }

  const newlyCreated = EMPLOYEES.filter((emp) => passwordMap[emp.employee_number]);

  // 4. Write passwords into column H of the spreadsheet — only when we actually
  //    generated new ones (the file lives locally and is absent in cloud deploys).
  if (newlyCreated.length > 0) {
    const xlsxPath = path.join(__dirname, '../../../登録者リスト一覧.xlsx');
    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(xlsxPath);
      const ws = wb.worksheets[0];

      if (!ws.getCell('H1').value) {
        ws.getCell('H1').value = '仮パスワード';
      }

      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) return;
        const empNum = String(row.getCell(1).value ?? '');
        if (passwordMap[empNum]) {
          row.getCell(8).value = passwordMap[empNum];
        }
      });

      await wb.xlsx.writeFile(xlsxPath);
      console.log('Spreadsheet updated: 登録者リスト一覧.xlsx column H\n');
    } catch (e) {
      console.warn('Could not update spreadsheet:', (e as Error).message, '\n');
    }
  }

  // 5. Print credentials. Admin login is fixed/known; employee passwords are only
  //    shown for accounts created on THIS run (existing ones keep their password).
  console.log(`Admin login: 0000208 (佐野 ちいほ) / ${CHIIHO_PASSWORD}`);
  if (newlyCreated.length === 0) {
    console.log('Seed: all employee accounts already exist — passwords unchanged.\n');
  } else {
    console.log('=== NEW EMPLOYEE CREDENTIALS (shown once, at first seed) ===');
    for (const emp of newlyCreated) {
      console.log(`${emp.employee_number}  ${emp.name_en.padEnd(24)}  ${passwordMap[emp.employee_number]}`);
    }
    console.log('============================================================\n');
  }

  await pool.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
