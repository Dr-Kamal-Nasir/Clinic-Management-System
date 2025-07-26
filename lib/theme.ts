// lib/theme.ts
import { createTheme } from '@mui/material/styles';

export const clinicTheme = createTheme({
  palette: {
    primary: {
      main: '#2c7da0', // Professional healthcare blue
      light: '#61a5c2', // Lighter healthcare blue
      dark: '#01497c', // Darker healthcare blue
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4c956c', // Calming medical green
      light: '#8ac926', // Fresh green accent
      dark: '#2d6a4f', // Deep green
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f', // Standard error red
    },
    warning: {
      main: '#ff9800', // Warning orange
    },
    info: {
      main: '#0288d1', // Informational blue
    },
    success: {
      main: '#388e3c', // Success green
    },
    background: {
      default: '#f8f9fa', // Very light gray background
      paper: '#ffffff', // White cards/paper
    },
    text: {
      primary: '#212529', // Dark text for readability
      secondary: '#495057', // Medium gray text
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      color: '#01497c',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      color: '#2c7da0',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      color: '#2c7da0',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#2d6a4f',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#2d6a4f',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      color: '#495057',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8, // Slightly rounded corners for a modern look
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '8px 16px',
          borderRadius: '8px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
        containedPrimary: {
          backgroundColor: '#2c7da0',
          '&:hover': {
            backgroundColor: '#01497c',
          },
        },
        containedSecondary: {
          backgroundColor: '#4c956c',
          '&:hover': {
            backgroundColor: '#2d6a4f',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: '1px solid #e9ecef',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#212529',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': {
              borderColor: '#ced4da',
            },
            '&:hover fieldset': {
              borderColor: '#2c7da0',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2c7da0',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
        standardSuccess: {
          backgroundColor: '#e8f5e9', // Very light success green
        },
        standardInfo: {
          backgroundColor: '#e3f2fd', // Very light info blue
        },
        standardWarning: {
          backgroundColor: '#fff8e1', // Very light warning
        },
        standardError: {
          backgroundColor: '#ffebee', // Very light error
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#2d6a4f',
          fontSize: '0.875rem',
          borderRadius: '6px',
        },
        arrow: {
          color: '#2d6a4f',
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: '0 8px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f1faee !important',
          },
        },
        head: {
          backgroundColor: '#f8f9fa',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: 'none',
        },
        head: {
          fontWeight: 600,
          color: '#212529',
        },
        body: {
          backgroundColor: '#ffffff',
          '&:first-of-type': {
            borderTopLeftRadius: '8px',
            borderBottomLeftRadius: '8px',
          },
          '&:last-of-type': {
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px',
          },
        },
      },
    },
  },
});