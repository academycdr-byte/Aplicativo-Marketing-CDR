import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'cdr-marketing.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS colaboradores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      cargo TEXT NOT NULL DEFAULT 'Marketing',
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contas_sociais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plataforma TEXT NOT NULL CHECK(plataforma IN ('instagram', 'tiktok')),
      nome_perfil TEXT NOT NULL,
      username TEXT NOT NULL,
      avatar_url TEXT NOT NULL DEFAULT '',
      seguidores INTEGER NOT NULL DEFAULT 0,
      ativa INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS postagens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conta_id INTEGER NOT NULL,
      colaborador_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      thumbnail_url TEXT NOT NULL DEFAULT '',
      categoria TEXT NOT NULL CHECK(categoria IN ('viral', 'tecnico')),
      visualizacoes INTEGER NOT NULL DEFAULT 0,
      curtidas INTEGER NOT NULL DEFAULT 0,
      comentarios INTEGER NOT NULL DEFAULT 0,
      compartilhamentos INTEGER NOT NULL DEFAULT 0,
      data_postagem TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (conta_id) REFERENCES contas_sociais(id),
      FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
    );

    CREATE TABLE IF NOT EXISTS configuracoes_cpm (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria TEXT NOT NULL UNIQUE CHECK(categoria IN ('viral', 'tecnico')),
      valor_por_cpm REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comissoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      colaborador_id INTEGER NOT NULL,
      postagem_id INTEGER NOT NULL,
      valor REAL NOT NULL,
      mes_referencia TEXT NOT NULL,
      pago INTEGER NOT NULL DEFAULT 0,
      data_pagamento TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id),
      FOREIGN KEY (postagem_id) REFERENCES postagens(id)
    );

    -- Insert default CPM values if not exists
    INSERT OR IGNORE INTO configuracoes_cpm (categoria, valor_por_cpm) VALUES ('viral', 2.00);
    INSERT OR IGNORE INTO configuracoes_cpm (categoria, valor_por_cpm) VALUES ('tecnico', 5.00);
  `);
}

// ============ COLABORADORES ============
export function getColaboradores() {
  return getDb().prepare('SELECT * FROM colaboradores ORDER BY nome').all();
}

export function getColaborador(id: number) {
  return getDb().prepare('SELECT * FROM colaboradores WHERE id = ?').get(id);
}

export function createColaborador(data: { nome: string; email: string; cargo: string }) {
  const stmt = getDb().prepare('INSERT INTO colaboradores (nome, email, cargo) VALUES (?, ?, ?)');
  const result = stmt.run(data.nome, data.email, data.cargo);
  return { id: result.lastInsertRowid, ...data };
}

export function updateColaborador(id: number, data: { nome: string; email: string; cargo: string; ativo: boolean }) {
  const stmt = getDb().prepare('UPDATE colaboradores SET nome = ?, email = ?, cargo = ?, ativo = ? WHERE id = ?');
  stmt.run(data.nome, data.email, data.cargo, data.ativo ? 1 : 0, id);
  return getColaborador(id);
}

export function deleteColaborador(id: number) {
  getDb().prepare('DELETE FROM colaboradores WHERE id = ?').run(id);
}

// ============ CONTAS SOCIAIS ============
export function getContasSociais() {
  return getDb().prepare('SELECT * FROM contas_sociais ORDER BY plataforma, nome_perfil').all();
}

export function getContaSocial(id: number) {
  return getDb().prepare('SELECT * FROM contas_sociais WHERE id = ?').get(id);
}

export function createContaSocial(data: { plataforma: string; nome_perfil: string; username: string; avatar_url?: string; seguidores?: number }) {
  const stmt = getDb().prepare('INSERT INTO contas_sociais (plataforma, nome_perfil, username, avatar_url, seguidores) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(data.plataforma, data.nome_perfil, data.username, data.avatar_url || '', data.seguidores || 0);
  return { id: result.lastInsertRowid, ...data };
}

export function updateContaSocial(id: number, data: { plataforma?: string; nome_perfil?: string; username?: string; avatar_url?: string; seguidores?: number; ativa?: boolean }) {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (data.plataforma !== undefined) { fields.push('plataforma = ?'); values.push(data.plataforma); }
  if (data.nome_perfil !== undefined) { fields.push('nome_perfil = ?'); values.push(data.nome_perfil); }
  if (data.username !== undefined) { fields.push('username = ?'); values.push(data.username); }
  if (data.avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(data.avatar_url); }
  if (data.seguidores !== undefined) { fields.push('seguidores = ?'); values.push(data.seguidores); }
  if (data.ativa !== undefined) { fields.push('ativa = ?'); values.push(data.ativa ? 1 : 0); }

  values.push(id);
  getDb().prepare(`UPDATE contas_sociais SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getContaSocial(id);
}

