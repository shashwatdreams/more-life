import React, { useState } from 'react';
import { Box, Container, Typography, Paper, Grid, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, Divider, Tabs, Tab, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Plot from 'react-plotly.js';
import FileUpload from './components/FileUpload';
import FinancialChat from './components/FinancialChat';
import FinancialGoals from './components/FinancialGoals';
import ReactMarkdown from 'react-markdown';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedInsight, setExpandedInsight] = useState('panel1');
  const [showGoals, setShowGoals] = useState(false);

  const handleInsightChange = (panel) => (event, isExpanded) => {
    setExpandedInsight(isExpanded ? panel : false);
  };

  const renderVisualizations = () => {
    if (!data) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Plot
              data={JSON.parse(data.category_plot).data}
              layout={JSON.parse(data.category_plot).layout}
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
                {renderInsights(data.insights.insights)}
              </AccordionDetails>
            </Accordion>

            <Accordion expanded={expandedInsight === 'panel3'} onChange={handleInsightChange('panel3')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Chat with AI Financial Advisor</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ height: '500px' }}>
                  <FinancialChat insights={data.insights.insights} />
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion expanded={expandedInsight === 'panel4'} onChange={handleInsightChange('panel4')}>
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

            {!showGoals && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => setShowGoals(true)}
                >
                  Set Your Financial Goals
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {showGoals && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <FinancialGoals uploadedData={data} />
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderInsights = (insights) => {
    if (!insights) return null;
    return <ReactMarkdown>{insights}</ReactMarkdown>;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          More Life
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
          Your Personal Financial Advisor
        </Typography>

        <FileUpload
          onUploadStart={() => setLoading(true)}
          onUploadSuccess={(data) => {
            setData(data);
            setLoading(false);
            setError(null);
            setShowGoals(false); // Reset goals when new data is uploaded
          }}
          onUploadError={(error) => {
            setError(error);
            setLoading(false);
          }}
        />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {data && renderVisualizations()}
      </Box>
    </Container>
  );
}

export default App; 