import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';

const QuizContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: 800,
  margin: '0 auto',
  marginTop: theme.spacing(4)
}));

const QuestionCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3)
}));

const questions = [
  {
    id: 1,
    question: "How much did you spend on food and dining last month?",
    options: [
      "I don't track my food expenses",
      "Less than $200",
      "$200-$500",
      "$500-$1000",
      "More than $1000"
    ],
    category: "Food & Dining"
  },
  {
    id: 2,
    question: "What percentage of your income goes to housing expenses?",
    options: [
      "I don't know",
      "Less than 25%",
      "25-35%",
      "35-50%",
      "More than 50%"
    ],
    category: "Housing"
  },
  {
    id: 3,
    question: "How often do you review your bank statements?",
    options: [
      "Never",
      "Once a year",
      "Every few months",
      "Monthly",
      "Weekly"
    ],
    category: "Financial Awareness"
  },
  {
    id: 4,
    question: "Do you have a monthly budget?",
    options: [
      "No, I don't budget",
      "I try but don't stick to it",
      "Yes, but it's not detailed",
      "Yes, and I track most expenses",
      "Yes, and I track everything"
    ],
    category: "Budgeting"
  },
  {
    id: 5,
    question: "How much do you save each month?",
    options: [
      "I don't save",
      "Less than 5% of income",
      "5-10% of income",
      "10-20% of income",
      "More than 20% of income"
    ],
    category: "Savings"
  }
];

const feedback = {
  "Food & Dining": {
    low: "Great job keeping your food expenses low! Consider setting a monthly food budget to maintain this.",
    medium: "Your food spending is moderate. Try tracking individual meals to identify any unnecessary spending.",
    high: "Your food expenses seem high. Consider meal planning and cooking at home more often."
  },
  "Housing": {
    low: "Excellent! You're following the 30% rule for housing expenses.",
    medium: "Your housing costs are reasonable. Make sure to factor in utilities and maintenance.",
    high: "Your housing expenses are quite high. Consider looking for ways to reduce these costs."
  },
  "Financial Awareness": {
    low: "Regular review of your finances is crucial. Try setting a weekly reminder to check your accounts.",
    medium: "Good start! Consider increasing the frequency of your financial reviews.",
    high: "Excellent financial awareness! Keep up the good work of staying informed."
  },
  "Budgeting": {
    low: "Creating a budget is the first step to financial success. Start with a simple spreadsheet.",
    medium: "You're on the right track! Try using a budgeting app to make tracking easier.",
    high: "Great budgeting habits! Consider sharing your methods with others."
  },
  "Savings": {
    low: "Start small - even saving 5% of your income can build up over time.",
    medium: "Good savings habits! Consider increasing your savings rate gradually.",
    high: "Excellent savings rate! Make sure your savings are working for you through investments."
  }
};

const FinancialQuiz = ({ insights }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [currentQuestion]: value });
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let totalScore = 0;
    Object.values(answers).forEach((answer, index) => {
      // Higher scores for better financial habits
      totalScore += parseInt(answer) + 1;
    });
    setScore(totalScore);
  };

  const getFeedback = (category, answer) => {
    const value = parseInt(answer);
    if (value <= 1) return feedback[category].low;
    if (value <= 3) return feedback[category].medium;
    return feedback[category].high;
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
  };

  if (showResults) {
    return (
      <QuizContainer>
        <Typography variant="h4" gutterBottom>
          Quiz Results
        </Typography>
        <Typography variant="h6" gutterBottom>
          Your Score: {score} out of {questions.length * 5}
        </Typography>
        <Typography variant="body1" paragraph>
          {score > 15 ? "Excellent financial awareness!" : 
           score > 10 ? "Good financial habits!" : 
           "Consider improving your financial tracking."}
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Detailed Feedback
        </Typography>
        {Object.entries(answers).map(([questionIndex, answer]) => (
          <QuestionCard key={questionIndex}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {questions[questionIndex].question}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your answer: {questions[questionIndex].options[answer]}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                {getFeedback(questions[questionIndex].category, answer)}
              </Typography>
            </CardContent>
          </QuestionCard>
        ))}

        <Button 
          variant="contained" 
          color="primary" 
          onClick={resetQuiz}
          sx={{ mt: 3 }}
        >
          Take Quiz Again
        </Button>
      </QuizContainer>
    );
  }

  return (
    <QuizContainer>
      <Typography variant="h4" gutterBottom>
        Financial Literacy Quiz
      </Typography>
      <Typography variant="body1" paragraph>
        Test your financial awareness and get personalized tips for improvement.
      </Typography>

      <Stepper activeStep={currentQuestion} sx={{ mb: 4 }}>
        {questions.map((_, index) => (
          <Step key={index}>
            <StepLabel>Question {index + 1}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <LinearProgress 
        variant="determinate" 
        value={(currentQuestion / questions.length) * 100} 
        sx={{ mb: 3 }}
      />

      <QuestionCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {questions[currentQuestion].question}
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={answers[currentQuestion] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
            >
              {questions[currentQuestion].options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={index}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </CardContent>
      </QuestionCard>

      {currentQuestion > 0 && (
        <Button 
          variant="outlined" 
          onClick={() => setCurrentQuestion(currentQuestion - 1)}
          sx={{ mr: 2 }}
        >
          Previous
        </Button>
      )}
    </QuizContainer>
  );
};

export default FinancialQuiz; 