// ========================================================================
// SW Service Desk v1.0 - Controlador da Base de Conhecimento (KB)
// Empresa: SW Cloud Solutions
// ========================================================================

import { Response } from 'express';
import { query, queryOne, execute } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const kbController = {
  /**
   * Listar artigos da Base de Conhecimento
   */
  async getArticles(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const { categoryId, search, tag } = req.query;

    const whereClauses: string[] = ['k.is_published = 1'];
    const params: any[] = [];

    // RBAC: Clientes só podem ver artigos públicos (is_internal_only = 0)
    if (user.role === 'user') {
      whereClauses.push('k.is_internal_only = 0');
    }

    if (categoryId) {
      whereClauses.push('k.category_id = ?');
      params.push(parseInt(String(categoryId), 10));
    }

    if (tag) {
      whereClauses.push('k.tags LIKE ?');
      params.push(`%${String(tag)}%`);
    }

    if (search) {
      const term = `%${String(search).trim()}%`;
      whereClauses.push('(k.title LIKE ? OR k.summary LIKE ? OR k.content LIKE ? OR k.tags LIKE ?)');
      params.push(term, term, term, term);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const articles = await query(
      `SELECT k.id, k.title, k.slug, k.summary, k.category_id, k.is_internal_only,
              k.view_count, k.helpful_count, k.not_helpful_count, k.tags, k.created_at, k.updated_at,
              c.name as category_name,
              u.full_name as author_name
       FROM kb_articles k
       JOIN categories c ON k.category_id = c.id
       JOIN users u ON k.author_id = u.id
       ${whereSql}
       ORDER BY k.helpful_count DESC, k.view_count DESC`,
      params
    );

    res.json(articles);
  },

  /**
   * Obter artigo completo por ID ou Slug (incrementa view_count)
   */
  async getArticleBySlugOrId(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const identifier = req.params.slugOrId;

    const article = await queryOne(
      `SELECT k.*, c.name as category_name, u.full_name as author_name
       FROM kb_articles k
       JOIN categories c ON k.category_id = c.id
       JOIN users u ON k.author_id = u.id
       WHERE k.slug = ? OR k.id = ?`,
      [identifier, identifier]
    );

    if (!article) {
      res.status(404).json({ error: 'Artigo não encontrado.' });
      return;
    }

    if (user.role === 'user' && article.is_internal_only === 1) {
      res.status(403).json({ error: 'Este artigo é de acesso estritamente interno para equipas técnicas.' });
      return;
    }

    // Incrementar contagem de visualizações
    await execute('UPDATE kb_articles SET view_count = view_count + 1 WHERE id = ?', [article.id]);

    res.json(article);
  },

  /**
   * Criar novo artigo técnico
   */
  async createArticle(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const { title, summary, content, categoryId, isInternalOnly = 0, tags } = req.body;

    if (!title || !summary || !content || !categoryId) {
      res.status(400).json({ error: 'Título, resumo, conteúdo e categoria são obrigatórios.' });
      return;
    }

    // Gerar slug a partir do título
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const insertRes = await execute(
      `INSERT INTO kb_articles (
        title, slug, summary, content, category_id, author_id, is_internal_only, is_published, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [title.trim(), slug, summary.trim(), content.trim(), categoryId, user.id, isInternalOnly ? 1 : 0, tags || null]
    );

    res.status(201).json({
      success: true,
      id: insertRes.insertId,
      slug,
      message: 'Artigo publicado com sucesso.',
    });
  },

  /**
   * Avaliação de utilidade ("Isto foi útil?")
   */
  async voteArticle(req: AuthenticatedRequest, res: Response): Promise<void> {
    const articleId = parseInt(req.params.id, 10);
    const { helpful } = req.body;

    if (helpful === true) {
      await execute('UPDATE kb_articles SET helpful_count = helpful_count + 1 WHERE id = ?', [articleId]);
    } else {
      await execute('UPDATE kb_articles SET not_helpful_count = not_helpful_count + 1 WHERE id = ?', [articleId]);
    }

    res.json({ success: true, message: 'Obrigado pelo seu feedback.' });
  },
};
