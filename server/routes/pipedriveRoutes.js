const express = require('express');
const router = express.Router();
const axios = require('axios');

const PIPEDRIVE_API_URL = process.env.REACT_APP_PIPEDRIVE_API_URL;
const PIPEDRIVE_API_TOKEN = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;

router.get('/deals/:dealId', async (req, res) => {
  try {
    const { dealId } = req.params;
    const response = await axios.get(`${PIPEDRIVE_API_URL}/deals/${dealId}`, {
      params: { api_token: PIPEDRIVE_API_TOKEN }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching deal from Pipedrive:', error);
    res.status(500).json({ error: 'Failed to fetch deal data' });
  }
});

module.exports = router; 