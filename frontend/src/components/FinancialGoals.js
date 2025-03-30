import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  Slider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';

const GoalsContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: 800,
  margin: '0 auto',
  marginTop: theme.spacing(4)
}));

const categories = [
  { id: 'housing', label: 'Housing', recommended: 0.3 },
  { id: 'food', label: 'Food & Dining', recommended: 0.15 },
  { id: 'transportation', label: 'Transportation', recommended: 0.15 },
  { id: 'entertainment', label: 'Entertainment', recommended: 0.1 },
  { id: 'shopping', label: 'Shopping', recommended: 0.1 },
  { id: 'healthcare', label: 'Healthcare', recommended: 0.1 },
  { id: 'savings', label: 'Savings & Investments', recommended: 0.2 }
];

const FinancialGoals = ({ uploadedData }) => {
  const [step, setStep] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [goals, setGoals] = useState({});
  const [customGoals, setCustomGoals] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate total spending from uploaded data
  const totalSpending = uploadedData?.category_data.reduce((sum, category) => sum + category.Amount, 0) || 0;

  // Calculate current spending percentages
  const currentSpending = {};
  if (uploadedData?.category_data) {
    uploadedData.category_data.forEach(category => {
      currentSpending[category.Category.toLowerCase()] = (category.Amount / totalSpending) * 100;
    });
  }

  const handleIncomeChange = (event) => {
    setMonthlyIncome(event.target.value);
  };

  const handleGoalChange = (category, value) => {
    setGoals({
      ...goals,
      [category]: value
    });
  };

  const handleCustomGoalAdd = () => {
    setCustomGoals([...customGoals, { description: '', amount: '', deadline: '' }]);
  };

  const handleCustomGoalChange = (index, field, value) => {
    const updatedGoals = [...customGoals];
    updatedGoals[index] = { ...updatedGoals[index], [field]: value };
    setCustomGoals(updatedGoals);
  };

  const analyzeGoals = async () => {
    setLoading(true);
    setError(null);

    try {
      const goalData = {
        monthlyIncome: parseFloat(monthlyIncome),
        budgetGoals: goals,
        customGoals: customGoals,
        actualSpending: {
          categoryData: uploadedData.category_data,
          currentSpending: currentSpending,
          totalSpending: totalSpending
        }
      };

      const response = await fetch('http://localhost:5000/api/analyze-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData)
      });

      if (!response.ok) {
        throw new Error('Failed to analyze goals');
      }

      const analysisResult = await response.json();
      setAnalysis(analysisResult);
      setStep(step + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderIncomeStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          What's your monthly income after taxes?
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Based on your current spending of ${totalSpending.toFixed(2)}, we'll help you set realistic goals
        </Typography>
        <TextField
          fullWidth
          type="number"
          label="Monthly Income"
          value={monthlyIncome}
          onChange={handleIncomeChange}
          InputProps={{
            startAdornment: '$'
          }}
          sx={{ mt: 2 }}
        />
      </CardContent>
    </Card>
  );

  const renderBudgetGoalsStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          How would you like to allocate your monthly income?
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Compare your current spending (shown in blue) with your desired spending (shown in green)
        </Typography>
        <Box sx={{ mt: 3 }}>
          {uploadedData.category_data.map((category) => {
            const categoryId = category.Category.toLowerCase();
            const currentPercentage = currentSpending[categoryId] || 0;
            const goalPercentage = goals[categoryId] || currentPercentage;

            return (
              <Box key={categoryId} sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  {category.Category}
                  <Chip
                    size="small"
                    label={`Current: ${currentPercentage.toFixed(1)}%`}
                    sx={{ ml: 1, bgcolor: 'primary.light', color: 'primary.contrastText' }}
                  />
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs>
                    <Slider
                      value={goalPercentage}
                      onChange={(e, value) => handleGoalChange(categoryId, value)}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value}%`}
                      sx={{
                        '& .MuiSlider-thumb': {
                          bgcolor: 'success.main',
                        },
                        '& .MuiSlider-track': {
                          bgcolor: 'success.main',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">
                      ${((goalPercentage / 100) * monthlyIncome).toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );

  const renderCustomGoalsStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          What are your specific financial goals?
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Add any personal financial goals you want to achieve
        </Typography>
        {customGoals.map((goal, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Goal Description"
                  value={goal.description}
                  onChange={(e) => handleCustomGoalChange(index, 'description', e.target.value)}
                  placeholder="e.g., Save for a vacation"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Target Amount"
                  value={goal.amount}
                  onChange={(e) => handleCustomGoalChange(index, 'amount', e.target.value)}
                  InputProps={{
                    startAdornment: '$'
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Target Date"
                  value={goal.deadline}
                  onChange={(e) => handleCustomGoalChange(index, 'deadline', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        ))}
        <Button
          variant="outlined"
          onClick={handleCustomGoalAdd}
          sx={{ mt: 2 }}
        >
          Add Another Goal
        </Button>
      </CardContent>
    </Card>
  );

  const renderAnalysis = () => {
    if (!analysis) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Personalized Financial Analysis
          </Typography>
          
          {uploadedData?.insights?.high_ticket_items?.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                High-Ticket Spending Analysis
              </Typography>
              <List>
                {uploadedData.insights.high_ticket_items.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={item.Description}
                        secondary={
                          <>
                            Amount: ${item.Amount.toFixed(2)}
                            <br />
                            Category: {item.Category}
                            <br />
                            Date: {item.Date}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </>
          )}

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            Current vs. Desired Spending
          </Typography>
          <List>
            {uploadedData.category_data.map((category) => {
              const categoryId = category.Category.toLowerCase();
              const currentAmount = category.Amount;
              const goalPercentage = goals[categoryId] || currentSpending[categoryId];
              const goalAmount = (goalPercentage / 100) * monthlyIncome;
              const difference = goalAmount - currentAmount;

              return (
                <React.Fragment key={categoryId}>
                  <ListItem>
                    <ListItemText
                      primary={category.Category}
                      secondary={
                        <>
                          Current: ${currentAmount.toFixed(2)}
                          <br />
                          Goal: ${goalAmount.toFixed(2)}
                          <br />
                          {difference > 0 ? 
                            `You can increase spending by $${Math.abs(difference).toFixed(2)}` :
                            `You need to reduce spending by $${Math.abs(difference).toFixed(2)}`}
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              );
            })}
          </List>

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            Custom Goals Progress
          </Typography>
          <List>
            {customGoals.map((goal, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={goal.description}
                    secondary={
                      <>
                        Target: ${goal.amount} by {new Date(goal.deadline).toLocaleDateString()}
                        <br />
                        Required monthly saving: ${(goal.amount / Math.max(1, Math.ceil(
                          (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30)
                        ))).toFixed(2)}
                      </>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            AI Recommendations
          </Typography>
          <Box sx={{ mt: 2 }}>
            {analysis.recommendations.split('\n').map((section, index) => {
              if (section.trim().startsWith('1. Budget Analysis')) {
                return (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Budget Analysis
                    </Typography>
                    <Typography variant="body1" sx={{ pl: 2 }}>
                      {section.replace('1. Budget Analysis', '').trim()}
                    </Typography>
                  </Box>
                );
              }
              if (section.trim().startsWith('2. Custom Goals Assessment')) {
                return (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Custom Goals Assessment
                    </Typography>
                    <Typography variant="body1" sx={{ pl: 2 }}>
                      {section.replace('2. Custom Goals Assessment', '').trim()}
                    </Typography>
                  </Box>
                );
              }
              if (section.trim().startsWith('3. Action Items')) {
                return (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Action Items
                    </Typography>
                    <Typography variant="body1" sx={{ pl: 2 }}>
                      {section.replace('3. Action Items', '').trim()}
                    </Typography>
                  </Box>
                );
              }
              return null;
            })}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <GoalsContainer>
      <Typography variant="h4" gutterBottom>
        Set Your Financial Goals
      </Typography>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Monthly Income</StepLabel>
        </Step>
        <Step>
          <StepLabel>Budget Goals</StepLabel>
        </Step>
        <Step>
          <StepLabel>Custom Goals</StepLabel>
        </Step>
        <Step>
          <StepLabel>Analysis</StepLabel>
        </Step>
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        {step === 0 && renderIncomeStep()}
        {step === 1 && renderBudgetGoalsStep()}
        {step === 2 && renderCustomGoalsStep()}
        {step === 3 && renderAnalysis()}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          {step > 0 && (
            <Button
              variant="outlined"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
          
          {step < 3 && (
            <Button
              variant="contained"
              onClick={() => {
                if (step === 2) {
                  analyzeGoals();
                } else {
                  setStep(step + 1);
                }
              }}
              disabled={loading}
              sx={{ ml: 'auto' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Next'}
            </Button>
          )}
        </Box>
      </Box>
    </GoalsContainer>
  );
};

export default FinancialGoals; 