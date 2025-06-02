const express = require('express');
const router = express.Router();
const ToDoItem = require('../models/ToDoItem');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// GET /todo - Get todos for a specific date or all todos
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    let query = { userId };
    if (date) {
      query.date = date;
    }

    const todos = await ToDoItem.find(query)
      .sort({ date: 1, order: 1, createdAt: 1 });

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
    const lastTodo = await ToDoItem.findOne({ userId, date })
      .sort({ order: -1 });
    const order = lastTodo ? lastTodo.order + 1 : 0;

    const todo = new ToDoItem({
      userId,
      text: text.trim(),
      date,
      time: time || null,
      order
    });

    await todo.save();
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

    const todo = await ToDoItem.findOne({ _id: id, userId });
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    todo.completed = !todo.completed;
    await todo.save();

    res.json(todo);
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

    const todo = await ToDoItem.findOne({ _id: id, userId });
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (text !== undefined) todo.text = text.trim();
    if (time !== undefined) todo.time = time || null;

    await todo.save();
    res.json(todo);
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

    const todo = await ToDoItem.findOneAndDelete({ _id: id, userId });
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router; 