export function deleteContaSocial(id: number) {
  getDb().prepare('DELETE FROM contas_sociais WHERE id = ?').run(id);
}

// ============ POSTAGENS ============
export function getPostagens(filters?: { conta_id?: number; colaborador_id?: number; categoria?: string; mes?: string }) {
  let query = `
    SELECT p.*,
      c.nome_perfil as conta_nome, c.plataforma as conta_plataforma, c.username as conta_username,
      col.nome as colaborador_nome
    FROM postagens p
    JOIN contas_sociais c ON p.conta_id = c.id
    JOIN colaboradores col ON p.colaborador_id = col.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filters?.conta_id) { query += ' AND p.conta_id = ?'; params.push(filters.conta_id); }
  if (filters?.colaborador_id) { query += ' AND p.colaborador_id = ?'; params.push(filters.colaborador_id); }
  if (filters?.categoria) { query += ' AND p.categoria = ?'; params.push(filters.categoria); }
  if (filters?.mes) { query += " AND strftime('%Y-%m', p.data_postagem) = ?"; params.push(filters.mes); }

  query += ' ORDER BY p.data_postagem DESC';
  return getDb().prepare(query).all(...params);
}

export function getPostagem(id: number) {
  return getDb().prepare(`
    SELECT p.*,
      c.nome_perfil as conta_nome, c.plataforma as conta_plataforma, c.username as conta_username,
      col.nome as colaborador_nome
    FROM postagens p
    JOIN contas_sociais c ON p.conta_id = c.id
    JOIN colaboradores col ON p.colaborador_id = col.id
    WHERE p.id = ?
  `).get(id);
}

export function createPostagem(data: {
  conta_id: number; colaborador_id: number; titulo: string; url?: string;
  thumbnail_url?: string; categoria: string; visualizacoes: number;
  curtidas?: number; comentarios?: number; compartilhamentos?: number; data_postagem: string;
}) {
  const stmt = getDb().prepare(`
    INSERT INTO postagens (conta_id, colaborador_id, titulo, url, thumbnail_url, categoria, visualizacoes, curtidas, comentarios, compartilhamentos, data_postagem)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.conta_id, data.colaborador_id, data.titulo, data.url || '', data.thumbnail_url || '',
    data.categoria, data.visualizacoes, data.curtidas || 0, data.comentarios || 0,
    data.compartilhamentos || 0, data.data_postagem
  );
  return { id: result.lastInsertRowid, ...data };
}

export function updatePostagem(id: number, data: Partial<{
  conta_id: number; colaborador_id: number; titulo: string; url: string;
  thumbnail_url: string; categoria: string; visualizacoes: number;
  curtidas: number; comentarios: number; compartilhamentos: number; data_postagem: string;
}>) {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  values.push(id);
  getDb().prepare(`UPDATE postagens SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getPostagem(id);
}

export function deletePostagem(id: number) {
  getDb().prepare('DELETE FROM comissoes WHERE postagem_id = ?').run(id);
  getDb().prepare('DELETE FROM postagens WHERE id = ?').run(id);
}

// ============ CONFIGURACOES CPM ============
export function getConfiguracoesCPM() {
  return getDb().prepare('SELECT * FROM configuracoes_cpm ORDER BY categoria').all();
}

export function updateConfiguracaoCPM(categoria: string, valor_por_cpm: number) {
  getDb().prepare("UPDATE configuracoes_cpm SET valor_por_cpm = ?, updated_at = datetime('now') WHERE categoria = ?")
    .run(valor_por_cpm, categoria);
  return getDb().prepare('SELECT * FROM configuracoes_cpm WHERE categoria = ?').get(categoria);
}

// ============ COMISSOES ============
export function getComissoes(filters?: { colaborador_id?: number; mes?: string; pago?: boolean }) {
  let query = `
    SELECT com.*,
      col.nome as colaborador_nome,
      p.titulo as postagem_titulo, p.visualizacoes as postagem_visualizacoes,
      p.categoria as postagem_categoria, c.plataforma as conta_plataforma
    FROM comissoes com
    JOIN colaboradores col ON com.colaborador_id = col.id
    JOIN postagens p ON com.postagem_id = p.id
    JOIN contas_sociais c ON p.conta_id = c.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filters?.colaborador_id) { query += ' AND com.colaborador_id = ?'; params.push(filters.colaborador_id); }
  if (filters?.mes) { query += ' AND com.mes_referencia = ?'; params.push(filters.mes); }
  if (filters?.pago !== undefined) { query += ' AND com.pago = ?'; params.push(filters.pago ? 1 : 0); }

  query += ' ORDER BY com.created_at DESC';
  return getDb().prepare(query).all(...params);
}

