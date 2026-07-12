const express = require('express');
const pool = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All list routes require authentication
router.use(authenticateToken);

/**
 * GET /api/lists
 * Get all list items for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const { rows: items } = await pool.query(
      'SELECT * FROM user_lists WHERE user_id = $1 ORDER BY added_at DESC', [req.user.id]
    );
    res.json({ items });
  } catch (err) {
    console.error('Get lists error:', err);
    res.status(500).json({ error: 'Failed to fetch lists.' });
  }
});

/**
 * GET /api/lists/:listType
 * Get items in a specific list (favorite, must_watch, watched)
 */
router.get('/:listType', async (req, res) => {
  try {
    const { listType } = req.params;
    const validTypes = ['favorite', 'must_watch', 'watched'];
    
    if (!validTypes.includes(listType)) {
      return res.status(400).json({ error: `Invalid list type. Must be one of: ${validTypes.join(', ')}` });
    }

    const { rows: items } = await pool.query(
      'SELECT * FROM user_lists WHERE user_id = $1 AND list_type = $2 ORDER BY added_at DESC',
      [req.user.id, listType]
    );
    
    res.json({ items });
  } catch (err) {
    console.error('Get list error:', err);
    res.status(500).json({ error: 'Failed to fetch list.' });
  }
});

/**
 * POST /api/lists
 * Add an item to a list
 */
router.post('/', async (req, res) => {
  try {
    const {
      content_id, content_type, list_type,
      title, poster_path, backdrop_path,
      vote_average, overview, release_date
    } = req.body;

    if (!content_id || !content_type || !list_type || !title) {
      return res.status(400).json({ error: 'content_id, content_type, list_type, and title are required.' });
    }

    const validTypes = ['favorite', 'must_watch', 'watched'];
    if (!validTypes.includes(list_type)) {
      return res.status(400).json({ error: `Invalid list type. Must be one of: ${validTypes.join(', ')}` });
    }

    const validContentTypes = ['movie', 'tv'];
    if (!validContentTypes.includes(content_type)) {
      return res.status(400).json({ error: 'content_type must be "movie" or "tv".' });
    }

    // Check if already exists
    const { rows: existing } = await pool.query(
      'SELECT id FROM user_lists WHERE user_id = $1 AND content_id = $2 AND content_type = $3 AND list_type = $4',
      [req.user.id, content_id, content_type, list_type]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Item already in this list.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO user_lists (user_id, content_id, content_type, list_type, title, poster_path, backdrop_path, vote_average, overview, release_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [req.user.id, content_id, content_type, list_type,
       title, poster_path || null, backdrop_path || null,
       vote_average || 0, overview || '', release_date || '']
    );

    res.status(201).json({
      message: 'Added to list!',
      item: {
        id: rows[0].id,
        content_id, content_type, list_type,
        title, poster_path, backdrop_path,
        vote_average, overview, release_date
      }
    });
  } catch (err) {
    console.error('Add to list error:', err);
    res.status(500).json({ error: 'Failed to add to list.' });
  }
});

/**
 * DELETE /api/lists/:id
 * Remove an item from a list by its database ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const { rows } = await pool.query(
      'SELECT id FROM user_lists WHERE id = $1 AND user_id = $2', [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Item not found or not yours.' });
    }

    await pool.query('DELETE FROM user_lists WHERE id = $1', [id]);
    res.json({ message: 'Removed from list.' });
  } catch (err) {
    console.error('Delete from list error:', err);
    res.status(500).json({ error: 'Failed to remove from list.' });
  }
});

/**
 * DELETE /api/lists/item/:contentType/:contentId/:listType
 * Remove by content details instead of database ID
 */
router.delete('/item/:contentType/:contentId/:listType', async (req, res) => {
  try {
    const { contentType, contentId, listType } = req.params;

    const result = await pool.query(
      'DELETE FROM user_lists WHERE user_id = $1 AND content_id = $2 AND content_type = $3 AND list_type = $4',
      [req.user.id, contentId, contentType, listType]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Item not found in this list.' });
    }

    res.json({ message: 'Removed from list.' });
  } catch (err) {
    console.error('Delete from list error:', err);
    res.status(500).json({ error: 'Failed to remove from list.' });
  }
});

/**
 * GET /api/lists/check/:contentType/:contentId
 * Check which lists an item is in
 */
router.get('/check/:contentType/:contentId', async (req, res) => {
  try {
    const { contentType, contentId } = req.params;

    const { rows: items } = await pool.query(
      'SELECT list_type, id FROM user_lists WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
      [req.user.id, contentId, contentType]
    );

    const lists = {};
    items.forEach(item => {
      lists[item.list_type] = item.id;
    });

    res.json({ lists });
  } catch (err) {
    console.error('Check list error:', err);
    res.status(500).json({ error: 'Failed to check lists.' });
  }
});

module.exports = router;
