import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Plot from 'react-plotly.js';
import FileUpload from './components/FileUpload';
import FinancialGoals from './components/FinancialGoals';
import FinancialChat from './components/FinancialChat';
import ReactMarkdown from 'react-markdown';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedInsight, setExpandedInsight] = useState('panel1');
  const [showGoals, setShowGoals] = useState(false);
  const [showMainApp, setShowMainApp] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleInsightChange = (panel) => (event, isExpanded) => {
    setExpandedInsight(isExpanded ? panel : false);
  };

  const renderLandingPage = () => (
    <Box>
      <AppBar position="fixed" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            More Life
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<DashboardIcon />}
            onClick={() => setShowMainApp(true)}
          >
            Open Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ pt: 8 }}>
        {/* Hero Section */}
        <Box sx={{ 
          minHeight: '80vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          py: 4,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white'
        }}>
          <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            More Life
          </Typography>
          <Typography variant="h4" gutterBottom sx={{ mb: 4, maxWidth: '800px' }}>
            Your Smart Financial Companion for Better Money Management
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => setShowMainApp(true)}
            sx={{ 
              mt: 2,
              backgroundColor: 'white',
              color: '#2196F3',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Get Started
          </Button>
        </Box>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h3" component="h2" gutterBottom align="center" sx={{ mb: 6 }}>
            How It Works
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    Upload & Analyze
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Simply upload your bank statements and let our AI analyze your spending patterns automatically.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    Set Smart Goals
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Create personalized financial goals based on your spending habits and income.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    Get AI Insights
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Receive personalized recommendations and chat with our AI financial advisor.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>

        {/* CTA Section */}
        <Box sx={{ 
          py: 8, 
          backgroundColor: '#f5f5f5',
          textAlign: 'center'
        }}>
          <Container maxWidth="md">
            <Typography variant="h4" component="h2" gutterBottom>
              Ready to Take Control of Your Finances?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Join thousands of users who are already managing their money smarter with More Life.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => setShowMainApp(true)}
              sx={{ 
                backgroundColor: '#2196F3',
                '&:hover': {
                  backgroundColor: '#1976D2'
                }
              }}
            >
              Start Your Financial Journey
            </Button>
          </Container>
        </Box>
      </Box>
    </Box>
  );

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
    <Box>
      {!showMainApp ? (
        renderLandingPage()
      ) : (
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom align="center">
              More Life
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
      )}
    </Box>
  );
}

export default App; 