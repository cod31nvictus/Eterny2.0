const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// GET /todo - Get todos for a specific date or all todos
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    const where = {
      userId,
      ...(date && { date }),
    };

    const todos = await prisma.toDoItem.findMany({
      where,
      orderBy: [{ date: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    });

    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST /todo - Create a new todo item
router.post('/', async (req, res) => {
  try {
    const { text, date, time } = req.body;
    const userId = req.user.id;

    if (!text || !date) {
      return res.status(400).json({ error: 'Text and date are required' });
    }

    // Get the next order number for this date
    const lastTodo = await prisma.toDoItem.findFirst({
      where: { userId, date },
      orderBy: { order: 'desc' },
    });
    const order = lastTodo ? lastTodo.order + 1 : 0;

    const todo = await prisma.toDoItem.create({
      data: {
        userId,
        text: text.trim(),
        date,
        time: time || null,
        order,
      },
    });

    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PATCH /todo/:id/complete - Toggle completion status
router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.toDoItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const updated = await prisma.toDoItem.update({
      where: { id },
      data: { completed: !existing.completed },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating todo completion:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// PUT /todo/:id - Update todo text/time
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, time } = req.body;
    const userId = req.user.id;

    const existing = await prisma.toDoItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const data = {};
    if (text !== undefined) data.text = text.trim();
    if (time !== undefined) data.time = time || null;

    const updated = await prisma.toDoItem.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE /todo/:id - Delete a todo item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.toDoItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await prisma.toDoItem.delete({ where: { id } });

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router; 