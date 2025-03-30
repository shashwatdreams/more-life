import React, { useState } from 'react';
import { Box, Container, Typography, Paper, Grid, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Plot from 'react-plotly.js';
import FileUpload from './components/FileUpload';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedInsight, setExpandedInsight] = useState('panel1');

  const handleFileUpload = async (files) => {
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process files');
      }

      setData(result);
      if (result.category_data.length > 0) {
        setSelectedCategory(result.category_data[0].Category);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInsightChange = (panel) => (event, isExpanded) => {
    setExpandedInsight(isExpanded ? panel : false);
  };

  const renderVisualizations = () => {
    if (!data) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Plot
              data={JSON.parse(data.category_plot).data}
              layout={JSON.parse(data.category_plot).layout}
              style={{ width: '100%', height: '400px' }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Plot
              data={JSON.parse(data.monthly_plot).data}
              layout={JSON.parse(data.monthly_plot).layout}
              style={{ width: '100%', height: '400px' }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Financial Insights & Recommendations
            </Typography>
            <Accordion expanded={expandedInsight === 'panel1'} onChange={handleInsightChange('panel1')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>High-Ticket Spending Analysis</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {data.insights.high_ticket_items.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${item.Description} (${item.Category})`}
                        secondary={`$${Math.abs(item.Amount).toFixed(2)} on ${new Date(item.Date).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion expanded={expandedInsight === 'panel2'} onChange={handleInsightChange('panel2')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>AI-Powered Financial Insights</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                  {data.insights.insights}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion expanded={expandedInsight === 'panel3'} onChange={handleInsightChange('panel3')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Category Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Select Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Select Category"
                  >
                    {data.category_data.map((category) => (
                      <MenuItem key={category.Category} value={category.Category}>
                        {category.Category} (${category.Amount.toFixed(2)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {selectedCategory && data.transactions_by_category[selectedCategory] && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Transactions for {selectedCategory}
                    </Typography>
                    <List>
                      {data.transactions_by_category[selectedCategory].map((transaction, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemText
                              primary={transaction.Description}
                              secondary={`$${Math.abs(transaction.Amount).toFixed(2)} on ${new Date(transaction.Date).toLocaleDateString()}`}
                            />
                          </ListItem>
                          {index < data.transactions_by_category[selectedCategory].length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        More Life - Financial Literacy Tool
      </Typography>
      <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
        Less Stress, More Life - Empowering Young Adults with Financial Knowledge
      </Typography>

      <Box sx={{ my: 4 }}>
        <FileUpload onUpload={handleFileUpload} />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {renderVisualizations()}
    </Container>
  );
}

export default App; 