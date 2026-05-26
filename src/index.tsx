import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';

import ThemeProvider from '@mui/material/styles/ThemeProvider';
import { createTheme, CssBaseline } from '@mui/material';
import { Root } from './Root';

const root = document.getElementById('root') as HTMLElement;
const theme = createTheme({
  palette: {
    primary: {
      main: '#ff9e1b', // M1 Orange
      light: '#ffcc00', // M1 Orange Secondary
      dark: '#ff8800',
    },
    secondary: {
      main: '#2873c0', // M1 Blue
      dark: '#144271',
    },
    background: {
      default: '#f3f3f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 18,
  },
});

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Root />
  </ThemeProvider>,
  root,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