export function calcularComissoes(mes: string) {
  const db = getDb();

  // Get CPM configs
  const configs = db.prepare('SELECT * FROM configuracoes_cpm').all() as { categoria: string; valor_por_cpm: number }[];
  const cpmMap: Record<string, number> = {};
  configs.forEach(c => { cpmMap[c.categoria] = c.valor_por_cpm; });

  // Get all posts for the month
  const postagens = db.prepare(`
    SELECT * FROM postagens WHERE strftime('%Y-%m', data_postagem) = ?
  `).all(mes) as { id: number; colaborador_id: number; categoria: string; visualizacoes: number }[];

  // Delete existing commissions for this month, then recalculate
  db.prepare('DELETE FROM comissoes WHERE mes_referencia = ?').run(mes);

  const insertStmt = db.prepare(`
    INSERT INTO comissoes (colaborador_id, postagem_id, valor, mes_referencia)
    VALUES (?, ?, ?, ?)
  `);

  const insertMany = db.transaction(() => {
    for (const post of postagens) {
      const cpmValue = cpmMap[post.categoria] || 0;
      const comissao = (post.visualizacoes / 1000) * cpmValue;
      insertStmt.run(post.colaborador_id, post.id, comissao, mes);
    }
  });

  insertMany();
  return getComissoes({ mes });
}

export function marcarComissaoPaga(id: number) {
  getDb().prepare("UPDATE comissoes SET pago = 1, data_pagamento = datetime('now') WHERE id = ?").run(id);
}

export function marcarComissaoNaoPaga(id: number) {
  getDb().prepare("UPDATE comissoes SET pago = 0, data_pagamento = NULL WHERE id = ?").run(id);
}

// ============ DASHBOARD ============
export function getDashboardStats(): Record<string, unknown> {
  const db = getDb();

  const totalVisualizacoes = (db.prepare('SELECT COALESCE(SUM(visualizacoes), 0) as total FROM postagens').get() as { total: number }).total;
  const totalPostagens = (db.prepare('SELECT COUNT(*) as total FROM postagens').get() as { total: number }).total;
  const totalColaboradores = (db.prepare('SELECT COUNT(*) as total FROM colaboradores WHERE ativo = 1').get() as { total: number }).total;
  const totalComissoes = (db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM comissoes').get() as { total: number }).total;
  const comissoesPendentes = (db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM comissoes WHERE pago = 0').get() as { total: number }).total;
  const comissoesPagas = (db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM comissoes WHERE pago = 1').get() as { total: number }).total;

  const postagensPorMes = db.prepare(`
    SELECT strftime('%Y-%m', data_postagem) as mes, COUNT(*) as quantidade
    FROM postagens GROUP BY mes ORDER BY mes DESC LIMIT 12
  `).all();

  const comissoesPorColaborador = db.prepare(`
    SELECT col.nome, COALESCE(SUM(com.valor), 0) as valor
    FROM colaboradores col
    LEFT JOIN comissoes com ON col.id = com.colaborador_id
    WHERE col.ativo = 1
    GROUP BY col.id ORDER BY valor DESC
  `).all();

  const visualizacoesPorPlataforma = db.prepare(`
    SELECT c.plataforma, COALESCE(SUM(p.visualizacoes), 0) as visualizacoes
    FROM contas_sociais c
    LEFT JOIN postagens p ON c.id = p.conta_id
    GROUP BY c.plataforma
  `).all();

  const topPostagens = db.prepare(`
    SELECT p.*, c.nome_perfil as conta_nome, c.plataforma as conta_plataforma, c.username as conta_username, col.nome as colaborador_nome
    FROM postagens p
    JOIN contas_sociais c ON p.conta_id = c.id
    JOIN colaboradores col ON p.colaborador_id = col.id
    ORDER BY p.visualizacoes DESC LIMIT 5
  `).all();

  return {
    total_visualizacoes: totalVisualizacoes,
    total_comissoes: totalComissoes,
    total_postagens: totalPostagens,
    total_colaboradores: totalColaboradores,
    comissoes_pendentes: comissoesPendentes,
    comissoes_pagas: comissoesPagas,
    postagens_por_mes: postagensPorMes,
    comissoes_por_colaborador: comissoesPorColaborador,
    visualizacoes_por_plataforma: visualizacoesPorPlataforma,
    top_postagens: topPostagens,
  };
}
