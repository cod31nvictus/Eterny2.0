const express = require('express');
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');

// Simple MCP-style server skeleton exposing a few tools over HTTP JSON
const app = express();
app.use(express.json());

// Basic auth middleware reusing JWT from main API
app.use(async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Example tool: get user todos for a date
app.post('/tools/get_user_todos', async (req, res) => {
  try {
    const { date } = req.body;
    const where = {
      userId: req.user.id,
      ...(date && { date }),
    };

    const todos = await prisma.toDoItem.findMany({
      where,
      orderBy: [{ date: 'asc' }, { order: 'asc' }],
    });

    res.json({ todos });
  } catch (error) {
    console.error('MCP get_user_todos error:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Example tool: get high-level wellness summary stub
app.post('/tools/get_wellness_summary', async (req, res) => {
  try {
    // Placeholder: real implementation would mirror /api/summary
    res.json({ summary: 'Not yet implemented in MCP server' });
  } catch (error) {
    console.error('MCP get_wellness_summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Example tool: log Claude usage
app.post('/tools/log_ai_session', async (req, res) => {
  try {
    const { toolName, tokensIn, tokensOut, status } = req.body;

    const log = await prisma.mcpUsageLog.create({
      data: {
        userId: req.user.id,
        toolName,
        tokensIn: tokensIn ?? 0,
        tokensOut: tokensOut ?? 0,
        status: status || 'ok',
      },
    });

    res.json({ log });
  } catch (error) {
    console.error('MCP log_ai_session error:', error);
    res.status(500).json({ error: 'Failed to log AI session' });
  }
});

module.exports = app;

