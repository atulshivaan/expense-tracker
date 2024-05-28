const express = require('express');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
app.use(express.json());

// Replace with your Strapi API base URL
const STRAPI_API_URL = 'http://strapi.koders.in/api/expenses';

// CRUD Operations

// Create Expense
app.post('/expenses', async (req, res) => {
  try {
    const newExpense = await axios.post(STRAPI_API_URL, {
      data: req.body
    });
    res.status(201).json(newExpense.data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Read Expenses
app.get('/expenses', async (req, res) => {
  try {
    const response = await axios.get(STRAPI_API_URL);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Expense
app.put('/expenses/:id', async (req, res) => {
  try {
    const updatedExpense = await axios.put(`${STRAPI_API_URL}/${req.params.id}`, {
      data: req.body
    });
    res.json(updatedExpense.data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Expense
app.delete('/expenses/:id', async (req, res) => {
  try {
    await axios.delete(`${STRAPI_API_URL}/${req.params.id}`);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cron Job for Recurring Expenses
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily cron job for updating recurring expenses');

  try {
    const response = await axios.get(STRAPI_API_URL);
    const expenses = response.data.data;

    expenses.forEach(async (expense) => {
      const { id, attributes } = expense;
      let { amount, frequency, base } = attributes;
      let increment = 0;
      const today = new Date();

      switch (frequency) {
        case 'Daily':
          increment = base;
          break;
        case 'Weekly':
          if (today.getDay() === 0) increment = base; // Sunday
          break;
        case 'Monthly':
          if (today.getDate() === 1) increment = base; // 1st of the month
          break;
        case 'Quarterly':
          if (today.getDate() === 1 && [0, 3, 6, 9].includes(today.getMonth())) increment = base;
          break;
        case 'Yearly':
          if (today.getDate() === 1 && today.getMonth() === 0) increment = base;
          break;
      }

      if (increment > 0) {
        amount += increment;
        await axios.put(`${STRAPI_API_URL}/${id}`, {
          data: { amount }
        });
      }
    });
  } catch (error) {
    console.error('Error updating recurring expenses:', error.message);
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
